'use client'

import { useState, useTransition } from 'react'
import toast from 'react-hot-toast'
import { requestPasswordResetAction } from '@/lib/actions/auth'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await requestPasswordResetAction({ email: email.trim() })
      if (result?.error) {
        toast.error(result.error)
        return
      }
      setSubmitted(true)
    })
  }

  if (submitted) return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: '0.86rem', color: '#D9D9D9', lineHeight: 1.6 }}>
        If an account exists for <strong style={{ color: '#fff' }}>{email}</strong>, we&apos;ve sent a link to reset your password. Check your inbox.
      </p>
    </div>
  )

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

      <button
        type="submit"
        disabled={isPending || !email}
        className="btn-primary btn-block btn-lg mt-2"
      >
        {isPending ? 'Sending…' : 'Send Reset Link →'}
      </button>
    </form>
  )
}
