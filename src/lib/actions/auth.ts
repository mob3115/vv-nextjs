'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { loginSchema, buyerRegisterSchema, sellerRegisterSchema } from '@/lib/validations'
import { recomputeScoresForBuyer, recomputeScoresForListing } from './marketplace'
import { logAuditEvent } from './audit'
import type { LoginInput, BuyerRegisterInput, SellerRegisterInput } from '@/lib/validations'

export type ActionResult = {
  error?: string
  success?: boolean
}

// Registration collects the account *and* the full buyer profile / seller
// listing in one wizard, so there's no separate "now go build your profile"
// or "now go create a listing" step after signing up — see registerAction's
// former single-step version, replaced by these two.
//
// Supabase Auth requiring email confirmation (the default here — see
// auth/confirm) means signUp() often returns no session yet, so the profile
// row can't always be written through the user's own (still-unauthenticated)
// client. Falling back to the admin client — scoped strictly to the id
// Supabase just returned for *this* signup, never one supplied by the
// client — writes the row immediately regardless, so it's ready the moment
// the user confirms their email and logs in for the first time.
async function signUpAccount(email: string, password: string, fullName: string, role: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
      data: { full_name: fullName, role },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'An account with this email already exists. Please sign in.' } as const
    }
    return { error: error.message } as const
  }
  if (!data.user) {
    return { error: 'Registration failed. Please try again.' } as const
  }

  // Same client the signUp call ran on, so it carries the fresh session
  // when one was issued (RLS keeps this write scoped to the new user
  // regardless); the admin client otherwise, for the no-session case above.
  const db = data.session ? supabase : createAdminClient()

  await logAuditEvent(db, {
    actorId: data.user.id,
    eventType: 'AUTH',
    action: 'REGISTER',
    resourceType: 'profile',
    resourceId: data.user.id,
    metadata: { role },
  })

  return {
    userId: data.user.id,
    db,
    needsEmailConfirmation: !data.session,
  } as const
}

export async function registerBuyerAction(
  input: BuyerRegisterInput
): Promise<ActionResult & { needsEmailConfirmation?: boolean }> {
  const parsed = buyerRegisterSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }
  const { email, password, fullName, role, profile } = parsed.data

  const signUpResult = await signUpAccount(email, password, fullName, role)
  if ('error' in signUpResult) return { error: signUpResult.error }
  const { userId, db, needsEmailConfirmation } = signUpResult

  const { error: profileError } = await db.from('buyer_profiles').upsert({
    buyer_id: userId,
    background: profile.background,
    looking_for: profile.lookingFor,
    price_min: profile.priceMin,
    price_max: profile.priceMax,
    target_industries: profile.targetIndustries,
    location_preference: profile.locationPreference,
    funding_source: profile.fundingSource,
    experience_years: profile.experienceYears,
    values: profile.values,
    values_statement: profile.valuesStatement,
  }, { onConflict: 'buyer_id' })

  if (profileError) {
    console.error('registerBuyerAction profile error:', profileError)
    return {
      error: 'Your account was created, but saving your profile failed. Please sign in and complete it from My Profile.',
    }
  }

  await recomputeScoresForBuyer(userId, {
    values: profile.values,
    target_industries: profile.targetIndustries,
    price_min: profile.priceMin,
    price_max: profile.priceMax,
    location_preference: profile.locationPreference,
  })

  return { success: true, needsEmailConfirmation }
}

export async function registerSellerAction(
  input: SellerRegisterInput
): Promise<ActionResult & { needsEmailConfirmation?: boolean }> {
  const parsed = sellerRegisterSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }
  const { email, password, fullName, listing } = parsed.data

  const signUpResult = await signUpAccount(email, password, fullName, 'seller')
  if ('error' in signUpResult) return { error: signUpResult.error }
  const { userId, db, needsEmailConfirmation } = signUpResult

  const { data: created, error: listingError } = await db.from('seller_listings').insert({
    seller_id: userId,
    status: 'active',
    industry: listing.industry,
    industry_icon: listing.industryIcon,
    tagline: listing.tagline,
    years_operating: listing.yearsOperating,
    employees_range: listing.employeesRange,
    revenue_band: listing.revenueBand,
    asking_range: listing.askingRange,
    location_region: listing.locationRegion,
    values: listing.values,
    values_statement: listing.valuesStatement,
    transition_goals: listing.transitionGoals,
    transition_timeline: listing.transitionTimeline,
    seller_financing: listing.sellerFinancing,
    management_training: listing.managementTraining,
    anonymity_level: listing.anonymityLevel,
    owner_first_name: listing.ownerFirstName,
    location_city: listing.locationCity,
    business_name: listing.businessName,
    owner_full_name: listing.ownerFullName,
    revenue_exact: listing.revenueExact,
    asking_price_exact: listing.askingPriceExact,
    ebitda: listing.ebitda,
  }).select('id').single()

  if (listingError) {
    console.error('registerSellerAction listing error:', listingError)
    return {
      error: 'Your account was created, but publishing your listing failed. Please sign in and publish it from My Listing.',
    }
  }

  await recomputeScoresForListing(created.id, {
    industry: listing.industry, values: listing.values, asking_range: listing.askingRange, location_region: listing.locationRegion,
  })

  return { success: true, needsEmailConfirmation }
}

export async function loginAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { email, password } = parsed.data
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Never reveal whether the email or password was wrong specifically
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Invalid email or password.' }
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Please check your email and confirm your account before signing in.' }
    }
    return { error: 'Sign in failed. Please try again.' }
  }

  await logAuditEvent(supabase, {
    actorId: data.user.id,
    eventType: 'AUTH',
    action: 'LOGIN',
  })

  revalidatePath('/', 'layout')
  redirect('/buyer/discover') // middleware will re-route by role
}

export async function logoutAction(): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    await logAuditEvent(supabase, { actorId: user.id, eventType: 'AUTH', action: 'LOGOUT' })
  }

  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/auth/login')
}

export async function getSessionAction() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}
