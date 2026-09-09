import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shared/AppShell'
import { recordSwipe } from '@/lib/actions/marketplace'
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

  // Step 1: get matches for this listing
  const { data: matches } = listing
    ? await supabase
        .from('matches')
        .select('*, ndas(status)')
        .eq('seller_id', listing.id)
        .order('compatibility_score', { ascending: false })
    : { data: [] }

  const list = matches ?? []

  // Step 2: fetch buyer profiles separately via profiles table (no RLS restriction)
  const buyerIds = list.map((m: any) => m.buyer_id).filter(Boolean)

  const { data: buyerProfileRows } = buyerIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', buyerIds)
    : { data: [] }

  const { data: buyerDetailRows } = buyerIds.length > 0
    ? await supabase
        .from('buyer_profiles')
        .select('buyer_id, background, experience_years, price_min, price_max, funding_source, target_industries, values_statement')
        .in('buyer_id', buyerIds)
    : { data: [] }

  // Build lookup maps
  const profileMap = new Map((buyerProfileRows ?? []).map((p: any) => [p.id, p]))
  const detailMap  = new Map((buyerDetailRows ?? []).map((p: any) => [p.buyer_id, p]))

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
              {!listing
                ? 'Create a listing first to start receiving buyer interest.'
                : 'Buyers who swipe right on your listing will appear here.'}
            </p>
            {!listing && (
              <a href="/seller/listing" className="btn-primary" style={{ display: 'inline-block', marginTop: 16 }}>
                Create Listing →
              </a>
            )}
          </div>
        ) : (
          <div style={{ maxWidth: 720 }}>
            {list.map((match: any) => {
              const buyerProfile  = profileMap.get(match.buyer_id)
              const buyerDetail   = detailMap.get(match.buyer_id)
              const ndaSigned     = match.ndas?.some((n: any) => n.status === 'signed')
              const name          = buyerProfile?.full_name ?? 'Buyer'
              const initial       = name.charAt(0).toUpperCase()

              return (
                <div key={match.id} style={{ background: '#242424', border: '1px solid #2e2e2e', borderRadius: 12, padding: '18px 20px', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    {/* Avatar */}
                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#A05500', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', flexShrink: 0 }}>
                      {initial}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', color: match.compatibility_score >= 85 ? '#4caf7d' : '#C46A00' }}>
                            {match.compatibility_score}
                          </div>
                          {ndaSigned ? (
                            <span className="badge-green">NDA ✓</span>
                          ) : match.status === 'mutual' ? (
                            <a href={`/seller/nda/${match.id}`} className="badge-warning" style={{ textDecoration: 'none' }}>NDA Pending</a>
                          ) : (
                            <span className="badge-grey">Not yet mutual</span>
                          )}
                        </div>
                      </div>

                      {buyerDetail ? (
                        <>
                          <div style={{ fontSize: '0.78rem', color: '#929292', marginTop: 5 }}>
                            {buyerDetail.experience_years && <span>{buyerDetail.experience_years} experience · </span>}
                            {buyerDetail.price_min && buyerDetail.price_max && (
                              <span>Budget: ${(buyerDetail.price_min/1000).toFixed(0)}K–${(buyerDetail.price_max/1000000).toFixed(1)}M · </span>
                            )}
                            {buyerDetail.funding_source && <span>{buyerDetail.funding_source.replace('_', ' ')}</span>}
                          </div>
                          {buyerDetail.target_industries?.length > 0 && (
                            <div style={{ fontSize: '0.72rem', color: '#6a6a6a', marginTop: 4 }}>
                              {buyerDetail.target_industries.slice(0, 4).join(' · ')}
                            </div>
                          )}
                          {buyerDetail.values_statement && (
                            <blockquote style={{ fontSize: '0.8rem', color: '#D9D9D9', fontStyle: 'italic', lineHeight: 1.55, borderLeft: '2px solid #A05500', paddingLeft: 10, marginTop: 10 }}>
                              &ldquo;{buyerDetail.values_statement.slice(0, 160)}{buyerDetail.values_statement.length > 160 ? '…' : ''}&rdquo;
                            </blockquote>
                          )}
                        </>
                      ) : (
                        <div style={{ fontSize: '0.78rem', color: '#6a6a6a', marginTop: 5 }}>
                          Buyer profile not yet completed
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                        {match.status === 'mutual' ? (
                          <>
                            <a href={`/seller/chat/${match.id}`} className="btn-primary btn-sm">Open Chat →</a>
                            {!ndaSigned && <a href={`/seller/nda/${match.id}`} className="btn-ghost btn-sm">Request NDA</a>}
                          </>
                        ) : (
                          <form action={recordSwipe.bind(null, { targetBuyerId: match.buyer_id, direction: 'like' })}>
                            <button type="submit" className="btn-primary btn-sm">
                              Connect → Unlock Messaging
                            </button>
                          </form>
                        )}
                        <button className="btn-ghost btn-sm">Pass</button>
                      </div>
                    </div>
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
