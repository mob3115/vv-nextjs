'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { recordSwipe } from '@/lib/actions/marketplace'
import { ScoreRing } from '@/components/ui/ScoreRing'
import {
  getDisplayBusiness, getDisplayName, getDisplayLocation,
  getDisplayRevenue, scoreBreakdown, scoreColor, cn
} from '@/lib/utils'
import type { SafeListing } from '@/types'

interface SwipeArenaProps {
  listings: SafeListing[]
}

export function SwipeArena({ listings: initialListings }: SwipeArenaProps) {
  const [queue, setQueue] = useState<SafeListing[]>(initialListings)
  const [swiping, setSwiping] = useState(false)
  const [overlayState, setOverlayState] = useState<'like' | 'pass' | null>(null)
  const [overlayOpacity, setOverlayOpacity] = useState(0)

  // cardRef is reset each render via the key prop on the top card div
  const cardRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const curX = useRef(0)
  const router = useRouter()

  const current = queue[0]
  const next1   = queue[1]
  const next2   = queue[2]

  // Reset card styles whenever the queue changes (new top card)
  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.style.transform = ''
      cardRef.current.style.opacity = '1'
      cardRef.current.style.transition = ''
    }
  }, [queue])

  const doSwipe = useCallback(async (direction: 'like' | 'pass', listing: SafeListing) => {
    if (swiping) return
    setSwiping(true)

    // Animate card out
    const card = cardRef.current
    if (card) {
      card.style.transition = 'transform 0.3s ease, opacity 0.3s ease'
      card.style.transform = direction === 'like'
        ? 'translate(150%, -20px) rotate(20deg)'
        : 'translate(-150%, -20px) rotate(-20deg)'
      card.style.opacity = '0'
    }

    // Record swipe server-side (fire and forget — don't block the UI)
    recordSwipe({ targetListingId: listing.id, direction })
      .then(result => {
        if (result.matched) {
          toast.success('It\'s a match! Both parties connected.', { duration: 4000 })
        } else if (direction === 'like') {
          toast.success('Connection sent — check My Matches!')
        }
        // Refresh server data so matches page stays in sync
        router.refresh()
      })
      .catch(() => toast.error('Something went wrong, please try again'))

    // Remove card from local queue after animation completes
    setTimeout(() => {
      setQueue(q => q.slice(1))
      setOverlayState(null)
      setOverlayOpacity(0)
      setSwiping(false)
    }, 300)
  }, [swiping, router])

  // ---- Pointer event handlers ----
  function onPointerDown(e: React.PointerEvent) {
    if (swiping) return
    startX.current = e.clientX
    curX.current = 0
    cardRef.current?.setPointerCapture(e.pointerId)
    if (cardRef.current) cardRef.current.style.transition = 'none'
  }

  function onPointerMove(e: React.PointerEvent) {
    if (swiping || e.buttons === 0) return
    const x = e.clientX - startX.current
    const y = e.clientY - 0 // we only care about x for rotation
    curX.current = x

    if (cardRef.current) {
      cardRef.current.style.transform =
        `translate(${x}px, ${(e.clientY - e.currentTarget.getBoundingClientRect().top - 280) * 0.05}px) rotate(${x * 0.07}deg)`
    }

    const progress = Math.min(Math.abs(x) / 100, 1)
    if (x > 15)        { setOverlayState('like'); setOverlayOpacity(progress) }
    else if (x < -15)  { setOverlayState('pass'); setOverlayOpacity(progress) }
    else               { setOverlayState(null);   setOverlayOpacity(0) }
  }

  function onPointerUp() {
    if (swiping || !current) return
    const x = curX.current

    if (x > 70) {
      doSwipe('like', current)
    } else if (x < -70) {
      doSwipe('pass', current)
    } else {
      // Not far enough — snap back
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.25s ease'
        cardRef.current.style.transform = ''
      }
      setOverlayState(null)
      setOverlayOpacity(0)
    }
    curX.current = 0
  }

  // ---- Empty queue state ----
  if (!current) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 500 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.4 }}>◎</div>
          <h3 style={{ fontSize: '1.1rem', color: '#929292', marginBottom: 8 }}>Queue cleared</h3>
          <p style={{ fontSize: '0.84rem', color: '#6a6a6a', maxWidth: 240, lineHeight: 1.6 }}>
            You&apos;ve reviewed all current listings. Check back soon — new sellers join every day.
          </p>
        </div>
      </div>
    )
  }

  const breakdown = scoreBreakdown(current.compatibility_score)

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 40, flexWrap: 'wrap', paddingBottom: 32 }}>

      {/* ---- Card stack ---- */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative', width: 360, height: 560 }}>

          {/* Back ghost cards — depth effect */}
          {next2 && (
            <div className="swipe-card back-2" style={{ pointerEvents: 'none' }}>
              <div style={{ height: 6, background: 'linear-gradient(90deg, #A05500, #C46A00)' }} />
            </div>
          )}
          {next1 && (
            <div className="swipe-card back-1" style={{ pointerEvents: 'none' }}>
              <div style={{ height: 6, background: 'linear-gradient(90deg, #A05500, #C46A00)' }} />
            </div>
          )}

          {/* Top interactive card — key forces remount when card changes */}
          <div
            key={current.id}
            ref={cardRef}
            className="swipe-card top"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {/* Accent bar */}
            <div style={{ height: 6, background: 'linear-gradient(90deg, #A05500, #C46A00)' }} />

            {/* Card header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 12px' }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(160,85,0,0.12)', border: '1px solid rgba(160,85,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: '#C46A00' }}>
                {current.industry_icon}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <ScoreRing score={current.compatibility_score} size={72} />
                <AnonBadge level={current.anonymity_level} />
              </div>
            </div>

            {/* Card body */}
            <div style={{ padding: '0 20px 18px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 4, lineHeight: 1.3 }}>
                {getDisplayBusiness(current)}
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#929292', marginBottom: 14 }}>
                {getDisplayName(current)} · {getDisplayLocation(current)}
              </p>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                {[
                  ['Years', current.years_operating],
                  ['Revenue', getDisplayRevenue(current)],
                  ['Team', current.employees_range],
                ].map(([label, val]) => (
                  <div key={label as string} style={{ background: '#141414', border: '1px solid #2e2e2e', borderRadius: 6, padding: '8px 6px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color: '#fff', lineHeight: 1 }}>{val}</div>
                    <div style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6a6a6a', marginTop: 3 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Tagline */}
              <blockquote style={{ fontSize: '0.82rem', color: '#D9D9D9', fontStyle: 'italic', lineHeight: 1.55, borderLeft: '2px solid #A05500', paddingLeft: 12, background: '#141414', padding: '8px 12px', borderRadius: '0 6px 6px 0', marginBottom: 12 }}>
                &ldquo;{current.tagline}&rdquo;
              </blockquote>

              {/* Values pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {current.values.map(v => (
                  <span key={v} className="badge-orange" style={{ fontSize: '0.68rem' }}>{v}</span>
                ))}
              </div>
            </div>

            {/* Card footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #2e2e2e', background: '#141414', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.78rem', color: '#929292' }}>{current.industry}</span>
              <span style={{ fontSize: '0.78rem', color: '#C46A00', fontWeight: 600 }}>Ask: {current.asking_range}</span>
            </div>

            {/* CONNECT overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', letterSpacing: '0.1em',
              borderRadius: 20, pointerEvents: 'none',
              background: 'rgba(76,175,125,0.22)', color: '#4caf7d',
              opacity: overlayState === 'like' ? overlayOpacity : 0,
              transition: 'opacity 0.1s',
            }}>
              CONNECT
            </div>

            {/* PASS overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', letterSpacing: '0.1em',
              borderRadius: 20, pointerEvents: 'none',
              background: 'rgba(212,95,95,0.18)', color: '#d45f5f',
              opacity: overlayState === 'pass' ? overlayOpacity : 0,
              transition: 'opacity 0.1s',
            }}>
              PASS
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button
            onClick={() => doSwipe('pass', current)}
            disabled={swiping}
            style={{ width: 56, height: 56, borderRadius: '50%', background: '#242424', border: '2px solid rgba(212,95,95,0.35)', color: '#d45f5f', fontSize: '1.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', transition: 'transform 0.15s', opacity: swiping ? 0.5 : 1 }}
            aria-label="Pass"
          >✕</button>
          <button
            onClick={() => doSwipe('like', current)}
            disabled={swiping}
            style={{ width: 68, height: 68, borderRadius: '50%', background: '#A05500', border: 'none', color: '#fff', fontSize: '1.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(160,85,0,0.4)', transition: 'transform 0.15s', opacity: swiping ? 0.5 : 1 }}
            aria-label="Connect"
          >♡</button>
        </div>

        <p style={{ fontSize: '0.72rem', color: '#6a6a6a' }}>Drag left to pass · drag right to connect</p>
      </div>

      {/* ---- Detail panel ---- */}
      <div style={{ flex: 1, minWidth: 260, maxWidth: 320, paddingTop: 4 }}>
        <DetailSection title="Values Statement">
          <p style={{ fontSize: '0.84rem', color: '#D9D9D9', lineHeight: 1.65 }}>&ldquo;{current.values_statement}&rdquo;</p>
        </DetailSection>

        <DetailSection title="Seller's Goals">
          <p style={{ fontSize: '0.84rem', color: '#D9D9D9', lineHeight: 1.65 }}>{current.transition_goals}</p>
        </DetailSection>

        <DetailSection title="Deal Info">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="card-sm" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6a6a6a' }}>Timeline</div>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#fff', marginTop: 4 }}>{current.transition_timeline}</div>
            </div>
            <div className="card-sm" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6a6a6a' }}>Financing</div>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, marginTop: 4, color: current.seller_financing ? '#4caf7d' : '#929292' }}>
                {current.seller_financing ? '✓ Available' : 'Not offered'}
              </div>
            </div>
          </div>
        </DetailSection>

        <DetailSection title="Score Breakdown">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {breakdown.map(({ label, value }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.72rem', color: '#6a6a6a' }}>{label}</span>
                  <span style={{ fontSize: '0.72rem', color: scoreColor(value) }}>{value}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${value}%`, background: scoreColor(value) }} />
                </div>
              </div>
            ))}
          </div>
        </DetailSection>
      </div>
    </div>
  )
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C46A00', whiteSpace: 'nowrap' }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: '#2e2e2e' }} />
      </div>
      {children}
    </div>
  )
}

function AnonBadge({ level }: { level: number }) {
  const configs = [
    null,
    { cls: 'anon-1', icon: '●', label: 'Anonymous' },
    { cls: 'anon-2', icon: '○', label: 'Partial ID' },
    { cls: 'anon-3', icon: '✓', label: 'Full Reveal' },
  ]
  const cfg = configs[level]
  if (!cfg) return null
  return <span className={cfg.cls}>{cfg.icon} {cfg.label}</span>
}
