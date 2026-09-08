'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { recordSwipe } from '@/lib/actions/marketplace'
import { ScoreRing } from '@/components/ui/ScoreRing'
import {
  getDisplayBusiness, getDisplayName, getDisplayLocation,
  getDisplayRevenue, scoreBreakdown, scoreColor
} from '@/lib/utils'
import type { SafeListing } from '@/types'

export function SwipeArena({ listings: initialListings }: { listings: SafeListing[] }) {
  const [queue, setQueue] = useState<SafeListing[]>(initialListings)
  const [swiping, setSwiping] = useState(false)
  const [overlayState, setOverlayState] = useState<'like' | 'pass' | null>(null)
  const [overlayOpacity, setOverlayOpacity] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const curX = useRef(0)
  const isDragging = useRef(false)
  const router = useRouter()

  const current = queue[0]
  const next1   = queue[1]
  const next2   = queue[2]

  // Reset card when queue changes
  useEffect(() => {
    const card = cardRef.current
    if (card) {
      card.style.transform = ''
      card.style.opacity = '1'
      card.style.transition = ''
    }
    setOverlayState(null)
    setOverlayOpacity(0)
    isDragging.current = false
  }, [queue])

  const doSwipe = useCallback(async (direction: 'like' | 'pass', listing: SafeListing) => {
    if (swiping) return
    setSwiping(true)

    const card = cardRef.current
    if (card) {
      card.style.transition = 'transform 0.28s ease, opacity 0.28s ease'
      card.style.transform = direction === 'like'
        ? 'translate(140%, -20px) rotate(18deg)'
        : 'translate(-140%, -20px) rotate(-18deg)'
      card.style.opacity = '0'
    }

    // Fire and forget — don't block the UI
    recordSwipe({ targetListingId: listing.id, direction })
      .then(result => {
        if (result.matched)          toast.success('It\'s a match!')
        else if (direction === 'like') toast.success('Connection sent — check My Matches!')
        router.refresh()
      })
      .catch(() => toast.error('Something went wrong'))

    setTimeout(() => {
      setQueue(q => q.slice(1))
      setSwiping(false)
    }, 290)
  }, [swiping, router])

  // ---- Touch handlers (mobile) ----
  // We use raw touch events so we can call preventDefault() to stop page scroll
  useEffect(() => {
    const card = cardRef.current
    if (!card || !current) return

    function onTouchStart(e: TouchEvent) {
      if (swiping) return
      const t = e.touches[0]
      startX.current = t.clientX
      startY.current = t.clientY
      curX.current = 0
      isDragging.current = false
      card.style.transition = 'none'
    }

    function onTouchMove(e: TouchEvent) {
      if (swiping) return
      const t = e.touches[0]
      const dx = t.clientX - startX.current
      const dy = t.clientY - startY.current

      // Only lock as a horizontal swipe if movement is more horizontal than vertical
      if (!isDragging.current) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        if (Math.abs(dy) > Math.abs(dx) * 1.2) return // vertical scroll — let browser handle
        isDragging.current = true
      }

      // Prevent page scroll while swiping card
      e.preventDefault()
      curX.current = dx
      const rot = dx * 0.07
      card.style.transform = `translate(${dx}px, ${dy * 0.3}px) rotate(${rot}deg)`

      const progress = Math.min(Math.abs(dx) / 100, 1)
      if (dx > 10)       { setOverlayState('like'); setOverlayOpacity(progress) }
      else if (dx < -10) { setOverlayState('pass'); setOverlayOpacity(progress) }
      else               { setOverlayState(null);   setOverlayOpacity(0) }
    }

    function onTouchEnd() {
      if (swiping || !isDragging.current) return
      const x = curX.current

      if (x > 65) {
        doSwipe('like', current)
      } else if (x < -65) {
        doSwipe('pass', current)
      } else {
        card.style.transition = 'transform 0.22s ease'
        card.style.transform = ''
        setOverlayState(null)
        setOverlayOpacity(0)
      }
      isDragging.current = false
      curX.current = 0
    }

    card.addEventListener('touchstart', onTouchStart, { passive: true })
    card.addEventListener('touchmove',  onTouchMove,  { passive: false }) // passive:false to allow preventDefault
    card.addEventListener('touchend',   onTouchEnd,   { passive: true })

    return () => {
      card.removeEventListener('touchstart', onTouchStart)
      card.removeEventListener('touchmove',  onTouchMove)
      card.removeEventListener('touchend',   onTouchEnd)
    }
  }, [current, swiping, doSwipe])

  // ---- Mouse handlers (desktop) ----
  function onMouseDown(e: React.MouseEvent) {
    if (swiping) return
    startX.current = e.clientX
    startY.current = e.clientY
    curX.current = 0
    isDragging.current = true
    if (cardRef.current) cardRef.current.style.transition = 'none'
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!isDragging.current || swiping) return
    const dx = e.clientX - startX.current
    const dy = e.clientY - startY.current
    curX.current = dx
    if (cardRef.current) {
      cardRef.current.style.transform = `translate(${dx}px, ${dy * 0.35}px) rotate(${dx * 0.07}deg)`
    }
    const progress = Math.min(Math.abs(dx) / 100, 1)
    if (dx > 10)       { setOverlayState('like'); setOverlayOpacity(progress) }
    else if (dx < -10) { setOverlayState('pass'); setOverlayOpacity(progress) }
    else               { setOverlayState(null);   setOverlayOpacity(0) }
  }

  function onMouseUp() {
    if (!isDragging.current || !current) return
    isDragging.current = false
    const x = curX.current

    if (x > 65) {
      doSwipe('like', current)
    } else if (x < -65) {
      doSwipe('pass', current)
    } else {
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.22s ease'
        cardRef.current.style.transform = ''
      }
      setOverlayState(null)
      setOverlayOpacity(0)
    }
    curX.current = 0
  }

  // ---- Empty queue ----
  if (!current) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 14, opacity: 0.4 }}>◎</div>
          <h3 style={{ fontSize: '1.1rem', color: '#929292', marginBottom: 8 }}>Queue cleared</h3>
          <p style={{ fontSize: '0.84rem', color: '#6a6a6a', maxWidth: 240, lineHeight: 1.6, margin: '0 auto' }}>
            You&apos;ve reviewed all current listings. Check back soon — new sellers join every day.
          </p>
        </div>
      </div>
    )
  }

  const breakdown = scoreBreakdown(current.compatibility_score)

  return (
    <>
      {/* ---- Mobile layout: card + buttons above fold, detail below ---- */}
      <style>{`
        .swipe-layout { display: flex; align-items: flex-start; justify-content: center; gap: 32px; flex-wrap: wrap; }
        .swipe-stack-col { display: flex; flex-direction: column; align-items: center; gap: 14px; }
        .swipe-card-wrap { position: relative; width: 360px; height: 520px; flex-shrink: 0; }
        .swipe-detail-col { flex: 1; min-width: 240px; max-width: 300px; padding-top: 4px; }
        .swipe-hint { font-size: 0.72rem; color: #6a6a6a; }

        @media (max-width: 768px) {
          .swipe-layout { flex-direction: column; align-items: center; gap: 16px; padding-bottom: 24px; }
          .swipe-card-wrap { width: min(340px, calc(100vw - 32px)); height: min(480px, 62vh); }
          .swipe-detail-col { max-width: 100%; width: min(340px, calc(100vw - 32px)); }
          .swipe-hint { display: none; }
        }
      `}</style>

      <div className="swipe-layout">
        <div className="swipe-stack-col">
          <div className="swipe-card-wrap">
            {/* Ghost cards */}
            {next2 && (
              <div className="swipe-card back-2" style={{ pointerEvents: 'none' }}>
                <div style={{ height: 5, background: 'linear-gradient(90deg,#A05500,#C46A00)' }} />
              </div>
            )}
            {next1 && (
              <div className="swipe-card back-1" style={{ pointerEvents: 'none' }}>
                <div style={{ height: 5, background: 'linear-gradient(90deg,#A05500,#C46A00)' }} />
              </div>
            )}

            {/* Top card — key forces remount on queue change */}
            <div
              key={current.id}
              ref={cardRef}
              className="swipe-card top"
              style={{ cursor: swiping ? 'default' : 'grab', userSelect: 'none', touchAction: 'none' }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              <div style={{ height: 5, background: 'linear-gradient(90deg,#A05500,#C46A00)' }} />

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 12px' }}>
                <div style={{ width: 46, height: 46, borderRadius: 10, background: 'rgba(160,85,0,0.12)', border: '1px solid rgba(160,85,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', color: '#C46A00', flexShrink: 0 }}>
                  {current.industry_icon}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                  <ScoreRing score={current.compatibility_score} size={66} />
                  <AnonBadge level={current.anonymity_level} />
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '0 18px 16px' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: 3, lineHeight: 1.3 }}>
                  {getDisplayBusiness(current)}
                </h2>
                <p style={{ fontSize: '0.76rem', color: '#929292', marginBottom: 12 }}>
                  {getDisplayName(current)} · {getDisplayLocation(current)}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7, marginBottom: 12 }}>
                  {[['Years', current.years_operating], ['Revenue', getDisplayRevenue(current)], ['Team', current.employees_range]].map(([l, v]) => (
                    <div key={l as string} style={{ background: '#141414', border: '1px solid #2e2e2e', borderRadius: 6, padding: '7px 5px', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.95rem', color: '#fff', lineHeight: 1 }}>{v}</div>
                      <div style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6a6a6a', marginTop: 3 }}>{l}</div>
                    </div>
                  ))}
                </div>

                <blockquote style={{ fontSize: '0.8rem', color: '#D9D9D9', fontStyle: 'italic', lineHeight: 1.5, borderLeft: '2px solid #A05500', padding: '7px 12px', background: '#141414', borderRadius: '0 5px 5px 0', marginBottom: 10 }}>
                  &ldquo;{current.tagline}&rdquo;
                </blockquote>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {current.values.slice(0, 3).map(v => (
                    <span key={v} className="badge-orange" style={{ fontSize: '0.65rem' }}>{v}</span>
                  ))}
                </div>
              </div>

              <div style={{ padding: '10px 18px', borderTop: '1px solid #2e2e2e', background: '#141414', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: '#929292' }}>{current.industry}</span>
                <span style={{ fontSize: '0.75rem', color: '#C46A00', fontWeight: 600 }}>Ask: {current.asking_range}</span>
              </div>
              {(current.seller_financing || (current as any).management_training) && (
                <div style={{ padding: '6px 18px 8px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {current.seller_financing && (
                    <span style={{ fontSize: '0.68rem', background: 'rgba(76,175,125,0.1)', color: '#4caf7d', border: '1px solid rgba(76,175,125,0.25)', padding: '2px 8px', borderRadius: 99 }}>
                      ✓ Seller Financing
                    </span>
                  )}
                  {(current as any).management_training && (
                    <span style={{ fontSize: '0.68rem', background: 'rgba(160,85,0,0.1)', color: '#C46A00', border: '1px solid rgba(160,85,0,0.3)', padding: '2px 8px', borderRadius: 99 }}>
                      ✓ Management Training Path
                    </span>
                  )}
                </div>
              )}

              {/* Overlays */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.8rem', letterSpacing: '0.1em', borderRadius: 20, pointerEvents: 'none', background: 'rgba(76,175,125,0.22)', color: '#4caf7d', opacity: overlayState === 'like' ? overlayOpacity : 0, transition: 'opacity 0.08s' }}>CONNECT</div>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.8rem', letterSpacing: '0.1em', borderRadius: 20, pointerEvents: 'none', background: 'rgba(212,95,95,0.18)', color: '#d45f5f', opacity: overlayState === 'pass' ? overlayOpacity : 0, transition: 'opacity 0.08s' }}>PASS</div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <button onClick={() => !swiping && doSwipe('pass', current)} disabled={swiping} aria-label="Pass"
              style={{ width: 54, height: 54, borderRadius: '50%', background: '#242424', border: '2px solid rgba(212,95,95,0.35)', color: '#d45f5f', fontSize: '1.3rem', cursor: swiping ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', opacity: swiping ? 0.5 : 1 }}>
              ✕
            </button>
            <button onClick={() => !swiping && doSwipe('like', current)} disabled={swiping} aria-label="Connect"
              style={{ width: 66, height: 66, borderRadius: '50%', background: '#A05500', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: swiping ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(160,85,0,0.4)', opacity: swiping ? 0.5 : 1 }}>
              ♡
            </button>
          </div>

          <p className="swipe-hint">Drag left to pass · drag right to connect</p>
        </div>

        {/* Detail panel */}
        <div className="swipe-detail-col">
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
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
    </>
  )
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C46A00', whiteSpace: 'nowrap' }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: '#2e2e2e' }} />
      </div>
      {children}
    </div>
  )
}

function AnonBadge({ level }: { level: number }) {
  const cfg = [null,
    { cls: 'anon-1', label: '● Anonymous' },
    { cls: 'anon-2', label: '○ Partial ID' },
    { cls: 'anon-3', label: '✓ Full Reveal' },
  ][level]
  if (!cfg) return null
  return <span className={cfg.cls}>{cfg.label}</span>
}
