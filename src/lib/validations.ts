import { z } from 'zod'

export const registerSchema = z.object({
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
  sellerFinancing: z.boolean(),`n  managementTraining: z.boolean().optional().default(false),
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

export const ndaSignSchema = z.object({
  signature: z.string().min(2, 'Please type your full legal name'),
  matchId: z.string().uuid(),
})

export const swipeSchema = z.object({
  targetListingId: z.string().uuid().optional(),
  targetBuyerId: z.string().uuid().optional(),
  direction: z.enum(['like', 'pass']),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type SellerListingInput = z.infer<typeof sellerListingSchema>
export type BuyerProfileInput = z.infer<typeof buyerProfileSchema>
export type NdaSignInput = z.infer<typeof ndaSignSchema>
export type SwipeInput = z.infer<typeof swipeSchema>

