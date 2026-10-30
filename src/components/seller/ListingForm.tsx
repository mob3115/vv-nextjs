'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { createSellerListing, updateSellerListing } from '@/lib/actions/marketplace'
import { getIndustryIcon, ANON_ICONS } from '@/lib/icons'
import { INDUSTRIES, REVENUE_BANDS, TRANSITION_TIMELINES as TIMELINES, CORE_VALUES as ALL_VALUES, REGIONS } from '@/lib/constants'
import { AccordionCard } from '@/components/shared/AccordionCard'
import { ValuesMethodChooser } from '@/components/values/ValuesMethodChooser'
import { ValuesQuiz } from '@/components/values/ValuesQuiz'
import type { SellerListingInput } from '@/lib/validations'

interface ListingFormProps {
  existing?: any  // existing listing data for edit mode
  // The account name collected one step earlier in the registration wizard
  // (RegisterForm). When present, this form is being embedded mid-signup —
  // the owner name fields are derived from it instead of asked again, since
  // the person just typed their name on the previous screen. Absent when
  // editing an existing listing from the seller dashboard, where these
  // fields show their own independently-editable saved values instead.
  fullName?: string
  // When provided, the final submit hands the validated payload to this
  // callback instead of calling createSellerListing()/updateSellerListing()
  // + redirecting itself — used to embed this form inside the registration
  // wizard, where the listing is published together with account creation
  // in one combined submit (see RegisterForm) rather than through its own
  // authenticated session.
  onSubmit?: (payload: SellerListingInput) => void | Promise<void>
  submitLabel?: string
  // 'wizard' (default): one step at a time with Next/Back — used during
  // registration, where nothing exists yet to glance at. 'accordion': all
  // four sections shown as independently-expandable cards with one Save
  // action — used on the standalone My Listing page. Same fields, same
  // state and validation either way; only the presentation differs.
  mode?: 'wizard' | 'accordion'
}

type Step = 1 | 2 | 3 | 4
type ValuesMethod = 'choose' | 'quiz' | 'manual'

export function ListingForm({ existing, fullName, onSubmit, submitLabel, mode = 'wizard' }: ListingFormProps) {
  const isEdit = !!existing
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<Step>(1)

  // Form state — pre-filled if editing
  const [industry, setIndustry]           = useState(existing?.industry ?? '')
  const [businessName, setBusinessName]   = useState(existing?.business_name ?? '')
  const [ownerFullName, setOwnerFullName] = useState(existing?.owner_full_name ?? fullName ?? '')
  const [ownerFirstName, setOwnerFirstName] = useState(existing?.owner_first_name ?? (fullName ? fullName.trim().split(/\s+/)[0] : ''))
  const [tagline, setTagline]             = useState(existing?.tagline ?? '')
  const [yearsOp, setYearsOp]             = useState(existing?.years_operating?.toString() ?? '')
  const [employees, setEmployees]         = useState(existing?.employees_range ?? '')
  const [locationCity, setLocationCity]   = useState(existing?.location_city ?? '')
  const [locationRegion, setLocationRegion] = useState(existing?.location_region ?? '')

  const [revenueBand, setRevenueBand]         = useState(existing?.revenue_band ?? '')
  const [askingRange, setAskingRange]         = useState(existing?.asking_range ?? '')
  const [revenueExact, setRevenueExact]       = useState(existing?.revenue_exact ?? '')
  const [askingPriceExact, setAskingPriceExact] = useState(existing?.asking_price_exact ?? '')
  const [ebitda, setEbitda]                   = useState(existing?.ebitda ?? '')
  const [sellerFinancing, setSellerFinancing] = useState(existing?.seller_financing ?? false)
  const [managementTraining, setManagementTraining] = useState(existing?.management_training ?? false)

  const [values, setValues]                 = useState<string[]>(existing?.values ?? [])
  const [valuesStatement, setValuesStatement] = useState(existing?.values_statement ?? '')
  const [transitionGoals, setTransitionGoals] = useState(existing?.transition_goals ?? '')
  const [timeline, setTimeline]               = useState(existing?.transition_timeline ?? '')

  const [anonymityLevel, setAnonymityLevel] = useState<1|2|3>(existing?.anonymity_level ?? 1)

  const [errors, setErrors] = useState<Record<string, string>>({})

  // First time through (no saved values yet), lead with the quiz-or-pick
  // chooser; editing an existing listing skips straight to the familiar grid.
  const [valuesMethod, setValuesMethod] = useState<ValuesMethod>(values.length > 0 ? 'manual' : 'choose')

  function toggleValue(v: string) {
    setValues(prev =>
      prev.includes(v)
        ? prev.filter(x => x !== v)
        : prev.length >= 5
          ? (toast.error('Choose up to 5 values'), prev)
          : [...prev, v]
    )
  }

  function handleQuizConfirm(quizValues: string[], statementDraft: string) {
    setValues(quizValues)
    setValuesStatement((prev: string) => prev.trim() ? prev : statementDraft)
    setValuesMethod('manual')
  }

  function selectIndustry(ind: string) {
    setIndustry(ind)
  }

  function validateStep(s: Step): Record<string, string> {
    const errs: Record<string, string> = {}
    if (s === 1) {
      if (!industry)        errs.industry     = 'Please select an industry'
      if (!businessName.trim()) errs.businessName = 'Business name is required'
      if (!tagline.trim())  errs.tagline      = 'Tagline is required'
      if (!yearsOp || isNaN(Number(yearsOp))) errs.yearsOp = 'Years operating is required'
      if (!employees.trim()) errs.employees   = 'Employee range is required'
      if (!locationCity.trim()) errs.locationCity = 'City is required'
      if (!locationRegion.trim()) errs.locationRegion = 'Region is required'
    }
    if (s === 2) {
      if (!revenueBand)     errs.revenueBand  = 'Revenue band is required'
      if (!askingRange.trim()) errs.askingRange = 'Asking range is required'
      if (!revenueExact.trim()) errs.revenueExact = 'Exact revenue is required'
      if (!askingPriceExact.trim()) errs.askingPriceExact = 'Asking price is required'
    }
    if (s === 3) {
      if (values.length === 0)          errs.values          = 'Select at least one value'
      if (valuesStatement.length < 30)  errs.valuesStatement = 'Please write at least 30 characters'
      if (transitionGoals.length < 20)  errs.transitionGoals = 'Please describe your goals'
      if (!timeline)                    errs.timeline        = 'Timeline is required'
    }
    return errs
  }

  function runValidateStep(s: Step): boolean {
    const errs = validateStep(s)
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Accordion mode has no forced step order, so Save validates every section
  // at once rather than just the last one — step 4 (Privacy) has no required
  // fields of its own, so 1+2+3 is everything there is to check.
  function validateAll(): Record<string, string> {
    const errs = { ...validateStep(1), ...validateStep(2), ...validateStep(3) }
    setErrors(errs)
    return errs
  }

  const STEP_OF_FIELD: Record<string, Step> = {
    industry: 1, businessName: 1, tagline: 1, yearsOp: 1, employees: 1, locationCity: 1, locationRegion: 1,
    revenueBand: 2, askingRange: 2, revenueExact: 2, askingPriceExact: 2,
    values: 3, valuesStatement: 3, transitionGoals: 3, timeline: 3,
  }

  function nextStep() {
    if (!runValidateStep(step)) return
    setStep(s => Math.min(s + 1, 4) as Step)
  }

  function buildPayload() {
    return {
      industry,
      industryIcon: industry, // icon is now always derived from the industry itself
      businessName,
      ownerFullName,
      ownerFirstName,
      tagline,
      yearsOperating: Number(yearsOp),
      employeesRange: employees,
      locationCity,
      locationRegion,
      revenueBand,
      askingRange,
      revenueExact,
      askingPriceExact,
      ebitda,
      sellerFinancing,
      managementTraining,
      values,
      valuesStatement,
      transitionGoals,
      transitionTimeline: timeline,
      anonymityLevel,
      status: 'active',
    }
  }

  function handleSubmit() {
    const errs = validateAll()
    if (Object.keys(errs).length > 0) {
      if (mode === 'accordion') {
        toast.error('Please fix the errors above')
      } else {
        // In practice every step is re-validated by nextStep() before you can
        // reach step 4, so this shouldn't fire — but if it ever does, the
        // invalid fields live on a step that isn't currently rendered. Jump
        // back to the earliest one rather than failing with nothing visible.
        const firstErrorStep = Math.min(...Object.keys(errs).map(k => STEP_OF_FIELD[k] ?? 4)) as Step
        setStep(firstErrorStep)
        toast.error('Please fix the errors on an earlier step')
      }
      return
    }
    const payload = buildPayload()

    if (onSubmit) {
      startTransition(async () => { await onSubmit(payload) })
      return
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateSellerListing({ ...payload, id: existing.id })
        : await createSellerListing(payload)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(isEdit ? 'Listing updated!' : 'Listing created!')
        router.push('/seller/dashboard')
        router.refresh()
      }
    })
  }

  // Step bar (wizard mode only)
  const STEPS = ['Business', 'Financials', 'Values', 'Privacy']
  const StepBar = () => (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
      {STEPS.map((label, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : undefined }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.78rem', fontWeight: 700, transition: 'all 0.2s',
              background: i + 1 < step ? '#A05500' : i + 1 === step ? 'transparent' : '#2e2e2e',
              border: i + 1 === step ? '2px solid #A05500' : '2px solid transparent',
              color: i + 1 < step ? '#fff' : i + 1 === step ? '#C46A00' : '#6a6a6a',
            }}>
              {i + 1 < step ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: i + 1 === step ? '#fff' : '#6a6a6a' }}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i + 1 < step ? '#A05500' : '#2e2e2e', margin: '0 4px', marginBottom: 16 }} />
          )}
        </div>
      ))}
    </div>
  )

  const Err = ({ field }: { field: string }) =>
    errors[field] ? <p style={{ fontSize: '0.72rem', color: '#d45f5f', marginTop: 4 }}>{errors[field]}</p> : null

  const label = (text: string) => (
    <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#929292', marginBottom: 6 }}>
      {text}
    </div>
  )

  const input = (value: string, onChange: (v: string) => void, placeholder: string, type = 'text') => (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width: '100%', background: '#141414', border: '1px solid #2e2e2e', borderRadius: 6, padding: '10px 14px', fontSize: '0.88rem', color: '#fff', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
      onFocus={e => e.target.style.borderColor = '#A05500'}
      onBlur={e => e.target.style.borderColor = '#2e2e2e'}
    />
  )

  const textarea = (value: string, onChange: (v: string) => void, placeholder: string, rows = 3) => (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{ width: '100%', background: '#141414', border: '1px solid #2e2e2e', borderRadius: 6, padding: '10px 14px', fontSize: '0.88rem', color: '#fff', outline: 'none', resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit', boxSizing: 'border-box' }}
      onFocus={e => e.target.style.borderColor = '#A05500'}
      onBlur={e => e.target.style.borderColor = '#2e2e2e'}
    />
  )

  const accordion = mode === 'accordion'

  // ---- Section bodies — shared markup for both wizard and accordion mode ----

  const businessBasicsBody = (
    <>
      <div style={{ marginBottom: 16 }}>
        {label('Industry *')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {INDUSTRIES.map(ind => {
            const Icon = getIndustryIcon(ind)
            return (
            <button
              key={ind}
              type="button"
              onClick={() => selectIndustry(ind)}
              style={{
                padding: '10px 8px', borderRadius: 8, border: `1px solid ${industry === ind ? '#A05500' : '#2e2e2e'}`,
                background: industry === ind ? 'rgba(160,85,0,0.1)' : '#141414',
                color: industry === ind ? '#C46A00' : '#929292',
                fontSize: '0.72rem', cursor: 'pointer', textAlign: 'center', lineHeight: 1.4, fontFamily: 'inherit',
              }}
            >
              <Icon size={20} strokeWidth={1.75} style={{ marginBottom: 3, marginInline: 'auto' }} />
              {ind}
            </button>
            )
          })}
        </div>
        <Err field="industry" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          {label('Business Name (private) *')}
          {input(businessName, setBusinessName, 'e.g. Ironwood Fabrication Co.')}
          <Err field="businessName" />
        </div>
        {/* Owner name is collected once, on the account step, when this
            form is embedded in registration (fullName is passed) — asking
            again here would just repeat the same question. Editing an
            existing listing from the dashboard (no fullName prop) still
            shows it, independently editable from the account name. */}
        {fullName ? (
          <div>
            {label('Years Operating *')}
            {input(yearsOp, setYearsOp, 'e.g. 12', 'number')}
            <Err field="yearsOp" />
          </div>
        ) : (
          <div>
            {label('Your Full Name (private) *')}
            {input(ownerFullName, setOwnerFullName, 'Legal name')}
          </div>
        )}
      </div>

      {!fullName && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            {label('First Name (shown at Level 2)')}
            {input(ownerFirstName, setOwnerFirstName, 'First name only')}
          </div>
          <div>
            {label('Years Operating *')}
            {input(yearsOp, setYearsOp, 'e.g. 12', 'number')}
            <Err field="yearsOp" />
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        {label('One-Line Tagline *')}
        {input(tagline, setTagline, 'e.g. Built for craftsmen. Ran like a family.')}
        <div style={{ fontSize: '0.68rem', color: '#6a6a6a', marginTop: 4 }}>This is visible to all buyers. Keep it evocative but vague enough to protect anonymity.</div>
        <Err field="tagline" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          {label('Employee Range *')}
          <select
            value={employees}
            onChange={e => setEmployees(e.target.value)}
            style={{ width: '100%', background: '#141414', border: '1px solid #2e2e2e', borderRadius: 6, padding: '10px 14px', fontSize: '0.88rem', color: employees ? '#fff' : '#6a6a6a', outline: 'none', fontFamily: 'inherit', appearance: 'none' }}
          >
            <option value="">Select range</option>
            {['1–5','6–10','11–20','21–35','36–50','51–75','76–100','100+'].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <Err field="employees" />
        </div>
        <div>
          {label('City *')}
          {input(locationCity, setLocationCity, 'e.g. Cleveland, OH')}
          <Err field="locationCity" />
        </div>
      </div>

      <div>
        {label('Region *')}
        <select
          value={locationRegion}
          onChange={e => setLocationRegion(e.target.value)}
          style={{ width: '100%', background: '#141414', border: '1px solid #2e2e2e', borderRadius: 6, padding: '10px 14px', fontSize: '0.88rem', color: locationRegion ? '#fff' : '#6a6a6a', outline: 'none', fontFamily: 'inherit', appearance: 'none' }}
        >
          <option value="">Select region</option>
          {REGIONS.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <Err field="locationRegion" />
      </div>
    </>
  )

  const financialsBody = (
    <>
      <div style={{ background: 'rgba(160,85,0,0.08)', border: '1px solid rgba(160,85,0,0.2)', borderRadius: 8, padding: '12px 14px', marginBottom: 20, fontSize: '0.8rem', color: '#C46A00' }}>
        🔒 Exact revenue and asking price are encrypted and never shown until a buyer signs your NDA.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          {label('Exact Asking Price (post-NDA) *')}
          {input(askingPriceExact, setAskingPriceExact, 'e.g. $2,800,000')}
          <Err field="askingPriceExact" />
        </div>
        <div>
          {label('Asking Range (pre-NDA, shown publicly) *')}
          {input(askingRange, setAskingRange, 'e.g. $2M–$4M')}
          <Err field="askingRange" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          {label('Annual Revenue (exact, post-NDA) *')}
          {input(revenueExact, setRevenueExact, 'e.g. $4,200,000')}
          <Err field="revenueExact" />
        </div>
        <div>
          {label('Revenue Band (pre-NDA, shown publicly) *')}
          <select
            value={revenueBand}
            onChange={e => setRevenueBand(e.target.value)}
            style={{ width: '100%', background: '#141414', border: '1px solid #2e2e2e', borderRadius: 6, padding: '10px 14px', fontSize: '0.88rem', color: revenueBand ? '#fff' : '#6a6a6a', outline: 'none', fontFamily: 'inherit', appearance: 'none' }}
          >
            <option value="">Select band</option>
            {REVENUE_BANDS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <Err field="revenueBand" />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        {label('EBITDA (optional, post-NDA)')}
        {input(ebitda, setEbitda, 'e.g. $680,000')}
      </div>

      <div>
        {label('Seller Financing')}
        <div style={{ display: 'flex', gap: 10 }}>
          {[true, false].map(val => (
            <button
              key={String(val)}
              type="button"
              onClick={() => setSellerFinancing(val)}
              style={{
                flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.86rem', fontWeight: 600,
                border: `1px solid ${sellerFinancing === val ? '#A05500' : '#2e2e2e'}`,
                background: sellerFinancing === val ? 'rgba(160,85,0,0.1)' : '#141414',
                color: sellerFinancing === val ? '#C46A00' : '#929292',
              }}
            >
              {val ? '✓ Available' : 'Not Offered'}
            </button>
          ))}
        </div>
      </div>
    </>
  )

  const manualValuesGrid = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        {label(`Core Values * — ${values.length}/5 selected`)}
        {values.length > 0 && (
          <button type="button" onClick={() => setValuesMethod('quiz')} className="btn-ghost btn-sm" style={{ fontFamily: 'inherit', cursor: 'pointer' }}>
            Retake the Values Quiz
          </button>
        )}
      </div>
      {/* Include any already-saved values not in the current picklist (e.g.
          older data using different wording/casing) so they still show up
          as selected and can be seen and deselected, instead of silently
          counting toward the 5-value cap while appearing unselected. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7, marginTop: 8 }}>
        {[...ALL_VALUES, ...values.filter(v => !ALL_VALUES.includes(v))].map(v => (
          <button
            key={v}
            type="button"
            onClick={() => toggleValue(v)}
            style={{
              padding: '8px 10px', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', textAlign: 'center', lineHeight: 1.3, fontFamily: 'inherit',
              border: `1px solid ${values.includes(v) ? '#A05500' : '#2e2e2e'}`,
              background: values.includes(v) ? 'rgba(160,85,0,0.1)' : '#141414',
              color: values.includes(v) ? '#C46A00' : '#929292',
            }}
          >
            {v}
          </button>
        ))}
      </div>
      <Err field="values" />
    </>
  )

  const valuesMissionBody = (
    <>
      <div style={{ marginBottom: 20 }}>
        {valuesMethod === 'choose' ? (
          <ValuesMethodChooser onChooseQuiz={() => setValuesMethod('quiz')} onChoosePick={() => setValuesMethod('manual')} />
        ) : valuesMethod === 'quiz' ? (
          <ValuesQuiz audience="seller" onConfirm={handleQuizConfirm} onCancel={() => setValuesMethod(values.length > 0 ? 'manual' : 'choose')} />
        ) : manualValuesGrid}
      </div>

      {valuesMethod === 'manual' && (
        <>
          <div style={{ marginBottom: 16 }}>
            {label('Values Statement *')}
            {textarea(valuesStatement, setValuesStatement, "What do you believe? Why did you build this business the way you did? What kind of buyer are you looking for? Write in your own voice.", 5)}
            <div style={{ fontSize: '0.68rem', color: '#6a6a6a', marginTop: 4 }}>{valuesStatement.length} characters · minimum 30</div>
            <Err field="valuesStatement" />
          </div>

          <div style={{ marginBottom: 16 }}>
            {label('Transition Goals *')}
            {textarea(transitionGoals, setTransitionGoals, "What do you want to happen after you sell? What does the ideal buyer look like? What are you non-negotiable on?", 4)}
            <Err field="transitionGoals" />
          </div>

          <div>
            {label('Transition Timeline *')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {TIMELINES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimeline(t)}
                  style={{
                    padding: '9px 8px', borderRadius: 8, fontSize: '0.78rem', cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit',
                    border: `1px solid ${timeline === t ? '#A05500' : '#2e2e2e'}`,
                    background: timeline === t ? 'rgba(160,85,0,0.1)' : '#141414',
                    color: timeline === t ? '#C46A00' : '#929292',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <Err field="timeline" />
          </div>
        </>
      )}
    </>
  )

  const privacyBody = (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {([
          [1, 'Anonymous', 'No name or identity. Revenue range and region only. Maximum privacy.'],
          [2, 'Partial ID', 'Your first name, industry, city, and revenue band are visible. Business name stays hidden.'],
          [3, 'Full Reveal', 'Everything visible immediately — no NDA required. Maximum exposure.'],
        ] as [1|2|3, string, string][]).map(([level, label2, desc]) => {
          const Icon = ANON_ICONS[level]
          return (
          <button
            key={level}
            type="button"
            onClick={() => setAnonymityLevel(level)}
            style={{
              padding: '16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              border: `1px solid ${anonymityLevel === level ? '#A05500' : '#2e2e2e'}`,
              background: anonymityLevel === level ? 'rgba(160,85,0,0.08)' : '#141414',
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}
          >
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${anonymityLevel === level ? '#A05500' : '#2e2e2e'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#A05500' }}>
              {anonymityLevel === level && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#A05500' }} />}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon size={14} strokeWidth={2} />
                {label2}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#929292', lineHeight: 1.5 }}>{desc}</div>
            </div>
          </button>
          )
        })}
      </div>

      {/* Preview of what buyers will see */}
      <div style={{ background: '#0e0e0e', border: '1px solid #2e2e2e', borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6a6a6a', marginBottom: 10 }}>Preview — what buyers see before NDA</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div style={{ background: '#1a1a1a', borderRadius: 6, padding: 10 }}>
            <div style={{ fontSize: '0.6rem', color: '#6a6a6a', textTransform: 'uppercase', marginBottom: 4 }}>Name</div>
            <div style={{ fontSize: '0.82rem', color: anonymityLevel >= 3 ? '#fff' : '#6a6a6a', fontStyle: anonymityLevel < 3 ? 'italic' : 'normal' }}>
              {anonymityLevel >= 3 ? (businessName || '[Business Name]') : '[Hidden]'}
            </div>
          </div>
          <div style={{ background: '#1a1a1a', borderRadius: 6, padding: 10 }}>
            <div style={{ fontSize: '0.6rem', color: '#6a6a6a', textTransform: 'uppercase', marginBottom: 4 }}>Revenue</div>
            <div style={{ fontSize: '0.82rem', color: '#fff' }}>{revenueBand || 'Range TBD'}</div>
          </div>
          <div style={{ background: '#1a1a1a', borderRadius: 6, padding: 10 }}>
            <div style={{ fontSize: '0.6rem', color: '#6a6a6a', textTransform: 'uppercase', marginBottom: 4 }}>Location</div>
            <div style={{ fontSize: '0.82rem', color: '#fff' }}>
              {anonymityLevel >= 2 ? (locationCity || locationRegion || 'City') : (locationRegion || 'Region')}
            </div>
          </div>
        </div>
      </div>
    </>
  )

  // ---- Accordion mode: all four sections at once ----
  if (accordion) {
    const hasError = (...keys: string[]) => keys.some(k => errors[k])
    return (
      <div style={{ maxWidth: 680 }}>
        <AccordionCard
          title="Business Basics"
          summary={businessName ? `${businessName} · ${industry || 'no industry set'}` : 'Not set yet'}
          forceOpen={hasError('industry', 'businessName', 'tagline', 'yearsOp', 'employees', 'locationCity', 'locationRegion')}
        >
          {businessBasicsBody}
        </AccordionCard>
        <AccordionCard
          title="Financials"
          summary={askingRange ? `Asking ${askingRange} · ${revenueBand || 'no revenue band set'}` : 'Not set yet'}
          forceOpen={hasError('revenueBand', 'askingRange', 'revenueExact', 'askingPriceExact')}
        >
          {financialsBody}
        </AccordionCard>
        <AccordionCard
          title="Values & Mission"
          summary={values.length ? values.join(', ') : 'Not set yet'}
          forceOpen={hasError('values', 'valuesStatement', 'transitionGoals', 'timeline')}
        >
          {valuesMissionBody}
        </AccordionCard>
        <AccordionCard title="Privacy" summary={`Level ${anonymityLevel}`}>
          {privacyBody}
        </AccordionCard>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            style={{ background: '#A05500', color: '#fff', border: 'none', borderRadius: 8, padding: '14px 36px', fontSize: '0.95rem', fontWeight: 700, cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1, fontFamily: 'inherit' }}
          >
            {isPending ? 'Saving…' : submitLabel ?? 'Save Changes ✓'}
          </button>
        </div>
      </div>
    )
  }

  // ---- Wizard mode: one step at a time ----
  if (step === 1) return (
    <div style={{ maxWidth: 680 }}>
      <StepBar />
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>Business Basics</h2>
      <p style={{ fontSize: '0.84rem', color: '#929292', marginBottom: 24 }}>Tell buyers what kind of business this is. Private details are protected by your anonymity setting.</p>
      <div className="card" style={{ marginBottom: 16 }}>{businessBasicsBody}</div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={nextStep}
          style={{ background: '#A05500', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Next: Financials →
        </button>
      </div>
    </div>
  )

  if (step === 2) return (
    <div style={{ maxWidth: 680 }}>
      <StepBar />
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>Financials</h2>
      <p style={{ fontSize: '0.84rem', color: '#929292', marginBottom: 24 }}>Exact figures are only revealed post-NDA. Pre-NDA buyers see ranges only.</p>
      <div className="card" style={{ marginBottom: 16 }}>{financialsBody}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button type="button" onClick={() => setStep(1)} style={{ background: 'transparent', color: '#929292', border: '1px solid #2e2e2e', borderRadius: 8, padding: '12px 24px', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
        <button type="button" onClick={nextStep} style={{ background: '#A05500', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Next: Values →</button>
      </div>
    </div>
  )

  if (step === 3) return (
    <div style={{ maxWidth: 680 }}>
      <StepBar />
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>Values & Mission</h2>
      <p style={{ fontSize: '0.84rem', color: '#929292', marginBottom: 24 }}>This is the heart of V+V. Buyers match with you based on shared values — take your time here.</p>
      <div className="card" style={{ marginBottom: 16 }}>{valuesMissionBody}</div>
      {/* The quiz has its own complete, self-contained navigation (including
          its own Back, which returns here) — showing this step's Back/Next
          underneath it at the same time just duplicates "Next" on screen. */}
      {valuesMethod !== 'quiz' && (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button type="button" onClick={() => setStep(2)} style={{ background: 'transparent', color: '#929292', border: '1px solid #2e2e2e', borderRadius: 8, padding: '12px 24px', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
          <button type="button" onClick={nextStep} style={{ background: '#A05500', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Next: Privacy →</button>
        </div>
      )}
    </div>
  )

  return (
    <div style={{ maxWidth: 680 }}>
      <StepBar />
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>Privacy & Publish</h2>
      <p style={{ fontSize: '0.84rem', color: '#929292', marginBottom: 24 }}>Choose how much buyers can see before signing your NDA. You can change this anytime.</p>
      <div className="card" style={{ marginBottom: 16 }}>{privacyBody}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button type="button" onClick={() => setStep(3)} style={{ background: 'transparent', color: '#929292', border: '1px solid #2e2e2e', borderRadius: 8, padding: '12px 24px', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          style={{ background: '#A05500', color: '#fff', border: 'none', borderRadius: 8, padding: '14px 36px', fontSize: '0.95rem', fontWeight: 700, cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1, fontFamily: 'inherit' }}
        >
          {isPending ? 'Saving…' : submitLabel ?? (isEdit ? 'Save Changes ✓' : 'Publish Listing →')}
        </button>
      </div>
    </div>
  )
}
