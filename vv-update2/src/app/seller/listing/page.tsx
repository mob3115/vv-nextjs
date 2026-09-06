import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shared/AppShell'
import { ListingForm } from '@/components/seller/ListingForm'
import { SELLER_NAV } from '@/lib/nav'

export const metadata: Metadata = { title: 'My Listing' }

export default async function SellerListingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  // Load existing listing if any
  const { data: listing } = await supabase
    .from('seller_listings')
    .select('*')
    .eq('seller_id', user.id)
    .single()

  return (
    <AppShell profile={profile} navItems={SELLER_NAV} role="seller">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
            {listing ? 'Edit My Listing' : 'Create My Listing'}
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#929292', marginTop: 2 }}>
            {listing
              ? 'Update your listing details — changes go live immediately'
              : 'Complete all four steps to publish your business listing'}
          </p>
        </div>
        {listing && <span className="badge-green">● Active</span>}
      </div>

      <div className="page-body">
        <ListingForm existing={listing} />
      </div>
    </AppShell>
  )
}
