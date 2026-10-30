'use client'

interface ValuesMethodChooserProps {
  onChooseQuiz: () => void
  onChoosePick: () => void
}

// The first screen of the values step, shown only when nothing has been
// selected yet (see useValuesSelection) — offers the quiz or the manual grid,
// matching the reference "What matters most to you?" chooser pattern.
export function ValuesMethodChooser({ onChooseQuiz, onChoosePick }: ValuesMethodChooserProps) {
  return (
    <div>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>What matters most to you?</h3>
      <p style={{ fontSize: '0.84rem', color: '#929292', marginBottom: 20, lineHeight: 1.5 }}>
        Choose how you&apos;d like to find your core values.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <button
          type="button"
          onClick={onChooseQuiz}
          className="card"
          style={{ textAlign: 'left', cursor: 'pointer', borderTop: '3px solid #A05500', fontFamily: 'inherit' }}
        >
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', marginBottom: 6 }}>Take the Quiz</div>
          <p style={{ fontSize: '0.82rem', color: '#929292', lineHeight: 1.5, margin: '0 0 12px' }}>
            Fifteen quick scenarios. Rank the options the way you actually would, and we&apos;ll reveal the five values that matter most to you.
          </p>
          <div style={{ fontSize: '0.72rem', color: '#C46A00', fontWeight: 600 }}>About 6 minutes</div>
        </button>
        <button
          type="button"
          onClick={onChoosePick}
          className="card"
          style={{ textAlign: 'left', cursor: 'pointer', borderTop: '3px solid #2e2e2e', fontFamily: 'inherit' }}
        >
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', marginBottom: 6 }}>Pick My Values</div>
          <p style={{ fontSize: '0.82rem', color: '#929292', lineHeight: 1.5, margin: '0 0 12px' }}>
            Already know what matters to you? Choose up to 5 values directly from the full list.
          </p>
          <div style={{ fontSize: '0.72rem', color: '#929292', fontWeight: 600 }}>About 1 minute</div>
        </button>
      </div>
    </div>
  )
}
