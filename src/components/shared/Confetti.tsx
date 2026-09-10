'use client'

import { useEffect, useRef } from 'react'

interface ConfettiProps {
  /** Increment this to fire a new burst. 0 means "no burst yet". */
  trigger: number
}

const COLORS = ['#A05500', '#C46A00', '#e8a838', '#4caf7d', '#D9D9D9']

interface Particle {
  x: number; y: number; vx: number; vy: number
  size: number; color: string; rotation: number; rotationSpeed: number
  shape: 'rect' | 'circle'
  life: number
}

// Small self-contained canvas confetti burst — brand-colored, no library.
export function Confetti({ trigger }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>()
  const skippedMount = useRef(false)

  useEffect(() => {
    if (!skippedMount.current) { skippedMount.current = true; return } // don't fire on mount
    if (trigger === 0) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr
    ctx.scale(dpr, dpr)

    const particles: Particle[] = []
    const originX = window.innerWidth / 2
    const originY = window.innerHeight * 0.35

    for (let i = 0; i < 140; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 4 + Math.random() * 9
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: 5 + Math.random() * 5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
        life: 1,
      })
    }

    const gravity = 0.28
    const drag = 0.985

    function tick() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      let alive = false
      for (const p of particles) {
        if (p.life <= 0) continue
        p.vx *= drag
        p.vy = p.vy * drag + gravity
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.rotationSpeed
        p.life -= 0.012
        if (p.life > 0) {
          alive = true
          ctx!.save()
          ctx!.translate(p.x, p.y)
          ctx!.rotate((p.rotation * Math.PI) / 180)
          ctx!.globalAlpha = Math.max(0, p.life)
          ctx!.fillStyle = p.color
          if (p.shape === 'rect') ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
          else { ctx!.beginPath(); ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx!.fill() }
          ctx!.restore()
        }
      }
      if (alive) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      }
    }

    tick()
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [trigger])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}
      aria-hidden
    />
  )
}
