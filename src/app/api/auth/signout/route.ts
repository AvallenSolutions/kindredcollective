import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const { origin, protocol } = new URL(request.url)
  const effectiveOrigin = forwardedHost ? `${protocol}//${forwardedHost}` : origin

  // Create the redirect response first so we can write the cleared session
  // cookies directly onto it.
  const response = NextResponse.redirect(`${effectiveOrigin}/login`, { status: 302 })

  const cookieStore = await cookies()

  // Explicitly clear all Supabase auth cookies on the response.
  // signOut() should do this via setAll, but in practice it doesn't always
  // clear chunked cookies reliably, leaving the user appearing logged-in.
  const allCookies = cookieStore.getAll()
  for (const cookie of allCookies) {
    if (cookie.name.startsWith('sb-')) {
      response.cookies.set(cookie.name, '', {
        path: '/',
        expires: new Date(0),
        maxAge: 0,
      })
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  await supabase.auth.signOut()

  return response
}
