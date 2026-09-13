'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from './shared'
import { logAuditEvent } from './audit'
import type { ActionResult } from './auth'
import type { UserRole, ListingStatus } from '@/types'

const ASSIGNABLE_ROLES: UserRole[] = ['buyer', 'seller', 'dual', 'admin']
const ASSIGNABLE_LISTING_STATUSES: ListingStatus[] = ['active', 'paused', 'sold']

// Every action here is also backstopped by RLS (see migration 006 —
// "Admins can update any profile/listing" using is_admin()), but that
// alone would let a non-admin's request fail silently with 0 rows
// updated rather than a clear error, so each action re-checks the role
// itself before touching anything.
async function requireAdmin(supabase: ReturnType<typeof createClient>) {
  const user = await requireUser(supabase)
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Forbidden')
  return user
}

export async function updateUserRoleAction(userId: string, role: UserRole): Promise<ActionResult> {
  const supabase = createClient()
  const admin = await requireAdmin(supabase)

  if (!ASSIGNABLE_ROLES.includes(role)) return { error: 'Invalid role.' }
  if (userId === admin.id && role !== 'admin') {
    return { error: "You can't remove your own admin access." }
  }

  const { data: updated, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select('id')
    .single()

  if (error || !updated) {
    console.error('updateUserRoleAction error:', error)
    return { error: 'Failed to update role. Please try again.' }
  }

  await logAuditEvent(supabase, {
    actorId: admin.id,
    eventType: 'ADMIN',
    action: 'ROLE_CHANGE',
    resourceType: 'profile',
    resourceId: userId,
    metadata: { role },
  })

  revalidatePath('/admin/users')
  return { success: true }
}

export async function setUserSuspendedAction(userId: string, suspended: boolean): Promise<ActionResult> {
  const supabase = createClient()
  const admin = await requireAdmin(supabase)

  if (userId === admin.id) return { error: "You can't suspend your own account." }

  const { data: updated, error } = await supabase
    .from('profiles')
    .update({ suspended })
    .eq('id', userId)
    .select('id')
    .single()

  if (error || !updated) {
    console.error('setUserSuspendedAction error:', error)
    return { error: 'Failed to update account status. Please try again.' }
  }

  await logAuditEvent(supabase, {
    actorId: admin.id,
    eventType: 'ADMIN',
    action: suspended ? 'SUSPEND' : 'REINSTATE',
    resourceType: 'profile',
    resourceId: userId,
  })

  revalidatePath('/admin/users')
  return { success: true }
}

export async function setListingStatusAction(listingId: string, status: ListingStatus): Promise<ActionResult> {
  const supabase = createClient()
  const admin = await requireAdmin(supabase)

  if (!ASSIGNABLE_LISTING_STATUSES.includes(status)) return { error: 'Invalid status.' }

  const { data: updated, error } = await supabase
    .from('seller_listings')
    .update({ status })
    .eq('id', listingId)
    .select('id')
    .single()

  if (error || !updated) {
    console.error('setListingStatusAction error:', error)
    return { error: 'Failed to update listing. Please try again.' }
  }

  await logAuditEvent(supabase, {
    actorId: admin.id,
    eventType: 'ADMIN',
    action: 'LISTING_STATUS_CHANGE',
    resourceType: 'seller_listing',
    resourceId: listingId,
    metadata: { status },
  })

  revalidatePath('/admin/listings')
  return { success: true }
}
