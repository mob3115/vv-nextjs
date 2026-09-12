// Shared server-only helper used by multiple 'use server' action files.
// Deliberately has NO 'use server' directive — same reasoning as shared.ts:
// it takes a raw Supabase client as an argument, which isn't a valid shape
// for a callable action.
//
// Event types match what src/app/admin/audit/page.tsx already renders
// distinct colors for: AUTH, NDA, VAULT, MATCH (ADMIN/SYSTEM/RATE_LIMIT are
// reserved for future use — nothing currently emits them).

import type { createClient } from '@/lib/supabase/server'

export type AuditEventType = 'AUTH' | 'NDA' | 'VAULT' | 'MATCH'

interface AuditEvent {
  actorId: string | null
  eventType: AuditEventType
  action: string
  resourceType?: string
  resourceId?: string
  metadata?: Record<string, unknown>
}

// Logging must never break the action it's attached to — a failed audit
// insert is reported to the server console and swallowed, not thrown.
export async function logAuditEvent(
  supabase: ReturnType<typeof createClient>,
  event: AuditEvent
) {
  const { error } = await supabase.from('audit_logs').insert({
    actor_id: event.actorId,
    event_type: event.eventType,
    action: event.action,
    resource_type: event.resourceType ?? null,
    resource_id: event.resourceId ?? null,
    metadata: event.metadata ?? {},
  })
  if (error) console.error('logAuditEvent error:', error)
}
