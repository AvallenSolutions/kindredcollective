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

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
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

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protected routes - redirect to login if not authenticated
  // Use exact path or path + '/' to avoid matching unintended routes (e.g., /administration)
  const protectedPaths = ['/dashboard', '/profile', '/settings', '/admin', '/onboarding']
  const isProtectedPath = protectedPaths.some((path) =>
    pathname === path || pathname.startsWith(path + '/')
  )

  // Protected API routes - return 401 JSON if not authenticated
  const protectedApiPaths = ['/api/me', '/api/admin']
  const isProtectedApiPath = protectedApiPaths.some((path) =>
    pathname === path || pathname.startsWith(path + '/')
  )

  if (isProtectedApiPath && !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Admin routes - check if user has admin role
  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/api/admin/')
  if (isAdminPath && user) {
    // Use admin client to bypass RLS when checking user role
    const adminClient = createAdminClient()
    const { data: dbUser } = await adminClient
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!dbUser || dbUser.role !== 'ADMIN') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      }
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
