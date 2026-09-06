import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shared/AppShell'
import { SwipeArena } from '@/components/buyer/SwipeArena'
import { BUYER_NAV } from '@/lib/nav'
import { enforceAnonymity } from '@/lib/utils'

export const metadata: Metadata = { title: 'Discover Businesses' }

export default async function DiscoverPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  // 1. Get listings this buyer has already swiped on
  const { data: swipedRows } = await supabase
    .from('swipes')
    .select('target_listing_id')
    .eq('swiper_id', user.id)
    .not('target_listing_id', 'is', null)

  const excludeIds: string[] = (swipedRows ?? [])
    .map((s: any) => s.target_listing_id)
    .filter(Boolean)

  // 2. Fetch all active listings not owned by this user
  const { data: allListings } = await supabase
    .from('seller_listings')
    .select('*')
    .eq('status', 'active')
    .neq('seller_id', user.id)

  // 3. Filter out already-swiped listings in JS (avoids complex SQL with empty arrays)
  const unseenListings = (allListings ?? []).filter(
    (l: any) => !excludeIds.includes(l.id)
  )

  // 4. Fetch compatibility scores for this buyer
  const { data: scoreRows } = await supabase
    .from('compatibility_scores')
    .select('listing_id, score')
    .eq('buyer_id', user.id)

  const scoreMap = new Map((scoreRows ?? []).map((s: any) => [s.listing_id, s.score]))

  // 5. Fetch NDA status
  const { data: ndaRows } = await supabase
    .from('ndas')
    .select('seller_id, status')
    .eq('buyer_id', user.id)
    .eq('status', 'signed')

  const signedSellerIds = new Set((ndaRows ?? []).map((n: any) => n.seller_id))

  // 6. Apply anonymity rules and attach scores, sort by score descending
  const listings = unseenListings
    .map((listing: any) => ({
      ...enforceAnonymity(listing, signedSellerIds.has(listing.seller_id)),
      compatibility_score: scoreMap.get(listing.id) ?? 60,
    }))
    .sort((a: any, b: any) => b.compatibility_score - a.compatibility_score)

  return (
    <AppShell profile={profile} navItems={BUYER_NAV} role="buyer">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Discover Businesses</h1>
          <p style={{ fontSize: '0.8rem', color: '#929292', marginTop: 2 }}>
            Ranked by values compatibility — drag to swipe
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#C46A00', border: '1px solid #2e2e2e', padding: '4px 12px', borderRadius: 99 }}>
            {listings.length} in queue
          </span>
          <a href="/buyer/matches" style={{ fontSize: '0.8rem', color: '#929292', border: '1px solid #2e2e2e', padding: '6px 14px', borderRadius: 6, textDecoration: 'none' }}>
            View Matches →
          </a>
        </div>
      </div>

      <div className="page-body">
        <SwipeArena listings={listings} />
      </div>
    </AppShell>
  )
}
