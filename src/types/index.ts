// ============================================================
// V+V Marketplace — Shared TypeScript Types
// These mirror the Supabase database schema exactly.
// ============================================================

export type UserRole = 'buyer' | 'seller' | 'dual' | 'admin'
export type AnonymityLevel = 1 | 2 | 3
export type SwipeDirection = 'like' | 'pass'
export type MatchStatus = 'pending' | 'mutual' | 'expired'
export type NdaStatus = 'pending' | 'signed' | 'declined'
export type ListingStatus = 'draft' | 'active' | 'paused' | 'sold'
export type FundingSource = 'cash' | 'sba_loan' | 'private_equity' | 'seller_financing' | 'combination'

// ---- Supabase Auth User (from auth.users) ----
export interface AuthUser {
  id: string
  email: string
  created_at: string
}

// ---- Profile (extends auth user, in public.profiles) ----
export interface Profile {
  id: string              // matches auth.users.id
  email: string           // encrypted in DB, decrypted on read
  full_name: string
  role: UserRole
  avatar_url: string | null
  suspended: boolean
  created_at: string
  updated_at: string
}

// ---- Seller Listing ----
export interface SellerListing {
  id: string
  seller_id: string       // references profiles.id
  status: ListingStatus
  anonymity_level: AnonymityLevel

  // Always visible
  industry: string
  industry_icon: string
  tagline: string
  years_operating: number
  employees_range: string
  revenue_band: string
  asking_range: string
  location_region: string
  values: string[]
  values_statement: string
  transition_goals: string
  transition_timeline: string
  seller_financing: boolean

  // Level 2+ (partial reveal)
  owner_first_name: string | null
  location_city: string | null

  // Level 3 (post-NDA only — never sent to client pre-NDA)
  business_name: string | null
  owner_full_name: string | null
  revenue_exact: string | null
  asking_price_exact: string | null
  ebitda: string | null

  created_at: string
  updated_at: string
}

// Safe listing — what the API returns based on anonymity level
export interface SafeListing extends Omit<SellerListing,
  'business_name' | 'owner_full_name' | 'revenue_exact' | 'asking_price_exact' | 'ebitda' | 'owner_first_name' | 'location_city'
> {
  business_name: string | null    // null unless level 3 unlocked
  owner_full_name: string | null  // null unless level 3
  revenue_exact: string | null    // null unless level 3
  asking_price_exact: string | null
  ebitda: string | null
  owner_first_name: string | null // null unless level 2+
  location_city: string | null    // null unless level 2+
  compatibility_score: number     // computed for current buyer
}

// ---- Buyer Profile ----
export interface BuyerProfile {
  id: string
  buyer_id: string        // references profiles.id
  background: string
  looking_for: string
  price_min: number
  price_max: number
  target_industries: string[]
  location_preference: string
  funding_source: FundingSource
  experience_years: string
  values: string[]
  values_statement: string
  created_at: string
  updated_at: string
}

// ---- Match ----
export interface Match {
  id: string
  buyer_id: string
  seller_id: string       // references seller_listings.id
  compatibility_score: number
  buyer_liked: boolean
  seller_liked: boolean
  status: MatchStatus
  created_at: string
}

// ---- NDA ----
export interface Nda {
  id: string
  match_id: string
  buyer_id: string
  seller_id: string
  status: NdaStatus
  buyer_signed_at: string | null
  seller_signed_at: string | null
  buyer_signature: string | null
  seller_signature: string | null
  created_at: string
}

// ---- Message ----
export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string         // encrypted in DB
  created_at: string
  read_at: string | null
}

// ---- Conversation ----
export interface Conversation {
  id: string
  match_id: string
  buyer_id: string
  seller_id: string
  nda_required: boolean
  created_at: string
}

// ---- Swipe ----
export interface Swipe {
  id: string
  swiper_id: string
  target_listing_id: string | null
  target_buyer_id: string | null
  direction: SwipeDirection
  created_at: string
}

// ---- Audit Log ----
export interface AuditLog {
  id: string
  actor_id: string | null
  event_type: string
  action: string
  resource_type: string | null
  resource_id: string | null
  ip_address: string | null
  metadata: Record<string, unknown>
  created_at: string
}

// ---- Form types (Zod-validated inputs) ----
export interface RegisterInput {
  email: string
  password: string
  fullName: string
  role: 'buyer' | 'seller' | 'dual'
}

export interface LoginInput {
  email: string
  password: string
}

export interface SellerListingInput {
  industry: string
  industryIcon: string
  tagline: string
  yearsOperating: number
  employeesRange: string
  revenueBand: string
  askingRange: string
  locationRegion: string
  values: string[]
  valuesStatement: string
  transitionGoals: string
  transitionTimeline: string
  sellerFinancing: boolean
  ownerFirstName: string
  locationCity: string
  businessName: string
  ownerFullName: string
  revenueExact: string
  askingPriceExact: string
  ebitda: string
  anonymityLevel: AnonymityLevel
}

export interface BuyerProfileInput {
  background: string
  lookingFor: string
  priceMin: number
  priceMax: number
  targetIndustries: string[]
  locationPreference: string
  fundingSource: FundingSource
  experienceYears: string
  values: string[]
  valuesStatement: string
}
