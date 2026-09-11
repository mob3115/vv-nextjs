import { describe, it, expect } from 'vitest'
import { scoreColor, anonLabel, formatCurrency, enforceAnonymity } from './utils'
import type { SellerListing } from '@/types'

function makeListing(overrides: Partial<SellerListing> = {}): SellerListing {
  return {
    id: 'listing-1',
    seller_id: 'seller-1',
    status: 'active',
    anonymity_level: 1,
    industry: 'Healthcare',
    industry_icon: 'Healthcare',
    tagline: 'A great business',
    years_operating: 10,
    employees_range: '10-20',
    revenue_band: '$1M-$2M',
    asking_range: '$1M-$2M',
    location_region: 'Midwest',
    values: ['Integrity'],
    values_statement: 'We believe in doing right by people.',
    transition_goals: 'Retire comfortably.',
    transition_timeline: '6-12 months',
    seller_financing: false,
    owner_first_name: 'Jane',
    location_city: 'Chicago, IL',
    business_name: 'Acme Health Co.',
    owner_full_name: 'Jane Doe',
    revenue_exact: '$1.5M',
    asking_price_exact: '$1.2M',
    ebitda: '$300K',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('scoreColor', () => {
  it('returns the success color at and above 85', () => {
    expect(scoreColor(85)).toBe('#4caf7d')
    expect(scoreColor(100)).toBe('#4caf7d')
  })
  it('returns the mid-tier color between 70 and 84', () => {
    expect(scoreColor(70)).toBe('#C46A00')
    expect(scoreColor(84)).toBe('#C46A00')
  })
  it('returns the low-tier color below 70', () => {
    expect(scoreColor(0)).toBe('#929292')
    expect(scoreColor(69)).toBe('#929292')
  })
})

describe('anonLabel', () => {
  it('labels each anonymity level', () => {
    expect(anonLabel(1)).toBe('Anonymous')
    expect(anonLabel(2)).toBe('Partial ID')
    expect(anonLabel(3)).toBe('Full Reveal')
  })
})

describe('formatCurrency', () => {
  it('formats millions', () => expect(formatCurrency(2_500_000)).toBe('$2.5M'))
  it('formats thousands', () => expect(formatCurrency(45_000)).toBe('$45K'))
  it('formats small values as-is', () => expect(formatCurrency(500)).toBe('$500'))
})

// enforceAnonymity is the actual server-side privacy gate that prevents
// pre-NDA business details from ever reaching the client — worth covering
// thoroughly, since a regression here is a real data leak, not a cosmetic bug.
describe('enforceAnonymity', () => {
  it('level 1 (no NDA): hides everything level 2+ and level 3', () => {
    const result = enforceAnonymity(makeListing({ anonymity_level: 1 }), false)
    expect(result.business_name).toBeNull()
    expect(result.owner_full_name).toBeNull()
    expect(result.revenue_exact).toBeNull()
    expect(result.asking_price_exact).toBeNull()
    expect(result.ebitda).toBeNull()
    expect(result.owner_first_name).toBeNull()
    expect(result.location_city).toBeNull()
  })

  it('level 2 (no NDA): reveals partial ID fields but not level 3 fields', () => {
    const result = enforceAnonymity(makeListing({ anonymity_level: 2 }), false)
    expect(result.owner_first_name).toBe('Jane')
    expect(result.location_city).toBe('Chicago, IL')
    expect(result.business_name).toBeNull()
    expect(result.owner_full_name).toBeNull()
    expect(result.revenue_exact).toBeNull()
  })

  it('level 3 (no NDA): reveals everything the listing itself allows', () => {
    const result = enforceAnonymity(makeListing({ anonymity_level: 3 }), false)
    expect(result.business_name).toBe('Acme Health Co.')
    expect(result.owner_full_name).toBe('Jane Doe')
    expect(result.revenue_exact).toBe('$1.5M')
  })

  it('a signed NDA unlocks full reveal regardless of the listing\'s own anonymity level', () => {
    const result = enforceAnonymity(makeListing({ anonymity_level: 1 }), true)
    expect(result.anonymity_level).toBe(3)
    expect(result.business_name).toBe('Acme Health Co.')
    expect(result.owner_full_name).toBe('Jane Doe')
    expect(result.revenue_exact).toBe('$1.5M')
    expect(result.asking_price_exact).toBe('$1.2M')
    expect(result.ebitda).toBe('$300K')
  })

  it('never leaks level-3 fields when NDA is unsigned, no matter the stored anonymity_level value', () => {
    // Defense in depth: even if a bad anonymity_level slipped through, an
    // unsigned NDA must never result in full-reveal fields being present.
    for (const level of [1, 2] as const) {
      const result = enforceAnonymity(makeListing({ anonymity_level: level }), false)
      expect(result.business_name).toBeNull()
      expect(result.owner_full_name).toBeNull()
      expect(result.revenue_exact).toBeNull()
      expect(result.asking_price_exact).toBeNull()
      expect(result.ebitda).toBeNull()
    }
  })
})
