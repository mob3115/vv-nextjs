import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shared/AppShell'
import { SELLER_NAV } from '@/lib/nav'

export const metadata: Metadata = { title: 'Discover Buyers' }

export default async function SellerDiscoverPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  // Check seller has an active listing
  const { data: listing } = await supabase
    .from('seller_listings').select('id').eq('seller_id', user.id).single()

  // Get buyer IDs this seller has already swiped on
  const { data: swipedRows } = await supabase
    .from('swipes')
    .select('target_buyer_id')
    .eq('swiper_id', user.id)
    .not('target_buyer_id', 'is', null)

  const excludeIds: string[] = (swipedRows ?? [])
    .map((s: any) => s.target_buyer_id)
    .filter(Boolean)

  // Fetch all buyer profiles — query profiles table (no RLS restriction)
  // then join buyer_profile data separately
  const { data: allBuyers } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ['buyer', 'dual'])
    .neq('id', user.id)
    .limit(50)

  // Filter out swiped buyers
  const unseenBuyers = (allBuyers ?? []).filter(
    (b: any) => !excludeIds.includes(b.id)
  )

  // Fetch buyer profile details for those buyers
  const buyerIds = unseenBuyers.map((b: any) => b.id)
  const { data: buyerProfiles } = buyerIds.length > 0
    ? await supabase
        .from('buyer_profiles')
        .select('*')
        .in('buyer_id', buyerIds)
    : { data: [] }

  const profileMap = new Map((buyerProfiles ?? []).map((bp: any) => [bp.buyer_id, bp]))

  // Merge profile + buyer_profile data
  const list = unseenBuyers.map((b: any) => ({
    ...b,
    buyerProfile: profileMap.get(b.id) ?? null,
  }))

  return (
    <AppShell profile={profile} navItems={SELLER_NAV} role="seller">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Discover Buyers</h1>
          <p style={{ fontSize: '0.8rem', color: '#929292', marginTop: 2 }}>
            Buyers ranked by match quality — review and connect
          </p>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#C46A00', border: '1px solid #2e2e2e', padding: '4px 12px', borderRadius: 99 }}>
          {list.length} buyers in queue
        </span>
      </div>

      <div className="page-body">
        {!listing ? (
          <div className="card" style={{ maxWidth: 420, textAlign: 'center', padding: '40px 24px' }}>
            <p style={{ fontSize: '0.86rem', color: '#929292', marginBottom: 16 }}>
              You need an active listing before you can discover buyers.
            </p>
            <a href="/seller/listing" className="btn-primary">Create My Listing →</a>
          </div>
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#6a6a6a' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16, opacity: 0.4 }}>◈</div>
            <h3 style={{ fontSize: '1.1rem', color: '#929292', marginBottom: 8 }}>Queue cleared</h3>
            <p style={{ fontSize: '0.84rem', maxWidth: 280, margin: '0 auto', lineHeight: 1.6 }}>
              You&apos;ve reviewed all current buyers. Check back soon.
            </p>
          </div>
        ) : (
          <div style={{ maxWidth: 680 }}>
            {list.map((buyer: any) => {
              const bp = buyer.buyerProfile
              return (
                <div key={buyer.id} className="match-item">
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#A05500', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', flexShrink: 0 }}>
                    {buyer.full_name?.charAt(0) ?? 'B'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                      {buyer.full_name}
                    </div>
                    {bp ? (
                      <>
                        <div style={{ fontSize: '0.75rem', color: '#929292', marginTop: 2 }}>
                          {bp.location_preference} · {bp.experience_years} · ${(bp.price_min/1000).toFixed(0)}K–${(bp.price_max/1000000).toFixed(1)}M
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#6a6a6a', marginTop: 3 }}>
                          {bp.target_industries?.slice(0,3).join(', ')}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: '#6a6a6a', marginTop: 2 }}>
                        Profile not yet completed
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button className="btn-ghost btn-sm">Pass</button>
                    <button className="btn-primary btn-sm">Connect</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}

