'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { registerSchema, loginSchema } from '@/lib/validations'
import type { RegisterInput, LoginInput } from '@/lib/validations'

export type ActionResult = {
  error?: string
  success?: boolean
}

export async function registerAction(input: RegisterInput): Promise<ActionResult> {
  // Validate input server-side (never trust client validation alone)
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { email, password, fullName, role } = parsed.data
  const supabase = createClient()

  // Sign up via Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
      data: { full_name: fullName, role },
    },
  })

  if (error) {
    // Normalize Supabase error messages for the UI
    if (error.message.includes('already registered')) {
      return { error: 'An account with this email already exists. Please sign in.' }
    }
    return { error: error.message }
  }

  if (!data.user) {
    return { error: 'Registration failed. Please try again.' }
  }

  // Profile row is created by a Supabase database trigger (see migration).
  // We don't need to insert it here — the trigger handles it atomically.

  return { success: true }
}

export async function loginAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { email, password } = parsed.data
  const supabase = createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Never reveal whether the email or password was wrong specifically
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Invalid email or password.' }
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Please check your email and confirm your account before signing in.' }
    }
    return { error: 'Sign in failed. Please try again.' }
  }

  revalidatePath('/', 'layout')
  redirect('/buyer/discover') // middleware will re-route by role
}

export async function logoutAction(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/auth/login')
}

export async function getSessionAction() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}
