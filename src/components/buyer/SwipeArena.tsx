'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { recordSwipe } from '@/lib/actions/marketplace'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { getDisplayBusiness, getDisplayName, getDisplayLocation, getDisplayRevenue, scoreBreakdown, scoreColor, cn } from '@/lib/utils'
import type { SafeListing } from '@/types'

interface SwipeArenaProps {
  listings: SafeListing[]
}

export function SwipeArena({ listings: initialListings }: SwipeArenaProps) {
  const [queue, setQueue] = useState(initialListings)
  const [swiping, setSwiping] = useState(false)
  const [overlayState, setOverlayState] = useState<'like' | 'pass' | null>(null)
  const [overlayOpacity, setOverlayOpacity] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const curX = useRef(0)
  const router = useRouter()

  const current = queue[0]
  const next1 = queue[1]
  const next2 = queue[2]

  const animateOut = useCallback((direction: 'like' | 'pass') => {
    const card = cardRef.current
    if (!card) return
    card.style.transition = 'transform 0.3s ease, opacity 0.3s ease'
    card.style.transform = direction === 'like'
      ? 'translate(150%, -20px) rotate(20deg)'
      : 'translate(-150%, -20px) rotate(-20deg)'
    card.style.opacity = '0'
  }, [])

  const doSwipe = useCallback(async (direction: 'like' | 'pass', listingId: string) => {
    if (swiping) return
    setSwiping(true)

    animateOut(direction)

    // Record swipe in background
    const result = await recordSwipe({
      targetListingId: listingId,
      direction,
    })

    if (result.matched) {
      toast.success('🎉 It\'s a match! Both parties connected.', { duration: 4000 })
    } else if (direction === 'like') {
      toast.success('Connection sent!')
    }

    // Remove from queue after animation
    setTimeout(() => {
      setQueue(q => q.slice(1))
      setOverlayState(null)
      setOverlayOpacity(0)
      setSwiping(false)
      router.refresh()
    }, 320)
  }, [swiping, animateOut, router])

  // Drag handlers
  function onPointerDown(e: React.PointerEvent) {
    if (swiping) return
    startX.current = e.clientX
    startY.current = e.clientY
    cardRef.current?.setPointerCapture(e.pointerId)
    if (cardRef.current) cardRef.current.style.transition = 'none'
  }

  function onPointerMove(e: React.PointerEvent) {
    if (swiping || e.buttons === 0) return
    const x = e.clientX - startX.current
    const y = e.clientY - startY.current
    curX.current = x
    const rot = x * 0.08

    if (cardRef.current) {
      cardRef.current.style.transform = `translate(${x}px, ${y * 0.4}px) rotate(${rot}deg)`
    }

    const progress = Math.min(Math.abs(x) / 120, 1)
    if (x > 20)       { setOverlayState('like');  setOverlayOpacity(progress) }
    else if (x < -20) { setOverlayState('pass');  setOverlayOpacity(progress) }
    else               { setOverlayState(null);   setOverlayOpacity(0) }
  }

  function onPointerUp() {
    if (swiping || !current) return
    const x = curX.current
    if (x > 80)       doSwipe('like', current.id)
    else if (x < -80) doSwipe('pass', current.id)
    else {
      // Snap back
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.3s ease'
        cardRef.current.style.transform = ''
      }
      setOverlayState(null)
      setOverlayOpacity(0)
    }
    curX.current = 0
  }

  if (!current) return (
    <div className="flex items-center justify-center" style={{ minHeight: 500 }}>
      <div className="text-center">
        <div className="text-5xl mb-4 opacity-40">🎯</div>
        <h3 className="text-grey-dark text-lg mb-2">Queue cleared</h3>
        <p className="text-grey-mid text-sm max-w-[240px]">
          You&apos;ve reviewed all current listings. Check back soon — new sellers join every day.
        </p>
      </div>
    </div>
  )

  const breakdown = scoreBreakdown(current.compatibility_score)

  return (
    <div className="flex items-start justify-center gap-10 flex-wrap">

      {/* Card stack */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative" style={{ width: 360, height: 560 }}>

          {/* Ghost cards */}
          {next2 && (
            <div className="swipe-card back-2 pointer-events-none">
              <div className="h-1.5 bg-gradient-to-r from-orange to-orange-light" />
            </div>
          )}
          {next1 && (
            <div className="swipe-card back-1 pointer-events-none">
              <div className="h-1.5 bg-gradient-to-r from-orange to-orange-light" />
            </div>
          )}

          {/* Top card */}
          <div
            ref={cardRef}
            className="swipe-card top"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {/* Color bar */}
            <div className="h-1.5 bg-gradient-to-r from-orange to-orange-light" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4">
              <div className="w-12 h-12 rounded-md bg-orange/10 border border-orange/20 flex items-center justify-center text-2xl">
                {current.industry_icon}
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <ScoreRing score={current.compatibility_score} size={72} />
                <AnonBadge level={current.anonymity_level} />
              </div>
            </div>

            {/* Body */}
            <div className="px-5 pb-4">
              <h2 className="text-lg font-bold text-white mb-1 leading-snug">
                {getDisplayBusiness(current)}
              </h2>
              <p className="text-xs text-grey-dark mb-3">
                {getDisplayName(current)} · {getDisplayLocation(current)}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  ['Years', current.years_operating],
                  ['Revenue', getDisplayRevenue(current)],
                  ['Team', current.employees_range],
                ].map(([label, val]) => (
                  <div key={label as string} className="bg-black-deep border border-grey-border rounded-sm p-2 text-center">
                    <div className="font-display text-base text-white leading-none">{val}</div>
                    <div className="text-[9px] uppercase tracking-widest text-grey-mid mt-1">{label}</div>
                  </div>
                ))}
              </div>

              {/* Tagline */}
              <blockquote className="text-sm text-grey-light italic leading-relaxed border-l-2 border-orange pl-3 rounded-r-sm bg-black-deep py-2 pr-3 mb-3">
                &ldquo;{current.tagline}&rdquo;
              </blockquote>

              {/* Values */}
              <div className="flex flex-wrap gap-1.5">
                {current.values.map(v => (
                  <span key={v} className="badge-orange text-[10px]">{v}</span>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-grey-border bg-black-deep flex items-center justify-between">
              <span className="text-xs text-grey-dark">{current.industry}</span>
              <span className="text-xs text-orange-light font-semibold">Ask: {current.asking_range}</span>
            </div>

            {/* Swipe overlays */}
            <div
              className="absolute inset-0 flex items-center justify-center font-display text-5xl tracking-widest rounded-xl pointer-events-none transition-opacity bg-success/25 text-success"
              style={{ opacity: overlayState === 'like' ? overlayOpacity : 0 }}
            >
              CONNECT
            </div>
            <div
              className="absolute inset-0 flex items-center justify-center font-display text-5xl tracking-widest rounded-xl pointer-events-none transition-opacity bg-danger/20 text-danger"
              style={{ opacity: overlayState === 'pass' ? overlayOpacity : 0 }}
            >
              PASS
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-5">
          <button
            onClick={() => doSwipe('pass', current.id)}
            disabled={swiping}
            className="w-14 h-14 rounded-full bg-black-card border-2 border-danger/30 text-danger text-xl flex items-center justify-center hover:scale-110 transition-transform shadow-card disabled:opacity-50"
            aria-label="Pass"
          >✕</button>
          <button
            onClick={() => setQueue(q => [...q.slice(0,0), q[0], ...q.slice(1)])}
            className="w-10 h-10 rounded-full bg-black-card border border-grey-border text-grey-dark text-sm flex items-center justify-center hover:scale-110 transition-transform"
            aria-label="More details"
          >⋯</button>
          <button
            onClick={() => doSwipe('like', current.id)}
            disabled={swiping}
            className="w-16 h-16 rounded-full bg-orange text-white text-2xl flex items-center justify-center hover:scale-110 transition-transform shadow-glow disabled:opacity-50"
            aria-label="Connect"
          >♡</button>
        </div>

        <p className="text-xs text-grey-mid">Drag left to pass · drag right to connect</p>
      </div>

      {/* Detail panel */}
      <div className="flex-1 min-w-[260px] max-w-[320px] space-y-5 pt-1">
        <DetailSection title="Values Statement">
          <p className="text-sm text-grey-light leading-relaxed">&ldquo;{current.values_statement}&rdquo;</p>
        </DetailSection>

        <DetailSection title="Seller's Goals">
          <p className="text-sm text-grey-light leading-relaxed">{current.transition_goals}</p>
        </DetailSection>

        <DetailSection title="Deal Info">
          <div className="grid grid-cols-2 gap-2">
            <div className="card-sm text-center">
              <div className="text-[9px] uppercase tracking-widest text-grey-mid">Timeline</div>
              <div className="text-sm font-semibold text-white mt-1">{current.transition_timeline}</div>
            </div>
            <div className="card-sm text-center">
              <div className="text-[9px] uppercase tracking-widest text-grey-mid">Financing</div>
              <div className={cn('text-sm font-semibold mt-1', current.seller_financing ? 'text-success' : 'text-grey-dark')}>
                {current.seller_financing ? '✓ Available' : 'Not offered'}
              </div>
            </div>
          </div>
        </DetailSection>

        <DetailSection title="Score Breakdown">
          <div className="space-y-2">
            {breakdown.map(({ label, value }) => (
              <div key={label}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-grey-mid">{label}</span>
                  <span className="text-xs" style={{ color: scoreColor(value) }}>{value}</span>
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
    <div>
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[9px] uppercase tracking-[0.14em] text-orange-light">{title}</span>
        <div className="flex-1 h-px bg-grey-border" />
      </div>
      {children}
    </div>
  )
}

function AnonBadge({ level }: { level: number }) {
  const configs = [
    null,
    { cls: 'anon-1', icon: '👤', label: 'Anonymous' },
    { cls: 'anon-2', icon: '🔓', label: 'Partial ID' },
    { cls: 'anon-3', icon: '✅', label: 'Full Reveal' },
  ]
  const cfg = configs[level]
  if (!cfg) return null
  return (
    <span className={cfg.cls}>
      {cfg.icon} {cfg.label}
    </span>
  )
}
