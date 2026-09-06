import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shared/AppShell'
import { SELLER_NAV } from '@/lib/nav'

export const metadata: Metadata = { title: 'Document Vault' }

const DEMO_DOCS = [
  { name: 'Business Overview — Teaser.pdf', size: '2.1 MB', tier: 'pre-nda', views: 8, uploaded: 'Jun 3' },
  { name: '3-Year P&L Statement.xlsx',       size: '890 KB', tier: 'post-nda', views: 3, uploaded: 'Jun 3' },
  { name: 'Equipment & Asset Schedule.pdf',  size: '1.4 MB', tier: 'post-nda', views: 2, uploaded: 'Jun 5' },
  { name: 'Employee Agreements Summary.pdf', size: '560 KB', tier: 'post-nda', views: 0, uploaded: 'Jun 5' },
]

export default async function SellerVaultPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const preNda  = DEMO_DOCS.filter(d => d.tier === 'pre-nda')
  const postNda = DEMO_DOCS.filter(d => d.tier === 'post-nda')

  return (
    <AppShell profile={profile} navItems={SELLER_NAV} role="seller">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Document Vault</h1>
          <p style={{ fontSize: '0.8rem', color: '#929292', marginTop: 2 }}>
            Documents are encrypted · Post-NDA files only accessible after NDA signing
          </p>
        </div>
        <button className="btn-ghost btn-sm">+ Upload Document</button>
      </div>

      <div className="page-body">
        <div style={{ maxWidth: 680 }}>
          {/* Pre-NDA */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>Pre-NDA Documents</div>
                <div style={{ fontSize: '0.75rem', color: '#929292', marginTop: 2 }}>Visible to all matched buyers before signing</div>
              </div>
              <button className="btn-ghost btn-sm">+ Upload</button>
            </div>
            {preNda.map(doc => (
              <div key={doc.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #2e2e2e', fontSize: '0.84rem' }}>
                <span style={{ color: '#C46A00', fontSize: '1.1rem' }}>◇</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontWeight: 500 }}>{doc.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#6a6a6a', marginTop: 2 }}>{doc.size} · Uploaded {doc.uploaded} · Viewed {doc.views} times</div>
                </div>
                <span className="badge-grey">Pre-NDA</span>
              </div>
            ))}
          </div>

          {/* Post-NDA */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>Post-NDA Documents</div>
                <div style={{ fontSize: '0.75rem', color: '#929292', marginTop: 2 }}>Only accessible after buyer signs NDA</div>
              </div>
              <button className="btn-ghost btn-sm">+ Upload</button>
            </div>
            {postNda.map(doc => (
              <div key={doc.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #2e2e2e', fontSize: '0.84rem' }}>
                <span style={{ color: '#C46A00', fontSize: '1.1rem' }}>▦</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontWeight: 500 }}>{doc.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#6a6a6a', marginTop: 2 }}>{doc.size} · Uploaded {doc.uploaded} · Viewed {doc.views} times</div>
                </div>
                <span className="badge-orange">Post-NDA</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
