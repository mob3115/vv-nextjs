import type { Metadata } from 'next'
import Link from 'next/link'
import { ForgotPasswordForm } from '@/components/shared/ForgotPasswordForm'

export const metadata: Metadata = { title: 'Reset Password' }

export default function ForgotPasswordPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#141414', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.4rem', color: '#fff', lineHeight: 1 }}>
            V<span style={{ color: '#C46A00' }}>+</span>V
          </div>
          <p style={{ fontSize: '0.72rem', color: '#929292', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 6 }}>
            Business Marketplace
          </p>
        </div>

        <div style={{ background: '#242424', border: '1px solid #2e2e2e', borderRadius: 20, padding: '36px 32px' }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>Forgot your password?</h1>
          <p style={{ fontSize: '0.84rem', color: '#929292', marginBottom: 24 }}>
            Enter your email and we&apos;ll send you a link to reset it.
          </p>

          <ForgotPasswordForm />

          <p style={{ textAlign: 'center', fontSize: '0.82rem', color: '#929292', marginTop: 24 }}>
            <Link href="/auth/login" style={{ color: '#C46A00', textDecoration: 'none' }}>← Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
