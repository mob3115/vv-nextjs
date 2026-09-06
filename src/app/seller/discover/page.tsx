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

  // Get this seller's listing
  const { data: listing } = await supabase
    .from('seller_listings').select('id').eq('seller_id', user.id).single()

  // Get buyers who haven't been swiped on yet
  const { data: swipedIds } = await supabase
    .from('swipes')
    .select('target_buyer_id')
    .eq('swiper_id', user.id)
    .not('target_buyer_id', 'is', null)

  const excludeIds = (swipedIds ?? []).map((s: any) => s.target_buyer_id).filter(Boolean)

  let query = supabase
    .from('buyer_profiles')
    .select('*, buyer:profiles!buyer_profiles_buyer_id_fkey(full_name, id)')

  if (excludeIds.length > 0) {
    query = (query as any).not('buyer_id', 'in', `(${excludeIds.join(',')})`)
  }

  const { data: buyers } = await query.limit(20)
  const list = buyers ?? []

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
            {list.map((buyer: any) => (
              <div key={buyer.id} className="match-item">
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#A05500', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', flexShrink: 0 }}>
                  {buyer.buyer?.full_name?.charAt(0) ?? 'B'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                    {buyer.buyer?.full_name ?? 'Buyer'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#929292', marginTop: 2 }}>
                    {buyer.location_preference} · {buyer.experience_years} experience · Budget: ${(buyer.price_min/1000).toFixed(0)}K–${(buyer.price_max/1000000).toFixed(1)}M
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6a6a6a', marginTop: 4 }}>
                    {buyer.target_industries?.slice(0,3).join(', ')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button className="btn-ghost btn-sm">Pass</button>
                  <button className="btn-primary btn-sm">Connect</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
