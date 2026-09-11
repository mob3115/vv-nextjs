import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUserAndProfile } from '@/lib/page-auth'
import { AppShell } from '@/components/shared/AppShell'
import { ADMIN_NAV } from '@/lib/nav'

export const metadata: Metadata = { title: 'Admin Overview' }

export default async function AdminOverviewPage() {
  const supabase = createClient()
  const { profile } = await requireUserAndProfile(supabase)
  if (profile.role !== 'admin') redirect('/auth/error?code=forbidden')

  // Platform stats
  const [
    { count: userCount },
    { count: listingCount },
    { count: matchCount },
    { count: ndaCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('seller_listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('ndas').select('*', { count: 'exact', head: true }).eq('status', 'signed'),
  ])

  return (
    <AppShell profile={profile} navItems={ADMIN_NAV} role="admin">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Platform Overview</h1>
          <p style={{ fontSize: '0.8rem', color: '#929292', marginTop: 2 }}>V+V Business Marketplace · Admin Console</p>
        </div>
        <span className="badge-green">● All Systems Operational</span>
      </div>

      <div className="page-body">
        <div className="stats-grid">
          {[
            ['Total Users',     userCount ?? 0,    'Registered accounts'],
            ['Active Listings', listingCount ?? 0, 'Live seller listings'],
            ['Matches Made',    matchCount ?? 0,   'Total connections'],
            ['NDAs Signed',     ndaCount ?? 0,     'Full reveals granted'],
          ].map(([label, value, meta]) => (
            <div key={label as string} className="card-sm">
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#929292', marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: '#fff', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: '0.75rem', color: '#6a6a6a', marginTop: 4 }}>{meta}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 900 }}>
          <div className="card">
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#929292', marginBottom: 14 }}>Quick Links</div>
            {[
              ['/admin/users',    'Manage Users'],
              ['/admin/listings', 'Review Listings'],
              ['/admin/audit',    'Audit Log'],
            ].map(([href, label]) => (
              <a key={href} href={href as string} style={{ display: 'block', padding: '10px 0', borderBottom: '1px solid #2e2e2e', fontSize: '0.86rem', color: '#C46A00', textDecoration: 'none' }}>
                {label} →
              </a>
            ))}
          </div>

          <div className="card">
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#929292', marginBottom: 14 }}>Platform Health</div>
            {[
              ['NDA Completion Rate', ndaCount && matchCount ? Math.round((ndaCount / matchCount) * 100) + '%' : '—'],
              ['Listings per User',   userCount ? (listingCount! / userCount).toFixed(1) : '—'],
              ['Match Rate',          userCount ? (matchCount! / userCount).toFixed(1) + ' per user' : '—'],
            ].map(([label, value]) => (
              <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2e2e2e', fontSize: '0.84rem' }}>
                <span style={{ color: '#929292' }}>{label}</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
