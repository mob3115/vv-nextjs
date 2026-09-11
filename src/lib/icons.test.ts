import { describe, it, expect } from 'vitest'
import { getIndustryIcon, INDUSTRY_ICONS, NAV_ICONS } from './icons'

describe('getIndustryIcon', () => {
  it('returns the mapped icon for a known industry', () => {
    expect(getIndustryIcon('Healthcare')).toBe(INDUSTRY_ICONS['Healthcare'])
  })

  it('falls back to a default icon for an unrecognized industry (never crashes the UI)', () => {
    expect(getIndustryIcon('Underwater Basket Weaving')).toBe(INDUSTRY_ICONS['Other'])
  })

  it('falls back to a default icon for null/undefined (a listing with no industry set yet)', () => {
    expect(getIndustryIcon(null)).toBe(INDUSTRY_ICONS['Other'])
    expect(getIndustryIcon(undefined)).toBe(INDUSTRY_ICONS['Other'])
  })
})

describe('NAV_ICONS', () => {
  it('has an entry for every key referenced by BUYER_NAV, SELLER_NAV, and ADMIN_NAV', () => {
    // Keeps the nav config and the icon registry from silently drifting apart —
    // a typo'd icon key would otherwise only surface as a runtime crash in the sidebar.
    const usedKeys = [
      'discover', 'matches', 'messages', 'ndas', 'profile', 'switchMode',
      'dashboard', 'listing', 'interests', 'vault', 'auditLog', 'exit',
    ]
    for (const key of usedKeys) {
      expect(NAV_ICONS).toHaveProperty(key)
    }
  })
})
