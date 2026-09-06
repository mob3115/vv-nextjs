'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sellerListingSchema, buyerProfileSchema, ndaSignSchema, swipeSchema } from '@/lib/validations'
import { enforceAnonymity } from '@/lib/utils'
import type { SellerListingInput, BuyerProfileInput, NdaSignInput, SwipeInput } from '@/lib/validations'
import type { ActionResult } from './auth'

// ---- Get current user profile ----
async function requireUser(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

// ============================================================
// LISTINGS
// ============================================================

export async function getDiscoverListings() {
  const supabase = createClient()
  const user = await requireUser(supabase)

  // Get listings buyer hasn't swiped on yet
  const { data: swipedIds } = await supabase
    .from('swipes')
    .select('target_listing_id')
    .eq('swiper_id', user.id)
    .not('target_listing_id', 'is', null)

  const excludeIds = (swipedIds ?? [])
    .map(s => s.target_listing_id)
    .filter(Boolean) as string[]

  let query = supabase
    .from('seller_listings')
    .select(`
      *,
      compatibility_scores(score)
    `)
    .eq('status', 'active')
    .neq('seller_id', user.id)
    .order('compatibility_scores(score)', { ascending: false })

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`)
  }

  const { data: listings, error } = await query

  if (error) {
    console.error('getDiscoverListings error:', error)
    return []
  }

  // Get NDA status for each listing
  const { data: ndas } = await supabase
    .from('ndas')
    .select('seller_id, status')
    .eq('buyer_id', user.id)
    .eq('status', 'signed')

  const signedSellerIds = new Set((ndas ?? []).map(n => n.seller_id))

  // Enforce anonymity server-side before returning to client
  return (listings ?? []).map(listing => ({
    ...enforceAnonymity(listing, signedSellerIds.has(listing.seller_id)),
    compatibility_score: listing.compatibility_scores?.[0]?.score ?? 50,
  }))
}

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
// BUYER PROFILES
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
// SWIPES
// ============================================================

export async function recordSwipe(input: SwipeInput): Promise<ActionResult & { matched?: boolean }> {
  const parsed = swipeSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid swipe data' }

  const supabase = createClient()
  const user = await requireUser(supabase)
  const d = parsed.data

  // Insert swipe record
  const { error } = await supabase.from('swipes').insert({
    swiper_id: user.id,
    target_listing_id: d.targetListingId ?? null,
    target_buyer_id: d.targetBuyerId ?? null,
    direction: d.direction,
  })

  if (error) {
    if (error.code === '23505') return { success: true } // duplicate swipe — ignore
    return { error: 'Failed to record swipe' }
  }

  // Check for mutual match (if buyer liked a listing)
  if (d.direction === 'like' && d.targetListingId) {
    const { data: listing } = await supabase
      .from('seller_listings')
      .select('seller_id')
      .eq('id', d.targetListingId)
      .single()

    if (listing) {
      // Check if seller has also liked this buyer
      const { data: sellerSwipe } = await supabase
        .from('swipes')
        .select('id')
        .eq('swiper_id', listing.seller_id)
        .eq('target_buyer_id', user.id)
        .eq('direction', 'like')
        .single()

      if (sellerSwipe) {
        // Mutual match — create match and conversation
        await supabase.from('matches').insert({
          buyer_id: user.id,
          seller_id: d.targetListingId,
          compatibility_score: 80, // fetched from compatibility_scores in prod
          buyer_liked: true,
          seller_liked: true,
          status: 'mutual',
        })

        revalidatePath('/buyer/matches')
        return { success: true, matched: true }
      }
    }
  }

  return { success: true, matched: false }
}

// ============================================================
// NDAs
// ============================================================

export async function signNda(input: NdaSignInput): Promise<ActionResult> {
  const parsed = ndaSignSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = createClient()
  const user = await requireUser(supabase)
  const { signature, matchId } = parsed.data

  // Verify user is party to this match
  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .single()

  if (!match) return { error: 'Match not found or access denied.' }

  const isBuyer = match.buyer_id === user.id
  const updateField = isBuyer
    ? { buyer_signed_at: new Date().toISOString(), buyer_signature: signature }
    : { seller_signed_at: new Date().toISOString(), seller_signature: signature }

  // Upsert NDA record
  const { data: nda } = await supabase
    .from('ndas')
    .select('*')
    .eq('match_id', matchId)
    .single()

  if (nda) {
    await supabase.from('ndas').update({
      ...updateField,
      status: nda.buyer_signed_at && nda.seller_signed_at ? 'signed' : 'pending',
    }).eq('id', nda.id)
  } else {
    await supabase.from('ndas').insert({
      match_id: matchId,
      buyer_id: match.buyer_id,
      seller_id: match.seller_id,
      ...updateField,
      status: 'pending',
    })
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
    .select(`
      *,
      seller_listings(*),
      ndas(status, buyer_signed_at, seller_signed_at)
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  return data ?? []
}


