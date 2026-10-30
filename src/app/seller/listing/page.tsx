import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { requireUserAndProfile } from '@/lib/page-auth'
import { AppShell } from '@/components/shared/AppShell'
import { AccordionCard } from '@/components/shared/AccordionCard'
import { ListingForm } from '@/components/seller/ListingForm'
import { SELLER_NAV } from '@/lib/nav'

export const metadata: Metadata = { title: 'My Listing' }

export default async function SellerListingPage() {
  const supabase = createClient()
  const { user, profile } = await requireUserAndProfile(supabase)

  const { data: listing } = await supabase
    .from('seller_listings').select('*').eq('seller_id', user.id).single()

  // First-time creation walks through the step wizard — nothing exists yet
  // to glance at. Once a listing exists, the page becomes the accordion
  // editor below: every section collapsed to a glanceable summary, editable
  // in place, so there's no separate read-only view vs. edit mode anymore.
  if (!listing) {
    return (
      <AppShell profile={profile} navItems={SELLER_NAV} role="seller">
        <div className="page-header">
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Create My Listing</h1>
            <p style={{ fontSize: '0.8rem', color: '#929292', marginTop: 2 }}>Complete all four steps to publish your business listing</p>
          </div>
        </div>
        <div className="page-body">
          <ListingForm />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell profile={profile} navItems={SELLER_NAV} role="seller">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>My Listing</h1>
          <p style={{ fontSize: '0.8rem', color: '#929292', marginTop: 2 }}>{listing.business_name} · Live on V+V</p>
        </div>
        <span className="badge-green">● Active</span>
      </div>

      <div className="page-body" style={{ maxWidth: 680 }}>
        <AccordionCard title="Personal Info" summary={`${profile.full_name} · ${profile.email}`}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#929292', marginBottom: 4 }}>Full Name</div>
              <div style={{ fontSize: '0.88rem', color: '#fff' }}>{profile.full_name}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#929292', marginBottom: 4 }}>Email</div>
              <div style={{ fontSize: '0.88rem', color: '#fff' }}>{profile.email}</div>
            </div>
            <p style={{ fontSize: '0.72rem', color: '#6a6a6a', margin: 0 }}>
              Changing your name or email isn&apos;t supported here yet — contact support if you need either updated.
            </p>
          </div>
        </AccordionCard>
        <ListingForm existing={listing} mode="accordion" />
      </div>
    </AppShell>
  )
}
