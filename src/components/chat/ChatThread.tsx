'use client'

import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { format, isToday, isYesterday } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { sendMessage, markConversationRead } from '@/lib/actions/messaging'

interface ThreadMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
  pending?: boolean
}

type NdaStatus = 'both_signed' | 'you_signed' | 'them_signed' | 'none'

interface ChatThreadProps {
  matchId: string
  conversationId: string | null
  currentUserId: string
  otherPartyName: string
  ndaStatus: NdaStatus
  ndaHref: string
  initialMessages: ThreadMessage[]
}

const NDA_BANNER: Record<NdaStatus, { tone: string; text: string; cta: string | null }> = {
  both_signed: {
    tone: 'green',
    text: '✓ NDA signed by both parties',
    cta: null,
  },
  you_signed: {
    tone: 'warning',
    text: '⚠ You signed the NDA — waiting on the other party. Avoid sharing confidential details until then.',
    cta: 'View NDA',
  },
  them_signed: {
    tone: 'warning',
    text: '⚠ The other party signed the NDA — you haven’t yet. Avoid sharing confidential details until then.',
    cta: 'Sign NDA',
  },
  none: {
    tone: 'danger',
    text: '⚠ No NDA is in place yet — don’t share confidential financial or proprietary information.',
    cta: 'Sign NDA',
  },
}

function dayLabel(date: Date) {
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMMM d, yyyy')
}

export function ChatThread({
  matchId, conversationId: initialConversationId, currentUserId, otherPartyName, ndaStatus, ndaHref, initialMessages,
}: ChatThreadProps) {
  const [conversationId, setConversationId] = useState(initialConversationId)
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const conversationIdRef = useRef(conversationId)
  conversationIdRef.current = conversationId

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Mark anything from the other party read on mount, in case messages
  // arrived between the server render and this component hydrating.
  useEffect(() => {
    if (conversationId) markConversationRead(conversationId).catch(() => {})
  }, [conversationId])

  useEffect(() => {
    if (!conversationId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, payload => {
        const incoming = payload.new as ThreadMessage
        setMessages(prev => prev.some(m => m.id === incoming.id) ? prev : [...prev, incoming])
        if (incoming.sender_id !== currentUserId) {
          markConversationRead(conversationId).catch(() => {})
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, payload => {
        const updated = payload.new as ThreadMessage
        setMessages(prev => prev.map(m => m.id === updated.id ? updated : m))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId, currentUserId])

  async function handleSend() {
    const content = draft.trim()
    if (!content || sending) return

    setSending(true)
    setDraft('')

    const tempId = `temp-${Date.now()}`
    const optimistic: ThreadMessage = {
      id: tempId,
      conversation_id: conversationId ?? 'pending',
      sender_id: currentUserId,
      content,
      created_at: new Date().toISOString(),
      read_at: null,
      pending: true,
    }
    setMessages(prev => [...prev, optimistic])

    const result = await sendMessage({ matchId, content })
    setSending(false)

    if (result.error || !result.message) {
      toast.error(result.error ?? 'Failed to send message')
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setDraft(content)
      return
    }

    setMessages(prev => prev.map(m => m.id === tempId ? result.message : m))
    if (!conversationIdRef.current && result.conversationId) {
      setConversationId(result.conversationId)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const banner = NDA_BANNER[ndaStatus]
  const bannerColors: Record<string, { bg: string; border: string; color: string }> = {
    green:   { bg: 'rgba(76,175,125,0.08)',  border: 'rgba(76,175,125,0.3)',  color: '#4caf7d' },
    warning: { bg: 'rgba(232,168,56,0.08)',  border: 'rgba(232,168,56,0.3)',  color: '#e8a838' },
    danger:  { bg: 'rgba(212,95,95,0.08)',   border: 'rgba(212,95,95,0.3)',   color: '#d45f5f' },
  }
  const bc = bannerColors[banner.tone]

  let lastDay = ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', maxWidth: 720 }}>
      {/* NDA indicator banner */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        background: bc.bg, border: `1px solid ${bc.border}`, borderRadius: 10,
        padding: '10px 16px', marginBottom: 14, flexShrink: 0,
      }}>
        <span style={{ fontSize: '0.78rem', color: bc.color, lineHeight: 1.5 }}>{banner.text}</span>
        {banner.cta && (
          <a href={ndaHref} style={{ fontSize: '0.75rem', fontWeight: 600, color: bc.color, whiteSpace: 'nowrap', textDecoration: 'underline' }}>
            {banner.cta} →
          </a>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', background: '#141414', border: '1px solid #2e2e2e',
        borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        {messages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', color: '#6a6a6a', maxWidth: 280 }}>
            <div style={{ fontSize: '2rem', marginBottom: 10, opacity: 0.4 }}>◻</div>
            <p style={{ fontSize: '0.82rem', lineHeight: 1.6 }}>
              Say hello to {otherPartyName} — suggest a call, a coffee, or a time to talk business.
            </p>
          </div>
        ) : (
          messages.map(m => {
            const date = new Date(m.created_at)
            const label = dayLabel(date)
            const showDaySeparator = label !== lastDay
            lastDay = label
            const mine = m.sender_id === currentUserId

            return (
              <div key={m.id}>
                {showDaySeparator && (
                  <div style={{ textAlign: 'center', margin: '14px 0 10px' }}>
                    <span style={{ fontSize: '0.68rem', color: '#6a6a6a', background: '#1e1e1e', padding: '3px 10px', borderRadius: 99 }}>
                      {label}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
                  <div style={{
                    maxWidth: '72%', padding: '9px 13px', borderRadius: mine ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                    background: mine ? '#A05500' : '#242424',
                    border: mine ? 'none' : '1px solid #2e2e2e',
                    opacity: m.pending ? 0.6 : 1,
                  }}>
                    <p style={{ fontSize: '0.86rem', color: '#fff', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {m.content}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <span style={{ fontSize: '0.62rem', color: mine ? 'rgba(255,255,255,0.65)' : '#6a6a6a' }}>
                        {format(date, 'h:mm a')}
                      </span>
                      {mine && !m.pending && (
                        <span style={{ fontSize: '0.68rem', color: m.read_at ? '#8fd6b3' : 'rgba(255,255,255,0.5)' }}>
                          {m.read_at ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 12, flexShrink: 0 }}>
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${otherPartyName}…`}
          rows={1}
          maxLength={4000}
          style={{
            flex: 1, resize: 'none', background: '#141414', border: '1px solid #2e2e2e', borderRadius: 10,
            padding: '11px 14px', fontSize: '0.88rem', color: '#fff', outline: 'none', fontFamily: 'inherit',
            lineHeight: 1.5, maxHeight: 120,
          }}
          onFocus={e => e.target.style.borderColor = '#A05500'}
          onBlur={e => e.target.style.borderColor = '#2e2e2e'}
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim() || sending}
          className="btn-primary"
          style={{ padding: '11px 20px', opacity: (!draft.trim() || sending) ? 0.5 : 1 }}
        >
          Send
        </button>
      </div>
      <p style={{ fontSize: '0.68rem', color: '#6a6a6a', marginTop: 6 }}>Enter to send · Shift+Enter for a new line</p>
    </div>
  )
}
