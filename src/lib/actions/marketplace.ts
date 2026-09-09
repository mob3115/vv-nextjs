'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sellerListingSchema, buyerProfileSchema, ndaSignSchema, swipeSchema } from '@/lib/validations'
import { enforceAnonymity } from '@/lib/utils'
import { NDA_TEMPLATE_VERSION } from '@/lib/nda-template'
import { requireUser, resolveMatchParty } from './shared'
import type { SellerListingInput, BuyerProfileInput, NdaSignInput, SwipeInput } from '@/lib/validations'
import type { ActionResult } from './auth'

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

  // 4. Compatibility scores for this buyer
  const { data: scoreRows } = await supabase
    .from('compatibility_scores')
    .select('listing_id, score')
    .eq('buyer_id', user.id)

  const scoreMap = new Map(
    (scoreRows ?? []).map((s: any) => [s.listing_id, s.score])
  )

  // 5. NDA status — determines anonymity level
  const { data: ndaRows } = await supabase
    .from('ndas')
    .select('seller_id, status')
    .eq('buyer_id', user.id)
    .eq('status', 'signed')

  const signedSellerIds = new Set((ndaRows ?? []).map((n: any) => n.seller_id))

  // 6. Apply anonymity, attach score, sort by score descending
  return unseen
    .map((listing: any) => ({
      ...enforceAnonymity(listing, signedSellerIds.has(listing.seller_id)),
      compatibility_score: scoreMap.get(listing.id) ?? 60,
    }))
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

  const { error } = await supabase.from('seller_listings').insert({
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
  })

  if (error) {
    console.error('createSellerListing error:', error)
    return { error: 'Failed to create listing. Please try again.' }
  }

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
// Design decision: a buyer "like" immediately creates a match record
// with status='pending' — this is what makes a listing show up in the
// buyer's My Matches. A seller "like" never creates that record by
// itself (a seller liking a buyer who has never touched the listing
// shouldn't manufacture a "connection" on the buyer's side); it just
// gets saved as a swipe, and flips an already-existing match to
// 'mutual' if the buyer has liked too.
//
// Both branches re-read *both* sides' swipe rows fresh via
// getMatchState() every time either side likes, so it never matters
// who liked first — a late like on either side self-corrects the
// match instead of needing separate "catch-up" logic.
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

    const { buyerLiked, sellerLiked, score } = await getMatchState(
      supabase, user.id, targetListingId, listing.seller_id
    )
    const isMutual = buyerLiked && sellerLiked

    const { error: matchError } = await supabase
      .from('matches')
      .upsert({
        buyer_id: user.id,
        seller_id: targetListingId,
        compatibility_score: score,
        buyer_liked: buyerLiked,
        seller_liked: sellerLiked,
        status: isMutual ? 'mutual' : 'pending',
      }, { onConflict: 'buyer_id,seller_id' })

    if (matchError) console.error('match upsert error:', matchError)

    revalidatePath('/buyer/matches')
    revalidatePath('/seller/interests')
    return { success: true, matched: isMutual }
  }

  // 2b. Seller liking a buyer — flip the buyer's existing match to mutual.
  // No match exists yet if the buyer hasn't liked back; in that case the
  // swipe above is all there is to save for now (see design note above).
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

    const { buyerLiked, sellerLiked } = await getMatchState(
      supabase, targetBuyerId, listing.id, user.id
    )
    // Legitimate no-op when a seller likes a buyer through Discover Buyers who
    // hasn't liked this listing back yet — nothing to flip to mutual yet.
    if (!buyerLiked) return { success: true, matched: false }

    // .select() here is load-bearing: without it, an UPDATE that Postgres
    // RLS silently filters down to 0 matched rows still comes back with
    // error === null — a real failure would otherwise be reported as
    // success. Requires the "Parties can update own matches" RLS policy
    // (migration 002) to actually be applied.
    const { data: updatedRows, error: matchError } = await supabase
      .from('matches')
      .update({ seller_liked: sellerLiked, status: sellerLiked ? 'mutual' : 'pending' })
      .eq('buyer_id', targetBuyerId)
      .eq('seller_id', listing.id)
      .select('id')

    if (matchError) {
      console.error('match update error:', matchError)
      return { error: 'Failed to connect. Please try again.' }
    }
    if (!updatedRows || updatedRows.length === 0) {
      console.error('match update affected 0 rows for buyer', targetBuyerId, 'listing', listing.id,
        '— check that migration 002 (matches UPDATE policy) has been applied.')
      return { error: 'Could not connect right now. Please try again in a moment.' }
    }

    revalidatePath('/seller/interests')
    revalidatePath('/buyer/matches')
    return { success: true, matched: sellerLiked }
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

  revalidatePath('/seller/listing')
  revalidatePath('/seller/dashboard')
  return { success: true }
}
