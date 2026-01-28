import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const role = searchParams.get('role') || 'BRAND' // Default to BRAND if not specified
  const inviteToken = searchParams.get('invite')
  const next = searchParams.get('next') ?? '/onboarding' // Redirect to onboarding for profile setup

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
        const adminSupabase = createAdminClient()

        // Validate invite token (REQUIRED for new signups)
        if (!inviteToken) {
          // New users MUST have an invite token
          return NextResponse.redirect(`${origin}/signup?error=invite_required`)
        }

        let validatedInviteToken = null
        if (inviteToken) {
          const { data: invite, error: inviteError } = await adminSupabase
            .from('InviteLink')
            .select('id, token, isActive, expiresAt, maxUses, usedCount')
            .eq('token', inviteToken)
            .single()

          // Check invite validity
          if (!invite ||
              !invite.isActive ||
              (invite.expiresAt && new Date(invite.expiresAt) < new Date()) ||
              (invite.maxUses && invite.usedCount >= invite.maxUses)) {
            // Invalid, inactive, expired, or maxed out invite
            return NextResponse.redirect(`${origin}/signup?error=invalid_invite`)
          }

          validatedInviteToken = inviteToken

          // Increment invite usage count
          await adminSupabase
            .from('InviteLink')
            .update({ usedCount: invite.usedCount + 1 })
            .eq('id', invite.id)
        }

        // Create user record in our database
        const { error: createError } = await adminSupabase
          .from('User')
          .insert({
            id: user.id,
            email: user.email!,
            role: userRole,
            inviteLinkToken: validatedInviteToken,
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
