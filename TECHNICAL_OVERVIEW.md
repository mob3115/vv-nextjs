# V+V Marketplace — Technical Overview

_Last updated: 2026-09-11. This document describes the system as it exists on
branch `claude/awesome-heisenberg-wn9zs5`, after the QA/refactor pass covered
in the "Refactor Notes" section below._

## 1. What this is

V+V Marketplace is a values-based business acquisition marketplace: sellers
list their business, buyers build a profile, both sides swipe on each other,
and a mutual match unlocks messaging, an NDA e-signature flow, and a
document vault. The product's differentiator is that matching is driven by
shared *values* (e.g. "Employee Wellbeing", "Environmental Stewardship"),
not just deal terms — see §4.

## 2. Stack

- **Next.js 14**, App Router, Server Components + Server Actions (`'use server'`)
- **Supabase**: Postgres, Auth, Row Level Security, Storage, Realtime (`postgres_changes`)
- **Zod** for all server-action input validation
- **lucide-react** for iconography
- **Vitest** for unit tests (new — see §6)
- No client-side state library; data flows through Server Components and
  Server Actions, with a thin Realtime subscription layer for chat/matches.

## 3. Data model

Defined in `supabase/migrations/`, applied in order:

| Migration | Adds |
|---|---|
| `001_initial_schema.sql` | Core schema: `profiles`, `seller_listings`, `buyer_profiles`, `compatibility_scores`, `swipes`, `matches`, `ndas`, `conversations`, `messages`, `audit_logs`, all RLS policies, Realtime publication for `messages`/`matches` |
| `002_seller_swipes_and_mutual_matches.sql` | The `matches` UPDATE policy that was missing initially — without it a match could never flip from `pending` to `mutual` |
| `003_messaging_and_nda_signing.sql` | NDA initials/template-version columns, a `conversations` UPDATE policy for the first-message race, a `messages` UPDATE policy for read receipts, and a trigger that locks every message column except `read_at` after creation |
| `004_document_vault.sql` | `documents` table + `vault-documents` private Storage bucket, gated by match/NDA state |
| `005_bidirectional_connection_requests.sql` | Adds an INSERT policy so a seller's "like" on a buyer can create a pending `matches` row too (previously only a buyer's like could insert one) — see §4a |

**One landmine worth internalizing:** `matches.seller_id` is a foreign key
to `seller_listings.id` (a *listing*), not to a user. `ndas.seller_id` and
`conversations.seller_id`, by contrast, *are* real user ids. Any code that
walks from a match to "the seller as a person" has to join through
`seller_listings` first. This is handled centrally by `resolveMatchParty` in
`src/lib/actions/shared.ts` — new code touching matches should use it rather
than re-deriving the join.

**Anonymity levels.** Seller listings have a `1–3` `anonymity_level`.
Level-3 fields (`business_name`, `owner_full_name`, `revenue_exact`,
`asking_price_exact`, `ebitda`) are never sent to a buyer until an NDA is
signed. This is enforced twice — RLS is the real gate, and
`enforceAnonymity()` in `src/lib/utils.ts` is a defense-in-depth
application-layer filter, covered by tests in `src/lib/utils.test.ts`.

## 4. The matching engine (`src/lib/matching.ts`)

Every one of the 24 selectable values (kept in `CORE_VALUES`,
`src/lib/constants.ts`) is hand-mapped onto a 6-dimension semantic space
(`people`, `community`, `planet`, `craft`, `growth`, `integrity`). Two
values are compared by cosine similarity of their vectors, so e.g. "Worker
Safety" and "Employee Wellbeing" score as closely related even though
they're different tags, while "Craftsmanship" and "Environmental
Stewardship" score as unrelated.

A buyer's and seller's *value sets* (not single values) are compared by
matching each value on one side to its single best counterpart on the
other side, then averaging in both directions — this rewards real overlap
without penalizing a side just for listing more or fewer values.

The overall compatibility score blends four factors:

| Factor | Weight | What it measures |
|---|---|---|
| Values match | 45% | Cosine-similarity value-set comparison above |
| Industry fit | 20% | Is the seller's industry in the buyer's target list |
| Price overlap | 20% | See below |
| Geography | 15% | Exact region match, or buyer accepts national/remote |

Price overlap deliberately measures *how much of the seller's asking range
is covered by the buyer's budget*, not symmetric overlap — a buyer with a
wider budget than the deal costs should never be penalized for that.

`computeCompatibility()` is called from `src/lib/actions/marketplace.ts`
whenever a listing or buyer profile is created/updated, writing real rows
into `compatibility_scores` for every real account (previously this only
existed for the 12 seeded demo profiles; real accounts fell back to a flat
60%). It also backs the ranking on both the buyer's and seller's discovery
queues.

`isRecognizedValue()` exists purely so a test can assert that every value
in `CORE_VALUES` has an actual entry in the engine's vector table — the two
lists silently drifting apart is exactly the bug class that caused an
earlier "values not saving correctly" report.

## 4a. Bidirectional connection requests

A "like" from either side now always creates or updates a `matches` row, so
the other party always sees an incoming connection request — this is
symmetric by design:

- **Buyer likes a listing** → a pending match is created immediately; the
  seller sees it on **Buyer Interest** (`seller/interests`), badged "New
  Interest", with a Connect button to reciprocate.
- **Seller likes a buyer** → a pending match is created immediately (this
  used to be a no-op until the buyer had already liked first); the buyer
  sees it on **My Matches** (`buyer/matches`), badged "Wants to Connect",
  with a "Connect Back" button (`BuyerConnectButton`) to reciprocate.
- Once both sides have liked, the match flips to `mutual` and messaging/NDA
  unlock, regardless of which side liked first.

This required a schema change, not just application code: the original
INSERT policy on `matches` (migration 001) only allowed a row to be
inserted when `buyer_id = auth.uid()`, since only a buyer's like ever
created a row. Migration 005 adds a second, OR'd INSERT policy allowing a
seller to insert a row for their own listing. `recordSwipe()`
(`src/lib/actions/marketplace.ts`) mirrors the same "load-bearing
`.select()`" defensive pattern used elsewhere in this codebase to catch a
silently-rejected insert rather than reporting false success.

## 4b. Audit logging

`audit_logs` (migration 001) existed from the start but nothing ever wrote
to it — the Admin Audit Log page labeled itself "Immutable security event
log · Tamper-evident" while silently showing nothing, forever. `logAuditEvent()`
(`src/lib/actions/audit.ts`, no `'use server'` — same non-callable-helper
pattern as `shared.ts`) is now called from the actions that actually
constitute a security-relevant event:

| Event type | Action | Where |
|---|---|---|
| `AUTH` | `REGISTER` | end of `signUpAccount()` — both `registerBuyerAction`/`registerSellerAction` |
| `AUTH` | `LOGIN` / `LOGOUT` | `loginAction` / `logoutAction` |
| `MATCH` | `MUTUAL` | `upsertMatchOnLike()`, only on the pending→mutual transition (not every subsequent swipe on an already-mutual match) |
| `NDA` | `SIGN` / `FULLY_SIGNED` | `signNda()` |
| `VAULT` | `UPLOAD` / `DELETE` | `uploadVaultDocument()` / `deleteVaultDocument()` |

A failed audit insert is logged to the server console and swallowed —
audit logging must never break the action it's attached to. `ADMIN`,
`SYSTEM`, and `RATE_LIMIT` event types are still reserved (the admin page
already has colors for them) but nothing emits them yet, since there's no
real admin write-action or rate limiting in the app to log.

## 5. Application structure

```
src/app/            Route segments (App Router). buyer/, seller/, admin/, auth/
src/lib/actions/    Server Actions — auth.ts, marketplace.ts (listings, profiles,
                    swipes, matches, NDAs), messaging.ts, vault.ts, shared.ts
src/lib/            matching.ts, validations.ts (Zod), constants.ts, page-auth.ts,
                    nav.ts, nda-template.ts, icons.tsx, utils.ts
src/components/     buyer/, seller/, chat/, nda/, vault/, shared/, ui/
```

**Page pattern.** Nearly every page under `buyer/`, `seller/`, and `admin/`
follows the same shape: load the user + profile, redirect to login if
missing, fetch one page-specific resource, render inside `<AppShell>`. That
boilerplate is now centralized in `requireUserAndProfile()`
(`src/lib/page-auth.ts`) — see Refactor Notes.

**Shared constants.** Picklists that need to match *exactly* between the
form that writes a value and the engine/UI that reads it back
(`CORE_VALUES`, `INDUSTRIES`, `REGIONS`, revenue bands, funding sources,
etc.) live in one place, `src/lib/constants.ts` — see Refactor Notes.

## 6. Testing

`npm test` runs the Vitest suite (`vitest.config.ts`, tests co-located as
`src/**/*.test.ts`). Current coverage, 68 tests across 4 files:

- **`matching.test.ts`** — every scoring function (`valuesCompatibility`,
  `industryCompatibility`, `priceCompatibility`, `geographyCompatibility`,
  `computeCompatibility`), plus a regression test that every `CORE_VALUES`
  entry is recognized by the engine's vector table.
- **`utils.test.ts`** — `scoreColor`, `anonLabel`, `formatCurrency`, and
  `enforceAnonymity` across all three anonymity levels, the NDA-signed
  override, and a defense-in-depth check that level-3 fields never leak
  when the NDA is unsigned regardless of the stored `anonymity_level`.
- **`validations.test.ts`** — every Zod schema in `validations.ts`:
  registration password rules, login, NDA signing (UUID match id,
  initials-vs-full-name), swipes, messages, buyer profile (price-range
  refinement, max values, funding enum).
- **`icons.test.ts`** — icon-registry fallback behavior and nav/icon key
  coverage.

This is a **unit-test safety net for pure logic**, not end-to-end coverage
— there is no test runner wired up for Server Actions (would need a
Supabase test instance) or for interactive UI (swipe gestures, drag
handling, Realtime). See Refactor Notes for what was deliberately left
untested and why.

## 7. Refactor notes (this pass)

Scope was: reduce duplication and maintenance risk, without changing any
behavior. Everything below was verified with `npm run type-check`, the new
test suite, and a full production `npm run build`.

**Consolidated:**
- `src/lib/constants.ts` (new) — `INDUSTRIES`, `CORE_VALUES`, `REGIONS`,
  `BUYER_LOCATION_PREFERENCES`, `REVENUE_BANDS`, `TRANSITION_TIMELINES`,
  `FUNDING_SOURCES`/`FUNDING_LABELS` were previously defined twice, once
  each in `ListingForm.tsx` and `BuyerProfileForm.tsx`, with no guarantee
  the two copies stayed in sync (this is exactly what caused the earlier
  values-picker bug). Both forms now import from this single source.
- `src/lib/page-auth.ts` (new) — `requireUserAndProfile(supabase)`
  extracts the "get user, redirect to login if missing, fetch profile,
  redirect to login if missing" boilerplate that was copy-pasted at the
  top of 18 page components. Applied to all of them; behavior unchanged.

**Left as-is, deliberately:**
- `src/app/page.tsx`, `src/app/seller/dashboard/page.tsx`, and
  `src/app/buyer/profile/page.tsx` were **not** converted — the first has
  different redirect-by-role logic and only ever needs `role`; the other
  two fetch the profile and a second resource in parallel via
  `Promise.all`, which is a genuinely different (and already efficient)
  shape that `requireUserAndProfile` would have serialized.
- `SellerSwipeArena.tsx`'s local `FUNDING_LABELS` was **not** merged into
  the shared constants — it intentionally uses seller-facing phrasing
  ("Cash buyer") that differs from the buyer-facing copy, so it isn't a
  true duplicate.
- **Swipe/drag-gesture consolidation** (`src/hooks/useSwipeDeck.ts`, later
  pass) — the ~150-180 lines of near-identical touch/mouse drag handling
  between `SwipeArena.tsx` and `SellerSwipeArena.tsx` are now one shared
  hook; each component only owns its card JSX and what a swipe *means*
  (the `recordSwipe` call, toast copy, confetti) via an `onSwipe` callback.
  Fixed two real bugs found along the way: a fast mouse drag that exited
  the card's bounding box mid-gesture used to fire `onMouseLeave`, ending
  the drag prematurely (mouse tracking now happens on `window` once a drag
  starts, like a native drag implementation); and the exit-animation
  `setTimeout` had no cleanup, risking a `setState` call after unmount.
  Also caught **a bug introduced by the refactor itself, not present
  before it**, and worth recording because it's a real trap: the hook's
  `commitSwipe` initially depended on the caller-supplied `onSwipe`
  callback directly. Since that callback is a fresh inline closure on
  every render of the *caller*, and every drag-visual update triggers a
  state update (a render), the mouse-handler chain's memoized identity
  churned on nearly every frame of a drag — which tripped a "remove stale
  window listeners" cleanup effect and silently detached the mouse
  handlers seconds into any drag that had already re-rendered once. Fixed
  by reading `onSwipe` (and the `swiping` guard) through refs instead of
  closing over them directly, so the handler chain's identity is stable
  regardless of how often the caller re-renders. This was only caught by
  actually driving the drag in a browser (Playwright against the dev
  server, simulating a real fast mouse drag) — `tsc` and the unit suite
  both stayed green through the whole broken version, which is exactly
  why this class of change needs interactive verification, not just
  type-checking.

**Bugs caught by the refactor itself** (fixed, no user-visible change from
before this pass — these were latent, not regressions introduced here):
- `src/app/buyer/matches/page.tsx` referenced `user` after being refactored
  to destructure only `{ profile }` — caught by `tsc`, fixed by
  destructuring `{ user, profile }`.
- 14 files were left with a dead `import { redirect } from 'next/navigation'`
  after their inline redirect boilerplate was removed (not a compile error,
  found by grepping usage counts) — removed or narrowed to `notFound` only,
  per file.

## 8. Known gaps / suggested follow-ups

- **No integration/e2e test layer.** The Vitest suite covers pure
  functions only. Server Actions and RLS policies are currently verified
  by manual QA against a real Supabase project. A follow-up worth
  considering: a Playwright smoke test for the swipe → match → NDA →
  message golden path, and/or `pgTAP` tests for the RLS policies
  themselves (the two RLS gaps found earlier in this project — missing
  UPDATE policies on `matches` and `messages` — are exactly the class of
  bug that policy-level tests would catch immediately).
- **`compatibility_scores` recomputation.** Scores are written on
  listing/profile create-or-update. If the matching engine's weights or
  value-vector table changes later, existing rows go stale until their
  owning listing/profile is next edited. A one-off backfill script (or an
  admin-triggered recompute-all action) would be a reasonable addition if
  the algorithm changes again.
- **No password reset flow.** There is no "Forgot password?" link, no
  reset-request page, and no server action for it. `auth/confirm/route.ts`
  has a half-wired `type=recovery` branch (it calls `verifyOtp` correctly)
  but redirects to a generic "email confirmed" message either way and
  there's no "set a new password" page for a recovery link to land on. A
  real gap for production use, not just a missing UI affordance.
- **Admin panel is list-only.** Overview/Users/Listings/Audit all read
  real data (no fake/hardcoded rows), but there's no moderation action
  anywhere — no role change, no suspend/remove a listing, no per-user
  detail view. Two now-removed dead buttons (admin Users "View", seller
  Buyer Interest "Pass") were previously present but non-functional; "Pass"
  is now wired for real (see §4b's sibling change — it records a `pass`
  swipe and the Buyer Interest query excludes buyers already passed on,
  reusing the same exclude-by-swipe pattern `getDiscoverListings` uses),
  "View" was removed outright since the admin Users table already renders
  every column on the `profiles` row — there was nothing left to reveal.
