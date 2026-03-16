import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { origin } = new URL(request.url)

  // Create the redirect response first so we can write the cleared session
  // cookies directly onto it. Using cookies() from next/headers writes to the
  // implicit default response, which is NOT the same object as a custom
  // NextResponse.redirect — meaning the browser would never receive the
  // cleared cookies and the user would appear still logged-in.
  const response = NextResponse.redirect(`${origin}/login`, { status: 302 })

  const cookieStore = await cookies()
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
