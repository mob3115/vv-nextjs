import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shared/AppShell'
import { SellerSwipeArena } from '@/components/seller/SellerSwipeArena'
import { SELLER_NAV } from '@/lib/nav'

export const metadata: Metadata = { title: 'Discover Buyers' }

export default async function SellerDiscoverPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const { data: listing } = await supabase
    .from('seller_listings').select('id').eq('seller_id', user.id).single()

  // IDs already swiped on
  const { data: swipedRows } = await supabase
    .from('swipes')
    .select('target_buyer_id')
    .eq('swiper_id', user.id)
    .not('target_buyer_id', 'is', null)

  const excludeIds: string[] = (swipedRows ?? [])
    .map((s: any) => s.target_buyer_id)
    .filter(Boolean)

  // All buyer profiles — profiles table is now readable by all authenticated users
  const { data: allBuyers } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ['buyer', 'dual'])
    .neq('id', user.id)
    .limit(50)

  const unseenBuyerIds = (allBuyers ?? [])
    .filter((b: any) => !excludeIds.includes(b.id))
    .map((b: any) => b.id)

  // Fetch buyer profile details
  const { data: buyerDetails } = unseenBuyerIds.length > 0
    ? await supabase
        .from('buyer_profiles')
        .select('*')
        .in('buyer_id', unseenBuyerIds)
    : { data: [] }

  const detailMap = new Map((buyerDetails ?? []).map((d: any) => [d.buyer_id, d]))

  // Merge into buyer cards
  const buyers = (allBuyers ?? [])
    .filter((b: any) => !excludeIds.includes(b.id))
    .map((b: any) => {
      const detail = detailMap.get(b.id)
      return {
        id: b.id,
        full_name: b.full_name,
        role: b.role,
        background:         detail?.background,
        looking_for:        detail?.looking_for,
        price_min:          detail?.price_min,
        price_max:          detail?.price_max,
        experience_years:   detail?.experience_years,
        funding_source:     detail?.funding_source,
        target_industries:  detail?.target_industries,
        values:             detail?.values,
        values_statement:   detail?.values_statement,
        location_preference: detail?.location_preference,
      }
    })

  return (
    <AppShell profile={profile} navItems={SELLER_NAV} role="seller">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Discover Buyers</h1>
          <p style={{ fontSize: '0.8rem', color: '#929292', marginTop: 2 }}>
            Ranked by values alignment — drag to swipe
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#C46A00', border: '1px solid #2e2e2e', padding: '4px 12px', borderRadius: 99 }}>
            {buyers.length} in queue
          </span>
          <a href="/seller/interests" style={{ fontSize: '0.8rem', color: '#929292', border: '1px solid #2e2e2e', padding: '6px 14px', borderRadius: 6, textDecoration: 'none' }}>
            View Interests →
          </a>
        </div>
      </div>

      <div className="page-body">
        {!listing ? (
          <div className="card" style={{ maxWidth: 420, textAlign: 'center', padding: '40px 24px' }}>
            <p style={{ fontSize: '0.86rem', color: '#929292', marginBottom: 16 }}>
              You need an active listing before you can discover buyers.
            </p>
            <a href="/seller/listing" className="btn-primary">Create My Listing →</a>
          </div>
        ) : (
          <SellerSwipeArena buyers={buyers} sellerId={user.id} />
        )}
      </div>
    </AppShell>
  )
}
