// ============================================================
// V+V Values-Based Matching Engine
//
// The platform's whole pitch is matching buyers and sellers on shared
// values, not just deal terms. This is the real implementation behind
// that pitch — every value a user can pick is placed in a small semantic
// space, and compatibility is a blend of values affinity plus practical
// fit (industry, price, geography).
// ============================================================

// ---- Semantic dimensions ----
// Each of the 24 selectable values is scored 0-1 on each dimension below.
// Similarity between two values is the cosine similarity of these vectors,
// so values that lean on the same underlying concerns (e.g. "Worker Safety"
// and "Employee Wellbeing") score highly related even when the exact tag
// differs — while still keeping unrelated values genuinely far apart.
type Dimension = 'people' | 'community' | 'planet' | 'craft' | 'growth' | 'integrity'

const DIMENSIONS: Dimension[] = ['people', 'community', 'planet', 'craft', 'growth', 'integrity']

// Must stay in sync with ALL_VALUES in ListingForm.tsx / BuyerProfileForm.tsx.
const VALUE_VECTORS: Record<string, Partial<Record<Dimension, number>>> = {
  'Investing Local':           { community: 1.0, people: 0.2 },
  'Craftsmanship':             { craft: 1.0, integrity: 0.3 },
  'Employee Wellbeing':        { people: 1.0, integrity: 0.2 },
  'Long Term Investment':      { growth: 0.9, integrity: 0.4 },
  'Equity':                    { growth: 0.5, community: 0.6, people: 0.3 },
  'Environmental Stewardship': { planet: 1.0, integrity: 0.3 },
  'Employee Ownership':        { people: 0.8, growth: 0.6, integrity: 0.3 },
  'Accessible to All':         { community: 0.9, people: 0.5 },
  'Worker Safety':             { people: 1.0, integrity: 0.4 },
  'Creative Excellence':       { craft: 0.7, growth: 0.3 },
  'Economic Mobility':         { community: 0.8, people: 0.6 },
  'Free Enterprise':           { growth: 1.0 },
  'Conscious Capitalism':      { growth: 0.7, integrity: 0.6, people: 0.3, planet: 0.2 },
  'Compassionate Care':        { people: 1.0, community: 0.3 },
  'Sustainability':            { planet: 1.0, growth: 0.2 },
  'Workforce Development':     { people: 0.8, community: 0.3, growth: 0.2 },
  'Customer Focused':          { community: 0.8, integrity: 0.3 },
  'Resident Dignity':          { people: 1.0, integrity: 0.3 },
  'Excellence & Quality':      { craft: 1.0 },
  'Family Values':             { people: 0.7, community: 0.4, integrity: 0.3 },
  'Innovation & Discovery':    { craft: 0.5, growth: 0.5 },
  'Individual Responsibility': { integrity: 0.8, growth: 0.3 },
  'Integrity':                 { integrity: 1.0 },
  'Client Stewardship':        { integrity: 0.6, community: 0.5, people: 0.2 },
}

// Case-insensitive lookup — real data has included values that differ from
// VALUE_VECTORS only in casing (e.g. "Worker safety" vs "Worker Safety").
// Wholly different wording still won't match; that's a data problem, not
// something a lookup can fix, but this closes the cheap, common case.
const VALUE_VECTORS_LOWER: Record<string, Partial<Record<Dimension, number>>> = Object.fromEntries(
  Object.entries(VALUE_VECTORS).map(([k, v]) => [k.toLowerCase(), v])
)

function vectorOf(value: string): number[] {
  const v = VALUE_VECTORS_LOWER[value.toLowerCase()]
  return DIMENSIONS.map(d => v?.[d] ?? 0)
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  if (magA === 0 || magB === 0) return 0
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

function valueSimilarity(a: string, b: string): number {
  if (a.toLowerCase() === b.toLowerCase()) return 1
  return Math.max(0, cosine(vectorOf(a), vectorOf(b)))
}

// Soft, order-independent set similarity: each value on one side is matched
// against its single best counterpart on the other side, then averaged in
// both directions. Rewards real overlap and closely-related values without
// requiring an exact match, and without being skewed by set-size alone.
export function valuesCompatibility(buyerValues: string[] | null | undefined, sellerValues: string[] | null | undefined): number {
  const bv = (buyerValues ?? []).filter(Boolean)
  const sv = (sellerValues ?? []).filter(Boolean)
  if (bv.length === 0 || sv.length === 0) return 50 // no signal either way

  const bestMatchAvg = (from: string[], to: string[]) =>
    from.reduce((sum, v) => sum + Math.max(...to.map(o => valueSimilarity(v, o))), 0) / from.length

  const buyerToSeller = bestMatchAvg(bv, sv)
  const sellerToBuyer = bestMatchAvg(sv, bv)
  return Math.round(((buyerToSeller + sellerToBuyer) / 2) * 100)
}

// ---- Industry fit ----
export function industryCompatibility(buyerTargetIndustries: string[] | null | undefined, sellerIndustry: string | null | undefined): number {
  if (!buyerTargetIndustries?.length || !sellerIndustry) return 60
  return buyerTargetIndustries.includes(sellerIndustry) ? 100 : 35
}

// ---- Price overlap ----
// asking_range / revenue_band are free-ish text like "$2M–$4M", "$900K–$1.5M",
// "Under $500K", "Over $25M" — parsed into a numeric [min, max] band.
function parseMoneyToken(token: string): number | null {
  const m = token.replace(/,/g, '').match(/\$?\s*([\d.]+)\s*(K|M|B)?/i)
  if (!m) return null
  const num = parseFloat(m[1])
  if (Number.isNaN(num)) return null
  const mult = { K: 1e3, M: 1e6, B: 1e9 }[m[2]?.toUpperCase() as 'K' | 'M' | 'B'] ?? 1
  return num * mult
}

function parseMoneyRange(text: string | null | undefined): [number, number] | null {
  if (!text) return null
  const t = text.trim()

  const under = t.match(/under\s+(.+)/i)
  if (under) {
    const max = parseMoneyToken(under[1])
    return max != null ? [0, max] : null
  }
  const over = t.match(/over\s+(.+)/i)
  if (over) {
    const min = parseMoneyToken(over[1])
    return min != null ? [min, min * 4] : null // open-ended — arbitrary but generous ceiling
  }

  const parts = t.split(/–|—|-|\bto\b/i).map(s => s.trim()).filter(Boolean)
  if (parts.length >= 2) {
    const lo = parseMoneyToken(parts[0])
    const hi = parseMoneyToken(parts[1])
    if (lo != null && hi != null) return [Math.min(lo, hi), Math.max(lo, hi)]
  }

  const single = parseMoneyToken(t)
  return single != null ? [single * 0.8, single * 1.2] : null
}

// Measured as how much of the seller's ask range falls inside the buyer's
// budget — not symmetric overlap, which would wrongly penalize a buyer for
// having a *wider* budget than the deal costs (a buyer who can afford
// $500K–$3M should score perfectly against a $900K–$1.5M asking price).
export function priceCompatibility(
  buyerMin: number | null | undefined,
  buyerMax: number | null | undefined,
  sellerAskingRange: string | null | undefined
): number {
  const sellerBand = parseMoneyRange(sellerAskingRange)
  if (!sellerBand || buyerMin == null || buyerMax == null) return 60

  const [sMin, sMax] = sellerBand
  const overlapLen = Math.max(0, Math.min(buyerMax, sMax) - Math.max(buyerMin, sMin))
  const sellerRangeLen = sMax - sMin
  if (sellerRangeLen <= 0) {
    return (buyerMin <= sMax && buyerMax >= sMin) ? 100 : 0
  }
  return Math.round(Math.min(1, overlapLen / sellerRangeLen) * 100)
}

// ---- Geography ----
export function geographyCompatibility(
  buyerLocationPref: string | null | undefined,
  sellerRegion: string | null | undefined
): number {
  if (!buyerLocationPref || !sellerRegion) return 60
  const pref = buyerLocationPref.toLowerCase()
  if (pref.startsWith('national') || pref.includes('remote-operable')) return 100
  return pref === sellerRegion.toLowerCase() ? 100 : 40
}

// ---- Combined score ----
export interface CompatibilityInput {
  buyerValues: string[] | null | undefined
  buyerTargetIndustries: string[] | null | undefined
  buyerMin: number | null | undefined
  buyerMax: number | null | undefined
  buyerLocationPref: string | null | undefined
  sellerValues: string[] | null | undefined
  sellerIndustry: string | null | undefined
  sellerAskingRange: string | null | undefined
  sellerRegion: string | null | undefined
}

export interface CompatibilityResult {
  overall: number
  breakdown: {
    valuesMatch: number
    industryFit: number
    priceOverlap: number
    geography: number
  }
}

// Values-based matching is the core pitch, so it carries the most weight.
const WEIGHTS = { values: 0.45, industry: 0.20, price: 0.20, geography: 0.15 } as const

export function computeCompatibility(input: CompatibilityInput): CompatibilityResult {
  const valuesMatch = valuesCompatibility(input.buyerValues, input.sellerValues)
  const industryFit = industryCompatibility(input.buyerTargetIndustries, input.sellerIndustry)
  const priceOverlap = priceCompatibility(input.buyerMin, input.buyerMax, input.sellerAskingRange)
  const geography = geographyCompatibility(input.buyerLocationPref, input.sellerRegion)

  const overall = Math.round(
    valuesMatch * WEIGHTS.values +
    industryFit * WEIGHTS.industry +
    priceOverlap * WEIGHTS.price +
    geography * WEIGHTS.geography
  )

  return {
    overall: Math.min(100, Math.max(0, overall)),
    breakdown: { valuesMatch, industryFit, priceOverlap, geography },
  }
}
