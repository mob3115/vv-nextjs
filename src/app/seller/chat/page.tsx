import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shared/AppShell'
import { getSellerInbox } from '@/lib/actions/messaging'
import { SELLER_NAV } from '@/lib/nav'

export const metadata: Metadata = { title: 'Messages' }

export default async function SellerChatPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const inbox = await getSellerInbox()

  return (
    <AppShell profile={profile} navItems={SELLER_NAV} role="seller">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Messages</h1>
          <p style={{ fontSize: '0.8rem', color: '#929292', marginTop: 2 }}>
            Message any mutual match, any time — an NDA reminder shows in each thread
          </p>
        </div>
      </div>

      <div className="page-body">
        {inbox.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#6a6a6a' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16, opacity: 0.4 }}>◻</div>
            <h3 style={{ fontSize: '1.1rem', color: '#929292', marginBottom: 8 }}>No conversations yet</h3>
            <p style={{ fontSize: '0.84rem', maxWidth: 300, margin: '0 auto', lineHeight: 1.6 }}>
              Once you connect back with an interested buyer, you can message them here.
            </p>
          </div>
        ) : (
          <div style={{ maxWidth: 640 }}>
            {inbox.map((row: any) => (
              <a key={row.matchId} href={`/seller/chat/${row.matchId}`} className="match-item" style={{ textDecoration: 'none' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#4caf7d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', flexShrink: 0 }}>
                  {row.buyerName?.charAt(0) ?? 'B'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{row.buyerName}</div>
                  <div style={{ fontSize: '0.78rem', color: '#929292', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {row.lastMessage ?? 'Say hello →'}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  {row.lastMessageAt && (
                    <span style={{ fontSize: '0.68rem', color: '#6a6a6a' }}>
                      {formatDistanceToNow(new Date(row.lastMessageAt), { addSuffix: true })}
                    </span>
                  )}
                  {row.unreadCount > 0 && (
                    <span style={{ background: '#A05500', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: 99 }}>
                      {row.unreadCount}
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
