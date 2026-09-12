'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { registerBuyerAction, registerSellerAction } from '@/lib/actions/auth'
import { BuyerProfileForm } from '@/components/buyer/BuyerProfileForm'
import { ListingForm } from '@/components/seller/ListingForm'
import type { BuyerProfileInput, SellerListingInput } from '@/lib/validations'

type Role = 'buyer' | 'seller' | 'dual'

// Registration is one continuous flow — account, then the *complete* buyer
// profile or seller listing, right here, before "Done". There is no
// separate "now go build your profile" or "now go create a listing" step
// afterward: BuyerProfileForm / ListingForm are embedded directly (in
// "collect" mode — see their onSubmit prop) and their payload is submitted
// together with account creation via registerBuyerAction/registerSellerAction.
const BUYER_STEPS = ['Your Role', 'Account', 'Your Profile', 'Done']
const SELLER_STEPS = ['Your Role', 'Account', 'List Your Business', 'Done']

export function RegisterForm() {
  const [step, setStep] = useState(0)
  const [role, setRole] = useState<Role>('buyer')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(true)
  const router = useRouter()

  function validateStep(s: number): boolean {
    const errs: Record<string, string> = {}
    if (s === 1) {
      if (!fullName.trim() || fullName.trim().length < 2) errs.fullName = 'Full name must be at least 2 characters'
      if (!email.includes('@')) errs.email = 'Please enter a valid email'
      if (password.length < 8) errs.password = 'Password must be at least 8 characters'
      if (!/[A-Z]/.test(password)) errs.password = 'Must include at least one uppercase letter'
      if (!/[0-9]/.test(password)) errs.password = 'Must include at least one number'
      if (!/[^A-Za-z0-9]/.test(password)) errs.password = 'Must include at least one special character'
      if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function nextStep() {
    if (!validateStep(step)) return
    setStep(s => Math.min(s + 1, 3))
  }

  async function handleProfileSubmit(profile: BuyerProfileInput) {
    const result = await registerBuyerAction({
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      role: role === 'dual' ? 'dual' : 'buyer',
      profile,
    })

    if (result?.error) {
      toast.error(result.error)
      setStep(1)
      return
    }
    setNeedsEmailConfirmation(!!result.needsEmailConfirmation)
    setStep(3)
  }

  async function handleListingSubmit(listing: SellerListingInput) {
    const result = await registerSellerAction({
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      listing,
    })

    if (result?.error) {
      toast.error(result.error)
      setStep(1)
      return
    }
    setNeedsEmailConfirmation(!!result.needsEmailConfirmation)
    setStep(3)
  }

  const stepLabels = role === 'seller' ? SELLER_STEPS : BUYER_STEPS

  // Step bar
  const StepBar = () => (
    <div className="flex items-center gap-0 mb-8">
      {stepLabels.map((label, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-all ${
              i < step ? 'bg-orange text-white' :
              i === step ? 'border-2 border-orange text-orange bg-black-card' :
              'bg-black-hover border border-grey-border text-grey-mid'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-[9px] uppercase tracking-widest mt-1 hidden sm:block ${i === step ? 'text-white' : 'text-grey-mid'}`}>
              {label}
            </span>
          </div>
          {i < stepLabels.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 ${i < step ? 'bg-orange' : 'bg-grey-border'}`} />
          )}
        </div>
      ))}
    </div>
  )

  // ---- Step 0: Role ----
  if (step === 0) return (
    <div>
      <StepBar />
      <h2 className="text-xl font-bold text-white mb-1.5">How are you joining V+V?</h2>
      <p className="text-sm text-grey-dark mb-6">You can update your role anytime after registration.</p>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {([
          ['buyer',  '🔍', 'Buyer',  'Find businesses to acquire'],
          ['seller', '🏢', 'Seller', 'List your business for sale'],
          ['dual',   '⇄',  'Both',   'Buyer and seller access'],
        ] as [Role, string, string, string][]).map(([r, icon, roleLabel, desc]) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`p-4 rounded-md border text-center transition-all ${
              role === r
                ? 'border-orange bg-orange/8 text-orange-light'
                : 'border-grey-border bg-black-deep text-grey-dark hover:border-orange hover:text-white'
            }`}
          >
            <span className="block text-2xl mb-2">{icon}</span>
            <span className="block text-sm font-semibold">{roleLabel}</span>
            <span className="block text-xs mt-1 opacity-70">{desc}</span>
          </button>
        ))}
      </div>
      <button type="button" onClick={nextStep} className="btn-primary btn-block btn-lg">
        Continue →
      </button>
    </div>
  )

  // ---- Step 1: Account ----
  if (step === 1) return (
    <div>
      <StepBar />
      <h2 className="text-xl font-bold text-white mb-1.5">Create your account</h2>
      <p className="text-sm text-grey-dark mb-6">Your email is stored securely and never shared.</p>
      <div className="space-y-4">
        <div>
          <label className="form-label">Full Name</label>
          <input
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Your full name"
            className="form-input"
          />
          {errors.fullName && <p className="form-error">{errors.fullName}</p>}
        </div>
        <div>
          <label className="form-label">Email Address</label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="form-input"
          />
          {errors.email && <p className="form-error">{errors.email}</p>}
        </div>
        <div>
          <label className="form-label">Password</label>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="form-input"
          />
          {errors.password && <p className="form-error">{errors.password}</p>}
          {!errors.password && (
            <p className="form-hint">Uppercase, number, and special character required</p>
          )}
        </div>
        <div>
          <label className="form-label">Confirm Password</label>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Repeat your password"
            className="form-input"
          />
          {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button type="button" onClick={() => setStep(0)} className="btn-ghost">← Back</button>
        <button type="button" onClick={nextStep} className="btn-primary flex-1">Continue →</button>
      </div>
    </div>
  )

  // ---- Step 2: Full profile (buyer/dual) or full listing (seller) ----
  if (step === 2) return (
    <div>
      <StepBar />
      <button
        type="button"
        onClick={() => {
          // BuyerProfileForm/ListingForm hold their own field state — going
          // back unmounts whichever is showing, so anything typed on this
          // step would otherwise vanish silently.
          if (confirm('Go back to edit your account details? Anything you\'ve entered on this step will be cleared.')) {
            setStep(1)
          }
        }}
        className="text-xs text-grey-dark hover:text-white mb-4"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        ← Back to account details
      </button>
      {role === 'seller' ? (
        <ListingForm onSubmit={handleListingSubmit} submitLabel="List My Business →" />
      ) : (
        <BuyerProfileForm
          fullName={fullName}
          onSubmit={handleProfileSubmit}
          submitLabel="Save Profile & Create Account →"
        />
      )}
    </div>
  )

  // ---- Step 3: Done ----
  return (
    <div className="text-center py-4">
      <StepBar />
      <div className="text-5xl mb-5">🎉</div>
      <h2 className="text-xl font-bold text-white mb-3">You&apos;re in.</h2>
      {role === 'seller' ? (
        <p className="text-sm text-grey-dark leading-relaxed max-w-xs mx-auto mb-2">
          Your listing is live and saved to My Listing.{' '}
          {needsEmailConfirmation
            ? 'Check your email to confirm your account, then sign in to start reviewing buyer interest.'
            : 'You can sign in now to start reviewing buyer interest.'}
        </p>
      ) : (
        <p className="text-sm text-grey-dark leading-relaxed max-w-xs mx-auto mb-2">
          Your buyer profile is saved to My Profile.{' '}
          {needsEmailConfirmation
            ? 'Check your email to confirm your account, then sign in to start discovering matches.'
            : 'You can sign in now to start discovering matches.'}
        </p>
      )}
      {needsEmailConfirmation && (
        <p className="text-xs text-grey-mid mb-6">(Demo accounts are pre-confirmed — sign in directly.)</p>
      )}
      <button
        type="button"
        onClick={() => router.push('/auth/login')}
        className="btn-primary btn-lg"
      >
        Go to Sign In →
      </button>
    </div>
  )
}
