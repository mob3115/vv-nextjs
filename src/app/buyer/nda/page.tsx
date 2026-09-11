import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { requireUserAndProfile } from '@/lib/page-auth'
import { AppShell } from '@/components/shared/AppShell'
import { NAV_ICONS } from '@/lib/icons'
import { BUYER_NAV } from '@/lib/nav'

export const metadata: Metadata = { title: 'NDAs' }

export default async function BuyerNdaPage() {
  const supabase = createClient()
  const { user, profile } = await requireUserAndProfile(supabase)

  // Query from matches (not ndas) so a mutual match shows up here even
  // before anyone has started the NDA — an ndas row only exists once one
  // side has actually signed.
  const { data: matches } = await supabase
    .from('matches')
    .select(`id, compatibility_score, seller_listings(industry, asking_range, revenue_band, location_region), ndas(status)`)
    .eq('buyer_id', user.id)
    .eq('status', 'mutual')
    .order('created_at', { ascending: false })

  const list = (matches ?? []).map((m: any) => ({
    matchId: m.id as string,
    compatibilityScore: m.compatibility_score,
    listing: m.seller_listings,
    status: (Array.isArray(m.ndas) ? m.ndas[0]?.status : m.ndas?.status) ?? 'not_started',
  }))

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
            <NAV_ICONS.ndas size={40} strokeWidth={1.5} style={{ marginBottom: 16, opacity: 0.4, color: '#929292' }} />
            <h3 style={{ fontSize: '1.1rem', color: '#929292', marginBottom: 8 }}>No NDAs yet</h3>
            <p style={{ fontSize: '0.84rem', maxWidth: 320, margin: '0 auto 20px', lineHeight: 1.6 }}>
              When you match with a seller, you&apos;ll be invited to sign a mutual NDA to unlock full business details and secure messaging.
            </p>
            <a href="/buyer/discover" className="btn-primary">Discover Businesses →</a>
          </div>
        ) : (
          <div style={{ maxWidth: 700 }}>
            {list.map(row => (
              <div key={row.matchId} className="card" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                    {row.listing?.industry ?? 'Business'} · {row.listing?.location_region}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#929292', marginTop: 4 }}>
                    Ask: {row.listing?.asking_range} · Revenue: {row.listing?.revenue_band}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  {row.status === 'signed' ? (
                    <span className="badge-green">✓ Signed</span>
                  ) : row.status === 'pending' ? (
                    <span className="badge-warning">Pending</span>
                  ) : (
                    <span className="badge-grey">Not started</span>
                  )}
                  {row.status === 'signed' ? (
                    <a href={`/buyer/vault/${row.matchId}`} className="btn-ghost btn-sm" style={{ fontSize: '0.75rem', textDecoration: 'none' }}>
                      Open Vault →
                    </a>
                  ) : (
                    <a href={`/buyer/nda/${row.matchId}`} className="btn-primary btn-sm" style={{ fontSize: '0.75rem', textDecoration: 'none' }}>
                      Review & Sign →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
