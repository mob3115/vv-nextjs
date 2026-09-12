'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireUser, resolveMatchParty } from './shared'
import { logAuditEvent } from './audit'
import type { ActionResult } from './auth'

const BUCKET = 'vault-documents'
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB — under the 25MB server action body limit
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
])

type Tier = 'pre-nda' | 'post-nda'

// ============================================================
// SELLER — upload, list, delete own documents
// ============================================================

export async function uploadVaultDocument(formData: FormData): Promise<ActionResult> {
  const supabase = createClient()
  const user = await requireUser(supabase)

  const file = formData.get('file')
  const tier = formData.get('tier')

  if (!(file instanceof File) || file.size === 0) return { error: 'Please choose a file.' }
  if (tier !== 'pre-nda' && tier !== 'post-nda') return { error: 'Invalid document tier.' }
  if (file.size > MAX_FILE_SIZE) return { error: 'File is too large — 20MB limit.' }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { error: 'Unsupported file type. PDF, Word, Excel, or image files only.' }
  }

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${user.id}/${randomUUID()}-${sanitizedName}`

  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type })

  if (uploadError) {
    console.error('vault upload error:', uploadError)
    return { error: 'Failed to upload document. Please try again.' }
  }

  const { data: created, error: insertError } = await supabase.from('documents').insert({
    seller_id: user.id,
    file_name: file.name,
    file_path: path,
    file_size: file.size,
    mime_type: file.type,
    tier,
  }).select('id').single()

  if (insertError) {
    console.error('vault document insert error:', insertError)
    await admin.storage.from(BUCKET).remove([path]) // don't leave an orphaned file
    return { error: 'Failed to save document. Please try again.' }
  }

  await logAuditEvent(supabase, {
    actorId: user.id,
    eventType: 'VAULT',
    action: 'UPLOAD',
    resourceType: 'document',
    resourceId: created.id,
    metadata: { fileName: file.name, tier },
  })

  revalidatePath('/seller/vault')
  return { success: true }
}

export async function deleteVaultDocument(documentId: string): Promise<ActionResult> {
  const supabase = createClient()
  const user = await requireUser(supabase)

  const { data: doc } = await supabase
    .from('documents')
    .select('file_path, seller_id')
    .eq('id', documentId)
    .eq('seller_id', user.id)
    .maybeSingle()

  if (!doc) return { error: 'Document not found or access denied.' }

  const admin = createAdminClient()
  await admin.storage.from(BUCKET).remove([doc.file_path])

  const { error } = await supabase.from('documents').delete().eq('id', documentId).eq('seller_id', user.id)
  if (error) {
    console.error('vault delete error:', error)
    return { error: 'Failed to delete document. Please try again.' }
  }

  await logAuditEvent(supabase, {
    actorId: user.id,
    eventType: 'VAULT',
    action: 'DELETE',
    resourceType: 'document',
    resourceId: documentId,
    metadata: { fileName: doc.file_path.split('/').pop() },
  })

  revalidatePath('/seller/vault')
  return { success: true }
}

export async function getSellerVaultDocuments() {
  const supabase = createClient()
  const user = await requireUser(supabase)

  const { data } = await supabase
    .from('documents')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  return data ?? []
}

// ============================================================
// BUYER — view a seller's vault, gated by RLS on `documents`
// (pre-nda requires a mutual match, post-nda requires a signed NDA —
// see migration 004). The buyer's own client is used directly; RLS does
// the actual gating, so this never needs elevated access.
// ============================================================

export async function getBuyerVaultAccess(matchId: string) {
  const supabase = createClient()
  const user = await requireUser(supabase)

  const party = await resolveMatchParty(supabase, user.id, matchId)
  if (!party || party.isBuyer !== true) return null
  const { sellerUserId, match } = party
  if (match.status !== 'mutual') return { matchId, sellerUserId, notMutual: true as const, documents: [] }

  const { data } = await supabase
    .from('documents')
    .select('*')
    .eq('seller_id', sellerUserId)
    .order('created_at', { ascending: false })

  const { data: nda } = await supabase
    .from('ndas')
    .select('status')
    .eq('match_id', matchId)
    .maybeSingle()

  return {
    matchId,
    sellerUserId,
    notMutual: false as const,
    ndaSigned: nda?.status === 'signed',
    documents: data ?? [],
  }
}

// Works for both the owning seller and an authorized buyer — RLS on
// `documents` decides whether the row is visible at all; only the
// resulting short-lived signed URL is generated with elevated access.
export async function getVaultDownloadUrl(documentId: string): Promise<ActionResult & { url?: string }> {
  const supabase = createClient()
  await requireUser(supabase)

  const { data: doc } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', documentId)
    .maybeSingle()

  if (!doc) return { error: 'Document not found or access denied.' }

  const admin = createAdminClient()
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(doc.file_path, 60)

  if (error || !data) {
    console.error('vault signed url error:', error)
    return { error: 'Failed to generate download link. Please try again.' }
  }

  return { success: true, url: data.signedUrl }
}
