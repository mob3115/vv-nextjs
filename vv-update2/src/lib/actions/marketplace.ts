'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sellerListingSchema, buyerProfileSchema, ndaSignSchema, swipeSchema } from '@/lib/validations'
import { enforceAnonymity } from '@/lib/utils'
import type { SellerListingInput, BuyerProfileInput, NdaSignInput, SwipeInput } from '@/lib/validations'
import type { ActionResult } from './auth'

// ---- Require authenticated user or throw ----
async function requireUser(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return user
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
// SWIPES — Record a swipe and create a match if liked
//
// Design decision: a buyer "like" immediately creates a match
// record with status='pending'. The match becomes 'mutual'
// when the seller also likes back. This means My Matches shows
// all listings the buyer has connected with, not just mutual ones.
// ============================================================

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

  // 2. If this is a buyer liking a listing — create a match record immediately
  if (direction === 'like' && targetListingId) {
    // Fetch the listing to get the seller's compatibility score
    const { data: listing } = await supabase
      .from('seller_listings')
      .select('seller_id')
      .eq('id', targetListingId)
      .single()

    if (listing) {
      // Get compatibility score
      const { data: scoreRow } = await supabase
        .from('compatibility_scores')
        .select('score')
        .eq('buyer_id', user.id)
        .eq('listing_id', targetListingId)
        .single()

      const score = scoreRow?.score ?? 60

      // Check if seller has already liked this buyer (mutual match)
      const { data: sellerSwipe } = await supabase
        .from('swipes')
        .select('id')
        .eq('swiper_id', listing.seller_id)
        .eq('target_buyer_id', user.id)
        .eq('direction', 'like')
        .maybeSingle()

      const isMutual = !!sellerSwipe

      // Upsert match record — pending if one-sided, mutual if both swiped
      const { error: matchError } = await supabase
        .from('matches')
        .upsert({
          buyer_id: user.id,
          seller_id: targetListingId,
          compatibility_score: score,
          buyer_liked: true,
          seller_liked: isMutual,
          status: isMutual ? 'mutual' : 'pending',
        }, { onConflict: 'buyer_id,seller_id' })

      if (matchError) {
        console.error('match upsert error:', matchError)
      }

      revalidatePath('/buyer/matches')
      return { success: true, matched: isMutual }
    }
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
  const { signature, matchId } = parsed.data

  // Verify user is a party to this match
  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .single()

  if (!match) return { error: 'Match not found or access denied.' }

  const isBuyer = match.buyer_id === user.id
  const signedAtField = isBuyer ? 'buyer_signed_at' : 'seller_signed_at'
  const signatureField = isBuyer ? 'buyer_signature' : 'seller_signature'

  // Check if other party already signed
  const otherSigned = isBuyer ? !!match.seller_signed_at : !!match.buyer_signed_at
  const newStatus = otherSigned ? 'signed' : 'pending'

  // Upsert NDA record
  const { error } = await supabase.from('ndas').upsert({
    match_id: matchId,
    buyer_id: match.buyer_id,
    seller_id: match.seller_id,
    [signedAtField]: new Date().toISOString(),
    [signatureField]: signature,
    status: newStatus,
  }, { onConflict: 'match_id' })

  if (error) {
    console.error('signNda error:', error)
    return { error: 'Failed to sign NDA. Please try again.' }
  }

  revalidatePath('/buyer/nda')
  revalidatePath('/seller/interests')
  return { success: true }
}

export async function getMatches() {
  const supabase = createClient()
  const user = await requireUser(supabase)

  const { data } = await supabase
    .from('matches')
    .select(`*, seller_listings(*), ndas(status, buyer_signed_at, seller_signed_at)`)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
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
