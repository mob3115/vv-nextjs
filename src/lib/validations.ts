import { z } from 'zod'

// Shared by every registration schema below, so password/email/name rules
// can't drift between the plain account schema and the combined
// account+profile / account+listing onboarding schemas.
const accountFields = {
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name is too long'),
}

export const registerSchema = z.object({
  ...accountFields,
  role: z.enum(['buyer', 'seller', 'dual'], {
    errorMap: () => ({ message: 'Please select a role' }),
  }),
})

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const sellerListingSchema = z.object({
  industry: z.string().min(1, 'Industry is required'),
  industryIcon: z.string().min(1),
  tagline: z.string().min(10, 'Tagline must be at least 10 characters').max(120),
  yearsOperating: z.number().int().min(0).max(200),
  employeesRange: z.string().min(1, 'Employee range is required'),
  revenueBand: z.string().min(1, 'Revenue band is required'),
  askingRange: z.string().min(1, 'Asking range is required'),
  locationRegion: z.string().min(1, 'Region is required'),
  values: z.array(z.string()).min(1).max(5, 'Choose up to 5 values'),
  valuesStatement: z.string().min(50, 'Please write at least 50 characters').max(1000),
  transitionGoals: z.string().min(20, 'Please describe your goals').max(1000),
  transitionTimeline: z.string().min(1, 'Timeline is required'),
  sellerFinancing: z.boolean(),
  managementTraining: z.boolean().optional().default(false),
  anonymityLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  // Private fields (encrypted / hidden pre-NDA)
  ownerFirstName: z.string().min(1, 'First name is required'),
  locationCity: z.string().min(1, 'City is required'),
  businessName: z.string().min(1, 'Business name is required'),
  ownerFullName: z.string().min(2, 'Full legal name is required'),
  revenueExact: z.string().min(1, 'Revenue is required'),
  askingPriceExact: z.string().min(1, 'Asking price is required'),
  ebitda: z.string().optional().default(''),
})

export const buyerProfileSchema = z.object({
  background: z.string().min(20, 'Please describe your background').max(500),
  lookingFor: z.string().min(20, 'Please describe what you\'re looking for').max(500),
  priceMin: z.number().min(0, 'Must be positive'),
  priceMax: z.number().min(1, 'Must be positive'),
  targetIndustries: z.array(z.string()).min(1, 'Select at least one industry').max(10),
  locationPreference: z.string().min(1, 'Location preference is required'),
  fundingSource: z.enum(['cash', 'sba_loan', 'private_equity', 'seller_financing', 'combination']),
  experienceYears: z.string().min(1, 'Experience is required'),
  values: z.array(z.string()).min(1).max(5, 'Choose up to 5 values'),
  valuesStatement: z.string().min(50, 'Please write at least 50 characters').max(1000),
}).refine(d => d.priceMax > d.priceMin, {
  message: 'Maximum price must be greater than minimum',
  path: ['priceMax'],
})

// ---- Onboarding — account creation + full profile/listing in one submit ----
// Used so a new buyer's complete profile (not just a throwaway values pick)
// is saved during registration, and a new seller's listing goes live in the
// same flow instead of requiring a separate "create a listing" step later.
export const buyerRegisterSchema = z.object({
  ...accountFields,
  role: z.enum(['buyer', 'dual']),
  profile: buyerProfileSchema,
})

export const sellerRegisterSchema = z.object({
  ...accountFields,
  listing: sellerListingSchema,
})

export const ndaSignSchema = z.object({
  signature: z.string().min(2, 'Please type your full legal name').max(200),
  initials: z
    .string()
    .min(1, 'Please add your initials')
    .max(8, 'Initials should be a few letters, not your full name'),
  matchId: z.string().uuid(),
})

export const swipeSchema = z.object({
  targetListingId: z.string().uuid().optional(),
  targetBuyerId: z.string().uuid().optional(),
  direction: z.enum(['like', 'pass']),
})

export const messageSchema = z.object({
  matchId: z.string().uuid(),
  content: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(4000, 'Message is too long (4000 character limit)'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type SellerListingInput = z.infer<typeof sellerListingSchema>
export type BuyerProfileInput = z.infer<typeof buyerProfileSchema>
export type BuyerRegisterInput = z.infer<typeof buyerRegisterSchema>
export type SellerRegisterInput = z.infer<typeof sellerRegisterSchema>
export type NdaSignInput = z.infer<typeof ndaSignSchema>
export type SwipeInput = z.infer<typeof swipeSchema>
export type MessageInput = z.infer<typeof messageSchema>
