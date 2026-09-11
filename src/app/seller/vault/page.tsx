import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { requireUserAndProfile } from '@/lib/page-auth'
import { AppShell } from '@/components/shared/AppShell'
import { SELLER_NAV } from '@/lib/nav'
import { getSellerVaultDocuments } from '@/lib/actions/vault'
import { UploadDocumentButton } from '@/components/vault/UploadDocumentButton'
import { DocumentRow } from '@/components/vault/DocumentRow'

export const metadata: Metadata = { title: 'Document Vault' }

export default async function SellerVaultPage() {
  const supabase = createClient()
  const { user, profile } = await requireUserAndProfile(supabase)

  const documents = await getSellerVaultDocuments()
  const preNda = documents.filter(d => d.tier === 'pre-nda')
  const postNda = documents.filter(d => d.tier === 'post-nda')

  return (
    <AppShell profile={profile} navItems={SELLER_NAV} role="seller">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Document Vault</h1>
          <p style={{ fontSize: '0.8rem', color: '#929292', marginTop: 2 }}>
            Post-NDA files only become visible to a buyer once they sign your NDA
          </p>
        </div>
      </div>

      <div className="page-body">
        <div style={{ maxWidth: 680 }}>
          {/* Pre-NDA */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>Pre-NDA Documents</div>
                <div style={{ fontSize: '0.75rem', color: '#929292', marginTop: 2 }}>Visible to any buyer you're mutually matched with</div>
              </div>
              <UploadDocumentButton tier="pre-nda" />
            </div>
            {preNda.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: '#6a6a6a', padding: '8px 0' }}>No documents yet.</p>
            ) : (
              preNda.map(doc => (
                <DocumentRow key={doc.id} id={doc.id} fileName={doc.file_name} fileSize={doc.file_size} uploadedAt={doc.created_at} canDelete />
              ))
            )}
          </div>

          {/* Post-NDA */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>Post-NDA Documents</div>
                <div style={{ fontSize: '0.75rem', color: '#929292', marginTop: 2 }}>Only visible once a buyer signs your NDA</div>
              </div>
              <UploadDocumentButton tier="post-nda" />
            </div>
            {postNda.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: '#6a6a6a', padding: '8px 0' }}>No documents yet.</p>
            ) : (
              postNda.map(doc => (
                <DocumentRow key={doc.id} id={doc.id} fileName={doc.file_name} fileSize={doc.file_size} uploadedAt={doc.created_at} canDelete />
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
