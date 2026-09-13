import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/shared/LoginForm'

export const metadata: Metadata = { title: 'Sign In' }

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirectTo?: string; message?: string }
}) {
  return (
    <div style={{ minHeight: '100vh', background: '#141414', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '16px 16px 40px' }}>

      {/* ---- Desktop: side-by-side card ---- */}
      <div style={{ width: '100%', maxWidth: 960, marginTop: 24 }}>
        <div style={{
          display: 'flex', borderRadius: 32, overflow: 'hidden',
          boxShadow: '0 20px 80px rgba(0,0,0,0.7)', border: '1px solid #2e2e2e',
          minHeight: 580,
        }}>

          {/* Left brand panel — hidden on mobile (display:none below 768px via inline media) */}
          <div
            className="auth-brand-panel"
            style={{
              flex: 1, background: '#1E1E1E', padding: '48px 44px',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              backgroundImage: 'radial-gradient(ellipse at 30% 70%, rgba(160,85,0,0.18) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(160,85,0,0.08) 0%, transparent 50%)',
            }}
          >
            <div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3.2rem', color: '#fff', letterSpacing: '0.06em', lineHeight: 1 }}>
                V<span style={{ color: '#C46A00' }}>+</span>V
              </div>
              <p style={{ fontSize: '0.9rem', color: '#929292', marginTop: 10, lineHeight: 1.6, maxWidth: 260 }}>
                The place where you buy and sell businesses based on shared values.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <BrandQuote text="My dream is to transition my business to someone who shares my vision, will steward my customers, and honor the reputation we've built." cite="Seller — Manufacturing, 28 years" />
              <BrandQuote text="I've always wanted to run my own business, but rather than start from scratch, I want to carry forward the legacy of a great family-owned company and help build its next chapter." cite="Buyer — Workforce Development" />
            </div>
            <ProcessSteps />
          </div>

          {/* Right auth panel */}
          <div style={{ width: '100%', maxWidth: 420, flexShrink: 0, background: '#242424', padding: '44px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {/* Mobile-only wordmark */}
            <div className="auth-mobile-logo" style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: '#fff', lineHeight: 1 }}>
                V<span style={{ color: '#C46A00' }}>+</span>V
              </div>
              <p style={{ fontSize: '0.75rem', color: '#929292', marginTop: 4 }}>Business Marketplace</p>
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>Welcome back</h1>
            <p style={{ fontSize: '0.84rem', color: '#929292', marginBottom: 24 }}>Sign in to your account to continue.</p>

            {searchParams.message && (
              <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(76,175,125,0.12)', border: '1px solid rgba(76,175,125,0.25)', borderRadius: 8, fontSize: '0.84rem', color: '#4caf7d' }}>
                {searchParams.message}
              </div>
            )}

            {/* Demo logins */}
            <div style={{ background: '#141414', border: '1px solid #2e2e2e', borderRadius: 8, padding: '14px', marginBottom: 20 }}>
              <div style={{ fontSize: '0.68rem', color: '#C46A00', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>⚡ Quick Demo Access</div>
              {[['angela@demo.vv','Buyer'],['marcus@demo.vv','Seller']].map(([email, role]) => (
                <div key={email} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #2e2e2e', fontSize: '0.78rem' }}>
                  <span style={{ color: '#D9D9D9' }}>{email}</span>
                  <span style={{ color: '#6a6a6a' }}>{role}</span>
                </div>
              ))}
              <p style={{ fontSize: '0.72rem', color: '#6a6a6a', marginTop: 8 }}>Password: Demo@VV2024!</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#6a6a6a', fontSize: '0.75rem', marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: '#2e2e2e' }} />
              or sign in manually
              <div style={{ flex: 1, height: 1, background: '#2e2e2e' }} />
            </div>

            <LoginForm redirectTo={searchParams.redirectTo} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#6a6a6a', fontSize: '0.75rem', margin: '20px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#2e2e2e' }} />
              new to V+V?
              <div style={{ flex: 1, height: 1, background: '#2e2e2e' }} />
            </div>

            <Link href="/auth/register" style={{ display: 'block', textAlign: 'center', padding: '10px 20px', border: '1px solid #2e2e2e', borderRadius: 8, color: '#D9D9D9', textDecoration: 'none', fontSize: '0.86rem', fontWeight: 600 }}>
              Create Account
            </Link>
          </div>
        </div>

        {/* Mobile-only brand content — scrollable below the card */}
        <div className="auth-mobile-brand" style={{ marginTop: 32, padding: '0 4px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            <BrandQuote text="My dream is to transition my business to someone who shares my vision, will steward my customers, and honor the reputation we've built." cite="Seller — Manufacturing, 28 years" />
            <BrandQuote text="I've always wanted to run my own business, but rather than start from scratch, I want to carry forward the legacy of a great family-owned company and help build its next chapter." cite="Buyer — Workforce Development" />
          </div>
          <ProcessSteps center />
        </div>
      </div>

      <p style={{ maxWidth: 520, margin: '28px auto 0', textAlign: 'center', fontSize: '0.72rem', color: '#5a5a5a', fontStyle: 'italic', lineHeight: 1.6, padding: '0 16px' }}>
        We&rsquo;re the V + V Business Marketplace because we believe all it takes to carry a great privately held business into its next generation is shared vision and values &mdash; and a lot of hard work.
      </p>

      {/* Responsive CSS */}
      <style>{`
        .auth-brand-panel { display: flex !important; }
        .auth-mobile-logo { display: none !important; }
        .auth-mobile-brand { display: none !important; }

        @media (max-width: 768px) {
          .auth-brand-panel { display: none !important; }
          .auth-mobile-logo { display: block !important; }
          .auth-mobile-brand { display: block !important; }
          .auth-auth-panel { max-width: 100% !important; padding: 32px 24px !important; }
        }
      `}</style>
    </div>
  )
}

function BrandQuote({ text, cite }: { text: string; cite: string }) {
  return (
    <blockquote style={{ borderLeft: '2px solid #A05500', paddingLeft: 16, margin: 0 }}>
      <p style={{ fontSize: '0.84rem', color: '#D9D9D9', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 5 }}>&ldquo;{text}&rdquo;</p>
      <cite style={{ fontSize: '0.68rem', color: '#C46A00', textTransform: 'uppercase', letterSpacing: '0.12em', fontStyle: 'normal' }}>{cite}</cite>
    </blockquote>
  )
}

const STEPS = ['Create a Profile', 'Match with Like-Minded Leaders', 'Conduct Business — on Shared Values']

function ProcessSteps({ center = false }: { center?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: center ? 'center' : 'stretch' }}>
      {STEPS.map((step, i) => (
        <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
            border: '1px solid #C46A00', color: '#C46A00',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.95rem',
          }}>
            {i + 1}
          </div>
          <span style={{ fontSize: '0.82rem', color: '#D9D9D9', fontWeight: 600 }}>{step}</span>
        </div>
      ))}
    </div>
  )
}

