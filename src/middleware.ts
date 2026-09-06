import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/auth/login', '/auth/register', '/auth/confirm', '/auth/error']

// Role-based route prefixes
const BUYER_ROUTES = ['/buyer']
const SELLER_ROUTES = ['/seller']
const ADMIN_ROUTES = ['/admin']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() refreshes the session token automatically
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Allow public routes without auth
  if (PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    // Redirect logged-in users away from auth pages
    if (user && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register'))) {
      return redirectByRole(user, request)
    }
    return supabaseResponse
  }

  // Require auth for all other routes
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Fetch user role from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'buyer'

  // Role-based access control
  const isBuyerRoute  = BUYER_ROUTES.some(r => pathname.startsWith(r))
  const isSellerRoute = SELLER_ROUTES.some(r => pathname.startsWith(r))
  const isAdminRoute  = ADMIN_ROUTES.some(r => pathname.startsWith(r))

  if (isAdminRoute && role !== 'admin') {
    return NextResponse.redirect(new URL('/auth/error?code=forbidden', request.url))
  }
  if (isBuyerRoute  && !['buyer', 'dual', 'admin'].includes(role)) {
    return NextResponse.redirect(new URL('/seller/dashboard', request.url))
  }
  if (isSellerRoute && !['seller', 'dual', 'admin'].includes(role)) {
    return NextResponse.redirect(new URL('/buyer/discover', request.url))
  }

  return supabaseResponse
}

function redirectByRole(user: { id: string } | null, request: NextRequest) {
  // Default redirect after login — middleware re-runs to get role
  return NextResponse.redirect(new URL('/buyer/discover', request.url))
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
