import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shared/AppShell'
import { ADMIN_NAV } from '@/lib/nav'

export const metadata: Metadata = { title: 'User Management' }

export default async function AdminUsersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/auth/error?code=forbidden')

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  const list = users ?? []

  return (
    <AppShell profile={profile} navItems={ADMIN_NAV} role="admin">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>User Management</h1>
          <p style={{ fontSize: '0.8rem', color: '#929292', marginTop: 2 }}>{list.length} accounts</p>
        </div>
      </div>

      <div className="page-body">
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr>
                {['Name', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#929292', padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #2e2e2e', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((u: any) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #2e2e2e' }}>
                  <td style={{ padding: '12px 14px', color: '#fff', fontWeight: 600 }}>{u.full_name}</td>
                  <td style={{ padding: '12px 14px', color: '#929292' }}>{u.email}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className="badge-grey">{u.role}</span>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#929292', whiteSpace: 'nowrap' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <button className="btn-ghost btn-sm" style={{ fontSize: '0.72rem' }}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
