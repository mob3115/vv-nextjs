import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shared/AppShell'
import { BUYER_NAV } from '@/lib/nav'

export const metadata: Metadata = { title: 'NDAs' }

export default async function BuyerNdaPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const { data: ndas } = await supabase
    .from('ndas')
    .select(`*, matches(compatibility_score, seller_listings(industry, asking_range, revenue_band, location_region))`)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  const list = ndas ?? []

  return (
    <AppShell profile={profile} navItems={BUYER_NAV} role="buyer">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>NDA Management</h1>
          <p style={{ fontSize: '0.8rem', color: '#929292', marginTop: 2 }}>
            Non-disclosure agreements unlock full business details
          </p>
        </div>
      </div>

      <div className="page-body">
        {list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#6a6a6a' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16, opacity: 0.4 }}>◇</div>
            <h3 style={{ fontSize: '1.1rem', color: '#929292', marginBottom: 8 }}>No NDAs yet</h3>
            <p style={{ fontSize: '0.84rem', maxWidth: 320, margin: '0 auto 20px', lineHeight: 1.6 }}>
              When you match with a seller, you&apos;ll be invited to sign a mutual NDA to unlock full business details and secure messaging.
            </p>
            <a href="/buyer/discover" className="btn-primary">Discover Businesses →</a>
          </div>
        ) : (
          <div style={{ maxWidth: 700 }}>
            {list.map((nda: any) => {
              const listing = nda.matches?.seller_listings
              return (
                <div key={nda.id} className="card" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                      {listing?.industry ?? 'Business'} · {listing?.location_region}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#929292', marginTop: 4 }}>
                      Ask: {listing?.asking_range} · Revenue: {listing?.revenue_band}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    {nda.status === 'signed'
                      ? <span className="badge-green">✓ Signed</span>
                      : <span className="badge-warning">Pending</span>
                    }
                    {nda.status === 'signed' && (
                      <button className="btn-ghost btn-sm" style={{ fontSize: '0.75rem' }}>
                        Open Vault →
                      </button>
                    )}
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
