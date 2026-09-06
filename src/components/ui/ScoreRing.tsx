import { scoreColor } from '@/lib/utils'

interface ScoreRingProps {
  score: number
  size?: number
}

export function ScoreRing({ score, size = 80 }: ScoreRingProps) {
  const r = size / 2 - 7
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = scoreColor(score)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#2e2e2e" strokeWidth={5} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={5}
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span
          className="font-display leading-none"
          style={{ color, fontSize: size > 70 ? '1.2rem' : '0.9rem' }}
        >
          {score}
        </span>
      </div>
    </div>
  )
}
