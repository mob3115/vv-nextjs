import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shared/AppShell'
import { SELLER_NAV } from '@/lib/nav'

export const metadata: Metadata = { title: 'Seller Dashboard' }

export default async function SellerDashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileRes, listingRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('seller_listings').select('*').eq('seller_id', user.id).eq('status', 'active').single(),
  ])

  if (!profileRes.data) redirect('/auth/login')

  const profile = profileRes.data
  const listing = listingRes.data

  // Stats
  const { count: matchCount } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', listing?.id ?? '')

  const { count: ndaCount } = await supabase
    .from('ndas')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', user.id)
    .eq('status', 'signed')

  return (
    <AppShell profile={profile} navItems={SELLER_NAV} role="seller">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold text-white">Seller Dashboard</h1>
          <p className="text-xs text-grey-dark mt-0.5">
            {listing ? `${listing.business_name} · Listed` : 'No active listing yet'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {listing
            ? <span className="badge-green">● Active</span>
            : <span className="badge-warning">No Listing</span>
          }
          <a href="/seller/listing" className="btn-ghost btn-sm">
            {listing ? 'Edit Listing' : 'Create Listing'}
          </a>
        </div>
      </div>

      <div className="page-body">
        {!listing ? (
          <div className="card max-w-md text-center py-12">
            <div className="text-4xl mb-4">🏢</div>
            <h2 className="text-lg font-bold text-white mb-2">Create your listing</h2>
            <p className="text-sm text-grey-dark mb-6 leading-relaxed">
              Tell buyers about your business, set your anonymity level, and start receiving match requests.
            </p>
            <a href="/seller/listing" className="btn-primary btn-lg">
              Create My Listing →
            </a>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="stats-grid">
              <div className="card-sm">
                <div className="text-xs uppercase tracking-widest text-grey-dark mb-1">Profile Views</div>
                <div className="font-display text-3xl text-white">147</div>
                <div className="text-xs text-grey-mid mt-1">↑ 23 this week</div>
              </div>
              <div className="card-sm">
                <div className="text-xs uppercase tracking-widest text-grey-dark mb-1">Buyer Interest</div>
                <div className="font-display text-3xl text-white">{matchCount ?? 0}</div>
                <a href="/seller/interests" className="text-xs mt-1" style={{ color: '#C46A00', textDecoration: 'none', display: 'block' }}>View interested buyers →</a>
              </div>
              <div className="card-sm">
                <div className="text-xs uppercase tracking-widest text-grey-dark mb-1">Compatibility Avg.</div>
                <div className="font-display text-3xl text-white">81%</div>
                <div className="text-xs text-grey-mid mt-1">Among interested buyers</div>
              </div>
              <div className="card-sm">
                <div className="text-xs uppercase tracking-widest text-grey-dark mb-1">NDAs Completed</div>
                <div className="font-display text-3xl text-white">{ndaCount ?? 0}</div>
                <div className="text-xs text-grey-mid mt-1">Full reveals granted</div>
              </div>
            </div>

            {/* Anonymity preview */}
            <div className="card max-w-3xl">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs uppercase tracking-widest text-grey-dark">Anonymity Preview</div>
                <span className={`anon-${listing.anonymity_level}`}>
                  {['', '👤 Anonymous', '🔓 Partial ID', '✅ Full Reveal'][listing.anonymity_level]}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Business Name', listing.anonymity_level >= 3 ? listing.business_name : '[Hidden]'],
                  ['Revenue', listing.revenue_band],
                  ['Location', listing.anonymity_level >= 2 ? listing.location_city : listing.location_region],
                ].map(([label, val]) => (
                  <div key={label} className="bg-black-deep border border-grey-border rounded-sm p-3">
                    <div className="text-xs text-grey-mid mb-1">{label}</div>
                    <div className={`text-sm font-medium ${val === '[Hidden]' ? 'text-grey-mid italic' : 'text-white'}`}>{val}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-grey-mid mt-3">
                You&apos;re on <strong className="text-white">Level {listing.anonymity_level} Anonymity</strong>. Full details unlock after NDA.{' '}
                <a href="/seller/listing" className="text-orange-light hover:underline">Change →</a>
              </p>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}

