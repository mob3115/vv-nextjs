'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { recordSwipe } from '@/lib/actions/marketplace'
import { Confetti } from '@/components/shared/Confetti'
import { SWIPE_ICONS, MISC_ICONS } from '@/lib/icons'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { scoreColor } from '@/lib/utils'

interface BuyerCard {
  id: string
  full_name: string
  role: string
  background?: string
  looking_for?: string
  price_min?: number
  price_max?: number
  experience_years?: string
  funding_source?: string
  target_industries?: string[]
  values?: string[]
  values_statement?: string
  location_preference?: string
  compatibility_score?: number
  score_breakdown?: { label: string; value: number }[]
}

interface SellerSwipeArenaProps {
  buyers: BuyerCard[]
  sellerId: string
}

const FUNDING_LABELS: Record<string, string> = {
  cash: 'Cash buyer',
  sba_loan: 'SBA Loan',
  private_equity: 'Private Equity',
  seller_financing: 'Seller Financing',
  combination: 'Combination',
}

export function SellerSwipeArena({ buyers, sellerId }: SellerSwipeArenaProps) {
  const [queue, setQueue] = useState<BuyerCard[]>(buyers)
  const [swiping, setSwiping] = useState(false)
  const [overlayState, setOverlayState] = useState<'connect' | 'pass' | null>(null)
  const [overlayOpacity, setOverlayOpacity] = useState(0)
  const [celebrate, setCelebrate] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const curX = useRef(0)
  const isDragging = useRef(false)
  const router = useRouter()

  const current = queue[0]
  const next1   = queue[1]
  const next2   = queue[2]

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

  const doSwipe = useCallback(async (direction: 'connect' | 'pass', buyer: BuyerCard) => {
    if (swiping) return
    setSwiping(true)

    const card = cardRef.current
    if (card) {
      card.style.transition = 'transform 0.28s ease, opacity 0.28s ease'
      card.style.transform = direction === 'connect'
        ? 'translate(140%, -20px) rotate(18deg)'
        : 'translate(-140%, -20px) rotate(-18deg)'
      card.style.opacity = '0'
    }

    // Fire and forget — don't block the UI
    recordSwipe({ targetBuyerId: buyer.id, direction: direction === 'connect' ? 'like' : 'pass' })
      .then(result => {
        if (result.matched) {
          toast.success(`It's a match with ${buyer.full_name}!`)
          setCelebrate(c => c + 1)
        } else if (direction === 'connect') {
          toast.success(`Connection request sent to ${buyer.full_name}!`)
        }
        router.refresh()
      })
      .catch(() => toast.error('Something went wrong'))

    setTimeout(() => {
      setQueue(q => q.slice(1))
      setSwiping(false)
    }, 290)
  }, [swiping, router])

  // Touch handlers
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
      if (!isDragging.current) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        if (Math.abs(dy) > Math.abs(dx) * 1.2) return
        isDragging.current = true
      }
      e.preventDefault()
      curX.current = dx
      card.style.transform = `translate(${dx}px, ${dy * 0.3}px) rotate(${dx * 0.07}deg)`
      const progress = Math.min(Math.abs(dx) / 100, 1)
      if (dx > 10)       { setOverlayState('connect'); setOverlayOpacity(progress) }
      else if (dx < -10) { setOverlayState('pass');    setOverlayOpacity(progress) }
      else               { setOverlayState(null);      setOverlayOpacity(0) }
    }

    function onTouchEnd() {
      if (swiping || !isDragging.current) return
      const x = curX.current
      if (x > 65)       doSwipe('connect', current)
      else if (x < -65) doSwipe('pass', current)
      else {
        card.style.transition = 'transform 0.22s ease'
        card.style.transform = ''
        setOverlayState(null)
        setOverlayOpacity(0)
      }
      isDragging.current = false
      curX.current = 0
    }

    card.addEventListener('touchstart', onTouchStart, { passive: true })
    card.addEventListener('touchmove',  onTouchMove,  { passive: false })
    card.addEventListener('touchend',   onTouchEnd,   { passive: true })
    return () => {
      card.removeEventListener('touchstart', onTouchStart)
      card.removeEventListener('touchmove',  onTouchMove)
      card.removeEventListener('touchend',   onTouchEnd)
    }
  }, [current, swiping, doSwipe])

  // Mouse handlers
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
    if (dx > 10)       { setOverlayState('connect'); setOverlayOpacity(progress) }
    else if (dx < -10) { setOverlayState('pass');    setOverlayOpacity(progress) }
    else               { setOverlayState(null);      setOverlayOpacity(0) }
  }

  function onMouseUp() {
    if (!isDragging.current || !current) return
    isDragging.current = false
    const x = curX.current
    if (x > 65)       doSwipe('connect', current)
    else if (x < -65) doSwipe('pass', current)
    else {
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.22s ease'
        cardRef.current.style.transform = ''
      }
      setOverlayState(null)
      setOverlayOpacity(0)
    }
    curX.current = 0
  }

  if (!current) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <MISC_ICONS.inbox size={40} strokeWidth={1.5} style={{ marginBottom: 14, opacity: 0.4, color: '#929292' }} />
          <h3 style={{ fontSize: '1.1rem', color: '#929292', marginBottom: 8 }}>Queue cleared</h3>
          <p style={{ fontSize: '0.84rem', color: '#6a6a6a', maxWidth: 240, lineHeight: 1.6, margin: '0 auto' }}>
            You&apos;ve reviewed all current buyers. Check back soon.
          </p>
        </div>
      </div>
    )
  }

  const initial = current.full_name?.charAt(0).toUpperCase() ?? 'B'
  const hasBuyerProfile = !!(current.background || current.values_statement)

  return (
    <>
      <Confetti trigger={celebrate} />
      <style>{`
        .seller-swipe-layout { display: flex; align-items: flex-start; justify-content: center; gap: 32px; flex-wrap: wrap; }
        .seller-card-wrap { position: relative; width: 360px; height: 540px; flex-shrink: 0; }
        .seller-detail-col { flex: 1; min-width: 240px; max-width: 300px; padding-top: 4px; }
        @media (max-width: 768px) {
          .seller-swipe-layout { flex-direction: column; align-items: center; gap: 16px; }
          .seller-card-wrap { width: min(340px, calc(100vw - 32px)); height: min(460px, 60vh); }
          .seller-detail-col { max-width: 100%; width: min(340px, calc(100vw - 32px)); }
        }
      `}</style>

      <div className="seller-swipe-layout">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div className="seller-card-wrap">
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

            {/* Top card */}
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
              {/* Accent bar */}
              <div style={{ height: 5, background: 'linear-gradient(90deg,#A05500,#C46A00)' }} />

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '20px 20px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#A05500', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', flexShrink: 0 }}>
                    {initial}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: 3 }}>
                      {current.full_name}
                    </h2>
                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#C46A00', background: 'rgba(160,85,0,0.1)', border: '1px solid rgba(160,85,0,0.25)', padding: '2px 8px', borderRadius: 99 }}>
                      Buyer
                    </span>
                  </div>
                </div>
                {current.compatibility_score !== undefined && (
                  <ScoreRing score={current.compatibility_score} size={60} />
                )}
              </div>

              <div style={{ padding: '0 20px 18px' }}>
                {hasBuyerProfile ? (
                  <>
                    {/* Budget + criteria */}
                    {(current.price_min || current.price_max) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7, marginBottom: 14 }}>
                        {[
                          ['Budget', current.price_min && current.price_max ? `$${(current.price_min/1000).toFixed(0)}K–$${(current.price_max/1000000).toFixed(1)}M` : '—'],
                          ['Experience', current.experience_years ?? '—'],
                          ['Funding', FUNDING_LABELS[current.funding_source ?? ''] ?? current.funding_source ?? '—'],
                        ].map(([label, val]) => (
                          <div key={label} style={{ background: '#141414', border: '1px solid #2e2e2e', borderRadius: 6, padding: '8px 6px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>{val}</div>
                            <div style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6a6a6a', marginTop: 3 }}>{label}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Background */}
                    {current.background && (
                      <blockquote style={{ fontSize: '0.82rem', color: '#D9D9D9', fontStyle: 'italic', lineHeight: 1.55, borderLeft: '2px solid #A05500', padding: '8px 12px', background: '#141414', borderRadius: '0 5px 5px 0', marginBottom: 12 }}>
                        &ldquo;{current.background.slice(0, 160)}{current.background.length > 160 ? '…' : ''}&rdquo;
                      </blockquote>
                    )}

                    {/* Location */}
                    {current.location_preference && (
                      <div style={{ fontSize: '0.78rem', color: '#929292', marginBottom: 10 }}>
                        ◎ Looking in: <span style={{ color: '#fff' }}>{current.location_preference}</span>
                      </div>
                    )}

                    {/* Values */}
                    {current.values && current.values.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {current.values.slice(0, 4).map(v => (
                          <span key={v} className="badge-orange" style={{ fontSize: '0.65rem' }}>{v}</span>
                        ))}
                      </div>
                    )}

                    {/* Target industries */}
                    {current.target_industries && current.target_industries.length > 0 && (
                      <div style={{ fontSize: '0.72rem', color: '#6a6a6a', marginTop: 10 }}>
                        Interested in: {current.target_industries.slice(0, 3).join(' · ')}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#6a6a6a' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: 10, opacity: 0.4 }}>○</div>
                    <p style={{ fontSize: '0.84rem', lineHeight: 1.6 }}>
                      This buyer has not yet completed their profile. You can still connect and they&apos;ll see your interest.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 20px', borderTop: '1px solid #2e2e2e', background: '#141414', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: '#929292' }}>V+V Buyer</span>
                <span style={{ fontSize: '0.75rem', color: '#C46A00', fontWeight: 600 }}>
                  {queue.length - 1} more in queue
                </span>
              </div>

              {/* CONNECT overlay */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.8rem', letterSpacing: '0.1em', borderRadius: 20, pointerEvents: 'none', background: 'rgba(76,175,125,0.22)', color: '#4caf7d', opacity: overlayState === 'connect' ? overlayOpacity : 0, transition: 'opacity 0.08s' }}>
                CONNECT
              </div>

              {/* PASS overlay */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.8rem', letterSpacing: '0.1em', borderRadius: 20, pointerEvents: 'none', background: 'rgba(212,95,95,0.18)', color: '#d45f5f', opacity: overlayState === 'pass' ? overlayOpacity : 0, transition: 'opacity 0.08s' }}>
                PASS
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <button
              onClick={() => !swiping && doSwipe('pass', current)}
              disabled={swiping}
              aria-label="Pass"
              style={{ width: 54, height: 54, borderRadius: '50%', background: '#242424', border: '2px solid rgba(212,95,95,0.35)', color: '#d45f5f', cursor: swiping ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', opacity: swiping ? 0.5 : 1 }}
            >
              <SWIPE_ICONS.pass size={22} strokeWidth={2} />
            </button>
            <button
              onClick={() => !swiping && doSwipe('connect', current)}
              disabled={swiping}
              aria-label="Connect"
              style={{ width: 66, height: 66, borderRadius: '50%', background: '#A05500', border: 'none', color: '#fff', cursor: swiping ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(160,85,0,0.4)', opacity: swiping ? 0.5 : 1 }}
            >
              <SWIPE_ICONS.like size={26} strokeWidth={2} fill="currentColor" />
            </button>
          </div>

          <p style={{ fontSize: '0.72rem', color: '#6a6a6a' }}>Drag left to pass · drag right to connect</p>
        </div>

        {/* Detail panel */}
        {hasBuyerProfile && (
          <div className="seller-detail-col">
            {current.values_statement && (
              <DetailSection title="Values Statement">
                <p style={{ fontSize: '0.84rem', color: '#D9D9D9', lineHeight: 1.65 }}>
                  &ldquo;{current.values_statement}&rdquo;
                </p>
              </DetailSection>
            )}
            {current.looking_for && (
              <DetailSection title="What They're Looking For">
                <p style={{ fontSize: '0.84rem', color: '#D9D9D9', lineHeight: 1.65 }}>
                  {current.looking_for}
                </p>
              </DetailSection>
            )}
            {current.target_industries && current.target_industries.length > 0 && (
              <DetailSection title="Target Industries">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {current.target_industries.map(ind => (
                    <span key={ind} className="badge-grey" style={{ fontSize: '0.72rem' }}>{ind}</span>
                  ))}
                </div>
              </DetailSection>
            )}
            <DetailSection title="Deal Details">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div className="card-sm" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6a6a6a' }}>Budget</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', marginTop: 4 }}>
                    {current.price_min && current.price_max
                      ? `$${(current.price_min/1000).toFixed(0)}K–$${(current.price_max/1000000).toFixed(1)}M`
                      : '—'}
                  </div>
                </div>
                <div className="card-sm" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6a6a6a' }}>Funding</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', marginTop: 4 }}>
                    {FUNDING_LABELS[current.funding_source ?? ''] ?? '—'}
                  </div>
                </div>
              </div>
            </DetailSection>
            {current.score_breakdown && (
              <DetailSection title="Score Breakdown">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {current.score_breakdown.map(({ label, value }) => (
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
            )}
          </div>
        )}
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
