'use client'

import { useMemo, useState } from 'react'
import { sellerQuizQuestions, buyerQuizQuestions, valueBlurbs } from '@/lib/valuesQuizData'
import { scoreQuiz, isQuestionComplete, answeredCount, type QuizAnswers } from '@/lib/valuesQuizScoring'
import { CORE_VALUES } from '@/lib/constants'

interface ValuesQuizProps {
  audience: 'buyer' | 'seller'
  onConfirm: (values: string[], statementDraft: string) => void
  onCancel: () => void
}

const INTRO_COPY: Record<'buyer' | 'seller', { title: string; lede: string }> = {
  seller: {
    title: 'What matters most when you sell',
    lede: 'Fifteen situations sellers really face: competing offers, deal terms, the transition year, your legacy. Rank the options the way you actually would, and you’ll see the five values that should guide who you sell to.',
  },
  buyer: {
    title: 'What matters most when you buy',
    lede: 'Fifteen situations buyers really face: choosing a target, diligence, financing, your first year and the long haul. Rank the options the way you actually would, and you’ll see the five values that should guide what you buy.',
  },
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type Screen = 'intro' | 'question' | 'results'

export function ValuesQuiz({ audience, onConfirm, onCancel }: ValuesQuizProps) {
  const questions = audience === 'seller' ? sellerQuizQuestions : buyerQuizQuestions
  const intro = INTRO_COPY[audience]

  const [screen, setScreen] = useState<Screen>('intro')
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const [order] = useState<Record<string, number[]>>(() =>
    Object.fromEntries(questions.map(q => [q.id, shuffle(q.options.map((_, k) => k))]))
  )
  const [top5, setTop5] = useState<string[] | null>(null)
  const [swapSlot, setSwapSlot] = useState<number | null>(null)

  const q = questions[i]
  const answer = answers[q?.id] ?? []
  const complete = q ? isQuestionComplete(q, answer) : false
  const ranked = useMemo(() => scoreQuiz(questions, answers), [questions, answers])
  const pct = Math.round((answeredCount(questions, answers) / questions.length) * 100)

  function choose(value: string) {
    const current = answers[q.id] ?? []
    let next: string[]
    if (q.type === 'rank') {
      const pos = current.indexOf(value)
      if (pos > -1) next = current.filter(v => v !== value)
      else {
        next = [...current, value]
        if (next.length === q.options.length - 1) {
          const rest = q.options.map(o => o.value).filter(v => !next.includes(v))
          next.push(rest[0])
        }
      }
    } else {
      next = [value]
    }
    setAnswers(prev => ({ ...prev, [q.id]: next }))
  }

  function next() {
    if (i === questions.length - 1) {
      setTop5(scoreQuiz(questions, answers).slice(0, 5).map(s => s.value))
      setScreen('results')
    } else {
      setI(i + 1)
    }
  }

  function back() {
    if (i === 0) setScreen('intro')
    else setI(i - 1)
  }

  function swapIn(replacement: string) {
    if (swapSlot === null || !top5) return
    const next = top5.slice()
    next[swapSlot] = replacement
    setTop5(next)
    setSwapSlot(null)
  }

  function confirm() {
    if (!top5) return
    const draft = top5.slice(0, 3).map(v => valueBlurbs[v]?.[audience]).filter(Boolean).join(' ')
    onConfirm(top5, draft)
  }

  // Only the custom answer/swap tiles below need their own inline shape —
  // the real buttons (.btn-primary / .btn-ghost) already carry padding,
  // radius, and font from globals.css, so they don't spread this.
  const tileStyle: React.CSSProperties = { fontFamily: 'inherit', cursor: 'pointer', borderRadius: 6 }

  if (screen === 'intro') {
    return (
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 6 }}>{intro.title}</h3>
        <p style={{ fontSize: '0.86rem', color: '#929292', lineHeight: 1.6, marginBottom: 20 }}>{intro.lede}</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setScreen('question')} className="btn-primary">Start the quiz →</button>
          <button type="button" onClick={onCancel} className="btn-ghost">← Back</button>
        </div>
        <p style={{ fontSize: '0.72rem', color: '#6a6a6a', marginTop: 16 }}>About 6 minutes. There are no right answers — every option is something a thoughtful owner might choose.</p>
      </div>
    )
  }

  if (screen === 'question') {
    const ord = order[q.id]
    const opts = ord.map(k => {
      const o = q.options[k]
      const pos = answer.indexOf(o.value)
      const on = pos > -1
      return (
        <button
          key={o.value}
          type="button"
          onClick={() => choose(o.value)}
          style={{
            ...tileStyle,
            display: 'flex', gap: 12, alignItems: 'center', width: '100%', textAlign: 'left',
            padding: '12px 14px', fontSize: '0.88rem', lineHeight: 1.4,
            border: `1px solid ${on ? '#A05500' : '#2e2e2e'}`,
            background: on ? 'rgba(160,85,0,0.08)' : '#141414',
            color: on ? '#fff' : '#D9D9D9',
          }}
        >
          <span style={{
            flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.78rem', fontWeight: 700,
            border: `1px ${q.type === 'rank' ? 'solid' : 'dashed'} ${on ? '#A05500' : '#6a6a6a'}`,
            background: on ? '#A05500' : 'transparent', color: on ? '#fff' : '#6a6a6a',
          }}>
            {q.type === 'rank' && on ? pos + 1 : ''}
          </span>
          <span>{o.text}</span>
        </button>
      )
    })

    let status = ''
    if (q.type === 'rank') {
      status = complete ? 'Ranking complete — tap any option to change it.' : (answer.length ? `Choose #${answer.length + 1}.` : 'Tap your #1 first.')
    }

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 600, color: '#929292', marginBottom: 6 }}>
          <span>{i + 1} / {questions.length}</span>
          <span style={{ color: '#C46A00' }}>{q.type === 'rank' ? 'Rank all four' : 'Pick one'}</span>
        </div>
        <div style={{ height: 4, background: '#2e2e2e', borderRadius: 99, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: '#A05500', transition: 'width 0.3s ease' }} />
        </div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: 6 }}>{q.title}</h3>
        <p style={{ fontSize: '0.88rem', color: '#D9D9D9', lineHeight: 1.5, marginBottom: 6 }}>{q.setup}</p>
        <p style={{ fontSize: '0.76rem', color: '#6a6a6a', marginBottom: 14 }}>
          {q.type === 'rank' ? 'Tap in order of importance, starting with your #1. Tap a ranked option again to remove it.' : 'Choose the one that fits you best.'}
        </p>
        <div style={{ display: 'grid', gap: 8 }}>{opts}</div>
        <p style={{ fontSize: '0.72rem', color: '#929292', minHeight: 18, marginTop: 10 }}>{status}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <button type="button" onClick={back} className="btn-ghost">← Back</button>
          <button type="button" onClick={next} disabled={!complete} className="btn-primary">
            {i === questions.length - 1 ? 'See my values →' : 'Next →'}
          </button>
        </div>
      </div>
    )
  }

  // ---- results ----
  const rankedExcludingTop5 = (slot: number) => ranked.filter(r => !top5!.includes(r.value) || top5![slot] === r.value)

  return (
    <div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 6 }}>Your top 5 values as a {audience}</h3>
      <p style={{ fontSize: '0.86rem', color: '#929292', lineHeight: 1.5, marginBottom: 18 }}>
        Based on how you weighed real trade-offs. If one doesn&apos;t feel right, swap it for another value before you confirm.
      </p>
      <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
        {top5!.map((value, k) => {
          const s = ranked.find(r => r.value === value)
          const strength = s?.maxScore ? Math.round((s.score / s.maxScore) * 100) : 0
          return (
            <div key={value} className="card-sm" style={{ display: 'flex', gap: 14 }}>
              <div style={{ flexShrink: 0, fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: '#C46A00', lineHeight: 1 }}>{k + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{value}</div>
                  <button
                    type="button"
                    onClick={() => setSwapSlot(swapSlot === k ? null : k)}
                    className="btn-ghost btn-sm"
                  >
                    {swapSlot === k ? 'Cancel' : 'Swap'}
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 6 }}>
                  <div style={{ flex: 1, maxWidth: 140, height: 4, background: '#2e2e2e', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${strength}%`, background: '#A05500' }} />
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#6a6a6a' }}>{strength}% strength</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#929292', lineHeight: 1.5, margin: 0 }}>{valueBlurbs[value]?.[audience]}</p>
                {swapSlot === k && (
                  <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
                    {rankedExcludingTop5(k).filter(r => r.value !== value).slice(0, 19).map(r => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => swapIn(r.value)}
                        style={{ ...tileStyle, display: 'flex', justifyContent: 'space-between', padding: '8px 12px', fontSize: '0.82rem', border: '1px solid #2e2e2e', background: '#141414', color: '#D9D9D9' }}
                      >
                        <span>{r.value}</span>
                        <span style={{ color: '#6a6a6a' }}>{r.maxScore ? Math.round((r.score / r.maxScore) * 100) : 0}%</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <button type="button" onClick={confirm} className="btn-primary">Confirm my values →</button>
        <button type="button" onClick={() => { setScreen('question'); setI(0); setAnswers({}); setTop5(null) }} className="btn-ghost">Retake quiz</button>
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
      </div>
      <details>
        <summary style={{ cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#929292' }}>See all {CORE_VALUES.length} values ranked</summary>
        <ol style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'grid', gap: 6 }}>
          {ranked.map((r, k) => {
            const strength = r.maxScore ? Math.round((r.score / r.maxScore) * 100) : 0
            return (
              <li key={r.value} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 60px', alignItems: 'center', gap: 10, fontSize: '0.8rem', color: '#D9D9D9' }}>
                <span style={{ color: '#6a6a6a', textAlign: 'right' }}>{k + 1}</span>
                <span>{r.value}</span>
                <span style={{ color: '#6a6a6a', textAlign: 'right' }}>{strength}%</span>
              </li>
            )
          })}
        </ol>
      </details>
    </div>
  )
}
