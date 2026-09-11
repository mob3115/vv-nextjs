// ============================================================
// Shared picklists — single source of truth
//
// Previously duplicated verbatim between ListingForm.tsx and
// BuyerProfileForm.tsx. Two copies of the same list is exactly how the
// values-picker bug happened (a value saved under one wording/casing no
// longer matched the picklist used to render it) — keeping one copy here
// means there's nothing left to drift apart.
// ============================================================

export const INDUSTRIES = [
  'Manufacturing', 'Healthcare', 'Food & Beverage', 'Education Technology',
  'Environmental Services', 'Events & Hospitality', 'Landscaping & Property Services',
  'Media & Publishing', 'Veterinary / Animal Health', 'Security & Risk',
  'Professional Services', 'Senior Care', 'Technology', 'Retail',
  'Construction', 'Transportation & Logistics', 'Finance & Insurance', 'Other',
]

// The canonical set of selectable "values" — must stay in sync with
// VALUE_VECTORS in src/lib/matching.ts (the matching engine's semantic
// map of what each value means).
export const CORE_VALUES = [
  'Investing Local',
  'Craftsmanship',
  'Employee Wellbeing',
  'Long Term Investment',
  'Equity',
  'Environmental Stewardship',
  'Employee Ownership',
  'Accessible to All',
  'Worker Safety',
  'Creative Excellence',
  'Economic Mobility',
  'Free Enterprise',
  'Conscious Capitalism',
  'Compassionate Care',
  'Sustainability',
  'Workforce Development',
  'Customer Focused',
  'Resident Dignity',
  'Excellence & Quality',
  'Family Values',
  'Innovation & Discovery',
  'Individual Responsibility',
  'Integrity',
  'Client Stewardship',
]

export const MAX_CORE_VALUES = 5

export const REGIONS = [
  'Northeast', 'Mid-Atlantic', 'Southeast', 'South', 'Midwest',
  'Southwest', 'West Coast', 'Pacific Northwest', 'National',
]

// Buyer location preference includes two extra "open to anywhere" options
// beyond the plain region list above (see geographyCompatibility in
// matching.ts, which treats both as matching any region).
export const BUYER_LOCATION_PREFERENCES = [
  ...REGIONS.filter(r => r !== 'National'),
  'National (open to any)',
  'Remote-operable preferred',
]

export const REVENUE_BANDS = [
  'Under $500K', '$500K–$1M', '$1M–$2.5M',
  '$2.5M–$5M', '$5M–$10M', '$10M–$25M', 'Over $25M',
]

export const TRANSITION_TIMELINES = [
  '3–6 months', '6–12 months', '12–18 months',
  '18–24 months', '2–3 years', 'No set timeline',
]

export const FUNDING_SOURCES = [
  { value: 'cash',             label: 'Cash',             desc: 'Self-funded acquisition' },
  { value: 'sba_loan',         label: 'SBA Loan',         desc: 'Government-backed financing' },
  { value: 'private_equity',   label: 'Private Equity',   desc: 'PE fund or investor group' },
  { value: 'seller_financing', label: 'Seller Financing', desc: 'Seller carries part of the note' },
  { value: 'combination',      label: 'Combination',      desc: 'Mix of the above' },
]

export const FUNDING_LABELS: Record<string, string> = Object.fromEntries(
  FUNDING_SOURCES.map(f => [f.value, f.label])
)
