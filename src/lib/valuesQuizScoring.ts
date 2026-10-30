// Pure scoring engine for the Values Discovery Quiz — ported from the standalone
// reference quiz's `scores()` function. Kept framework-free and pure so it's
// unit-testable the same way matching.ts/validations.ts are.

import type { QuizQuestion } from './valuesQuizData'

// A rank question's four options score 5/3/1/0 by the order the user ranked
// them; a pick question's single chosen option scores a flat 5. Same weights
// as the reference quiz.
const RANK_POINTS = [5, 3, 1, 0]
const PICK_POINTS = 5

// questionId -> ordered list of chosen option values (rank: all 4, best to
// worst; pick: the single chosen value).
export type QuizAnswers = Record<string, string[]>

export interface QuizScore {
  value: string
  score: number
  maxScore: number
  firsts: number
}

export function isQuestionComplete(question: QuizQuestion, answer: string[] | undefined): boolean {
  const a = answer ?? []
  return question.type === 'rank' ? a.length === question.options.length : a.length === 1
}

export function answeredCount(questions: QuizQuestion[], answers: QuizAnswers): number {
  return questions.filter(q => isQuestionComplete(q, answers[q.id])).length
}

// Ranks every value that appears anywhere in the question bank (not just the
// ones the user happened to answer) — ties break by score, then by how often
// a value was ranked/picked first, then by first appearance in the question
// bank, so results are deterministic across repeated runs with identical answers.
export function scoreQuiz(questions: QuizQuestion[], answers: QuizAnswers): QuizScore[] {
  const order: string[] = []
  const seen = new Set<string>()
  const scores = new Map<string, QuizScore>()

  for (const q of questions) {
    for (const opt of q.options) {
      if (!seen.has(opt.value)) {
        seen.add(opt.value)
        order.push(opt.value)
        scores.set(opt.value, { value: opt.value, score: 0, maxScore: 0, firsts: 0 })
      }
      scores.get(opt.value)!.maxScore += q.type === 'rank' ? RANK_POINTS[0] : PICK_POINTS
    }

    const a = answers[q.id]
    if (!a || !isQuestionComplete(q, a)) continue

    if (q.type === 'rank') {
      a.forEach((value, i) => {
        const s = scores.get(value)
        if (!s) return
        s.score += RANK_POINTS[i] ?? 0
        if (i === 0) s.firsts++
      })
    } else {
      const s = scores.get(a[0])
      if (s) { s.score += PICK_POINTS; s.firsts++ }
    }
  }

  const indexOf = new Map(order.map((v, i) => [v, i]))
  return Array.from(scores.values()).sort((x, y) =>
    (y.score - x.score) || (y.firsts - x.firsts) || (indexOf.get(x.value)! - indexOf.get(y.value)!)
  )
}

export function topValues(questions: QuizQuestion[], answers: QuizAnswers, count = 5): string[] {
  return scoreQuiz(questions, answers).slice(0, count).map(s => s.value)
}
