'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { signNda } from '@/lib/actions/marketplace'
import { renderNdaSections, NDA_DISCLAIMER } from '@/lib/nda-template'

interface NdaSignFormProps {
  matchId: string
  isBuyer: boolean
  buyerName: string
  sellerName: string
  industry: string
  locationRegion: string
  chatHref: string
  nda: {
    status: string
    buyer_signed_at: string | null
    seller_signed_at: string | null
    buyer_signature: string | null
    seller_signature: string | null
    buyer_initials: string | null
    seller_initials: string | null
  } | null
}

export function NdaSignForm({
  matchId, isBuyer, buyerName, sellerName, industry, locationRegion, chatHref, nda,
}: NdaSignFormProps) {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [reachedEnd, setReachedEnd] = useState(false)
  const [agree, setAgree] = useState(false)
  const [initials, setInitials] = useState('')
  const [signature, setSignature] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [localNda, setLocalNda] = useState(nda)

  const sections = useMemo(() => renderNdaSections({
    buyerName, sellerName, industry, locationRegion,
    effectiveDate: format(new Date(), 'MMMM d, yyyy'),
  }), [buyerName, sellerName, industry, locationRegion])

  const mySigned = isBuyer ? !!localNda?.buyer_signed_at : !!localNda?.seller_signed_at
  const myAt = isBuyer ? localNda?.buyer_signed_at : localNda?.seller_signed_at
  const otherSigned = isBuyer ? !!localNda?.seller_signed_at : !!localNda?.buyer_signed_at
  const otherName = isBuyer ? sellerName : buyerName

  function onScroll() {
    const el = scrollRef.current
    if (!el || reachedEnd) return
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 24) setReachedEnd(true)
  }

  // If the agreement is short enough to fit without scrolling (a tall
  // viewport, browser zoom, etc.), there's nothing to scroll past — don't
  // permanently block signing on an event that will never fire.
  useEffect(() => {
    const el = scrollRef.current
    if (el && el.scrollHeight <= el.clientHeight + 24) setReachedEnd(true)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting || !agree || !reachedEnd) return
    if (signature.trim().length < 2) { toast.error('Please type your full legal name'); return }
    if (initials.trim().length < 1) { toast.error('Please add your initials'); return }

    setSubmitting(true)
    const result = await signNda({ matchId, signature: signature.trim(), initials: initials.trim() })
    setSubmitting(false)

    if (result.error) { toast.error(result.error); return }

    toast.success('NDA signed')
    setLocalNda(prev => ({
      status: prev?.status ?? 'pending',
      buyer_signed_at: isBuyer ? new Date().toISOString() : (prev?.buyer_signed_at ?? null),
      seller_signed_at: !isBuyer ? new Date().toISOString() : (prev?.seller_signed_at ?? null),
      buyer_signature: isBuyer ? signature.trim() : (prev?.buyer_signature ?? null),
      seller_signature: !isBuyer ? signature.trim() : (prev?.seller_signature ?? null),
      buyer_initials: isBuyer ? initials.trim() : (prev?.buyer_initials ?? null),
      seller_initials: !isBuyer ? initials.trim() : (prev?.seller_initials ?? null),
    }))
    router.refresh()
  }

  if (mySigned) {
    return (
      <div className="card" style={{ maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span className="badge-green" style={{ fontSize: '0.78rem' }}>✓ You signed</span>
          {otherSigned
            ? <span className="badge-green" style={{ fontSize: '0.78rem' }}>✓ {otherName} signed</span>
            : <span className="badge-warning" style={{ fontSize: '0.78rem' }}>Waiting on {otherName}</span>
          }
        </div>
        <p style={{ fontSize: '0.84rem', color: '#929292', lineHeight: 1.6, marginBottom: 4 }}>
          You signed this Mutual NDA{myAt ? ` on ${format(new Date(myAt), 'MMMM d, yyyy \'at\' h:mm a')}` : ''}.
        </p>
        {!otherSigned && (
          <p style={{ fontSize: '0.8rem', color: '#6a6a6a', lineHeight: 1.6, marginBottom: 16 }}>
            {otherName} hasn&apos;t signed yet. You can still message each other in the meantime —
            just hold off on sharing anything confidential until both signatures are in place.
          </p>
        )}
        <a href={chatHref} className="btn-primary btn-sm">Go to Messages →</a>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="card" style={{ marginBottom: 16, borderColor: 'rgba(232,168,56,0.35)', background: 'rgba(232,168,56,0.06)' }}>
        <p style={{ fontSize: '0.78rem', color: '#e8a838', lineHeight: 1.6 }}>
          ⚠ {NDA_DISCLAIMER}
        </p>
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="card"
        style={{ maxHeight: 420, overflowY: 'auto', marginBottom: 14 }}
      >
        <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem', color: '#fff', letterSpacing: '0.03em', marginBottom: 4 }}>
          Mutual Non-Disclosure Agreement
        </h2>
        <p style={{ fontSize: '0.72rem', color: '#6a6a6a', marginBottom: 18 }}>
          Between {buyerName} (Buyer) and {sellerName} (Seller)
        </p>
        {sections.map(section => (
          <div key={section.id} style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#C46A00', marginBottom: 6 }}>
              {section.heading}
            </h3>
            {section.body.map((p, i) => (
              <p key={i} style={{ fontSize: '0.8rem', color: '#D9D9D9', lineHeight: 1.7, marginBottom: 8 }}>
                {p}
              </p>
            ))}
          </div>
        ))}
        <p style={{ fontSize: '0.72rem', color: '#6a6a6a', textAlign: 'center', paddingTop: 8 }}>
          — End of Agreement —
        </p>
      </div>

      {!reachedEnd && (
        <p style={{ fontSize: '0.75rem', color: '#e8a838', marginBottom: 12 }}>
          ↓ Scroll to the end of the agreement to continue
        </p>
      )}

      <form onSubmit={handleSubmit} className="card">
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16, cursor: reachedEnd ? 'pointer' : 'not-allowed', opacity: reachedEnd ? 1 : 0.5 }}>
          <input
            type="checkbox"
            checked={agree}
            disabled={!reachedEnd}
            onChange={e => setAgree(e.target.checked)}
            style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0 }}
          />
          <span style={{ fontSize: '0.82rem', color: '#D9D9D9', lineHeight: 1.5 }}>
            I have read and agree to the terms of this Mutual Non-Disclosure Agreement, and I intend
            my initials and typed name below to serve as my electronic signature.
          </span>
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6a6a6a', display: 'block', marginBottom: 6 }}>
              Initials
            </label>
            <input
              type="text"
              value={initials}
              maxLength={8}
              onChange={e => setInitials(e.target.value)}
              disabled={!agree}
              placeholder="e.g. JS"
              style={{ width: '100%', background: '#141414', border: '1px solid #2e2e2e', borderRadius: 6, padding: '10px 14px', fontSize: '0.88rem', color: '#fff', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6a6a6a', display: 'block', marginBottom: 6 }}>
              Full legal name
            </label>
            <input
              type="text"
              value={signature}
              maxLength={200}
              onChange={e => setSignature(e.target.value)}
              disabled={!agree}
              placeholder="Type your full legal name to sign"
              style={{ width: '100%', background: '#141414', border: '1px solid #2e2e2e', borderRadius: 6, padding: '10px 14px', fontSize: '0.88rem', color: '#fff', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!agree || !reachedEnd || submitting || signature.trim().length < 2 || initials.trim().length < 1}
          className="btn-primary btn-block"
        >
          {submitting ? 'Signing…' : 'Sign Agreement'}
        </button>
      </form>
    </div>
  )
}
