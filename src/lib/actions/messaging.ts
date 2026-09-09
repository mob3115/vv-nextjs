'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { messageSchema } from '@/lib/validations'
import { requireUser, resolveMatchParty } from './shared'
import type { MessageInput } from '@/lib/validations'
import type { ActionResult } from './auth'

// ============================================================
// CONVERSATIONS — one per mutual match, created lazily on first message
// ============================================================

// Messaging is available the moment a match is mutual — it is NOT gated on
// an NDA being signed. The NDA is only ever shown as a status indicator so
// each side knows whether it's safe to share confidential details.
async function getOrCreateConversation(
  supabase: ReturnType<typeof createClient>,
  matchId: string,
  buyerId: string,
  sellerUserId: string
) {
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('match_id', matchId)
    .maybeSingle()

  if (existing) return existing

  const { data: created, error } = await supabase
    .from('conversations')
    .upsert(
      { match_id: matchId, buyer_id: buyerId, seller_id: sellerUserId },
      { onConflict: 'match_id' }
    )
    .select('*')
    .single()

  if (error) throw error
  return created
}

export async function getConversationDetail(matchId: string) {
  const supabase = createClient()
  const user = await requireUser(supabase)

  const party = await resolveMatchParty(supabase, user.id, matchId)
  if (!party) return null
  const { match, sellerUserId, isBuyer } = party

  if (match.status !== 'mutual') {
    return { matchId, isBuyer, matchStatus: match.status, notMutual: true as const }
  }

  const [{ data: buyerProfile }, { data: sellerProfile }, { data: nda }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', match.buyer_id).single(),
    supabase.from('profiles').select('full_name').eq('id', sellerUserId).single(),
    supabase.from('ndas').select('status, buyer_signed_at, seller_signed_at').eq('match_id', matchId).maybeSingle(),
  ])

  const conversation = await getOrCreateConversation(supabase, matchId, match.buyer_id, sellerUserId)

  // Mark anything the other side sent as read now that this page is being viewed.
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversation.id)
    .neq('sender_id', user.id)
    .is('read_at', null)

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true })

  const ndaSigned = { buyer: !!nda?.buyer_signed_at, seller: !!nda?.seller_signed_at }

  return {
    matchId,
    isBuyer,
    matchStatus: match.status as 'mutual',
    notMutual: false as const,
    conversationId: conversation.id as string,
    currentUserId: user.id,
    otherPartyName: isBuyer ? (sellerProfile?.full_name ?? 'Seller') : (buyerProfile?.full_name ?? 'Buyer'),
    ndaStatus: ndaSigned.buyer && ndaSigned.seller
      ? 'both_signed' as const
      : (isBuyer ? ndaSigned.buyer : ndaSigned.seller)
        ? 'you_signed' as const
        : (isBuyer ? ndaSigned.seller : ndaSigned.buyer)
          ? 'them_signed' as const
          : 'none' as const,
    messages: messages ?? [],
  }
}

export async function sendMessage(
  input: MessageInput
): Promise<ActionResult & { message?: any; conversationId?: string }> {
  const parsed = messageSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid message' }

  const supabase = createClient()
  const user = await requireUser(supabase)
  const { matchId, content } = parsed.data

  const party = await resolveMatchParty(supabase, user.id, matchId)
  if (!party) return { error: 'Match not found or access denied.' }
  const { match, sellerUserId } = party

  if (match.status !== 'mutual') {
    return { error: 'You can only message a mutual match.' }
  }

  let conversation
  try {
    conversation = await getOrCreateConversation(supabase, matchId, match.buyer_id, sellerUserId)
  } catch (err) {
    console.error('getOrCreateConversation error:', err)
    return { error: 'Failed to open conversation. Please try again.' }
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversation.id, sender_id: user.id, content })
    .select('*')
    .single()

  if (error) {
    console.error('sendMessage error:', error)
    return { error: 'Failed to send message. Please try again.' }
  }

  revalidatePath('/buyer/chat')
  revalidatePath('/seller/chat')
  revalidatePath(`/buyer/chat/${matchId}`)
  revalidatePath(`/seller/chat/${matchId}`)

  return { success: true, message, conversationId: conversation.id }
}

export async function markConversationRead(conversationId: string): Promise<ActionResult> {
  const supabase = createClient()
  const user = await requireUser(supabase)

  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .is('read_at', null)

  if (error) return { error: 'Failed to mark messages read.' }
  return { success: true }
}

// ============================================================
// INBOX — one row per mutual match, with last message + unread count
// ============================================================

async function attachThreadPreviews<T extends { matchId: string; conversationId: string | null }>(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  rows: T[]
) {
  const conversationIds = rows.map(r => r.conversationId).filter((id): id is string => !!id)

  const { data: allMessages } = conversationIds.length > 0
    ? await supabase
        .from('messages')
        .select('conversation_id, sender_id, content, created_at, read_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: true })
    : { data: [] }

  const byConversation = new Map<string, typeof allMessages>()
  for (const m of allMessages ?? []) {
    const list = byConversation.get(m.conversation_id) ?? []
    list.push(m)
    byConversation.set(m.conversation_id, list)
  }

  return rows.map(row => {
    const thread = row.conversationId ? byConversation.get(row.conversationId) ?? [] : []
    const last = thread[thread.length - 1]
    const unreadCount = thread.filter(m => m.sender_id !== userId && !m.read_at).length
    return {
      ...row,
      lastMessage: last?.content ?? null,
      lastMessageAt: last?.created_at ?? null,
      unreadCount,
    }
  })
}

export async function getBuyerInbox() {
  const supabase = createClient()
  const user = await requireUser(supabase)

  const { data: matches } = await supabase
    .from('matches')
    .select('id, compatibility_score, seller_listings(industry, industry_icon, location_region, business_name)')
    .eq('buyer_id', user.id)
    .eq('status', 'mutual')
    .order('created_at', { ascending: false })

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, match_id')
    .eq('buyer_id', user.id)

  const conversationByMatch = new Map((conversations ?? []).map((c: any) => [c.match_id, c.id]))

  const rows = (matches ?? []).map((m: any) => ({
    matchId: m.id as string,
    conversationId: conversationByMatch.get(m.id) ?? null,
    listing: m.seller_listings,
  }))

  return attachThreadPreviews(supabase, user.id, rows)
}

export async function getSellerInbox() {
  const supabase = createClient()
  const user = await requireUser(supabase)

  const { data: listing } = await supabase
    .from('seller_listings')
    .select('id')
    .eq('seller_id', user.id)
    .maybeSingle()

  if (!listing) return []

  const { data: matches } = await supabase
    .from('matches')
    .select('id, compatibility_score, buyer_id')
    .eq('seller_id', listing.id)
    .eq('status', 'mutual')
    .order('created_at', { ascending: false })

  const buyerIds = (matches ?? []).map((m: any) => m.buyer_id)
  const { data: buyerProfiles } = buyerIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', buyerIds)
    : { data: [] }
  const buyerNameById = new Map((buyerProfiles ?? []).map((p: any) => [p.id, p.full_name]))

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, match_id')
    .eq('seller_id', user.id)

  const conversationByMatch = new Map((conversations ?? []).map((c: any) => [c.match_id, c.id]))

  const rows = (matches ?? []).map((m: any) => ({
    matchId: m.id as string,
    conversationId: conversationByMatch.get(m.id) ?? null,
    buyerName: buyerNameById.get(m.buyer_id) ?? 'Buyer',
  }))

  return attachThreadPreviews(supabase, user.id, rows)
}
