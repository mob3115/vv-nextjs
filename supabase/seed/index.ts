/**
 * V+V Marketplace — Demo Seed Script
 * Run: npm run db:seed
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // bypasses RLS
  { auth: { persistSession: false } }
)

// ---- Demo passwords ----
const DEMO_PASSWORD = 'Demo@VV2024!'

// ---- Sellers ----
const SELLERS = [
  { email: 'marcus@demo.vv', name: 'Marcus Delray', initials: 'MD',
    listing: { industry: 'Manufacturing', industry_icon: '🏭', tagline: 'Built for craftsmen. Ran like a family.', years_operating: 28, employees_range: '45–60', revenue_band: '$3M–$5M', asking_range: '$2M–$4M', location_region: 'Midwest', values: ['Craftsmanship', 'Employee dignity', 'Long-term thinking'], values_statement: "We believe skilled trades deserve the same respect as any profession. Every person on our floor has been with us over eight years. I'm not selling to the highest bidder — I'm finding someone who sees what I see.", transition_goals: "I want to retire knowing my team is taken care of and the company keeps doing meaningful work. I'd ideally stay on for 12 months as a consultant.", transition_timeline: '12–18 months', seller_financing: true, anonymity_level: 1, owner_first_name: 'Marcus', location_city: 'Cleveland, OH', business_name: 'Ironwood Fabrication Co.', owner_full_name: 'Marcus Delray', revenue_exact: '$4.2M', asking_price_exact: '$2.8M', ebitda: '$680K' } },
  { email: 'priya@demo.vv', name: 'Priya Nambiar', initials: 'PN',
    listing: { industry: 'Healthcare', industry_icon: '🌿', tagline: 'Mental health care that actually reaches people.', years_operating: 11, employees_range: '18–25', revenue_band: '$1M–$2.5M', asking_range: '$900K–$1.5M', location_region: 'Southeast', values: ['Accessibility', 'Community impact', 'Clinical excellence'], values_statement: "We built this practice to serve people who've historically been locked out of mental health care. Our sliding scale model and community outreach are the core of what we do — not a footnote.", transition_goals: 'Looking for a buyer who will expand the mission, not extract margin. Ideally someone with healthcare experience or a strong operational background.', transition_timeline: '6–12 months', seller_financing: false, anonymity_level: 2, owner_first_name: 'Priya', location_city: 'Atlanta, GA', business_name: 'Root & Branch Therapy Network', owner_full_name: 'Priya Nambiar', revenue_exact: '$1.8M', asking_price_exact: '$1.2M', ebitda: '$280K' } },
  { email: 'tom@demo.vv', name: 'Tom Grzelak', initials: 'TG',
    listing: { industry: 'Food & Beverage', industry_icon: '🥖', tagline: 'Three decades of morning regulars and real bread.', years_operating: 34, employees_range: '12–18', revenue_band: '$500K–$1M', asking_range: '$300K–$500K', location_region: 'Northeast', values: ['Community gathering', 'Authentic craft', 'Neighborhood roots'], values_statement: 'I opened this place the same year my youngest was born. It\'s not just a bakery — it\'s where the neighborhood comes. Funerals, graduations, every Tuesday for Frank Kowalski and his crew.', transition_goals: "Retirement. I need someone who wants to be here, not own from a distance.", transition_timeline: '3–6 months', seller_financing: true, anonymity_level: 1, owner_first_name: 'Tom', location_city: 'Buffalo, NY', business_name: "Grzelak's Bakery & Café", owner_full_name: 'Tom Grzelak', revenue_exact: '$720K', asking_price_exact: '$380K', ebitda: '$95K' } },
  { email: 'denise@demo.vv', name: 'Denise Kamau', initials: 'DK',
    listing: { industry: 'Education Technology', industry_icon: '📚', tagline: 'Workforce training that closes real skill gaps.', years_operating: 9, employees_range: '8–14', revenue_band: '$1.5M–$3M', asking_range: '$3M–$4M', location_region: 'West Coast', values: ['Economic mobility', 'Evidence-based learning', 'Equity'], values_statement: "We run programs that actually get people into better-paying jobs. 78% placement rate, not because we cherry-pick but because we build the curriculum around employer demand.", transition_goals: 'Expanding to two new metro markets. Looking for a growth-oriented buyer who can bring capital and operational depth.', transition_timeline: '18–24 months', seller_financing: false, anonymity_level: 2, owner_first_name: 'Denise', location_city: 'Portland, OR', business_name: 'Meridian Learning Solutions', owner_full_name: 'Denise Kamau', revenue_exact: '$2.1M', asking_price_exact: '$3.4M', ebitda: '$480K' } },
  { email: 'ray@demo.vv', name: 'Ray Okonkwo', initials: 'RO',
    listing: { industry: 'Environmental Services', industry_icon: '♻️', tagline: 'Remediation work that actually cleans things up.', years_operating: 17, employees_range: '30–40', revenue_band: '$4M–$6M', asking_range: '$3M–$5M', location_region: 'Midwest', values: ['Environmental justice', 'Worker safety', 'Accountability'], values_statement: "We've spent 17 years doing the hard cleanup work in communities that got stuck with someone else's mess.", transition_goals: 'I want to sell to someone who understands environmental services isn\'t just a contracts business.', transition_timeline: '12–18 months', seller_financing: true, anonymity_level: 1, owner_first_name: 'Ray', location_city: 'Detroit, MI', business_name: 'Okonkwo Environmental Services', owner_full_name: 'Ray Okonkwo', revenue_exact: '$5.1M', asking_price_exact: '$3.9M', ebitda: '$710K' } },
  { email: 'sandra@demo.vv', name: 'Sandra Whitfield', initials: 'SW',
    listing: { industry: 'Events & Hospitality', industry_icon: '🎉', tagline: 'Corporate events that people actually talk about.', years_operating: 14, employees_range: '6–10', revenue_band: '$800K–$1.5M', asking_range: '$700K–$1.1M', location_region: 'South', values: ['Intentional hospitality', 'Creative excellence', 'Vendor relationships'], values_statement: 'Every event we design tells a story. Our repeat client rate is 84% because we take the time to understand what a client is trying to say.', transition_goals: 'Looking for a buyer who is entrepreneurial, creative, and willing to invest in the brand\'s growth.', transition_timeline: '6–12 months', seller_financing: false, anonymity_level: 2, owner_first_name: 'Sandra', location_city: 'Nashville, TN', business_name: 'Whitfield & Co. Events', owner_full_name: 'Sandra Whitfield', revenue_exact: '$1.1M', asking_price_exact: '$850K', ebitda: '$195K' } },
  { email: 'carlos@demo.vv', name: 'Carlos Espinoza', initials: 'CE',
    listing: { industry: 'Landscaping & Property Services', industry_icon: '🌳', tagline: 'Commercial landscaping built on a crew that stays.', years_operating: 22, employees_range: '28–38', revenue_band: '$2.5M–$4M', asking_range: '$1.8M–$2.5M', location_region: 'Southwest', values: ['Workforce development', 'Quality over volume', 'Long-term contracts'], values_statement: 'I pay above market and promote from within. Most of my foremen started pushing wheelbarrows. That retention is why clients renew year after year.', transition_goals: 'I want a buyer who sees the crew as the asset, not a liability to cut.', transition_timeline: '6–12 months', seller_financing: true, anonymity_level: 1, owner_first_name: 'Carlos', location_city: 'Phoenix, AZ', business_name: 'Espinoza Precision Landscaping', owner_full_name: 'Carlos Espinoza', revenue_exact: '$3.3M', asking_price_exact: '$2.1M', ebitda: '$490K' } },
  { email: 'amara@demo.vv', name: 'Amara Osei', initials: 'AO',
    listing: { industry: 'Media & Publishing', industry_icon: '📰', tagline: 'Independent media with a 20-year reader relationship.', years_operating: 16, employees_range: '12–20', revenue_band: '$2M–$3.5M', asking_range: '$3.5M–$5M', location_region: 'Northeast', values: ['Editorial independence', 'Diverse voices', 'Reader trust'], values_statement: "We've never taken a brand partnership that compromised our journalism. Our readers know it and trust us because of it.", transition_goals: 'Would consider a journalist collective, mission-aligned PE, or an individual buyer with media background.', transition_timeline: '6–12 months', seller_financing: false, anonymity_level: 2, owner_first_name: 'Amara', location_city: 'New York, NY', business_name: 'Osei Publishing Group', owner_full_name: 'Amara Osei', revenue_exact: '$2.7M', asking_price_exact: '$4.2M', ebitda: '$380K' } },
  { email: 'beth@demo.vv', name: 'Beth Kowalczyk', initials: 'BK',
    listing: { industry: 'Veterinary / Animal Health', industry_icon: '🐾', tagline: 'A neighborhood vet practice 19 years in the making.', years_operating: 19, employees_range: '14–18', revenue_band: '$1M–$2M', asking_range: '$1.5M–$2.2M', location_region: 'Midwest', values: ['Compassionate care', 'Community trust', 'Affordable access'], values_statement: 'I started this practice because I wanted to do good medicine without being owned by a corporate chain. My clients aren\'t customers — they\'re neighbors who trust me with animals they love.', transition_goals: 'Looking for a veterinarian-buyer who will keep the practice independent. Not interested in selling to a private equity rollup.', transition_timeline: '12–18 months', seller_financing: true, anonymity_level: 1, owner_first_name: 'Beth', location_city: 'Chicago, IL', business_name: 'North Shore Veterinary Clinic', owner_full_name: 'Beth Kowalczyk', revenue_exact: '$1.6M', asking_price_exact: '$1.9M', ebitda: '$310K' } },
  { email: 'james@demo.vv', name: 'James Thornton', initials: 'JT',
    listing: { industry: 'Security & Risk', industry_icon: '🔒', tagline: 'Government-grade security advisory, boutique delivery.', years_operating: 13, employees_range: '8–12', revenue_band: '$3M–$5M', asking_range: '$4.5M–$6M', location_region: 'Mid-Atlantic', values: ['Integrity', 'Precision', 'Long-term client protection'], values_statement: 'Every client is a long-term engagement. We don\'t do one-and-done assessments. The relationships with federal clients and cleared staff are what make this business worth what it is.', transition_goals: 'Looking for a strategic buyer — ideally a mid-market firm wanting to add cleared consulting capability.', transition_timeline: '18–24 months', seller_financing: false, anonymity_level: 2, owner_first_name: 'James', location_city: 'Washington, DC', business_name: 'Thornton Security Consulting', owner_full_name: 'James Thornton', revenue_exact: '$3.8M', asking_price_exact: '$5.2M', ebitda: '$920K' } },
  { email: 'fatima@demo.vv', name: 'Fatima Al-Rashid', initials: 'FA',
    listing: { industry: 'Professional Services', industry_icon: '📊', tagline: 'Boutique accounting built entirely on referrals.', years_operating: 12, employees_range: '10–16', revenue_band: '$1.5M–$3M', asking_range: '$2.5M–$3.5M', location_region: 'South', values: ['Client stewardship', 'Work-life balance', 'Professional growth'], values_statement: "We've never run an ad. 100% of our growth has been word-of-mouth from clients who trust us with the real numbers.", transition_goals: 'Looking for a buyer who values client relationship continuity. Ideally an accounting professional or small firm looking to grow.', transition_timeline: '12–18 months', seller_financing: true, anonymity_level: 1, owner_first_name: 'Fatima', location_city: 'Houston, TX', business_name: 'Clarity Accounting Partners', owner_full_name: 'Fatima Al-Rashid', revenue_exact: '$2.2M', asking_price_exact: '$2.9M', ebitda: '$510K' } },
  { email: 'devon@demo.vv', name: 'Devon Park', initials: 'DP',
    listing: { industry: 'Senior Care', industry_icon: '🏡', tagline: 'Dignity-centered senior care in a community setting.', years_operating: 21, employees_range: '55–70', revenue_band: '$5M–$8M', asking_range: '$7.5M–$10M', location_region: 'Pacific Northwest', values: ['Resident dignity', 'Staff retention', 'Family trust'], values_statement: 'Our staff tenure averages 9 years. In this industry, that\'s almost unheard of. It happens because we treat caregivers the way we want residents treated.', transition_goals: 'Considering sale or partnership to fund expansion to a second location. Seeking a buyer who understands this business runs on human relationships.', transition_timeline: '18–24 months', seller_financing: false, anonymity_level: 2, owner_first_name: 'Devon', location_city: 'Seattle, WA', business_name: 'Cedar Crest Senior Living', owner_full_name: 'Devon Park', revenue_exact: '$6.8M', asking_price_exact: '$8.5M', ebitda: '$1.2M' } },
]

// ---- Buyers ----
const BUYERS = [
  { email: 'angela@demo.vv', name: 'Angela Reyes', profile: { background: 'Former nonprofit executive with 15 years in workforce development', looking_for: 'Mission-aligned service businesses in healthcare or education', price_min: 500000, price_max: 3000000, target_industries: ['Healthcare', 'Education Technology', 'Professional Services'], location_preference: 'Midwest', funding_source: 'sba_loan', experience_years: '15 years', values: ['Community impact', 'Employee ownership', 'Sustainability'], values_statement: "I've spent my career building programs that actually move the needle on economic mobility. I want to run a business that does the same thing, just with a sustainable model underneath." } },
  { email: 'derek@demo.vv', name: 'Derek Wainwright', profile: { background: 'Private equity principal, 12 years in lower-middle market', looking_for: 'Established businesses with strong cash flow and leadership teams', price_min: 3000000, price_max: 10000000, target_industries: ['Manufacturing', 'Environmental Services', 'Senior Care'], location_preference: 'National', funding_source: 'private_equity', experience_years: '12 years', values: ['Long-term value creation', 'Operational excellence', 'Employee retention'], values_statement: "I've seen what bad PE looks like from the inside. I'm building something different — a hold period measured in decades, not exit multiples." } },
  { email: 'solange@demo.vv', name: 'Solange Mbeki', profile: { background: 'Physician entrepreneur, built and sold two medical group practices', looking_for: 'Healthcare or wellness businesses with strong clinical culture', price_min: 1000000, price_max: 4000000, target_industries: ['Healthcare', 'Veterinary / Animal Health', 'Senior Care'], location_preference: 'Southeast', funding_source: 'cash', experience_years: '18 years', values: ['Clinical excellence', 'Patient dignity', 'Community trust'], values_statement: 'Healthcare businesses are only as good as the people delivering care. I buy culture, not just numbers.' } },
  { email: 'nathan@demo.vv', name: 'Nathan Kopp', profile: { background: 'Second-generation entrepreneur, ran family HVAC business for 10 years', looking_for: 'Blue-collar service businesses with loyal crews', price_min: 1000000, price_max: 3000000, target_industries: ['Landscaping & Property Services', 'Manufacturing', 'Environmental Services'], location_preference: 'Midwest', funding_source: 'sba_loan', experience_years: '10 years', values: ['Skilled trades respect', 'Team loyalty', 'Operational integrity'], values_statement: "I grew up watching my dad treat his employees like family. That's the only kind of business I want to run." } },
  { email: 'vivienne@demo.vv', name: 'Vivienne Laforge', profile: { background: 'Former CMO turned entrepreneur, 20 years in brand and hospitality', looking_for: 'Creative service or hospitality businesses with strong brand equity', price_min: 500000, price_max: 2000000, target_industries: ['Events & Hospitality', 'Food & Beverage', 'Media & Publishing'], location_preference: 'South', funding_source: 'seller_financing', experience_years: '20 years', values: ['Creative excellence', 'Brand integrity', 'Client relationships'], values_statement: "I'm not looking to buy a revenue stream. I'm looking for a business that has a genuine point of view." } },
  { email: 'jerome@demo.vv', name: 'Jerome Blackwood', profile: { background: 'CPA and former Big 4 partner, 22 years in professional services', looking_for: 'Accounting, advisory, or professional service firms', price_min: 1000000, price_max: 4000000, target_industries: ['Professional Services', 'Security & Risk'], location_preference: 'South', funding_source: 'cash', experience_years: '22 years', values: ['Client stewardship', 'Professional integrity', 'Team development'], values_statement: "The most valuable thing in professional services is the trust clients extend to their advisors. I look for practices where that trust has been earned honestly." } },
  { email: 'maya@demo.vv', name: 'Maya Ostrowski', profile: { background: 'EdTech founder, exited Series B startup, passionate about workforce development', looking_for: 'Education or training businesses with measurable outcomes', price_min: 2000000, price_max: 5000000, target_industries: ['Education Technology', 'Professional Services'], location_preference: 'West Coast', funding_source: 'cash', experience_years: '13 years', values: ['Economic mobility', 'Evidence-based outcomes', 'Equity in education'], values_statement: "The EdTech graveyard is full of companies that optimized for engagement over outcomes. I want to own something that's honest about what it delivers." } },
  { email: 'curtis@demo.vv', name: 'Curtis Haynes', profile: { background: 'Army veteran, 8 years in federal contracting, building a portfolio', looking_for: 'Government-adjacent businesses or security consulting', price_min: 3000000, price_max: 7000000, target_industries: ['Security & Risk', 'Environmental Services'], location_preference: 'Mid-Atlantic', funding_source: 'sba_loan', experience_years: '8 years', values: ['Integrity', 'Service', 'Long-term accountability'], values_statement: "In the military, your reputation follows you everywhere. I want to run a business that operates the same way." } },
  { email: 'ingrid@demo.vv', name: 'Ingrid Halvorsen', profile: { background: 'Former food & beverage executive, 25 years with regional chains', looking_for: 'Established restaurants or food businesses with loyal customer bases', price_min: 300000, price_max: 1200000, target_industries: ['Food & Beverage', 'Events & Hospitality'], location_preference: 'Northeast', funding_source: 'cash', experience_years: '25 years', values: ['Authentic craft', 'Community gathering', 'Sustainability'], values_statement: "I've spent my career making other people's concepts successful. Now I want to steward something that already has a soul." } },
  { email: 'terrence@demo.vv', name: 'Terrence Malone', profile: { background: 'Independent sponsor, former M&A attorney, deal-driven but values-led', looking_for: 'Scalable service businesses in fragmented markets', price_min: 2000000, price_max: 6000000, target_industries: ['Landscaping & Property Services', 'Senior Care', 'Environmental Services'], location_preference: 'National', funding_source: 'combination', experience_years: '14 years', values: ['Long-term stewardship', 'Fair dealing', 'Value creation'], values_statement: "I've structured enough bad deals to know what the good ones look like. The best acquisitions are the ones where the seller sleeps well after closing." } },
  { email: 'nadia@demo.vv', name: 'Nadia Brennan', profile: { background: 'Journalist turned media entrepreneur, 2 independent publications', looking_for: 'Independent media, newsletters, or publishing businesses', price_min: 1000000, price_max: 5000000, target_industries: ['Media & Publishing'], location_preference: 'Northeast', funding_source: 'combination', experience_years: '16 years', values: ['Editorial independence', 'Reader trust', 'Diverse voices'], values_statement: "I believe independent media is one of the most important businesses anyone can own right now." } },
  { email: 'paul@demo.vv', name: 'Paul & Lisa Sato', profile: { background: 'Spouses transitioning from corporate careers — Paul in logistics, Lisa in nursing', looking_for: 'Small healthcare or service business they can run together', price_min: 800000, price_max: 2500000, target_industries: ['Veterinary / Animal Health', 'Senior Care', 'Healthcare'], location_preference: 'Midwest', funding_source: 'seller_financing', experience_years: '30 years combined', values: ['Compassionate care', 'Community trust', 'Family business values'], values_statement: "We want to build something we're proud of together. We're not looking for passive income — we want to show up every day for people who are counting on us." } },
]

// Compatibility scores matrix (buyer index → seller index → score)
const COMPAT_SCORES: Record<number, Record<number, number>> = {
  0:  { 0: 91, 1: 87, 2: 74, 3: 83, 4: 69, 5: 78, 6: 72, 7: 65, 8: 80, 9: 62, 10: 76, 11: 88 },
  1:  { 0: 84, 1: 65, 2: 58, 3: 72, 4: 88, 5: 61, 6: 79, 7: 55, 8: 70, 9: 67, 10: 60, 11: 91 },
  2:  { 0: 62, 1: 92, 2: 58, 3: 68, 4: 55, 5: 70, 6: 60, 7: 58, 8: 89, 9: 50, 10: 64, 11: 85 },
  3:  { 0: 88, 1: 66, 2: 71, 3: 70, 4: 90, 5: 62, 6: 85, 7: 60, 8: 72, 9: 58, 10: 68, 11: 75 },
  4:  { 0: 65, 1: 60, 2: 86, 3: 62, 4: 58, 5: 91, 6: 60, 7: 82, 8: 60, 9: 52, 10: 66, 11: 68 },
  5:  { 0: 72, 1: 60, 2: 65, 3: 80, 4: 62, 5: 68, 6: 74, 7: 60, 8: 66, 9: 85, 10: 90, 11: 60 },
  6:  { 0: 78, 1: 90, 2: 68, 3: 92, 4: 72, 5: 62, 6: 70, 7: 60, 8: 74, 9: 58, 10: 68, 11: 82 },
  7:  { 0: 60, 1: 58, 2: 60, 3: 66, 4: 72, 5: 60, 6: 64, 7: 62, 8: 68, 9: 88, 10: 65, 11: 62 },
  8:  { 0: 68, 1: 62, 2: 90, 3: 64, 4: 58, 5: 88, 6: 62, 7: 80, 8: 65, 9: 56, 10: 66, 11: 70 },
  9:  { 0: 75, 1: 68, 2: 72, 3: 84, 4: 86, 5: 70, 6: 88, 7: 65, 8: 74, 9: 62, 10: 72, 11: 85 },
  10: { 0: 60, 1: 55, 2: 62, 3: 60, 4: 58, 5: 62, 6: 60, 7: 92, 8: 62, 9: 58, 10: 60, 11: 60 },
  11: { 0: 72, 1: 88, 2: 74, 3: 70, 4: 66, 5: 72, 6: 68, 7: 64, 8: 91, 9: 60, 10: 68, 11: 85 },
}

async function seed() {
  console.log('🌱 Starting V+V seed...\n')

  const sellerIds: string[] = []
  const buyerIds: string[] = []
  const listingIds: string[] = []

  // ---- Create seller accounts ----
  console.log('Creating seller accounts...')
  for (const seller of SELLERS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: seller.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: seller.name, role: 'seller' },
    })
    if (error) { console.error(`  ✗ ${seller.name}:`, error.message); continue }
    sellerIds.push(data.user.id)
    console.log(`  ✓ ${seller.name} (${seller.email})`)
  }

  // ---- Create buyer accounts ----
  console.log('\nCreating buyer accounts...')
  for (const buyer of BUYERS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: buyer.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: buyer.name, role: 'buyer' },
    })
    if (error) { console.error(`  ✗ ${buyer.name}:`, error.message); continue }
    buyerIds.push(data.user.id)
    console.log(`  ✓ ${buyer.name} (${buyer.email})`)
  }

  // Wait for triggers to fire and create profiles
  console.log('\nWaiting for profile triggers...')
  await new Promise(r => setTimeout(r, 2000))

  // ---- Create seller listings ----
  console.log('Creating seller listings...')
  for (let i = 0; i < SELLERS.length; i++) {
    if (!sellerIds[i]) continue
    const { data, error } = await supabase.from('seller_listings').insert({
      seller_id: sellerIds[i],
      status: 'active',
      ...SELLERS[i].listing,
    }).select('id').single()
    if (error) { console.error(`  ✗ ${SELLERS[i].name} listing:`, error.message); listingIds.push(''); continue }
    listingIds.push(data.id)
    console.log(`  ✓ ${SELLERS[i].name} — ${SELLERS[i].listing.business_name}`)
  }

  // ---- Create buyer profiles ----
  console.log('\nCreating buyer profiles...')
  for (let i = 0; i < BUYERS.length; i++) {
    if (!buyerIds[i]) continue
    const { error } = await supabase.from('buyer_profiles').insert({
      buyer_id: buyerIds[i],
      ...BUYERS[i].profile,
    })
    if (error) console.error(`  ✗ ${BUYERS[i].name} profile:`, error.message)
    else console.log(`  ✓ ${BUYERS[i].name}`)
  }

  // ---- Compute compatibility scores ----
  console.log('\nSeeding compatibility scores...')
  const scoreRows: Array<{ buyer_id: string; listing_id: string; score: number }> = []
  for (let bi = 0; bi < buyerIds.length; bi++) {
    for (let si = 0; si < listingIds.length; si++) {
      if (!buyerIds[bi] || !listingIds[si]) continue
      const score = COMPAT_SCORES[bi]?.[si] ?? 60
      scoreRows.push({ buyer_id: buyerIds[bi], listing_id: listingIds[si], score })
    }
  }

  const { error: scoreError } = await supabase.from('compatibility_scores').insert(scoreRows)
  if (scoreError) console.error('  ✗ Score insert error:', scoreError.message)
  else console.log(`  ✓ ${scoreRows.length} compatibility scores seeded`)

  console.log('\n✅ Seed complete!')
  console.log('\nDemo accounts (password: Demo@VV2024!):')
  console.log('  Buyer:  angela@demo.vv')
  console.log('  Seller: marcus@demo.vv')
  console.log('  (All 24 accounts use the same password)\n')
}

seed().catch(console.error)
