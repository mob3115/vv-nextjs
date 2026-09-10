import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shared/AppShell'
import { BUYER_NAV } from '@/lib/nav'
import { getBuyerVaultAccess } from '@/lib/actions/vault'
import { DocumentRow } from '@/components/vault/DocumentRow'

export const metadata: Metadata = { title: 'Document Vault' }

export default async function BuyerVaultPage({ params }: { params: { matchId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const access = await getBuyerVaultAccess(params.matchId)
  if (!access) notFound()

  const preNda = access.documents.filter((d: any) => d.tier === 'pre-nda')
  const postNda = access.documents.filter((d: any) => d.tier === 'post-nda')

  return (
    <AppShell profile={profile} navItems={BUYER_NAV} role="buyer">
      <div className="page-header">
        <div>
          <a href="/buyer/nda" style={{ fontSize: '0.75rem', color: '#929292', textDecoration: 'none' }}>← All NDAs</a>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>Document Vault</h1>
        </div>
      </div>

      <div className="page-body">
        {access.notMutual ? (
          <div className="card" style={{ maxWidth: 480, textAlign: 'center', padding: '32px 24px' }}>
            <p style={{ fontSize: '0.86rem', color: '#929292' }}>
              This match isn&apos;t mutual yet — the vault unlocks once the seller connects back.
            </p>
          </div>
        ) : (
          <div style={{ maxWidth: 680 }}>
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', marginBottom: 4 }}>Pre-NDA Documents</div>
              <div style={{ fontSize: '0.75rem', color: '#929292', marginBottom: 16 }}>Shared with all mutually matched buyers</div>
              {preNda.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: '#6a6a6a' }}>No documents shared yet.</p>
              ) : (
                preNda.map((doc: any) => (
                  <DocumentRow key={doc.id} id={doc.id} fileName={doc.file_name} fileSize={doc.file_size} uploadedAt={doc.created_at} />
                ))
              )}
            </div>

            <div className="card">
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', marginBottom: 4 }}>Post-NDA Documents</div>
              <div style={{ fontSize: '0.75rem', color: '#929292', marginBottom: 16 }}>
                {access.ndaSigned ? 'Unlocked — your NDA is signed' : 'Sign the NDA with this seller to unlock these'}
              </div>
              {!access.ndaSigned ? (
                <a href={`/buyer/nda/${access.matchId}`} className="btn-primary btn-sm">Sign NDA →</a>
              ) : postNda.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: '#6a6a6a' }}>No documents shared yet.</p>
              ) : (
                postNda.map((doc: any) => (
                  <DocumentRow key={doc.id} id={doc.id} fileName={doc.file_name} fileSize={doc.file_size} uploadedAt={doc.created_at} />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
