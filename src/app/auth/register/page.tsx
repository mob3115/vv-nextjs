import type { Metadata } from 'next'
import Link from 'next/link'
import { RegisterForm } from '@/components/shared/RegisterForm'

export const metadata: Metadata = { title: 'Create Account' }

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-black-deep flex items-center justify-center p-4">
      <div className="w-full max-w-[560px]">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="font-display text-4xl text-white leading-none">
            V<span className="text-orange-light">+</span>V
          </div>
          <p className="text-xs text-grey-dark uppercase tracking-widest mt-2">
            Business Marketplace
          </p>
        </div>

        <div className="bg-black-card border border-grey-border rounded-xl p-8 shadow-card">
          <RegisterForm />
        </div>

        <p className="text-center text-sm text-grey-dark mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-orange-light hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
