import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shared/AppShell'
import { SwipeArena } from '@/components/buyer/SwipeArena'
import { getDiscoverListings } from '@/lib/actions/marketplace'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Discover Businesses' }

const BUYER_NAV = [
  { href: '/buyer/discover', label: 'Discover',   icon: '♣' },
  { href: '/buyer/matches',  label: 'My Matches', icon: '💛' },
  { href: '/buyer/chat',     label: 'Messages',   icon: '💬', badge: 0 },
  { href: '/buyer/nda',      label: 'NDAs',       icon: '📄' },
  { href: '/buyer/profile',  label: 'My Profile', icon: '👤' },
  { href: '/seller/dashboard', label: 'Seller Mode', icon: '↔' },
]

export default async function DiscoverPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profile, listings] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single().then(r => r.data),
    getDiscoverListings(),
  ])

  if (!profile) redirect('/auth/login')

  return (
    <AppShell profile={profile} navItems={BUYER_NAV} role="buyer">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold text-white">Discover Businesses</h1>
          <p className="text-xs text-grey-dark mt-0.5">
            Ranked by values compatibility — drag to swipe
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <span className="badge-orange">{listings.length} in queue</span>
          <a href="/buyer/matches" className="btn-ghost btn-sm">View Matches →</a>
        </div>
      </div>

      <div className="page-body">
        <SwipeArena listings={listings} />
      </div>
    </AppShell>
  )
}
