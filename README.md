# V+V Business Marketplace

A privacy-first, values-based business acquisition platform built on **Next.js 14 App Router**, **Supabase**, and **Vercel**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router, Server Components, Server Actions) |
| Auth | Supabase Auth (email + password, email confirmation) |
| Database | Supabase (PostgreSQL 15, Row Level Security) |
| Hosting | Vercel (edge middleware, zero-config CI/CD) |
| Styling | Tailwind CSS |
| Validation | Zod (server + client) |
| Animation | Framer Motion |

---

## Local Development

### Prerequisites
- Node.js 20+
- [Supabase CLI](https://supabase.com/docs/guides/cli): `npm install -g supabase`
- A Supabase project (free tier works)

### 1. Clone and install

```bash
git clone https://github.com/your-org/vv-marketplace
cd vv-marketplace
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Find these in: **Supabase Dashboard → Project Settings → API**

### 3. Run the database migration

```bash
# Option A: Using Supabase CLI (recommended)
supabase link --project-ref your-project-ref
supabase db push

# Option B: Manual — copy supabase/migrations/001_initial_schema.sql
# into Supabase Dashboard → SQL Editor → Run
```

### 4. Seed demo data

```bash
npm run db:seed
```

This creates 12 seller accounts, 12 buyer accounts, all listings, buyer profiles,
and pre-computed compatibility scores.

**Demo credentials (all use password: `Demo@VV2024!`)**
- Buyer: `angela@demo.vv`
- Seller: `marcus@demo.vv`

### 5. Start the dev server

```bash
npm run dev
# Open http://localhost:3000
```

---

## Deploying to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/your-org/vv-marketplace
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel auto-detects Next.js — no config needed

### 3. Add environment variables in Vercel

In **Project Settings → Environment Variables**, add:

| Variable | Value | Environments |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | All |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.vercel.app` | Production |

⚠️ `SUPABASE_SERVICE_ROLE_KEY` is a server secret — never prefix with `NEXT_PUBLIC_`.

### 4. Configure Supabase for production

In **Supabase Dashboard → Authentication → URL Configuration**:

- **Site URL**: `https://your-domain.vercel.app`
- **Redirect URLs**: `https://your-domain.vercel.app/auth/confirm`

### 5. Deploy

Push to `main` — Vercel builds and deploys automatically.

---

## Security Architecture

### Row Level Security (RLS)
Every table has RLS enabled. Key policies:
- **Seller listings**: private fields (`business_name`, `revenue_exact`, etc.) are never returned unless an NDA is signed — enforced at both the RLS and application layers
- **Profiles**: users can only read/update their own profile
- **Matches & NDAs**: only the parties involved can read their records
- **Audit logs**: append-only via Postgres rules; no update/delete possible

### Anonymity Enforcement (Defence in Depth)
Anonymity is enforced at **two layers**:
1. **Server action** (`lib/utils.ts → enforceAnonymity`): strips private fields before data leaves the server
2. **Supabase RLS**: would still protect data even if the application layer failed

### Authentication
- Passwords handled by Supabase Auth (bcrypt under the hood)
- JWT access tokens (15-min expiry) + rotating refresh tokens
- Email confirmation required for new accounts
- Middleware refreshes sessions on every request (`middleware.ts`)

### HTTP Security Headers
Set in `next.config.ts`:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy` (strict)
- `Referrer-Policy: strict-origin-when-cross-origin`

Plus in `vercel.json`:
- `Strict-Transport-Security` with preload

---

## Project Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx      # Login page
│   │   ├── register/page.tsx   # Registration (3-step)
│   │   ├── confirm/route.ts    # Email confirmation callback
│   │   └── error/page.tsx      # Auth error page
│   ├── buyer/
│   │   ├── discover/page.tsx   # Swipe interface
│   │   ├── matches/page.tsx    # Match list
│   │   ├── chat/page.tsx       # Messaging
│   │   ├── nda/page.tsx        # NDA management
│   │   └── profile/page.tsx    # Buyer profile editor
│   ├── seller/
│   │   ├── dashboard/page.tsx  # Seller home
│   │   ├── listing/page.tsx    # Listing editor
│   │   ├── discover/page.tsx   # Buyer swipe (seller perspective)
│   │   ├── interests/page.tsx  # Interested buyers
│   │   ├── vault/page.tsx      # Document vault
│   │   └── chat/page.tsx       # Messaging
│   ├── admin/                  # Admin console
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Root redirect
│   └── globals.css             # Tailwind + design tokens
├── components/
│   ├── ui/
│   │   └── ScoreRing.tsx       # SVG score ring
│   ├── buyer/
│   │   └── SwipeArena.tsx      # Full swipe interface
│   └── shared/
│       ├── AppShell.tsx        # Sidebar + layout wrapper
│       ├── LoginForm.tsx       # Client login form
│       └── RegisterForm.tsx    # Multi-step registration
├── lib/
│   ├── supabase/
│   │   ├── server.ts           # Server-side Supabase client
│   │   └── client.ts           # Browser Supabase client
│   ├── actions/
│   │   ├── auth.ts             # Auth server actions
│   │   └── marketplace.ts      # Listings, swipes, NDAs
│   ├── validations.ts          # Zod schemas
│   └── utils.ts                # Utilities + anonymity enforcement
├── middleware.ts               # Auth guards + route protection
└── types/index.ts              # Full TypeScript types

supabase/
├── migrations/
│   └── 001_initial_schema.sql  # Full DB schema + RLS + triggers
├── seed/
│   └── index.ts                # 12 buyers + 12 sellers + scores
└── config.toml                 # Supabase CLI config
```

---

## Adding New Features

### Adding a page
1. Create `src/app/[section]/[page]/page.tsx`
2. Make it a Server Component that fetches data
3. Add the route to the `NAV` array in the parent page
4. The middleware auto-protects it if it's under `/buyer/`, `/seller/`, or `/admin/`

### Adding a server action
1. Add to `src/lib/actions/marketplace.ts` with `'use server'` at the top
2. Validate input with Zod before touching the database
3. Use `requireUser()` to enforce authentication
4. Call `revalidatePath()` to refresh the UI

### Adding a database table
1. Write a new migration in `supabase/migrations/`
2. Add RLS policies — **default to deny, then grant minimally**
3. Run `supabase db push`
4. Add TypeScript types to `src/types/index.ts`
