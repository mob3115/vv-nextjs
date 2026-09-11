import { redirect } from 'next/navigation'
import type { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'

// Every authenticated page needs the same user + profile fetch, redirecting
// to login if either is missing — previously copy-pasted at the top of ~20
// page components. Extra role checks (e.g. admin-only pages) stay in the
// page itself, since the redirect target differs (forbidden vs. login).
export async function requireUserAndProfile(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  return { user, profile: profile as Profile }
}
