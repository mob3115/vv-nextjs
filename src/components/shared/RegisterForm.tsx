'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Search, Store, ArrowLeftRight, type LucideIcon } from 'lucide-react'
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
//
// The Role screen (internal step 0) is a quick, unlabeled intro rather than
// a numbered step — it's a single click, not a form to fill in. The numbered
// bar only covers the substantive part of the flow: Account, then Your
// Profile/Your Business, then Done, so "step 1 of 3" means something.
const BUYER_STEPS = ['Account', 'Your Profile', 'Done']
const SELLER_STEPS = ['Account', 'List Your Business', 'Done']

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
  // Internal `step` values are 0 (role, unlabeled) / 1 / 2 / 3 — the bar
  // itself only shows 3 dots (Account / Profile-or-Listing / Done), so shift
  // by one to map step 1/2/3 onto bar positions 0/1/2.
  const barStep = step - 1

  // Step bar — a 3-column grid (both STEPS arrays always have exactly 3
  // entries) so each circle sits dead-center in its column, rather than the
  // old flex layout where the middle circle rode on the left edge of its
  // (much wider) flex-1 box instead of the box's center. The connector line
  // is drawn separately, absolutely positioned between the first and last
  // circles' centers (inset = half a column's width = 100/6%), with an
  // orange overlay on top sized to the current progress fraction.
  const stepCount = stepLabels.length
  const stepInset = 100 / (2 * stepCount)
  const stepProgress = stepCount > 1 ? Math.min(Math.max(barStep, 0), stepCount - 1) / (stepCount - 1) : 0
  const StepBar = () => (
    <div className="relative grid grid-cols-3 mb-8">
      <div className="absolute h-0.5 bg-grey-border" style={{ top: 13, left: `${stepInset}%`, right: `${stepInset}%` }} />
      <div
        className="absolute h-0.5 bg-orange transition-all"
        style={{ top: 13, left: `${stepInset}%`, width: `${(100 - 2 * stepInset) * stepProgress}%` }}
      />
      {stepLabels.map((label, i) => (
        <div key={i} className="relative z-10 flex flex-col items-center">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            i < barStep ? 'bg-orange text-white' :
            i === barStep ? 'border-2 border-orange text-orange bg-black-card' :
            'bg-black-hover border border-grey-border text-grey-mid'
          }`}>
            {i < barStep ? '✓' : i + 1}
          </div>
          <span className={`text-[9px] uppercase tracking-widest mt-1 hidden sm:block text-center px-1 ${i === barStep ? 'text-white' : 'text-grey-mid'}`}>
            {label}
          </span>
        </div>
      ))}
    </div>
  )

  // ---- Step 0: Role (quick intro, not a numbered step) ----
  if (step === 0) return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1.5">How are you joining V+V?</h2>
      <p className="text-sm text-grey-dark mb-6">You can update your role anytime after registration.</p>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {([
          ['buyer',  Search,         'Buyer',  'Find businesses to acquire'],
          ['seller', Store,          'Seller', 'List your business for sale'],
          ['dual',   ArrowLeftRight, 'Both',   'Buyer and seller access'],
        ] as [Role, LucideIcon, string, string][]).map(([r, Icon, roleLabel, desc]) => (
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
            <Icon size={26} strokeWidth={1.75} className="mx-auto mb-2" aria-hidden />
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
      {/* ListingForm has its own (more granular) 4-step progress bar for
          Business/Financials/Values/Privacy — stacking this coarser one on
          top of it just doubles up on progress indicators. Only shown here
          for buyer/dual, where BuyerProfileForm is a single screen with no
          stepper of its own. */}
      {role !== 'seller' && <StepBar />}
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
        <ListingForm fullName={fullName} onSubmit={handleListingSubmit} submitLabel="List My Business →" />
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
