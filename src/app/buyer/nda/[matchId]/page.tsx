import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUserAndProfile } from '@/lib/page-auth'
import { AppShell } from '@/components/shared/AppShell'
import { NdaSignForm } from '@/components/nda/NdaSignForm'
import { getNdaSignContext } from '@/lib/actions/marketplace'
import { BUYER_NAV } from '@/lib/nav'

export const metadata: Metadata = { title: 'Sign NDA' }

export default async function BuyerNdaSignPage({ params }: { params: { matchId: string } }) {
  const supabase = createClient()
  const { profile } = await requireUserAndProfile(supabase)

  const ctx = await getNdaSignContext(params.matchId)
  if (!ctx) notFound()

  return (
    <AppShell profile={profile} navItems={BUYER_NAV} role="buyer">
      <div className="page-header">
        <div>
          <a href="/buyer/nda" style={{ fontSize: '0.75rem', color: '#929292', textDecoration: 'none' }}>← All NDAs</a>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>Mutual NDA</h1>
        </div>
      </div>

      <div className="page-body">
        {ctx.matchStatus !== 'mutual' ? (
          <div className="card" style={{ maxWidth: 480, textAlign: 'center', padding: '32px 24px' }}>
            <p style={{ fontSize: '0.86rem', color: '#929292' }}>
              This match isn&apos;t mutual yet — an NDA can be signed once the seller connects back.
            </p>
          </div>
        ) : (
          <NdaSignForm
            matchId={ctx.matchId}
            isBuyer={ctx.isBuyer}
            buyerName={ctx.buyerName}
            sellerName={ctx.sellerName}
            industry={ctx.industry}
            locationRegion={ctx.locationRegion}
            chatHref={`/buyer/chat/${ctx.matchId}`}
            nda={ctx.nda}
          />
        )}
      </div>
    </AppShell>
  )
}
