import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shared/AppShell'
import { ChatThread } from '@/components/chat/ChatThread'
import { getConversationDetail } from '@/lib/actions/messaging'
import { SELLER_NAV } from '@/lib/nav'

export const metadata: Metadata = { title: 'Messages' }

export default async function SellerChatThreadPage({ params }: { params: { matchId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const detail = await getConversationDetail(params.matchId)
  if (!detail) notFound()

  return (
    <AppShell profile={profile} navItems={SELLER_NAV} role="seller">
      <div className="page-header">
        <div>
          <a href="/seller/chat" style={{ fontSize: '0.75rem', color: '#929292', textDecoration: 'none' }}>← All Messages</a>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>
            {detail.notMutual ? 'Messages' : detail.otherPartyName}
          </h1>
        </div>
      </div>

      <div className="page-body">
        {detail.notMutual ? (
          <div className="card" style={{ maxWidth: 480, textAlign: 'center', padding: '32px 24px' }}>
            <p style={{ fontSize: '0.86rem', color: '#929292' }}>
              This match isn&apos;t mutual yet — messaging unlocks once you connect back with this buyer.
            </p>
          </div>
        ) : (
          <ChatThread
            matchId={detail.matchId}
            conversationId={detail.conversationId}
            currentUserId={detail.currentUserId}
            otherPartyName={detail.otherPartyName}
            ndaStatus={detail.ndaStatus}
            ndaHref={`/seller/nda/${detail.matchId}`}
            initialMessages={detail.messages}
          />
        )}
      </div>
    </AppShell>
  )
}
