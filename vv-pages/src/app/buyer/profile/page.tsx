import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shared/AppShell'
import { BUYER_NAV } from '@/lib/nav'

export const metadata: Metadata = { title: 'My Profile' }

const FUNDING_LABELS: Record<string, string> = {
  cash: 'Cash',
  sba_loan: 'SBA Loan',
  private_equity: 'Private Equity',
  seller_financing: 'Seller Financing',
  combination: 'Combination',
}

export default async function BuyerProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileRes, buyerRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('buyer_profiles').select('*').eq('buyer_id', user.id).single(),
  ])

  if (!profileRes.data) redirect('/auth/login')
  const profile = profileRes.data
  const buyer = buyerRes.data

  const initials = profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  // Calculate completeness
  const fields = [profile.full_name, profile.email, buyer?.background, buyer?.values_statement, buyer?.target_industries?.length, buyer?.price_min, buyer?.funding_source]
  const filled = fields.filter(Boolean).length
  const completeness = Math.round((filled / fields.length) * 100)

  return (
    <AppShell profile={profile} navItems={BUYER_NAV} role="buyer">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>My Buyer Profile</h1>
          <p style={{ fontSize: '0.8rem', color: '#929292', marginTop: 2 }}>
            This is what sellers see when you appear in their match queue
          </p>
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 860 }}>

          {/* Left: Identity */}
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#A05500', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', color: '#fff', flexShrink: 0 }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{profile.full_name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#929292' }}>Buyer · {profile.email}</div>
                </div>
              </div>
              <div style={{ height: 1, background: '#2e2e2e', margin: '0 0 16px' }} />

              {buyer ? (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#929292', marginBottom: 6 }}>Background</div>
                    <p style={{ fontSize: '0.86rem', color: '#D9D9D9', lineHeight: 1.6 }}>{buyer.background}</p>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#929292', marginBottom: 6 }}>Values Statement</div>
                    <p style={{ fontSize: '0.86rem', color: '#D9D9D9', lineHeight: 1.6 }}>{buyer.values_statement}</p>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#6a6a6a' }}>
                  <p style={{ fontSize: '0.84rem', marginBottom: 12 }}>Complete your profile to appear in seller match queues.</p>
                  <a href="/buyer/discover" className="btn-primary btn-sm">Get Started →</a>
                </div>
              )}
            </div>
          </div>

          {/* Right: Criteria + Completeness */}
          <div>
            {buyer && (
              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#929292', marginBottom: 14 }}>Acquisition Criteria</div>
                {[
                  ['Target Industries', buyer.target_industries?.join(', ') ?? '—'],
                  ['Price Range', buyer.price_min && buyer.price_max ? `$${(buyer.price_min/1000).toFixed(0)}K – $${(buyer.price_max/1000000).toFixed(1)}M` : '—'],
                  ['Funding Source', FUNDING_LABELS[buyer.funding_source] ?? buyer.funding_source],
                  ['Location Preference', buyer.location_preference ?? '—'],
                  ['Experience', buyer.experience_years ?? '—'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2e2e2e', fontSize: '0.84rem' }}>
                    <span style={{ color: '#929292' }}>{label}</span>
                    <span style={{ color: '#fff', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#929292' }}>Profile Completeness</div>
                <span style={{ fontSize: '0.82rem', color: '#C46A00', fontWeight: 600 }}>{completeness}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${completeness}%` }} />
              </div>
              <p style={{ fontSize: '0.72rem', color: '#6a6a6a', marginTop: 8 }}>
                {completeness < 100 ? 'Complete your acquisition criteria to improve match quality.' : 'Profile complete — you\'re appearing in seller queues.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
