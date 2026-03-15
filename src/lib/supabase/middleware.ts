import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

type CookieToSet = { name: string; value: string; options: CookieOptions }

// Create admin client for bypassing RLS in middleware
function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

// Routes that require authentication
const PROTECTED_PATHS = [
  '/dashboard',
  '/profile',
  '/settings',
  '/admin',
  '/community',
  '/explore',
  '/events',
  '/offers',
  '/news',
  '/search',
  '/onboarding',
]

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname.startsWith(path))
}

function redirectToLogin(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.searchParams.set('redirect', request.nextUrl.pathname)
  return NextResponse.redirect(url)
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  let supabaseResponse = NextResponse.next({
    request,
  })

  let supabase
  try {
    supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: CookieToSet[]) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )
  } catch (error) {
    console.error('[Middleware] Failed to create Supabase client:', error)
    // If we can't create the client on a protected route, block access
    if (isProtectedRoute(pathname)) {
      return redirectToLogin(request)
    }
    return supabaseResponse
  }

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (error) {
    console.error('[Middleware] Failed to get user:', error)
    // If auth check fails on a protected route, block access
    if (isProtectedRoute(pathname)) {
      return redirectToLogin(request)
    }
    return supabaseResponse
  }

  // Protected routes - redirect to login if not authenticated
  if (isProtectedRoute(pathname) && !user) {
    return redirectToLogin(request)
  }

  // Admin routes - check if user has admin role
  if (pathname.startsWith('/admin') && user) {
    try {
      // Use admin client to bypass RLS when checking user role
      const adminClient = createAdminClient()
      const { data: dbUser } = await adminClient
        .from('User')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!dbUser || dbUser.role !== 'ADMIN') {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    } catch (error) {
      console.error('[Middleware] Failed to check admin role:', error)
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // Redirect logged-in users away from auth pages (except password reset)
  const authPaths = ['/login', '/signup']
  const isAuthPath = authPaths.some((path) =>
    pathname.startsWith(path)
  )

  if (isAuthPath && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
