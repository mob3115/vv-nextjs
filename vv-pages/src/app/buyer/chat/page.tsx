import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shared/AppShell'
import { BUYER_NAV } from '@/lib/nav'

export const metadata: Metadata = { title: 'Messages' }

export default async function BuyerChatPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const { data: conversations } = await supabase
    .from('conversations')
    .select(`*, seller:profiles!conversations_seller_id_fkey(full_name), ndas(status)`)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  const list = conversations ?? []

  return (
    <AppShell profile={profile} navItems={BUYER_NAV} role="buyer">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Messages</h1>
          <p style={{ fontSize: '0.8rem', color: '#929292', marginTop: 2 }}>
            End-to-end encrypted · NDA required to start
          </p>
        </div>
      </div>

      <div className="page-body">
        {list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#6a6a6a' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16, opacity: 0.4 }}>◻</div>
            <h3 style={{ fontSize: '1.1rem', color: '#929292', marginBottom: 8 }}>No conversations yet</h3>
            <p style={{ fontSize: '0.84rem', maxWidth: 300, margin: '0 auto 20px', lineHeight: 1.6 }}>
              Sign an NDA with a matched seller to unlock secure messaging.
            </p>
            <a href="/buyer/matches" className="btn-primary">View My Matches →</a>
          </div>
        ) : (
          <div style={{ maxWidth: 640 }}>
            {list.map((conv: any) => (
              <div key={conv.id} className="match-item">
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#A05500', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', flexShrink: 0 }}>
                  {conv.seller?.full_name?.charAt(0) ?? 'S'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{conv.seller?.full_name ?? 'Seller'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#929292', marginTop: 2 }}>
                    🔒 End-to-end encrypted
                  </div>
                </div>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#4caf7d', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
