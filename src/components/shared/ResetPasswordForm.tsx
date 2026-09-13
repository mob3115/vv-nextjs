'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { updatePasswordAction } from '@/lib/actions/auth'

export function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function validate(): boolean {
    if (password.length < 8) return fail('Password must be at least 8 characters')
    if (!/[A-Z]/.test(password)) return fail('Must include at least one uppercase letter')
    if (!/[0-9]/.test(password)) return fail('Must include at least one number')
    if (!/[^A-Za-z0-9]/.test(password)) return fail('Must include at least one special character')
    if (password !== confirmPassword) return fail('Passwords do not match')
    setError('')
    return true
  }
  function fail(message: string) {
    setError(message)
    return false
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    startTransition(async () => {
      const result = await updatePasswordAction({ password })
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success('Password updated!')
      router.push('/auth/login?message=Password updated! Sign in with your new password.')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label className="form-label" htmlFor="password">New Password</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          className="form-input"
        />
        <p className="form-hint">Uppercase, number, and special character required</p>
      </div>

      <div>
        <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="Repeat your password"
          className="form-input"
        />
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <button
        type="submit"
        disabled={isPending || !password || !confirmPassword}
        className="btn-primary btn-block btn-lg mt-2"
      >
        {isPending ? 'Updating…' : 'Update Password →'}
      </button>
    </form>
  )
}
