import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Supabase sends users here after clicking email confirmation link.
// Handles both token_hash flow (new) and code flow (legacy PKCE).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type       = searchParams.get('type') as 'email' | 'recovery' | null
  const code       = searchParams.get('code')

  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value, options }: any) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // Path 1: token_hash flow (standard email confirmation, and password reset)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) {
      // A recovery link verifies into a real session — hand off to the
      // "set a new password" page rather than back to sign-in.
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/reset-password`)
      }
      return NextResponse.redirect(
        `${origin}/auth/login?message=Email confirmed! You can now sign in.`
      )
    }
    console.error('verifyOtp error:', error.message)
    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/auth/error?code=invalid_reset_link`)
    }
  }

  // Path 2: PKCE code exchange flow (some Supabase versions send ?code= instead)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(
        `${origin}/auth/login?message=Email confirmed! You can now sign in.`
      )
    }
    console.error('exchangeCodeForSession error:', error.message)
  }

  // Both paths failed — redirect to error page
  return NextResponse.redirect(`${origin}/auth/error?code=confirmation_failed`)
}
