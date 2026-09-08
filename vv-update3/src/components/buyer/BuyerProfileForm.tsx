'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { upsertBuyerProfile } from '@/lib/actions/marketplace'

const INDUSTRIES = [
  'Manufacturing', 'Healthcare', 'Food & Beverage', 'Education Technology',
  'Environmental Services', 'Events & Hospitality', 'Landscaping & Property Services',
  'Media & Publishing', 'Veterinary / Animal Health', 'Security & Risk',
  'Professional Services', 'Senior Care', 'Technology', 'Retail',
  'Construction', 'Transportation & Logistics', 'Finance & Insurance', 'Other',
]

const FUNDING_OPTIONS = [
  { value: 'cash',             label: 'Cash',             desc: 'Self-funded acquisition' },
  { value: 'sba_loan',         label: 'SBA Loan',         desc: 'Government-backed financing' },
  { value: 'private_equity',   label: 'Private Equity',   desc: 'PE fund or investor group' },
  { value: 'seller_financing', label: 'Seller Financing', desc: 'Seller carries part of the note' },
  { value: 'combination',      label: 'Combination',      desc: 'Mix of the above' },
]

const ALL_VALUES = [
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

interface BuyerProfileFormProps {
  existing?: any
  fullName?: string
}

export function BuyerProfileForm({ existing, fullName }: BuyerProfileFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [background, setBackground]     = useState(existing?.background ?? '')
  const [lookingFor, setLookingFor]     = useState(existing?.looking_for ?? '')
  const [priceMin, setPriceMin]         = useState(existing?.price_min?.toString() ?? '')
  const [priceMax, setPriceMax]         = useState(existing?.price_max?.toString() ?? '')
  const [industries, setIndustries]     = useState<string[]>(existing?.target_industries ?? [])
  const [location, setLocation]         = useState(existing?.location_preference ?? '')
  const [funding, setFunding]           = useState(existing?.funding_source ?? '')
  const [experience, setExperience]     = useState(existing?.experience_years ?? '')
  const [values, setValues]             = useState<string[]>(existing?.values ?? [])
  const [valuesStatement, setValuesStatement] = useState(existing?.values_statement ?? '')
  const [errors, setErrors]             = useState<Record<string, string>>({})

  function toggleIndustry(ind: string) {
    setIndustries(prev => prev.includes(ind) ? prev.filter(x => x !== ind) : [...prev, ind])
  }

  function toggleValue(v: string) {
    setValues(prev =>
      prev.includes(v)
        ? prev.filter(x => x !== v)
        : prev.length >= 5
          ? (toast.error('Choose up to 5 values'), prev)
          : [...prev, v]
    )
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!background.trim() || background.length < 20) errs.background = 'Please write at least 20 characters about your background'
    if (!lookingFor.trim()) errs.lookingFor = 'Please describe what you\'re looking for'
    if (!priceMin || isNaN(Number(priceMin.replace(/[,$]/g, '')))) errs.priceMin = 'Enter a valid minimum price'
    if (!priceMax || isNaN(Number(priceMax.replace(/[,$]/g, '')))) errs.priceMax = 'Enter a valid maximum price'
    if (Number(priceMax.replace(/[,$]/g, '')) <= Number(priceMin.replace(/[,$]/g, ''))) errs.priceMax = 'Maximum must be greater than minimum'
    if (industries.length === 0) errs.industries = 'Select at least one target industry'
    if (!location.trim()) errs.location = 'Location preference is required'
    if (!funding) errs.funding = 'Select a funding source'
    if (!experience.trim()) errs.experience = 'Experience is required'
    if (values.length === 0) errs.values = 'Select at least one value'
    if (valuesStatement.length < 30) errs.valuesStatement = 'Please write at least 30 characters'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit() {
    if (!validate()) {
      toast.error('Please fix the errors above')
      return
    }
    startTransition(async () => {
      const result = await upsertBuyerProfile({
        background,
        lookingFor,
        priceMin: Number(priceMin.replace(/[,$]/g, '')),
        priceMax: Number(priceMax.replace(/[,$]/g, '')),
        targetIndustries: industries,
        locationPreference: location,
        fundingSource: funding as any,
        experienceYears: experience,
        values,
        valuesStatement,
      })
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(existing ? 'Profile updated!' : 'Buyer profile created!')
        router.push('/buyer/discover')
        router.refresh()
      }
    })
  }

  const Err = ({ field }: { field: string }) =>
    errors[field] ? <p style={{ fontSize: '0.72rem', color: '#d45f5f', marginTop: 4 }}>{errors[field]}</p> : null

  const fieldLabel = (text: string) => (
    <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#929292', marginBottom: 6 }}>{text}</div>
  )

  const textInput = (value: string, onChange: (v: string) => void, placeholder: string, type = 'text') => (
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', background: '#141414', border: '1px solid #2e2e2e', borderRadius: 6, padding: '10px 14px', fontSize: '0.88rem', color: '#fff', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
      onFocus={e => e.target.style.borderColor = '#A05500'}
      onBlur={e => e.target.style.borderColor = '#2e2e2e'}
    />
  )

  const textArea = (value: string, onChange: (v: string) => void, placeholder: string, rows = 3) => (
    <textarea
      value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ width: '100%', background: '#141414', border: '1px solid #2e2e2e', borderRadius: 6, padding: '10px 14px', fontSize: '0.88rem', color: '#fff', outline: 'none', resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit', boxSizing: 'border-box' }}
      onFocus={e => e.target.style.borderColor = '#A05500'}
      onBlur={e => e.target.style.borderColor = '#2e2e2e'}
    />
  )

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>
          {existing ? 'Edit Your Buyer Profile' : `Set up your buyer profile, ${fullName?.split(' ')[0] ?? 'there'}`}
        </h2>
        <p style={{ fontSize: '0.84rem', color: '#929292', lineHeight: 1.6 }}>
          This is what sellers see when you appear in their match queue. Be specific — it directly affects your compatibility scores.
        </p>
      </div>

      {/* Background */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#929292', marginBottom: 14 }}>About You</div>

        <div style={{ marginBottom: 16 }}>
          {fieldLabel('Your Background *')}
          {textArea(background, setBackground, 'Describe your professional background — what you\'ve built, led, or operated. Be specific about relevant experience.', 3)}
          <Err field="background" />
        </div>

        <div>
          {fieldLabel('What You\'re Looking For *')}
          {textArea(lookingFor, setLookingFor, 'What kind of business are you trying to find? What matters most to you in an acquisition?', 3)}
          <Err field="lookingFor" />
        </div>
      </div>

      {/* Acquisition criteria */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#929292', marginBottom: 14 }}>Acquisition Criteria</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            {fieldLabel('Minimum Budget *')}
            {textInput(priceMin, setPriceMin, 'e.g. 500000')}
            <div style={{ fontSize: '0.68rem', color: '#6a6a6a', marginTop: 4 }}>Enter in dollars, no commas needed</div>
            <Err field="priceMin" />
          </div>
          <div>
            {fieldLabel('Maximum Budget *')}
            {textInput(priceMax, setPriceMax, 'e.g. 3000000')}
            <Err field="priceMax" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            {fieldLabel('Location Preference *')}
            <select
              value={location} onChange={e => setLocation(e.target.value)}
              style={{ width: '100%', background: '#141414', border: '1px solid #2e2e2e', borderRadius: 6, padding: '10px 14px', fontSize: '0.88rem', color: location ? '#fff' : '#6a6a6a', outline: 'none', fontFamily: 'inherit', appearance: 'none' }}
            >
              <option value="">Select preference</option>
              {['Northeast','Mid-Atlantic','Southeast','South','Midwest','Southwest','West Coast','Pacific Northwest','National (open to any)','Remote-operable preferred'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <Err field="location" />
          </div>
          <div>
            {fieldLabel('Years of Experience *')}
            <select
              value={experience} onChange={e => setExperience(e.target.value)}
              style={{ width: '100%', background: '#141414', border: '1px solid #2e2e2e', borderRadius: 6, padding: '10px 14px', fontSize: '0.88rem', color: experience ? '#fff' : '#6a6a6a', outline: 'none', fontFamily: 'inherit', appearance: 'none' }}
            >
              <option value="">Select range</option>
              {['1–3 years','3–5 years','5–10 years','10–15 years','15–20 years','20+ years'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <Err field="experience" />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          {fieldLabel('Funding Source *')}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {FUNDING_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFunding(opt.value)}
                style={{
                  padding: '10px 8px', borderRadius: 8, cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit',
                  border: `1px solid ${funding === opt.value ? '#A05500' : '#2e2e2e'}`,
                  background: funding === opt.value ? 'rgba(160,85,0,0.1)' : '#141414',
                  color: funding === opt.value ? '#C46A00' : '#929292',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: 3 }}>{opt.label}</div>
                <div style={{ fontSize: '0.65rem', lineHeight: 1.3 }}>{opt.desc}</div>
              </button>
            ))}
          </div>
          <Err field="funding" />
        </div>

        <div>
          {fieldLabel(`Target Industries * — ${industries.length} selected`)}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7, marginTop: 8 }}>
            {INDUSTRIES.map(ind => (
              <button
                key={ind}
                type="button"
                onClick={() => toggleIndustry(ind)}
                style={{
                  padding: '8px', borderRadius: 6, fontSize: '0.72rem', cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit',
                  border: `1px solid ${industries.includes(ind) ? '#A05500' : '#2e2e2e'}`,
                  background: industries.includes(ind) ? 'rgba(160,85,0,0.1)' : '#141414',
                  color: industries.includes(ind) ? '#C46A00' : '#929292',
                }}
              >
                {ind}
              </button>
            ))}
          </div>
          <Err field="industries" />
        </div>
      </div>

      {/* Values */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#929292', marginBottom: 14 }}>Your Values</div>

        <div style={{ marginBottom: 16 }}>
          {fieldLabel(`Core Values * — ${values.length}/5 selected`)}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7, marginTop: 8 }}>
            {ALL_VALUES.map(v => (
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
        </div>

        <div>
          {fieldLabel('Values Statement *')}
          {textArea(valuesStatement, setValuesStatement, "What drives you as a buyer? What does it mean to you to own a business? What kind of legacy do you want to build?", 4)}
          <div style={{ fontSize: '0.68rem', color: '#6a6a6a', marginTop: 4 }}>{valuesStatement.length} characters · minimum 30</div>
          <Err field="valuesStatement" />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          style={{ background: '#A05500', color: '#fff', border: 'none', borderRadius: 8, padding: '14px 36px', fontSize: '0.95rem', fontWeight: 700, cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1, fontFamily: 'inherit' }}
        >
          {isPending ? 'Saving…' : existing ? 'Save Changes ✓' : 'Save Profile & Start Discovering →'}
        </button>
      </div>
    </div>
  )
}
