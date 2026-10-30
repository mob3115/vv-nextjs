'use client'

import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface AccordionCardProps {
  title: string
  summary?: React.ReactNode
  defaultOpen?: boolean
  // Collapsed content is still mounted in the DOM (just visually clipped to
  // zero height), so a validation error inside a closed card is otherwise
  // invisible after a failed submit. Pass `true` right after validation to
  // force this card open so the error the user needs is actually on screen.
  forceOpen?: boolean
  children: React.ReactNode
}

// A collapsible .card — closed by default, shows `title` + an optional
// one-line `summary` so the whole section is readable at a glance; expands
// to reveal the full editable content. Height-animated via a CSS grid-rows
// trick (see .accordion-card-body-wrap in globals.css), so no JS content
// measurement is needed for a smooth expand regardless of field count.
export function AccordionCard({ title, summary, defaultOpen = false, forceOpen = false, children }: AccordionCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  useEffect(() => { if (forceOpen) setOpen(true) }, [forceOpen])

  return (
    <div className={`accordion-card ${open ? 'open' : ''}`} style={{ marginBottom: 16 }}>
      <button
        type="button"
        className="accordion-card-header"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{title}</div>
          {!open && summary && (
            <div style={{ fontSize: '0.78rem', color: '#929292', marginTop: 4 }}>{summary}</div>
          )}
        </div>
        <ChevronDown className="accordion-card-chevron" size={20} />
      </button>
      <div className="accordion-card-body-wrap">
        <div className="accordion-card-body-inner">
          <div className="accordion-card-body">{children}</div>
        </div>
      </div>
    </div>
  )
}
