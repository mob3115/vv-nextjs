'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { loginAction } from '@/lib/actions/auth'

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    startTransition(async () => {
      const result = await loginAction({ email: email.trim(), password })
      if (result?.error) {
        setError(result.error)
      } else {
        toast.success('Signed in!')
        router.push(redirectTo ?? '/buyer/discover')
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label className="form-label" htmlFor="email">Email Address</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="form-input"
        />
      </div>

      <div>
        <label className="form-label" htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          className="form-input"
        />
      </div>

      {error && (
        <p className="form-error" role="alert">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending || !email || !password}
        className="btn-primary btn-block btn-lg mt-2"
      >
        {isPending ? 'Signing in…' : 'Sign In →'}
      </button>
    </form>
  )
}
