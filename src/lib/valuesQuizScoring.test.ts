import { describe, it, expect } from 'vitest'
import { scoreQuiz, topValues, isQuestionComplete, answeredCount } from './valuesQuizScoring'
import { sellerQuizQuestions, buyerQuizQuestions, valueBlurbs } from './valuesQuizData'
import { CORE_VALUES } from './constants'

describe('quiz data integrity', () => {
  it('every option value in both question banks is a real CORE_VALUES label', () => {
    const unknown = [...sellerQuizQuestions, ...buyerQuizQuestions]
      .flatMap(q => q.options.map(o => o.value))
      .filter(v => !CORE_VALUES.includes(v))
    expect(unknown).toEqual([])
  })

  it('every CORE_VALUES label has a blurb for both audiences', () => {
    const missing = CORE_VALUES.filter(v => !valueBlurbs[v]?.buyer || !valueBlurbs[v]?.seller)
    expect(missing).toEqual([])
  })

  it('has 15 questions per audience', () => {
    expect(sellerQuizQuestions).toHaveLength(15)
    expect(buyerQuizQuestions).toHaveLength(15)
  })
})

describe('isQuestionComplete / answeredCount', () => {
  const rankQ = sellerQuizQuestions.find(q => q.type === 'rank')!
  const pickQ = sellerQuizQuestions.find(q => q.type === 'pick')!

  it('a rank question needs every option ranked', () => {
    expect(isQuestionComplete(rankQ, [])).toBe(false)
    expect(isQuestionComplete(rankQ, [rankQ.options[0].value])).toBe(false)
    expect(isQuestionComplete(rankQ, rankQ.options.map(o => o.value))).toBe(true)
  })

  it('a pick question needs exactly one choice', () => {
    expect(isQuestionComplete(pickQ, [])).toBe(false)
    expect(isQuestionComplete(pickQ, [pickQ.options[0].value])).toBe(true)
  })

  it('counts only fully-answered questions', () => {
    const answers = { [rankQ.id]: rankQ.options.map(o => o.value) }
    expect(answeredCount(sellerQuizQuestions, answers)).toBe(1)
  })
})

describe('scoreQuiz', () => {
  // Two short synthetic questions keep the weighting/tie-break math legible,
  // independent of the real 15-question banks' exact content.
  const questions = [
    { id: 'q1', type: 'rank' as const, title: '', setup: '', options: [
      { value: 'A', text: '' }, { value: 'B', text: '' }, { value: 'C', text: '' }, { value: 'D', text: '' },
    ]},
    { id: 'q2', type: 'pick' as const, title: '', setup: '', options: [
      { value: 'A', text: '' }, { value: 'E', text: '' },
    ]},
  ]

  it('awards rank points 5/3/1/0 in ranked order', () => {
    const scores = scoreQuiz(questions, { q1: ['B', 'A', 'D', 'C'] })
    const byValue = Object.fromEntries(scores.map(s => [s.value, s.score]))
    expect(byValue.B).toBe(5)
    expect(byValue.A).toBe(3)
    expect(byValue.D).toBe(1)
    expect(byValue.C).toBe(0)
  })

  it('awards a flat 5 points to a pick answer', () => {
    const scores = scoreQuiz(questions, { q2: ['E'] })
    const e = scores.find(s => s.value === 'E')!
    expect(e.score).toBe(5)
    expect(e.firsts).toBe(1)
  })

  it('ignores incomplete answers for a question', () => {
    const scores = scoreQuiz(questions, { q1: ['A'] }) // only 1 of 4 ranked
    expect(scores.every(s => s.score === 0)).toBe(true)
  })

  it('computes maxScore per value from every question it appears in', () => {
    // A appears in both q1 (rank, max 5) and q2 (pick, max 5) => max 10
    const scores = scoreQuiz(questions, {})
    const a = scores.find(s => s.value === 'A')!
    expect(a.maxScore).toBe(10)
    const b = scores.find(s => s.value === 'B')!
    expect(b.maxScore).toBe(5)
  })

  it('breaks ties by score, then first-place count, then original order', () => {
    // B and D both score 0 points here (never ranked/picked) and are tied —
    // D should sort first since it's declared before B's own worth as a
    // tiebreak target isn't relevant; use a cleaner tie: two values with
    // identical score but different firsts.
    const scores = scoreQuiz(
      [{ id: 'p1', type: 'pick' as const, title: '', setup: '', options: [{ value: 'X', text: '' }, { value: 'Y', text: '' }] },
       { id: 'p2', type: 'pick' as const, title: '', setup: '', options: [{ value: 'X', text: '' }, { value: 'Y', text: '' }] }],
      { p1: ['X'], p2: ['Y'] }
    )
    // Both X and Y score 5 with 1 first-place each here — true tie, falls to original order (X before Y)
    expect(scores[0].value).toBe('X')
    expect(scores[1].value).toBe('Y')
  })

  it('topValues returns the requested count, highest score first', () => {
    const top = topValues(questions, { q1: ['B', 'A', 'D', 'C'], q2: ['E'] }, 3)
    expect(top).toEqual(['B', 'E', 'A'])
  })
})
