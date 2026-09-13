import { describe, it, expect } from 'vitest'
import {
  registerSchema, loginSchema, ndaSignSchema, swipeSchema, messageSchema, buyerProfileSchema,
  buyerRegisterSchema, sellerRegisterSchema, sellerListingSchema,
  requestPasswordResetSchema, updatePasswordSchema,
} from './validations'
import type { SellerListingInput } from './validations'

describe('registerSchema', () => {
  const valid = { email: 'a@b.com', password: 'Str0ng!Pass', fullName: 'Jane Doe', role: 'buyer' as const }

  it('accepts a valid registration', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects a password missing an uppercase letter', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'str0ng!pass' })
    expect(result.success).toBe(false)
  })

  it('rejects a password missing a number', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'Strong!Pass' })
    expect(result.success).toBe(false)
  })

  it('rejects a password missing a special character', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'Str0ngPass' })
    expect(result.success).toBe(false)
  })

  it('rejects a password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'Sh0rt!' })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid email', () => {
    expect(registerSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false)
  })

  it('rejects an invalid role', () => {
    expect(registerSchema.safeParse({ ...valid, role: 'admin' }).success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('accepts any non-empty password (strength is only enforced at registration)', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true)
  })
  it('rejects an empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false)
  })
})

describe('requestPasswordResetSchema', () => {
  it('accepts a valid email', () => {
    expect(requestPasswordResetSchema.safeParse({ email: 'a@b.com' }).success).toBe(true)
  })
  it('rejects an invalid email', () => {
    expect(requestPasswordResetSchema.safeParse({ email: 'not-an-email' }).success).toBe(false)
  })
})

describe('updatePasswordSchema', () => {
  it('accepts a strong password', () => {
    expect(updatePasswordSchema.safeParse({ password: 'Str0ng!Pass' }).success).toBe(true)
  })
  it('enforces the same strength rules as registration', () => {
    expect(updatePasswordSchema.safeParse({ password: 'weak' }).success).toBe(false)
    expect(updatePasswordSchema.safeParse({ password: 'nouppercase1!' }).success).toBe(false)
    expect(updatePasswordSchema.safeParse({ password: 'NoNumber!!' }).success).toBe(false)
    expect(updatePasswordSchema.safeParse({ password: 'NoSpecial1' }).success).toBe(false)
  })
})

describe('ndaSignSchema', () => {
  const validMatchId = '123e4567-e89b-12d3-a456-426614174000'

  it('accepts a valid signature + initials + matchId', () => {
    const result = ndaSignSchema.safeParse({ signature: 'Jane Doe', initials: 'JD', matchId: validMatchId })
    expect(result.success).toBe(true)
  })

  it('rejects a non-UUID matchId (can\'t sign an NDA for an arbitrary string)', () => {
    const result = ndaSignSchema.safeParse({ signature: 'Jane Doe', initials: 'JD', matchId: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })

  it('rejects a one-character signature', () => {
    const result = ndaSignSchema.safeParse({ signature: 'J', initials: 'JD', matchId: validMatchId })
    expect(result.success).toBe(false)
  })

  it('rejects missing initials', () => {
    const result = ndaSignSchema.safeParse({ signature: 'Jane Doe', initials: '', matchId: validMatchId })
    expect(result.success).toBe(false)
  })

  it('rejects initials that are actually a full name (defeats the point of initials)', () => {
    const result = ndaSignSchema.safeParse({ signature: 'Jane Doe', initials: 'Jane Elizabeth Doe', matchId: validMatchId })
    expect(result.success).toBe(false)
  })
})

describe('swipeSchema', () => {
  const uuid = '123e4567-e89b-12d3-a456-426614174000'

  it('accepts a buyer-likes-listing swipe', () => {
    expect(swipeSchema.safeParse({ targetListingId: uuid, direction: 'like' }).success).toBe(true)
  })

  it('accepts a seller-likes-buyer swipe', () => {
    expect(swipeSchema.safeParse({ targetBuyerId: uuid, direction: 'like' }).success).toBe(true)
  })

  it('rejects an invalid direction', () => {
    expect(swipeSchema.safeParse({ targetListingId: uuid, direction: 'super-like' }).success).toBe(false)
  })

  it('rejects a non-UUID target id', () => {
    expect(swipeSchema.safeParse({ targetListingId: 'abc', direction: 'like' }).success).toBe(false)
  })

  // Note: the DB's `one_target` check constraint is what actually enforces
  // exactly one of targetListingId/targetBuyerId is set — the zod schema
  // intentionally allows both/neither to pass through to that DB-level gate.
})

describe('messageSchema', () => {
  const uuid = '123e4567-e89b-12d3-a456-426614174000'

  it('accepts a normal message', () => {
    expect(messageSchema.safeParse({ matchId: uuid, content: 'Hello!' }).success).toBe(true)
  })

  it('rejects an empty message', () => {
    expect(messageSchema.safeParse({ matchId: uuid, content: '' }).success).toBe(false)
  })

  it('rejects a whitespace-only message (trimmed before length check)', () => {
    expect(messageSchema.safeParse({ matchId: uuid, content: '   ' }).success).toBe(false)
  })

  it('rejects a message over the 4000-character limit', () => {
    expect(messageSchema.safeParse({ matchId: uuid, content: 'x'.repeat(4001) }).success).toBe(false)
  })

  it('accepts a message right at the 4000-character limit', () => {
    expect(messageSchema.safeParse({ matchId: uuid, content: 'x'.repeat(4000) }).success).toBe(true)
  })
})

describe('buyerProfileSchema', () => {
  const valid = {
    background: 'A'.repeat(25),
    lookingFor: 'B'.repeat(25),
    priceMin: 500_000,
    priceMax: 1_000_000,
    targetIndustries: ['Healthcare'],
    locationPreference: 'Midwest',
    fundingSource: 'cash' as const,
    experienceYears: '10 years',
    values: ['Integrity'],
    valuesStatement: 'C'.repeat(55),
  }

  it('accepts a valid profile', () => {
    expect(buyerProfileSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects priceMax not greater than priceMin', () => {
    const result = buyerProfileSchema.safeParse({ ...valid, priceMin: 1_000_000, priceMax: 500_000 })
    expect(result.success).toBe(false)
  })

  it('rejects more than 5 values', () => {
    const result = buyerProfileSchema.safeParse({ ...valid, values: ['a', 'b', 'c', 'd', 'e', 'f'] })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid funding source', () => {
    const result = buyerProfileSchema.safeParse({ ...valid, fundingSource: 'crypto' })
    expect(result.success).toBe(false)
  })
})

const validSellerListing: SellerListingInput = {
  industry: 'Healthcare',
  industryIcon: 'Healthcare',
  tagline: 'A'.repeat(15),
  yearsOperating: 12,
  employeesRange: '11–20',
  revenueBand: '$1M–$2M',
  askingRange: '$2M–$4M',
  locationRegion: 'Midwest',
  values: ['Integrity'],
  valuesStatement: 'B'.repeat(55),
  transitionGoals: 'C'.repeat(25),
  transitionTimeline: '6–12 months',
  sellerFinancing: false,
  managementTraining: false,
  anonymityLevel: 1,
  ownerFirstName: 'Jane',
  locationCity: 'Cleveland, OH',
  businessName: 'Ironwood Fabrication Co.',
  ownerFullName: 'Jane Doe',
  revenueExact: '$1,800,000',
  askingPriceExact: '$3,200,000',
  ebitda: '',
}

describe('sellerListingSchema', () => {
  it('accepts a valid listing', () => {
    expect(sellerListingSchema.safeParse(validSellerListing).success).toBe(true)
  })

  it('rejects a tagline under 10 characters', () => {
    expect(sellerListingSchema.safeParse({ ...validSellerListing, tagline: 'short' }).success).toBe(false)
  })

  it('rejects more than 5 values', () => {
    expect(sellerListingSchema.safeParse({ ...validSellerListing, values: ['a', 'b', 'c', 'd', 'e', 'f'] }).success).toBe(false)
  })

  it('rejects an invalid anonymity level', () => {
    expect(sellerListingSchema.safeParse({ ...validSellerListing, anonymityLevel: 4 }).success).toBe(false)
  })
})

// ---- Onboarding: registration + full profile/listing combined ----
describe('buyerRegisterSchema', () => {
  const validBuyerProfile = {
    background: 'A'.repeat(25),
    lookingFor: 'B'.repeat(25),
    priceMin: 500_000,
    priceMax: 1_000_000,
    targetIndustries: ['Healthcare'],
    locationPreference: 'Midwest',
    fundingSource: 'cash' as const,
    experienceYears: '10 years',
    values: ['Integrity'],
    valuesStatement: 'C'.repeat(55),
  }
  const valid = {
    email: 'a@b.com', password: 'Str0ng!Pass', fullName: 'Jane Doe',
    role: 'buyer' as const, profile: validBuyerProfile,
  }

  it('accepts a valid buyer registration with a complete profile', () => {
    expect(buyerRegisterSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts role "dual" (buyers who also plan to sell)', () => {
    expect(buyerRegisterSchema.safeParse({ ...valid, role: 'dual' }).success).toBe(true)
  })

  it('rejects role "seller" (sellers register through sellerRegisterSchema instead)', () => {
    expect(buyerRegisterSchema.safeParse({ ...valid, role: 'seller' }).success).toBe(false)
  })

  it('rejects an incomplete profile (missing required fields still enforced)', () => {
    const { valuesStatement, ...incomplete } = validBuyerProfile
    expect(buyerRegisterSchema.safeParse({ ...valid, profile: incomplete }).success).toBe(false)
  })

  it('rejects a weak password, same rules as plain registerSchema', () => {
    expect(buyerRegisterSchema.safeParse({ ...valid, password: 'weak' }).success).toBe(false)
  })
})

describe('sellerRegisterSchema', () => {
  const valid = {
    email: 'a@b.com', password: 'Str0ng!Pass', fullName: 'Jane Doe',
    listing: validSellerListing,
  }

  it('accepts a valid seller registration with a complete listing', () => {
    expect(sellerRegisterSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects an incomplete listing (missing required fields still enforced)', () => {
    const { businessName, ...incomplete } = validSellerListing
    expect(sellerRegisterSchema.safeParse({ ...valid, listing: incomplete }).success).toBe(false)
  })

  it('rejects a weak password, same rules as plain registerSchema', () => {
    expect(sellerRegisterSchema.safeParse({ ...valid, password: 'weak' }).success).toBe(false)
  })
})
