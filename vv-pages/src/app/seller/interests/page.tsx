import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shared/AppShell'
import { SELLER_NAV } from '@/lib/nav'

export const metadata: Metadata = { title: 'Buyer Interest' }

export default async function SellerInterestsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const { data: listing } = await supabase
    .from('seller_listings').select('id').eq('seller_id', user.id).single()

  const { data: matches } = listing
    ? await supabase
        .from('matches')
        .select(`*, buyer:profiles!matches_buyer_id_fkey(full_name, id), buyer_profiles(background, experience_years, price_min, price_max, funding_source, target_industries), ndas(status)`)
        .eq('seller_id', listing.id)
        .order('compatibility_score', { ascending: false })
    : { data: [] }

  const list = matches ?? []

  return (
    <AppShell profile={profile} navItems={SELLER_NAV} role="seller">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Buyer Interest</h1>
          <p style={{ fontSize: '0.8rem', color: '#929292', marginTop: 2 }}>
            {list.length} buyer{list.length !== 1 ? 's' : ''} connected with your listing · Sorted by compatibility
          </p>
        </div>
      </div>

      <div className="page-body">
        {list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#6a6a6a' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16, opacity: 0.4 }}>◉</div>
            <h3 style={{ fontSize: '1.1rem', color: '#929292', marginBottom: 8 }}>No interested buyers yet</h3>
            <p style={{ fontSize: '0.84rem', maxWidth: 300, margin: '0 auto', lineHeight: 1.6 }}>
              {!listing ? 'Create a listing first to start receiving buyer interest.' : 'Buyers who match your listing will appear here.'}
            </p>
            {!listing && <a href="/seller/listing" className="btn-primary" style={{ display: 'inline-block', marginTop: 16 }}>Create Listing →</a>}
          </div>
        ) : (
          <div style={{ maxWidth: 720 }}>
            {list.map((match: any) => {
              const bp = match.buyer_profiles
              const ndaSigned = match.ndas?.some((n: any) => n.status === 'signed')
              return (
                <div key={match.id} className="match-item">
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#A05500', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', flexShrink: 0 }}>
                    {match.buyer?.full_name?.charAt(0) ?? 'B'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                      {match.buyer?.full_name ?? 'Buyer'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#929292', marginTop: 2 }}>
                      {bp?.experience_years} experience · Budget: ${bp?.price_min ? (bp.price_min/1000).toFixed(0) + 'K' : '—'}–${bp?.price_max ? (bp.price_max/1000000).toFixed(1) + 'M' : '—'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#6a6a6a', marginTop: 4 }}>
                      {bp?.target_industries?.slice(0,3).join(', ')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', color: match.compatibility_score >= 85 ? '#4caf7d' : '#C46A00' }}>
                      {match.compatibility_score}
                    </div>
                    {ndaSigned
                      ? <span className="badge-green">NDA ✓</span>
                      : <span className="badge-warning">NDA Pending</span>
                    }
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
