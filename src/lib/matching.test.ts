import { describe, it, expect } from 'vitest'
import {
  valuesCompatibility,
  industryCompatibility,
  priceCompatibility,
  geographyCompatibility,
  computeCompatibility,
  isRecognizedValue,
} from './matching'
import { CORE_VALUES } from './constants'

describe('CORE_VALUES / matching engine sync', () => {
  // The values-picker bug (a listing's saved values not matching the
  // current picklist) happened because two independent copies of this
  // list existed and drifted apart. Now there's one canonical list
  // (CORE_VALUES) — this guards against a *different* drift: every
  // selectable value having a real entry in the matching engine's
  // semantic map, not silently scoring as unrelated to everything.
  it('has a matching-engine vector for every selectable value', () => {
    const unrecognized = CORE_VALUES.filter(v => !isRecognizedValue(v))
    expect(unrecognized).toEqual([])
  })
})

describe('valuesCompatibility', () => {
  it('scores identical value sets at 100', () => {
    expect(valuesCompatibility(['Integrity', 'Craftsmanship'], ['Integrity', 'Craftsmanship'])).toBe(100)
  })

  it('scores semantically related-but-different values highly', () => {
    // Both lean heavily on the "people" dimension
    const score = valuesCompatibility(['Worker Safety'], ['Employee Wellbeing'])
    expect(score).toBeGreaterThan(85)
  })

  it('scores orthogonal values at 0', () => {
    // Free Enterprise (growth-only) vs Compassionate Care (people-only) share no dimension
    expect(valuesCompatibility(['Free Enterprise'], ['Compassionate Care'])).toBe(0)
  })

  it('is case-insensitive (data may not match canonical casing)', () => {
    const canonical = valuesCompatibility(['Worker Safety'], ['Worker Safety'])
    const mismatchedCasing = valuesCompatibility(['worker safety'], ['Worker Safety'])
    expect(mismatchedCasing).toBe(canonical)
    expect(mismatchedCasing).toBe(100)
  })

  it('treats an unrecognized value as having zero relation to anything (not a crash)', () => {
    expect(() => valuesCompatibility(['Some Made Up Value'], ['Integrity'])).not.toThrow()
    expect(valuesCompatibility(['Some Made Up Value'], ['Integrity'])).toBe(0)
  })

  it('returns a neutral 50 when either side has no values at all', () => {
    expect(valuesCompatibility([], ['Integrity'])).toBe(50)
    expect(valuesCompatibility(['Integrity'], [])).toBe(50)
    expect(valuesCompatibility(null, ['Integrity'])).toBe(50)
    expect(valuesCompatibility(['Integrity'], undefined)).toBe(50)
  })

  it('is symmetric regardless of argument order', () => {
    const a = valuesCompatibility(['Integrity', 'Sustainability'], ['Worker Safety'])
    const b = valuesCompatibility(['Worker Safety'], ['Integrity', 'Sustainability'])
    expect(a).toBe(b)
  })
})

describe('industryCompatibility', () => {
  it('scores an exact target-industry match at 100', () => {
    expect(industryCompatibility(['Healthcare', 'Technology'], 'Healthcare')).toBe(100)
  })

  it('gives partial credit (not zero) for a non-matching industry', () => {
    const score = industryCompatibility(['Healthcare'], 'Manufacturing')
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(100)
  })

  it('falls back to a neutral score when the buyer has no stated preferences', () => {
    expect(industryCompatibility([], 'Healthcare')).toBe(60)
    expect(industryCompatibility(null, 'Healthcare')).toBe(60)
    expect(industryCompatibility(['Healthcare'], null)).toBe(60)
  })
})

describe('priceCompatibility', () => {
  it('scores 100 when the buyer budget fully covers the ask range', () => {
    // A buyer's budget wider than the deal's price should NOT be penalized
    expect(priceCompatibility(500_000, 3_000_000, '$900K–$1.5M')).toBe(100)
  })

  it('scores partial coverage proportionally', () => {
    // Buyer can only afford the bottom half of a $1M–$2M ask
    const score = priceCompatibility(500_000, 1_500_000, '$1M–$2M')
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(100)
  })

  it('scores 0 when the ranges do not overlap at all', () => {
    expect(priceCompatibility(100_000, 300_000, '$5M–$8M')).toBe(0)
  })

  it('parses "Under $X" and "Over $X" bands', () => {
    expect(priceCompatibility(0, 400_000, 'Under $500K')).toBeGreaterThan(0)
    expect(priceCompatibility(30_000_000, 50_000_000, 'Over $25M')).toBeGreaterThan(0)
  })

  it('falls back to neutral when inputs are missing or unparseable', () => {
    expect(priceCompatibility(null, 100, '$1M–$2M')).toBe(60)
    expect(priceCompatibility(100, 200, null)).toBe(60)
    expect(priceCompatibility(100, 200, 'not a price')).toBe(60)
  })
})

describe('geographyCompatibility', () => {
  it('scores an exact region match at 100', () => {
    expect(geographyCompatibility('Midwest', 'Midwest')).toBe(100)
  })

  it('is case-insensitive', () => {
    expect(geographyCompatibility('midwest', 'Midwest')).toBe(100)
  })

  it('treats "National" and "Remote-operable" buyer preferences as matching anywhere', () => {
    expect(geographyCompatibility('National (open to any)', 'Southeast')).toBe(100)
    expect(geographyCompatibility('Remote-operable preferred', 'Southeast')).toBe(100)
  })

  it('gives partial (non-zero) credit for a region mismatch', () => {
    const score = geographyCompatibility('Midwest', 'Southeast')
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(100)
  })

  it('falls back to neutral when either side is missing', () => {
    expect(geographyCompatibility(null, 'Midwest')).toBe(60)
    expect(geographyCompatibility('Midwest', null)).toBe(60)
  })
})

describe('computeCompatibility', () => {
  const strongMatch = {
    buyerValues: ['Economic Mobility', 'Employee Ownership', 'Sustainability'],
    buyerTargetIndustries: ['Healthcare', 'Education Technology'],
    buyerMin: 500_000,
    buyerMax: 3_000_000,
    buyerLocationPref: 'Midwest',
    sellerValues: ['Accessible to All', 'Economic Mobility', 'Workforce Development'],
    sellerIndustry: 'Healthcare',
    sellerAskingRange: '$900K–$1.5M',
    sellerRegion: 'Midwest',
  }

  const weakMatch = {
    buyerValues: ['Free Enterprise', 'Innovation & Discovery'],
    buyerTargetIndustries: ['Technology'],
    buyerMin: 5_000_000,
    buyerMax: 8_000_000,
    buyerLocationPref: 'West Coast',
    sellerValues: ['Compassionate Care', 'Resident Dignity', 'Family Values'],
    sellerIndustry: 'Senior Care',
    sellerAskingRange: '$300K–$500K',
    sellerRegion: 'Northeast',
  }

  it('scores a realistic strong match well above a realistic weak match', () => {
    const strong = computeCompatibility(strongMatch)
    const weak = computeCompatibility(weakMatch)
    expect(strong.overall).toBeGreaterThan(70)
    expect(weak.overall).toBeLessThan(30)
    expect(strong.overall).toBeGreaterThan(weak.overall)
  })

  it('always returns an overall score clamped to 0-100', () => {
    const { overall } = computeCompatibility(strongMatch)
    expect(overall).toBeGreaterThanOrEqual(0)
    expect(overall).toBeLessThanOrEqual(100)
  })

  it('returns a breakdown with all four dimensions', () => {
    const { breakdown } = computeCompatibility(strongMatch)
    expect(breakdown).toHaveProperty('valuesMatch')
    expect(breakdown).toHaveProperty('industryFit')
    expect(breakdown).toHaveProperty('priceOverlap')
    expect(breakdown).toHaveProperty('geography')
  })

  it('never throws on a completely empty input (new profile with nothing filled in)', () => {
    expect(() => computeCompatibility({
      buyerValues: undefined,
      buyerTargetIndustries: undefined,
      buyerMin: undefined,
      buyerMax: undefined,
      buyerLocationPref: undefined,
      sellerValues: undefined,
      sellerIndustry: undefined,
      sellerAskingRange: undefined,
      sellerRegion: undefined,
    })).not.toThrow()
  })
})
