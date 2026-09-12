'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Shared drag-gesture engine behind both SwipeArena (buyer) and
// SellerSwipeArena — previously ~150-180 lines of nearly identical
// touch/mouse handling duplicated between the two, with a few latent bugs
// baked into both copies:
//
// - Mouse drag was tracked only on the card element itself, so a fast drag
//   that exited the card's bounding box mid-gesture fired onMouseLeave,
//   which ended the drag prematurely — the card visually "dropped" even
//   though the mouse button was still held. Fixed by tracking mousemove/
//   mouseup on `window` once a drag starts, the same way native drag
//   implementations do.
// - Touch required a directional lock (a movement threshold, and a
//   dx-vs-dy ratio check) before committing to a horizontal swipe, so a
//   vertical scroll gesture wasn't misread as a swipe attempt; mouse had
//   no equivalent check. Both now share the same lock logic.
// - The 290ms exit-animation timeout had no cleanup, so a swipe started
//   right before navigating away could call setState after unmount.
//
// This hook only owns the gesture physics — direction, drag visuals, when
// a swipe commits. Business meaning (what a "right" swipe records, what
// toast it shows) stays with the caller via `onSwipe`.
//
// `onSwipe` and `swiping` are read through refs inside the mouse handlers
// rather than closed over directly. `onSwipe` in particular is a fresh
// inline closure from the caller on every render of *its* component: if
// commitSwipe's useCallback depended on it directly, every drag-visual
// update (which calls setState) would produce a new commitSwipe -> a new
// endDrag -> a new onMouseUp, which would trip the "remove stale window
// listeners" cleanup effect below on nearly every frame of the drag —
// tearing down the listeners onMouseDown had just attached, seconds into
// the gesture. Routing through refs keeps the whole mouse-handler chain
// referentially stable regardless of how often the caller re-renders.

export type SwipeDirection = 'right' | 'left'

const LOCK_THRESHOLD = 8      // px of movement before committing to horizontal vs vertical
const LOCK_RATIO = 1.2        // dy/dx ratio beyond which a drag reads as vertical scroll, not a swipe
const COMMIT_THRESHOLD = 65   // px of horizontal movement that commits a swipe on release
const EXIT_ANIMATION_MS = 290
const TOUCH_VERTICAL_DAMP = 0.3
const MOUSE_VERTICAL_DAMP = 0.35

interface UseSwipeDeckOptions<T> {
  /** The queue to work through — swiped items drop off the front. */
  items: T[]
  /** Called once a swipe commits. Do the actual recordSwipe call, toasts, confetti, etc. here. */
  onSwipe: (direction: SwipeDirection, item: T) => void
}

export function useSwipeDeck<T>({ items, onSwipe }: UseSwipeDeckOptions<T>) {
  const [queue, setQueue] = useState<T[]>(items)
  const [swiping, setSwiping] = useState(false)
  const [overlay, setOverlay] = useState<{ direction: SwipeDirection; opacity: number } | null>(null)

  const cardRef = useRef<HTMLDivElement>(null)
  const startPos = useRef({ x: 0, y: 0 })
  const curX = useRef(0)
  const dragLocked = useRef(false) // has this gesture committed to being a horizontal swipe?
  const dragActive = useRef(false) // is a touch/mouse gesture currently in progress at all?
  const exitTimeout = useRef<ReturnType<typeof setTimeout>>()

  const swipingRef = useRef(swiping)
  swipingRef.current = swiping
  const onSwipeRef = useRef(onSwipe)
  onSwipeRef.current = onSwipe

  const current = queue[0]
  const next1 = queue[1]
  const next2 = queue[2]

  // Reset the top card's inline style whenever the queue advances.
  useEffect(() => {
    const card = cardRef.current
    if (card) {
      card.style.transform = ''
      card.style.opacity = '1'
      card.style.transition = ''
    }
    setOverlay(null)
    dragLocked.current = false
    dragActive.current = false
  }, [queue])

  useEffect(() => () => { if (exitTimeout.current) clearTimeout(exitTimeout.current) }, [])

  // Stable regardless of caller re-renders — see file header.
  const commitSwipe = useCallback((direction: SwipeDirection, item: T) => {
    if (swipingRef.current) return
    setSwiping(true)

    const card = cardRef.current
    if (card) {
      card.style.transition = 'transform 0.28s ease, opacity 0.28s ease'
      card.style.transform = direction === 'right'
        ? 'translate(140%, -20px) rotate(18deg)'
        : 'translate(-140%, -20px) rotate(-18deg)'
      card.style.opacity = '0'
    }

    onSwipeRef.current(direction, item)

    exitTimeout.current = setTimeout(() => {
      setQueue(q => q.slice(1))
      setSwiping(false)
    }, EXIT_ANIMATION_MS)
  }, [])

  const updateDragVisual = useCallback((dx: number, dy: number, verticalDamp: number) => {
    const card = cardRef.current
    if (card) card.style.transform = `translate(${dx}px, ${dy * verticalDamp}px) rotate(${dx * 0.07}deg)`
    const progress = Math.min(Math.abs(dx) / 100, 1)
    if (dx > 10) setOverlay({ direction: 'right', opacity: progress })
    else if (dx < -10) setOverlay({ direction: 'left', opacity: progress })
    else setOverlay(null)
  }, [])

  // Depends on `current` (the item to swipe) but not on anything that
  // changes mid-drag, so this stays stable for the duration of one gesture.
  const endDrag = useCallback(() => {
    if (!dragActive.current || !dragLocked.current || !current) {
      dragActive.current = false
      dragLocked.current = false
      curX.current = 0
      return
    }
    const x = curX.current
    if (x > COMMIT_THRESHOLD) {
      commitSwipe('right', current)
    } else if (x < -COMMIT_THRESHOLD) {
      commitSwipe('left', current)
    } else {
      const card = cardRef.current
      if (card) {
        card.style.transition = 'transform 0.22s ease'
        card.style.transform = ''
      }
      setOverlay(null)
    }
    dragActive.current = false
    dragLocked.current = false
    curX.current = 0
  }, [current, commitSwipe])

  // ---- Touch (mobile) — raw events so preventDefault can stop page scroll ----
  useEffect(() => {
    const card = cardRef.current
    if (!card || !current) return

    function onTouchStart(e: TouchEvent) {
      if (swipingRef.current) return
      const t = e.touches[0]
      startPos.current = { x: t.clientX, y: t.clientY }
      curX.current = 0
      dragLocked.current = false
      dragActive.current = true
      card!.style.transition = 'none'
    }

    function onTouchMove(e: TouchEvent) {
      if (swipingRef.current || !dragActive.current) return
      const t = e.touches[0]
      const dx = t.clientX - startPos.current.x
      const dy = t.clientY - startPos.current.y
      if (!dragLocked.current) {
        if (Math.abs(dx) < LOCK_THRESHOLD && Math.abs(dy) < LOCK_THRESHOLD) return
        if (Math.abs(dy) > Math.abs(dx) * LOCK_RATIO) return // vertical scroll — let the browser handle it
        dragLocked.current = true
      }
      e.preventDefault()
      curX.current = dx
      updateDragVisual(dx, dy, TOUCH_VERTICAL_DAMP)
    }

    function onTouchEnd() { endDrag() }

    card.addEventListener('touchstart', onTouchStart, { passive: true })
    card.addEventListener('touchmove', onTouchMove, { passive: false })
    card.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      card.removeEventListener('touchstart', onTouchStart)
      card.removeEventListener('touchmove', onTouchMove)
      card.removeEventListener('touchend', onTouchEnd)
    }
  }, [current, endDrag, updateDragVisual])

  // ---- Mouse (desktop) ----
  // mousemove/mouseup listen on `window` once a drag starts, not just the
  // card element — see the file header for why.
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (swipingRef.current || !dragActive.current) return
    const dx = e.clientX - startPos.current.x
    const dy = e.clientY - startPos.current.y
    if (!dragLocked.current) {
      if (Math.abs(dx) < LOCK_THRESHOLD && Math.abs(dy) < LOCK_THRESHOLD) return
      if (Math.abs(dy) > Math.abs(dx) * LOCK_RATIO) return
      dragLocked.current = true
    }
    curX.current = dx
    updateDragVisual(dx, dy, MOUSE_VERTICAL_DAMP)
  }, [updateDragVisual])

  const onMouseUp = useCallback(() => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    endDrag()
  }, [onMouseMove, endDrag])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (swipingRef.current) return
    startPos.current = { x: e.clientX, y: e.clientY }
    curX.current = 0
    dragLocked.current = false
    dragActive.current = true
    if (cardRef.current) cardRef.current.style.transition = 'none'
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [onMouseMove, onMouseUp])

  // Don't leave window-level listeners attached if the component unmounts
  // mid-drag (e.g. onSwipe's caller navigates away immediately). onMouseMove
  // / onMouseUp are stable across re-renders (see file header), so this
  // cleanup now only ever runs on a real unmount, not on every drag frame.
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [onMouseMove, onMouseUp])

  return {
    current,
    next1,
    next2,
    queueLength: queue.length,
    swiping,
    overlay,
    cardRef,
    /** Trigger a swipe directly — for tap/click buttons, bypassing drag entirely. */
    swipe: commitSwipe,
    /** Spread onto the top card element. */
    cardHandlers: { onMouseDown },
  }
}
