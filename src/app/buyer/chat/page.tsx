import type { Metadata } from 'next'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { requireUserAndProfile } from '@/lib/page-auth'
import { AppShell } from '@/components/shared/AppShell'
import { getBuyerInbox } from '@/lib/actions/messaging'
import { getIndustryIcon } from '@/lib/icons'
import { BUYER_NAV } from '@/lib/nav'

export const metadata: Metadata = { title: 'Messages' }

export default async function BuyerChatPage() {
  const supabase = createClient()
  const { profile } = await requireUserAndProfile(supabase)

  const inbox = await getBuyerInbox()

  return (
    <AppShell profile={profile} navItems={BUYER_NAV} role="buyer">
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
            <p style={{ fontSize: '0.84rem', maxWidth: 300, margin: '0 auto 20px', lineHeight: 1.6 }}>
              Once a seller connects back with you, you can message them here.
            </p>
            <a href="/buyer/matches" className="btn-primary">View My Matches →</a>
          </div>
        ) : (
          <div style={{ maxWidth: 640 }}>
            {inbox.map((row: any) => {
              const listing = row.listing
              const label = listing?.business_name ?? `${listing?.industry ?? 'Business'} · ${listing?.location_region ?? ''}`
              return (
                <a key={row.matchId} href={`/buyer/chat/${row.matchId}`} className="match-item" style={{ textDecoration: 'none' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#A05500', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                    {(() => { const Icon = getIndustryIcon(listing?.industry); return <Icon size={20} strokeWidth={1.75} /> })()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {label}
                    </div>
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
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
