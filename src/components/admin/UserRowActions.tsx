'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { updateUserRoleAction, setUserSuspendedAction } from '@/lib/actions/admin'
import type { UserRole } from '@/types'

const ROLES: UserRole[] = ['buyer', 'seller', 'dual', 'admin']

export function UserRowActions({
  userId, role, suspended, isSelf,
}: {
  userId: string
  role: UserRole
  suspended: boolean
  isSelf: boolean
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as UserRole
    if (next === role) return
    setLoading(true)
    const result = await updateUserRoleAction(userId, next)
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Role updated')
    router.refresh()
  }

  async function handleSuspendToggle() {
    setLoading(true)
    const result = await setUserSuspendedAction(userId, !suspended)
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(suspended ? 'Account reinstated' : 'Account suspended')
    router.refresh()
  }

  if (isSelf) {
    return <span style={{ fontSize: '0.72rem', color: '#6a6a6a' }}>You</span>
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <select
        className="form-select"
        value={role}
        disabled={loading}
        onChange={handleRoleChange}
        style={{ width: 'auto', padding: '5px 10px', fontSize: '0.76rem' }}
      >
        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      <button
        onClick={handleSuspendToggle}
        disabled={loading}
        className={suspended ? 'btn-ghost btn-sm' : 'btn-danger btn-sm'}
        style={{ opacity: loading ? 0.6 : 1, whiteSpace: 'nowrap' }}
      >
        {suspended ? 'Reinstate' : 'Suspend'}
      </button>
    </div>
  )
}
