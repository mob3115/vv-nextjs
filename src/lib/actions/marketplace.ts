'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sellerListingSchema, buyerProfileSchema, ndaSignSchema, swipeSchema } from '@/lib/validations'
import { enforceAnonymity } from '@/lib/utils'
import { NDA_TEMPLATE_VERSION } from '@/lib/nda-template'
import { computeCompatibility } from '@/lib/matching'
import { requireUser, resolveMatchParty } from './shared'
import type { SellerListingInput, BuyerProfileInput, NdaSignInput, SwipeInput } from '@/lib/validations'
import type { ActionResult } from './auth'

// ============================================================
// COMPATIBILITY — recompute scores whenever a buyer profile or seller
// listing changes, so every account (not just seeded demo data) gets a
// real values-based score instead of a flat fallback.
//
// Uses the admin client: computing a pairwise score means reading across
// *other* users' buyer profiles / listings, which RLS intentionally does
// not allow for an ordinary user session (a seller has no general right to
// browse buyer profiles, nor vice versa). Only the resulting number is
// ever persisted — raw profile fields are never exposed back to the other
// party through this path.
// ============================================================

export async function recomputeScoresForBuyer(buyerId: string, buyer: {
  values: string[]; target_industries: string[]; price_min: number; price_max: number; location_preference: string
}) {
  const admin = createAdminClient()
  const { data: listings } = await admin
    .from('seller_listings')
    .select('id, industry, values, asking_range, location_region')
    .eq('status', 'active')

  if (!listings || listings.length === 0) return

  const rows = listings.map((l: any) => ({
    buyer_id: buyerId,
    listing_id: l.id,
    score: computeCompatibility({
      buyerValues: buyer.values,
      buyerTargetIndustries: buyer.target_industries,
      buyerMin: buyer.price_min,
      buyerMax: buyer.price_max,
      buyerLocationPref: buyer.location_preference,
      sellerValues: l.values,
      sellerIndustry: l.industry,
      sellerAskingRange: l.asking_range,
      sellerRegion: l.location_region,
    }).overall,
  }))

  const { error } = await admin.from('compatibility_scores').upsert(rows, { onConflict: 'buyer_id,listing_id' })
  if (error) console.error('recomputeScoresForBuyer upsert error:', error)
}

export async function recomputeScoresForListing(listingId: string, listing: {
  industry: string; values: string[]; asking_range: string; location_region: string
}) {
  const admin = createAdminClient()
  const { data: buyers } = await admin
    .from('buyer_profiles')
    .select('buyer_id, values, target_industries, price_min, price_max, location_preference')

  if (!buyers || buyers.length === 0) return

  const rows = buyers.map((b: any) => ({
    buyer_id: b.buyer_id,
    listing_id: listingId,
    score: computeCompatibility({
      buyerValues: b.values,
      buyerTargetIndustries: b.target_industries,
      buyerMin: b.price_min,
      buyerMax: b.price_max,
      buyerLocationPref: b.location_preference,
      sellerValues: listing.values,
      sellerIndustry: listing.industry,
      sellerAskingRange: listing.asking_range,
      sellerRegion: listing.location_region,
    }).overall,
  }))

  const { error } = await admin.from('compatibility_scores').upsert(rows, { onConflict: 'buyer_id,listing_id' })
  if (error) console.error('recomputeScoresForListing upsert error:', error)
}

// ============================================================
// LISTINGS — Discover queue
// ============================================================

export async function getDiscoverListings() {
  const supabase = createClient()
  const user = await requireUser(supabase)

  // 1. IDs this buyer has already swiped on
  const { data: swipedRows } = await supabase
    .from('swipes')
    .select('target_listing_id')
    .eq('swiper_id', user.id)
    .not('target_listing_id', 'is', null)

  const excludeIds: string[] = (swipedRows ?? [])
    .map((s: any) => s.target_listing_id)
    .filter(Boolean)

  // 2. All active listings not owned by this user
  const { data: allListings, error } = await supabase
    .from('seller_listings')
    .select('*')
    .eq('status', 'active')
    .neq('seller_id', user.id)

  if (error) {
    console.error('getDiscoverListings error:', error)
    return []
  }

  // 3. Filter already-swiped in JS (avoids empty-array SQL edge cases)
  const unseen = (allListings ?? []).filter(
    (l: any) => !excludeIds.includes(l.id)
  )

  // 4. This buyer's own profile — drives the real compatibility computation
  const { data: buyerProfile } = await supabase
    .from('buyer_profiles')
    .select('values, target_industries, price_min, price_max, location_preference')
    .eq('buyer_id', user.id)
    .maybeSingle()

  // 5. NDA status — determines anonymity level
  const { data: ndaRows } = await supabase
    .from('ndas')
    .select('seller_id, status')
    .eq('buyer_id', user.id)
    .eq('status', 'signed')

  const signedSellerIds = new Set((ndaRows ?? []).map((n: any) => n.seller_id))

  // 6. Apply anonymity, compute a real score + breakdown, sort descending
  return unseen
    .map((listing: any) => {
      const { overall, breakdown } = computeCompatibility({
        buyerValues: buyerProfile?.values,
        buyerTargetIndustries: buyerProfile?.target_industries,
        buyerMin: buyerProfile?.price_min,
        buyerMax: buyerProfile?.price_max,
        buyerLocationPref: buyerProfile?.location_preference,
        sellerValues: listing.values,
        sellerIndustry: listing.industry,
        sellerAskingRange: listing.asking_range,
        sellerRegion: listing.location_region,
      })
      return {
        ...enforceAnonymity(listing, signedSellerIds.has(listing.seller_id)),
        compatibility_score: overall,
        score_breakdown: [
          { label: 'Values Match',  value: breakdown.valuesMatch },
          { label: 'Industry Fit',  value: breakdown.industryFit },
          { label: 'Price Overlap', value: breakdown.priceOverlap },
          { label: 'Geography',     value: breakdown.geography },
        ],
      }
    })
    .sort((a: any, b: any) => b.compatibility_score - a.compatibility_score)
}

// ============================================================
// SELLER LISTING — Create
// ============================================================

export async function createSellerListing(input: SellerListingInput): Promise<ActionResult> {
  const parsed = sellerListingSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const supabase = createClient()
  const user = await requireUser(supabase)
  const d = parsed.data

  const { data: created, error } = await supabase.from('seller_listings').insert({
    seller_id: user.id,
    status: 'active',
    industry: d.industry,
    industry_icon: d.industryIcon,
    tagline: d.tagline,
    years_operating: d.yearsOperating,
    employees_range: d.employeesRange,
    revenue_band: d.revenueBand,
    asking_range: d.askingRange,
    location_region: d.locationRegion,
    values: d.values,
    values_statement: d.valuesStatement,
    transition_goals: d.transitionGoals,
    transition_timeline: d.transitionTimeline,
    seller_financing: d.sellerFinancing,
    management_training: d.managementTraining,
    anonymity_level: d.anonymityLevel,
    owner_first_name: d.ownerFirstName,
    location_city: d.locationCity,
    business_name: d.businessName,
    owner_full_name: d.ownerFullName,
    revenue_exact: d.revenueExact,
    asking_price_exact: d.askingPriceExact,
    ebitda: d.ebitda,
  }).select('id').single()

  if (error) {
    console.error('createSellerListing error:', error)
    return { error: 'Failed to create listing. Please try again.' }
  }

  await recomputeScoresForListing(created.id, {
    industry: d.industry, values: d.values, asking_range: d.askingRange, location_region: d.locationRegion,
  })

  revalidatePath('/seller/listing')
  return { success: true }
}

// ============================================================
// BUYER PROFILE — Upsert + Get
// ============================================================

export async function upsertBuyerProfile(input: BuyerProfileInput): Promise<ActionResult> {
  const parsed = buyerProfileSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const supabase = createClient()
  const user = await requireUser(supabase)
  const d = parsed.data

  const { error } = await supabase.from('buyer_profiles').upsert({
    buyer_id: user.id,
    background: d.background,
    looking_for: d.lookingFor,
    price_min: d.priceMin,
    price_max: d.priceMax,
    target_industries: d.targetIndustries,
    location_preference: d.locationPreference,
    funding_source: d.fundingSource,
    experience_years: d.experienceYears,
    values: d.values,
    values_statement: d.valuesStatement,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'buyer_id' })

  if (error) return { error: 'Failed to save profile. Please try again.' }

  await recomputeScoresForBuyer(user.id, {
    values: d.values,
    target_industries: d.targetIndustries,
    price_min: d.priceMin,
    price_max: d.priceMax,
    location_preference: d.locationPreference,
  })

  revalidatePath('/buyer/profile')
  return { success: true }
}

export async function getBuyerProfile() {
  const supabase = createClient()
  const user = await requireUser(supabase)
  const { data } = await supabase
    .from('buyer_profiles')
    .select('*')
    .eq('buyer_id', user.id)
    .single()
  return data
}

// ============================================================
// SWIPES — Record a swipe and create/update a match if liked
//
// A "like" from either side always creates or updates a match record so
// the other party can see it as an incoming connection request —
// symmetric in both directions: a buyer liking a listing creates a
// pending match the seller sees on Buyer Interest, and a seller liking a
// buyer creates a pending match that buyer sees on My Matches. Once both
// sides have liked, the match flips to 'mutual'.
//
// upsertMatchOnLike() always reads the *existing* matches row first and
// only ever adds information to it — a liked flag already true is never
// written back to false. The swipes table is still consulted (via
// getMatchState) as a defensive fallback signal, OR'd in rather than
// trusted outright: re-deriving both flags from swipes on every call and
// overwriting the row with that snapshot (the previous approach) meant
// that if the swipes lookup for the *other* party ever disagreed with
// the row — stale data, a partially-failed earlier write — a late like
// would silently *downgrade* an already-connected match back to pending.
// ============================================================

async function getMatchState(
  supabase: ReturnType<typeof createClient>,
  buyerId: string,
  listingId: string,
  sellerId: string
) {
  const [{ data: buyerSwipe }, { data: sellerSwipe }, { data: scoreRow }] = await Promise.all([
    supabase.from('swipes').select('id')
      .eq('swiper_id', buyerId).eq('target_listing_id', listingId).eq('direction', 'like').maybeSingle(),
    supabase.from('swipes').select('id')
      .eq('swiper_id', sellerId).eq('target_buyer_id', buyerId).eq('direction', 'like').maybeSingle(),
    supabase.from('compatibility_scores').select('score')
      .eq('buyer_id', buyerId).eq('listing_id', listingId).maybeSingle(),
  ])

  return {
    buyerLiked: !!buyerSwipe,
    sellerLiked: !!sellerSwipe,
    score: scoreRow?.score ?? 60,
  }
}

async function upsertMatchOnLike(
  supabase: ReturnType<typeof createClient>,
  buyerId: string,
  listingId: string,
  sellerUserId: string,
  likerSide: 'buyer' | 'seller'
): Promise<{ error?: string; matched: boolean }> {
  const { data: existing, error: fetchError } = await supabase
    .from('matches')
    .select('id, buyer_liked, seller_liked')
    .eq('buyer_id', buyerId)
    .eq('seller_id', listingId)
    .maybeSingle()

  if (fetchError) {
    console.error('match lookup error:', fetchError)
    return { error: 'Failed to connect. Please try again.', matched: false }
  }

  const { buyerLiked: swipeBuyerLiked, sellerLiked: swipeSellerLiked, score } =
    await getMatchState(supabase, buyerId, listingId, sellerUserId)

  // The current actor's like is always true by definition; the other
  // side's is whatever the row already has, OR the swipes fallback —
  // never re-derived in a way that could erase an existing true value.
  const buyerLiked  = likerSide === 'buyer'  || !!existing?.buyer_liked  || swipeBuyerLiked
  const sellerLiked = likerSide === 'seller' || !!existing?.seller_liked || swipeSellerLiked
  const isMutual = buyerLiked && sellerLiked

  if (!existing) {
    const { data: createdRows, error } = await supabase
      .from('matches')
      .insert({
        buyer_id: buyerId,
        seller_id: listingId,
        compatibility_score: score,
        buyer_liked: buyerLiked,
        seller_liked: sellerLiked,
        status: isMutual ? 'mutual' : 'pending',
      })
      .select('id')

    if (error) {
      console.error('match create error:', error)
      return { error: 'Failed to connect. Please try again.', matched: false }
    }
    if (!createdRows || createdRows.length === 0) {
      console.error('match create affected 0 rows for buyer', buyerId, 'listing', listingId,
        '— check that the matches INSERT policies (migrations 001, 005) have been applied.')
      return { error: 'Could not connect right now. Please try again in a moment.', matched: false }
    }
    return { matched: isMutual }
  }

  // .select() here is load-bearing: without it, an UPDATE that Postgres
  // RLS silently filters down to 0 matched rows still comes back with
  // error === null — a real failure would otherwise be reported as
  // success. Requires the "Parties can update own matches" RLS policy
  // (migration 002) to actually be applied.
  const { data: updatedRows, error } = await supabase
    .from('matches')
    .update({ buyer_liked: buyerLiked, seller_liked: sellerLiked, status: isMutual ? 'mutual' : 'pending' })
    .eq('id', existing.id)
    .select('id')

  if (error) {
    console.error('match update error:', error)
    return { error: 'Failed to connect. Please try again.', matched: false }
  }
  if (!updatedRows || updatedRows.length === 0) {
    console.error('match update affected 0 rows for match', existing.id,
      '— check that migration 002 (matches UPDATE policy) has been applied.')
    return { error: 'Could not connect right now. Please try again in a moment.', matched: false }
  }

  return { matched: isMutual }
}

export async function recordSwipe(
  input: SwipeInput
): Promise<ActionResult & { matched?: boolean }> {
  const parsed = swipeSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid swipe data' }

  const supabase = createClient()
  const user = await requireUser(supabase)
  const { targetListingId, targetBuyerId, direction } = parsed.data

  // 1. Record the swipe
  const { error: swipeError } = await supabase.from('swipes').insert({
    swiper_id: user.id,
    target_listing_id: targetListingId ?? null,
    target_buyer_id: targetBuyerId ?? null,
    direction,
  })

  if (swipeError) {
    // Duplicate swipe — silently succeed (user already swiped this)
    if (swipeError.code === '23505') return { success: true, matched: false }
    console.error('recordSwipe error:', swipeError)
    return { error: 'Failed to record swipe' }
  }

  if (direction !== 'like') return { success: true, matched: false }

  // 2a. Buyer liking a listing — create or update the match record
  if (targetListingId) {
    const { data: listing, error: listingError } = await supabase
      .from('seller_listings')
      .select('seller_id')
      .eq('id', targetListingId)
      .maybeSingle()

    if (listingError) {
      console.error('listing lookup error:', listingError)
      return { error: 'Failed to record swipe. Please try again.' }
    }
    if (!listing) return { success: true, matched: false } // listing no longer exists — nothing to match against

    const result = await upsertMatchOnLike(supabase, user.id, targetListingId, listing.seller_id, 'buyer')
    if (result.error) return { error: result.error }

    revalidatePath('/buyer/matches')
    revalidatePath('/seller/interests')
    return { success: true, matched: result.matched }
  }

  // 2b. Seller liking a buyer — create a pending match (if the buyer
  // hasn't liked yet) or flip an existing one to mutual (if they have).
  if (targetBuyerId) {
    const { data: listing, error: listingError } = await supabase
      .from('seller_listings')
      .select('id')
      .eq('seller_id', user.id)
      .maybeSingle()

    if (listingError) {
      console.error('seller listing lookup error:', listingError)
      return { error: 'Failed to record swipe. Please try again.' }
    }
    if (!listing) return { success: true, matched: false } // no listing — nothing to connect against

    // Requires the "Sellers can create pending matches" INSERT policy
    // (migration 005) for the case where this is a brand new row — without
    // it that insert is silently rejected by RLS.
    const result = await upsertMatchOnLike(supabase, targetBuyerId, listing.id, user.id, 'seller')
    if (result.error) return { error: result.error }

    revalidatePath('/seller/interests')
    revalidatePath('/buyer/matches')
    return { success: true, matched: result.matched }
  }

  return { success: true, matched: false }
}

// ============================================================
// NDAs — Sign and get
// ============================================================

export async function signNda(input: NdaSignInput): Promise<ActionResult> {
  const parsed = ndaSignSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = createClient()
  const user = await requireUser(supabase)
  const { signature, initials, matchId } = parsed.data

  const party = await resolveMatchParty(supabase, user.id, matchId)
  if (!party) return { error: 'Match not found or access denied.' }
  const { match, sellerUserId, isBuyer } = party

  if (match.status !== 'mutual') {
    return { error: 'This match must be mutual before an NDA can be signed.' }
  }

  const { data: existingNda } = await supabase
    .from('ndas')
    .select('buyer_signed_at, seller_signed_at')
    .eq('match_id', matchId)
    .maybeSingle()

  // Check if the other party already signed
  const otherSigned = isBuyer ? !!existingNda?.seller_signed_at : !!existingNda?.buyer_signed_at
  const newStatus = otherSigned ? 'signed' : 'pending'

  const payload: Record<string, unknown> = {
    match_id: matchId,
    buyer_id: match.buyer_id,
    seller_id: sellerUserId, // ndas.seller_id is a real user id, unlike matches.seller_id
    status: newStatus,
    template_version: NDA_TEMPLATE_VERSION,
  }
  if (isBuyer) {
    payload.buyer_signed_at = new Date().toISOString()
    payload.buyer_signature = signature
    payload.buyer_initials = initials
  } else {
    payload.seller_signed_at = new Date().toISOString()
    payload.seller_signature = signature
    payload.seller_initials = initials
  }

  const { error } = await supabase.from('ndas').upsert(payload, { onConflict: 'match_id' })

  if (error) {
    console.error('signNda error:', error)
    return { error: 'Failed to sign NDA. Please try again.' }
  }

  revalidatePath('/buyer/nda')
  revalidatePath('/seller/interests')
  revalidatePath(`/buyer/chat/${matchId}`)
  revalidatePath(`/seller/chat/${matchId}`)
  return { success: true }
}

// Everything the NDA sign page needs: names + listing context to render the
// agreement text, plus any existing signature state for this match.
export async function getNdaSignContext(matchId: string) {
  const supabase = createClient()
  const user = await requireUser(supabase)

  const party = await resolveMatchParty(supabase, user.id, matchId)
  if (!party) return null
  const { match, sellerUserId, isBuyer } = party

  const [{ data: buyerProfile }, { data: sellerProfile }, { data: nda }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', match.buyer_id).single(),
    supabase.from('profiles').select('full_name').eq('id', sellerUserId).single(),
    supabase.from('ndas').select('*').eq('match_id', matchId).maybeSingle(),
  ])

  return {
    matchId,
    isBuyer,
    matchStatus: match.status as 'pending' | 'mutual' | 'expired',
    industry: match.seller_listings.industry as string,
    locationRegion: match.seller_listings.location_region as string,
    buyerName: buyerProfile?.full_name ?? 'Buyer',
    sellerName: sellerProfile?.full_name ?? 'Seller',
    nda: nda ?? null,
  }
}

export async function getMatches() {
  const supabase = createClient()
  const user = await requireUser(supabase)

  // matches.seller_id references seller_listings.id, not a user — resolve
  // this user's own listing (if any) before filtering as a potential seller.
  const { data: listing } = await supabase
    .from('seller_listings')
    .select('id')
    .eq('seller_id', user.id)
    .maybeSingle()

  const filter = listing
    ? `buyer_id.eq.${user.id},seller_id.eq.${listing.id}`
    : `buyer_id.eq.${user.id}`

  const { data } = await supabase
    .from('matches')
    .select(`*, seller_listings(*), ndas(status, buyer_signed_at, seller_signed_at)`)
    .or(filter)
    .order('created_at', { ascending: false })

  return data ?? []
}

// ============================================================
// UPDATE SELLER LISTING
// ============================================================

export async function updateSellerListing(input: any): Promise<ActionResult> {
  const supabase = createClient()
  const user = await requireUser(supabase)

  // Verify ownership before updating
  const { data: existing } = await supabase
    .from('seller_listings')
    .select('id, seller_id')
    .eq('id', input.id)
    .single()

  if (!existing || existing.seller_id !== user.id) {
    return { error: 'Listing not found or access denied.' }
  }

  const { error } = await supabase
    .from('seller_listings')
    .update({
      industry:            input.industry,
      industry_icon:       input.industryIcon,
      tagline:             input.tagline,
      years_operating:     input.yearsOperating,
      employees_range:     input.employeesRange,
      revenue_band:        input.revenueBand,
      asking_range:        input.askingRange,
      location_region:     input.locationRegion,
      values:              input.values,
      values_statement:    input.valuesStatement,
      transition_goals:    input.transitionGoals,
      transition_timeline: input.transitionTimeline,
      seller_financing:    input.sellerFinancing,
      management_training: input.managementTraining,
      anonymity_level:     input.anonymityLevel,
      owner_first_name:    input.ownerFirstName,
      location_city:       input.locationCity,
      business_name:       input.businessName,
      owner_full_name:     input.ownerFullName,
      revenue_exact:       input.revenueExact,
      asking_price_exact:  input.askingPriceExact,
      ebitda:              input.ebitda,
      updated_at:          new Date().toISOString(),
    })
    .eq('id', input.id)

  if (error) {
    console.error('updateSellerListing error:', error)
    return { error: 'Failed to update listing. Please try again.' }
  }

  await recomputeScoresForListing(input.id, {
    industry: input.industry, values: input.values, asking_range: input.askingRange, location_region: input.locationRegion,
  })

  revalidatePath('/seller/listing')
  revalidatePath('/seller/dashboard')
  return { success: true }
}
