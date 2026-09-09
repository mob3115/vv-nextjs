// Shared server-only helpers used by multiple 'use server' action files.
// Deliberately has NO 'use server' directive — it takes a raw Supabase
// client as an argument, which isn't a valid shape for a callable action.

import type { createClient } from '@/lib/supabase/server'

export async function requireUser(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

// Resolves whether `userId` is a party to `matchId` and, if so, which side —
// buyer_id is a real user id, but match.seller_id is a *listing* id, so the
// seller side can only be resolved by joining through seller_listings.
export async function resolveMatchParty(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  matchId: string
) {
  const { data: match } = await supabase
    .from('matches')
    .select('*, seller_listings(seller_id, industry, location_region)')
    .eq('id', matchId)
    .maybeSingle()

  if (!match || !match.seller_listings) return null

  const sellerUserId: string = match.seller_listings.seller_id
  const isBuyer = match.buyer_id === userId
  const isSeller = sellerUserId === userId
  if (!isBuyer && !isSeller) return null

  return { match, sellerUserId, isBuyer }
}
