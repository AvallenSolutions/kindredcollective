import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const role = searchParams.get('role') || 'BRAND' // Default to BRAND if not specified
  const next = searchParams.get('next') ?? '/dashboard?welcome=true'

  if (code) {
    const supabase = await createClient()
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && sessionData?.user) {
      const user = sessionData.user
      const userRole = role.toUpperCase()

      // Update user metadata with role
      await supabase.auth.updateUser({
        data: { role: userRole }
      })

      // Check if user already exists in our User table
      const { data: existingUser } = await supabase
        .from('User')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingUser) {
        // Create user record in our database
        const { error: createError } = await supabase
          .from('User')
          .insert({
            id: user.id,
            email: user.email!,
            role: userRole,
            emailVerified: user.email_confirmed_at ? new Date(user.email_confirmed_at).toISOString() : null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })

        if (createError) {
          console.error('Error creating user record:', createError)
          // Don't fail the auth flow, but log the error
        }

        // Create a basic member profile
        const metadata = user.user_metadata || {}
        const firstName = metadata.first_name || metadata.full_name?.split(' ')[0] || ''
        const lastName = metadata.last_name || metadata.full_name?.split(' ').slice(1).join(' ') || ''

        if (firstName || lastName) {
          await supabase
            .from('Member')
            .insert({
              userId: user.id,
              firstName: firstName || 'User',
              lastName: lastName || '',
              isPublic: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
