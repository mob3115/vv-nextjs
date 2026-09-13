import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ResetPasswordForm } from '@/components/shared/ResetPasswordForm'

export const metadata: Metadata = { title: 'Set New Password' }

export default async function ResetPasswordPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
          {user ? (
            <>
              <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>Set a new password</h1>
              <p style={{ fontSize: '0.84rem', color: '#929292', marginBottom: 24 }}>
                Choose a new password for your account.
              </p>
              <ResetPasswordForm />
            </>
          ) : (
            <>
              <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>Link expired</h1>
              <p style={{ fontSize: '0.84rem', color: '#929292', marginBottom: 24 }}>
                This reset link is no longer valid. Request a new one to continue.
              </p>
              <Link href="/auth/forgot-password" className="btn-primary btn-block btn-lg" style={{ textDecoration: 'none', textAlign: 'center' }}>
                Request New Link →
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
