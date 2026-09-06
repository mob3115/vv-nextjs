import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shared/AppShell'
import { ListingForm } from '@/components/seller/ListingForm'
import { SELLER_NAV } from '@/lib/nav'

export const metadata: Metadata = { title: 'My Listing' }

const ANON_LABELS = ['', 'Anonymous', 'Partial ID', 'Full Reveal']

export default async function SellerListingPage({
  searchParams,
}: {
  searchParams: { edit?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const { data: listing } = await supabase
    .from('seller_listings').select('*').eq('seller_id', user.id).single()

  // If no listing, or user clicked Edit/New — show the form
  const showForm = !listing || searchParams.edit === 'true'

  if (showForm) {
    return (
      <AppShell profile={profile} navItems={SELLER_NAV} role="seller">
        <div className="page-header">
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
              {listing ? 'Edit My Listing' : 'Create My Listing'}
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#929292', marginTop: 2 }}>
              {listing
                ? 'Update your listing — changes go live immediately'
                : 'Complete all four steps to publish your business listing'}
            </p>
          </div>
          {listing && (
            <a href="/seller/listing" style={{ fontSize: '0.82rem', color: '#929292', border: '1px solid #2e2e2e', padding: '8px 16px', borderRadius: 8, textDecoration: 'none' }}>
              ← Back to Listing
            </a>
          )}
        </div>
        <div className="page-body">
          <ListingForm existing={listing} />
        </div>
      </AppShell>
    )
  }

  // Show listing details view with Edit button
  return (
    <AppShell profile={profile} navItems={SELLER_NAV} role="seller">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>My Listing</h1>
          <p style={{ fontSize: '0.8rem', color: '#929292', marginTop: 2 }}>
            {listing.business_name} · Live on V+V
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="badge-green">● Active</span>
          <a href="/seller/listing?edit=true" style={{ background: '#A05500', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: '0.84rem', fontWeight: 600, textDecoration: 'none' }}>
            Edit Listing
          </a>
        </div>
      </div>

      <div className="page-body">
        <div style={{ maxWidth: 700 }}>

          {/* Business Details */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#929292', marginBottom: 14 }}>Business Details</div>
            {[
              ['Business Name', listing.business_name],
              ['Owner', listing.owner_full_name],
              ['Industry', listing.industry],
              ['Years Operating', listing.years_operating],
              ['Employees', listing.employees_range],
              ['City', listing.location_city],
              ['Region', listing.location_region],
              ['Tagline', listing.tagline],
            ].map(([label, value]) => (
              <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid #2e2e2e', fontSize: '0.84rem', gap: 12 }}>
                <span style={{ color: '#929292', flexShrink: 0 }}>{label}</span>
                <span style={{ color: '#fff', textAlign: 'right' }}>{value ?? '—'}</span>
              </div>
            ))}
          </div>

          {/* Financials */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#929292', marginBottom: 14 }}>Financials</div>
            <div style={{ background: 'rgba(160,85,0,0.08)', border: '1px solid rgba(160,85,0,0.2)', borderRadius: 7, padding: '10px 14px', marginBottom: 12, fontSize: '0.78rem', color: '#C46A00' }}>
              — Exact figures below are encrypted and only revealed to buyers after NDA signing
            </div>
            {[
              ['Asking Price (exact)', listing.asking_price_exact],
              ['Revenue (exact)', listing.revenue_exact],
              ['EBITDA', listing.ebitda || '—'],
              ['Asking Range (public)', listing.asking_range],
              ['Revenue Band (public)', listing.revenue_band],
              ['Seller Financing', listing.seller_financing ? 'Available' : 'Not offered'],
            ].map(([label, value]) => (
              <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #2e2e2e', fontSize: '0.84rem', gap: 12 }}>
                <span style={{ color: '#929292' }}>{label}</span>
                <span style={{ color: '#fff' }}>{value ?? '—'}</span>
              </div>
            ))}
          </div>

          {/* Values */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#929292', marginBottom: 12 }}>Values & Mission</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: '0.72rem', color: '#6a6a6a', marginBottom: 7 }}>Core Values</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(listing.values ?? []).map((v: string) => (
                  <span key={v} className="badge-orange">{v}</span>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: '0.72rem', color: '#6a6a6a', marginBottom: 7 }}>Values Statement</div>
              <p style={{ fontSize: '0.84rem', color: '#D9D9D9', lineHeight: 1.65 }}>{listing.values_statement}</p>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: '0.72rem', color: '#6a6a6a', marginBottom: 7 }}>Transition Goals</div>
              <p style={{ fontSize: '0.84rem', color: '#D9D9D9', lineHeight: 1.65 }}>{listing.transition_goals}</p>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#6a6a6a', marginBottom: 7 }}>Timeline</div>
              <p style={{ fontSize: '0.84rem', color: '#fff' }}>{listing.transition_timeline}</p>
            </div>
          </div>

          {/* Privacy */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#929292', marginBottom: 6 }}>Privacy Level</div>
                <div style={{ fontSize: '0.86rem', color: '#fff' }}>Level {listing.anonymity_level} — {ANON_LABELS[listing.anonymity_level]}</div>
              </div>
              <span className={`anon-${listing.anonymity_level}`}>
                {['','● Anonymous','○ Partial ID','✓ Full Reveal'][listing.anonymity_level]}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
