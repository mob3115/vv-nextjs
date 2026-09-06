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
    <div className="min-h-screen bg-black-deep flex items-center justify-center p-4">
      <div className="w-full max-w-[960px] min-h-[580px] flex rounded-[32px] overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.7)] border border-grey-border">

        {/* Left brand panel */}
        <div className="flex-1 bg-black-DEFAULT relative hidden md:flex flex-col justify-between p-12"
             style={{ backgroundImage: 'radial-gradient(ellipse at 30% 70%, rgba(160,85,0,0.18) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(160,85,0,0.08) 0%, transparent 50%)' }}>
          <div>
            <div className="font-display text-5xl text-white leading-none">
              V<span className="text-orange-light">+</span>V
            </div>
            <p className="text-sm text-grey-dark mt-3 leading-relaxed max-w-[260px]">
              The place where you buy and sell businesses based on shared values.
            </p>
          </div>

          <div className="space-y-5">
            <blockquote className="border-l-2 border-orange pl-4">
              <p className="text-sm text-grey-light italic leading-relaxed">
                &ldquo;I&apos;m not selling to the highest bidder. I&apos;m finding someone who sees what I see.&rdquo;
              </p>
              <cite className="text-xs text-orange-light uppercase tracking-widest mt-2 block not-italic">
                Seller — Manufacturing, 28 years
              </cite>
            </blockquote>
            <blockquote className="border-l-2 border-orange pl-4">
              <p className="text-sm text-grey-light italic leading-relaxed">
                &ldquo;I&apos;ve spent my career building programs that move the needle. I want to run a business that does the same thing.&rdquo;
              </p>
              <cite className="text-xs text-orange-light uppercase tracking-widest mt-2 block not-italic">
                Buyer — Workforce Development
              </cite>
            </blockquote>
          </div>

          <div className="flex gap-7">
            {[['847', 'Listings'], ['312', 'Matches'], ['94%', 'NDA Rate']].map(([val, lbl]) => (
              <div key={lbl}>
                <div className="font-display text-3xl text-white leading-none">{val}</div>
                <div className="text-xs text-grey-dark uppercase tracking-widest mt-1">{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right auth panel */}
        <div className="w-full md:w-[420px] flex-shrink-0 bg-black-card flex flex-col justify-center px-10 py-11">
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-sm text-grey-dark mb-7">Sign in to your account to continue.</p>

          {searchParams.message && (
            <div className="mb-4 p-3 bg-success/10 border border-success/25 rounded-md text-sm text-success">
              {searchParams.message}
            </div>
          )}

          {/* Quick demo access */}
          <div className="bg-black-deep border border-grey-border rounded-sm p-3.5 mb-5">
            <div className="text-xs text-orange-light uppercase tracking-widest mb-2.5">⚡ Quick Demo Access</div>
            <div className="space-y-1">
              {[
                ['angela@demo.vv', 'Buyer'],
                ['marcus@demo.vv', 'Seller'],
              ].map(([email, role]) => (
                <div key={email} className="flex justify-between items-center py-1 border-b border-grey-border last:border-0">
                  <span className="text-xs text-grey-light">{email}</span>
                  <span className="text-xs text-grey-mid uppercase tracking-wide">{role}</span>
                </div>
              ))}
              <p className="text-xs text-grey-mid mt-2">Password: Demo@VV2024!</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-grey-mid text-xs mb-5">
            <div className="flex-1 h-px bg-grey-border" />
            or sign in
            <div className="flex-1 h-px bg-grey-border" />
          </div>

          <LoginForm redirectTo={searchParams.redirectTo} />

          <div className="flex items-center gap-3 text-grey-mid text-xs my-5">
            <div className="flex-1 h-px bg-grey-border" />
            new to V+V?
            <div className="flex-1 h-px bg-grey-border" />
          </div>

          <Link href="/auth/register" className="btn-ghost btn-block text-center py-2.5 rounded-sm text-sm">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  )
}
