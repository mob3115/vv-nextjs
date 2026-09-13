import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUserAndProfile } from '@/lib/page-auth'
import { AppShell } from '@/components/shared/AppShell'
import { ADMIN_NAV } from '@/lib/nav'
import { ListingStatusActions } from '@/components/admin/ListingStatusActions'

export const metadata: Metadata = { title: 'Listings' }

export default async function AdminListingsPage() {
  const supabase = createClient()
  const { profile } = await requireUserAndProfile(supabase)
  if (profile.role !== 'admin') redirect('/auth/error?code=forbidden')

  const { data: listings } = await supabase
    .from('seller_listings')
    .select(`*, seller:profiles!seller_listings_seller_id_fkey(full_name)`)
    .order('created_at', { ascending: false })

  const list = listings ?? []

  return (
    <AppShell profile={profile} navItems={ADMIN_NAV} role="admin">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>All Listings</h1>
          <p style={{ fontSize: '0.8rem', color: '#929292', marginTop: 2 }}>{list.length} listings on the platform</p>
        </div>
      </div>

      <div className="page-body">
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr>
                {['Business', 'Seller', 'Industry', 'Ask Price', 'Status', 'Anonymity', 'Actions'].map(h => (
                  <th key={h} style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#929292', padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #2e2e2e', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((l: any) => (
                <tr key={l.id} style={{ borderBottom: '1px solid #2e2e2e' }}>
                  <td style={{ padding: '12px 14px', color: '#fff', fontWeight: 600 }}>{l.business_name ?? '[Hidden]'}</td>
                  <td style={{ padding: '12px 14px', color: '#929292' }}>{l.seller?.full_name}</td>
                  <td style={{ padding: '12px 14px', color: '#D9D9D9' }}>{l.industry}</td>
                  <td style={{ padding: '12px 14px', color: '#C46A00' }}>{l.asking_range}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className={l.status === 'active' ? 'badge-green' : 'badge-grey'}>{l.status}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className={`anon-${l.anonymity_level}`}>L{l.anonymity_level}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <ListingStatusActions listingId={l.id} status={l.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
