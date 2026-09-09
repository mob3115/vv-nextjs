import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shared/AppShell'
import { BUYER_NAV } from '@/lib/nav'

export const metadata: Metadata = { title: 'My Matches' }

export default async function BuyerMatchesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  // Fetch matches with seller listing details
  const { data: matches } = await supabase
    .from('matches')
    .select(`*, seller_listings(*), ndas(status)`)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  const list = matches ?? []

  return (
    <AppShell profile={profile} navItems={BUYER_NAV} role="buyer">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>My Matches</h1>
          <p style={{ fontSize: '0.8rem', color: '#929292', marginTop: 2 }}>
            Businesses you&apos;ve connected with
          </p>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#C46A00', border: '1px solid #2e2e2e', padding: '4px 12px', borderRadius: 99 }}>
          {list.length} connection{list.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          {[
            ['Connections', list.length, 'Businesses you liked'],
            ['Mutual Matches', list.filter(m => m.seller_liked).length, 'Sellers also liked you'],
            ['NDAs Signed', list.filter(m => m.ndas?.some((n: any) => n.status === 'signed')).length, 'Full reveals unlocked'],
            ['Avg. Compatibility', list.length ? Math.round(list.reduce((a, m) => a + m.compatibility_score, 0) / list.length) + '%' : '—', 'Across all matches'],
          ].map(([label, value, meta]) => (
            <div key={label as string} className="card-sm">
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#929292', marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: '#fff', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: '0.75rem', color: '#6a6a6a', marginTop: 4 }}>{meta}</div>
            </div>
          ))}
        </div>

        {/* Match list */}
        {list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#6a6a6a' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16, opacity: 0.4 }}>♥</div>
            <h3 style={{ fontSize: '1.1rem', color: '#929292', marginBottom: 8 }}>No connections yet</h3>
            <p style={{ fontSize: '0.84rem', maxWidth: 280, margin: '0 auto 20px', lineHeight: 1.6 }}>
              Go to Discover and start swiping to find businesses aligned with your values.
            </p>
            <a href="/buyer/discover" className="btn-primary">Start Discovering →</a>
          </div>
        ) : (
          <div>
            {list.map((match: any) => {
              const listing = match.seller_listings
              const ndaSigned = match.ndas?.some((n: any) => n.status === 'signed')
              return (
                <div key={match.id} className="match-item">
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#A05500', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', flexShrink: 0 }}>
                    {listing?.industry_icon ?? '▣'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ndaSigned ? listing?.business_name : listing?.revenue_band + ' ' + listing?.industry}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#929292', marginTop: 2 }}>
                      {listing?.industry} · {listing?.location_region} · Ask: {listing?.asking_range}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', color: match.compatibility_score >= 85 ? '#4caf7d' : '#C46A00' }}>
                      {match.compatibility_score}
                    </div>
                    {ndaSigned
                      ? <span className="badge-green">NDA ✓</span>
                      : <a href={`/buyer/nda/${match.id}`} className="badge-warning" style={{ textDecoration: 'none' }}>Sign NDA</a>
                    }
                    {match.status === 'mutual' ? (
                      <a href={`/buyer/chat/${match.id}`} className="btn-primary btn-sm" style={{ textDecoration: 'none' }}>Message →</a>
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: '#6a6a6a' }}>Awaiting seller</span>
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
