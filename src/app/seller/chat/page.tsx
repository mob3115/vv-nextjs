import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shared/AppShell'
import { SELLER_NAV } from '@/lib/nav'

export const metadata: Metadata = { title: 'Messages' }

export default async function SellerChatPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const { data: conversations } = await supabase
    .from('conversations')
    .select(`*, buyer:profiles!conversations_buyer_id_fkey(full_name)`)
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  const list = conversations ?? []

  return (
    <AppShell profile={profile} navItems={SELLER_NAV} role="seller">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Messages</h1>
          <p style={{ fontSize: '0.8rem', color: '#929292', marginTop: 2 }}>
            Secure conversations with NDA-verified buyers
          </p>
        </div>
      </div>

      <div className="page-body">
        {list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#6a6a6a' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16, opacity: 0.4 }}>◻</div>
            <h3 style={{ fontSize: '1.1rem', color: '#929292', marginBottom: 8 }}>No conversations yet</h3>
            <p style={{ fontSize: '0.84rem', maxWidth: 300, margin: '0 auto', lineHeight: 1.6 }}>
              Conversations open after a buyer signs your NDA.
            </p>
          </div>
        ) : (
          <div style={{ maxWidth: 640 }}>
            {list.map((conv: any) => (
              <div key={conv.id} className="match-item">
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#4caf7d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', flexShrink: 0 }}>
                  {conv.buyer?.full_name?.charAt(0) ?? 'B'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{conv.buyer?.full_name ?? 'Buyer'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#929292', marginTop: 2 }}>End-to-end encrypted · NDA active</div>
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
