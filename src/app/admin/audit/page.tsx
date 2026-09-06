import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shared/AppShell'
import { ADMIN_NAV } from '@/lib/nav'

export const metadata: Metadata = { title: 'Audit Log' }

export default async function AdminAuditPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/auth/error?code=forbidden')

  const { data: logs } = await supabase
    .from('audit_logs')
    .select(`*, actor:profiles!audit_logs_actor_id_fkey(full_name)`)
    .order('created_at', { ascending: false })
    .limit(100)

  const list = logs ?? []

  const EVENT_COLORS: Record<string, string> = {
    AUTH:       '#929292',
    NDA:        '#4caf7d',
    VAULT:      '#C46A00',
    MATCH:      '#4caf7d',
    RATE_LIMIT: '#e8a838',
    ADMIN:      '#C46A00',
    SYSTEM:     '#929292',
  }

  return (
    <AppShell profile={profile} navItems={ADMIN_NAV} role="admin">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Audit Log</h1>
          <p style={{ fontSize: '0.8rem', color: '#929292', marginTop: 2 }}>
            Immutable security event log · Tamper-evident · Last 100 events
          </p>
        </div>
      </div>

      <div className="page-body">
        <div className="card">
          {list.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#6a6a6a', fontSize: '0.86rem' }}>
              No audit events recorded yet.
            </div>
          ) : (
            list.map((log: any) => (
              <div key={log.id} style={{ display: 'flex', gap: 14, padding: '10px 0', borderBottom: '1px solid #2e2e2e', fontSize: '0.8rem', alignItems: 'flex-start' }}>
                <span style={{ color: '#6a6a6a', width: 70, flexShrink: 0, fontSize: '0.72rem', paddingTop: 2 }}>
                  {new Date(log.created_at).toLocaleTimeString()}
                </span>
                <span style={{
                  width: 80, flexShrink: 0,
                  fontSize: '0.62rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  padding: '2px 7px', borderRadius: 99,
                  background: `${EVENT_COLORS[log.event_type] ?? '#929292'}20`,
                  color: EVENT_COLORS[log.event_type] ?? '#929292',
                  border: `1px solid ${EVENT_COLORS[log.event_type] ?? '#929292'}40`,
                  display: 'inline-flex', alignItems: 'center',
                }}>
                  {log.event_type}
                </span>
                <span style={{ color: '#fff', width: 90, flexShrink: 0, fontWeight: 600, fontSize: '0.75rem' }}>
                  {log.action}
                </span>
                <span style={{ color: '#D9D9D9', flex: 1, lineHeight: 1.4 }}>
                  {log.actor?.full_name && <span style={{ color: '#C46A00' }}>{log.actor.full_name} · </span>}
                  {log.resource_type && <span>{log.resource_type} </span>}
                  {JSON.stringify(log.metadata) !== '{}' && (
                    <span style={{ color: '#6a6a6a' }}>{JSON.stringify(log.metadata).slice(0, 60)}</span>
                  )}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  )
}
