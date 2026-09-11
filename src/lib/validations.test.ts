import { describe, it, expect } from 'vitest'
import {
  registerSchema, loginSchema, ndaSignSchema, swipeSchema, messageSchema, buyerProfileSchema,
} from './validations'

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
