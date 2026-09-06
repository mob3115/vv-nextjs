import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shared/AppShell'
import { SELLER_NAV } from '@/lib/nav'

export const metadata: Metadata = { title: 'My Listing' }

const ANON_LABELS = ['', 'Anonymous — no name, region only', 'Partial ID — first name, city visible', 'Full Reveal — everything visible pre-NDA']

export default async function SellerListingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const { data: listing } = await supabase
    .from('seller_listings').select('*').eq('seller_id', user.id).single()

  return (
    <AppShell profile={profile} navItems={SELLER_NAV} role="seller">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>My Listing</h1>
          <p style={{ fontSize: '0.8rem', color: '#929292', marginTop: 2 }}>
            Keep this updated to improve your match quality
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {listing && <span className="badge-green">● Active</span>}
        </div>
      </div>

      <div className="page-body">
        {!listing ? (
          // No listing yet — show creation prompt
          <div className="card" style={{ maxWidth: 480, textAlign: 'center', padding: '48px 32px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16, opacity: 0.5 }}>▣</div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>
              Create your listing
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#929292', lineHeight: 1.6, marginBottom: 24 }}>
              Tell buyers about your business, set your anonymity level, and start receiving match requests.
            </p>
            <p style={{ fontSize: '0.78rem', color: '#6a6a6a', lineHeight: 1.5 }}>
              Listing creation via the full form is coming soon. To create a listing now, contact support or use the seed data as a starting point.
            </p>
          </div>
        ) : (
          // Show existing listing details
          <div style={{ maxWidth: 680 }}>
            {/* Business basics */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#929292', marginBottom: 14 }}>Business Details</div>
              {[
                ['Business Name', listing.business_name],
                ['Industry', listing.industry],
                ['Years Operating', listing.years_operating],
                ['Employees', listing.employees_range],
                ['Location', listing.location_city + ', ' + listing.location_region],
                ['Tagline', listing.tagline],
              ].map(([label, value]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2e2e2e', fontSize: '0.84rem' }}>
                  <span style={{ color: '#929292' }}>{label}</span>
                  <span style={{ color: '#fff', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Financials */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#929292', marginBottom: 14 }}>Financials (Post-NDA)</div>
              {[
                ['Asking Price', listing.asking_price_exact],
                ['Revenue', listing.revenue_exact],
                ['EBITDA', listing.ebitda],
                ['Revenue Band (pre-NDA)', listing.revenue_band],
                ['Asking Range (pre-NDA)', listing.asking_range],
                ['Seller Financing', listing.seller_financing ? 'Available' : 'Not offered'],
              ].map(([label, value]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2e2e2e', fontSize: '0.84rem' }}>
                  <span style={{ color: '#929292' }}>{label}</span>
                  <span style={{ color: '#fff' }}>{value ?? '—'}</span>
                </div>
              ))}
            </div>

            {/* Values */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#929292', marginBottom: 12 }}>Values & Mission</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.72rem', color: '#6a6a6a', marginBottom: 6 }}>Core Values</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(listing.values ?? []).map((v: string) => (
                    <span key={v} className="badge-orange">{v}</span>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.72rem', color: '#6a6a6a', marginBottom: 6 }}>Values Statement</div>
                <p style={{ fontSize: '0.84rem', color: '#D9D9D9', lineHeight: 1.6 }}>{listing.values_statement}</p>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#6a6a6a', marginBottom: 6 }}>Transition Goals</div>
                <p style={{ fontSize: '0.84rem', color: '#D9D9D9', lineHeight: 1.6 }}>{listing.transition_goals}</p>
              </div>
            </div>

            {/* Anonymity */}
            <div className="card">
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#929292', marginBottom: 10 }}>Privacy Setting</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.86rem', color: '#fff' }}>Level {listing.anonymity_level}</span>
                <span className={`anon-${listing.anonymity_level}`}>{ANON_LABELS[listing.anonymity_level]}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
