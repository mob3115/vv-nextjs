'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { registerAction } from '@/lib/actions/auth'

type Role = 'buyer' | 'seller' | 'dual'

const VALUES_LIST = [
  'Investing Local',
  'Craftsmanship',
  'Employee Wellbeing',
  'Long Term Investment',
  'Equity',
  'Environmental Stewardship',
  'Employee Ownership',
  'Accessible to All',
  'Worker Safety',
  'Creative Excellence',
  'Economic Mobility',
  'Free Enterprise',
  'Conscious Capitalism',
  'Compassionate Care',
  'Sustainability',
  'Workforce Development',
  'Customer Focused',
  'Resident Dignity',
  'Excellence & Quality',
  'Family Values',
  'Innovation & Discovery',
  'Individual Responsibility',
  'Integrity',
  'Client Stewardship',
]

const STEPS = ['Your Role', 'Account', 'Your Values', 'Done']

export function RegisterForm() {
  const [step, setStep] = useState(0)
  const [role, setRole] = useState<Role>('buyer')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedValues, setSelectedValues] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function toggleValue(v: string) {
    setSelectedValues(prev =>
      prev.includes(v)
        ? prev.filter(x => x !== v)
        : prev.length >= 5
          ? (toast.error('Select up to 5 values'), prev)
          : [...prev, v]
    )
  }

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
    if (s === 2 && selectedValues.length === 0) errs.values = 'Please select at least one value'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function nextStep() {
    if (!validateStep(step)) return
    setStep(s => Math.min(s + 1, 3))
  }

  function handleSubmit() {
    if (!validateStep(2)) return
    startTransition(async () => {
      const result = await registerAction({ email: email.trim(), password, fullName: fullName.trim(), role })
      if (result?.error) {
        setErrors({ submit: result.error })
        setStep(1)
      } else {
        setStep(3)
      }
    })
  }

  // Step bar
  const StepBar = () => (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => (
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
          {i < STEPS.length - 1 && (
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
        ] as [Role, string, string, string][]).map(([r, icon, label, desc]) => (
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
            <span className="block text-sm font-semibold">{label}</span>
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
        {errors.submit && <p className="form-error text-center" role="alert">{errors.submit}</p>}
      </div>
      <div className="flex gap-3 mt-6">
        <button type="button" onClick={() => setStep(0)} className="btn-ghost">← Back</button>
        <button type="button" onClick={nextStep} className="btn-primary flex-1">Continue →</button>
      </div>
    </div>
  )

  // ---- Step 2: Values ----
  if (step === 2) return (
    <div>
      <StepBar />
      <h2 className="text-xl font-bold text-white mb-1.5">What do you stand for?</h2>
      <p className="text-sm text-grey-dark mb-5">
        Choose your top 3–5 values. These power your compatibility matches.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        {VALUES_LIST.map(v => (
          <button
            key={v}
            type="button"
            onClick={() => toggleValue(v)}
            className={`px-3 py-2 rounded-sm border text-xs text-center transition-all ${
              selectedValues.includes(v)
                ? 'border-orange bg-orange/8 text-orange-light'
                : 'border-grey-border bg-black-deep text-grey-dark hover:border-orange hover:text-white'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      {errors.values && <p className="form-error mb-3">{errors.values}</p>}
      <p className="text-xs text-grey-mid mb-5">
        {selectedValues.length}/5 values selected
      </p>
      <div className="flex gap-3">
        <button type="button" onClick={() => setStep(1)} className="btn-ghost">← Back</button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="btn-primary flex-1"
        >
          {isPending ? 'Creating account…' : 'Create Account →'}
        </button>
      </div>
    </div>
  )

  // ---- Step 3: Done ----
  return (
    <div className="text-center py-4">
      <StepBar />
      <div className="text-5xl mb-5">🎉</div>
      <h2 className="text-xl font-bold text-white mb-3">You&apos;re in.</h2>
      <p className="text-sm text-grey-dark leading-relaxed max-w-xs mx-auto mb-2">
        Check your email to confirm your account. Once confirmed, you can sign in and start discovering matches.
      </p>
      <p className="text-xs text-grey-mid mb-6">(Demo accounts are pre-confirmed — sign in directly.)</p>
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
