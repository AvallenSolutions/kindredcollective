import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmailConfirmationEmail } from '@/lib/email'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const adminSupabase = createAdminClient()
  const body = await request.json()

  const { email, password, firstName, lastName, inviteToken } = body

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    )
  }

  // Validate invite token (required for signup)
  if (!inviteToken) {
    return NextResponse.json(
      { error: 'An invite link is required to join Kindred Collective' },
      { status: 403 }
    )
  }

  const { data: invite, error: inviteError } = await adminSupabase
    .from('InviteLink')
    .select('id, token, isActive, expiresAt, maxUses, usedCount')
    .eq('token', inviteToken)
    .single()

  if (inviteError || !invite) {
    if (inviteError && inviteError.code !== 'PGRST116') {
      console.error('[Signup] Error validating invite token:', inviteError)
    }
    return NextResponse.json(
      { error: 'Invalid invite link' },
      { status: 403 }
    )
  }

  // Check if invite is active
  if (!invite.isActive) {
    return NextResponse.json(
      { error: 'This invite link has been deactivated' },
      { status: 403 }
    )
  }

  // Check if expired
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return NextResponse.json(
      { error: 'This invite link has expired' },
      { status: 403 }
    )
  }

  // Check if max uses reached
  if (invite.maxUses && invite.usedCount >= invite.maxUses) {
    return NextResponse.json(
      { error: 'This invite link has reached its maximum usage limit' },
      { status: 403 }
    )
  }

  // Create auth user via admin API so Supabase does NOT send its default
  // confirmation email — we send our own branded one via Resend instead.
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
    },
  })

  if (authError) {
    return NextResponse.json(
      { error: authError.message },
      { status: 400 }
    )
  }

  if (!authData.user) {
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }

  // Create user record in our database with invite tracking.
  // This must succeed - the User record links auth to roles and profiles.
  const { error: userError } = await adminSupabase
    .from('User')
    .insert({
      id: authData.user.id,
      email: authData.user.email!,
      role: 'MEMBER',
      inviteLinkToken: inviteToken,
      emailVerified: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

  if (userError) {
    console.error('[Signup] Failed to create User record:', userError)
    // Clean up the auth user to avoid an orphaned auth account
    await adminSupabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json(
      { error: 'Failed to complete signup. Please try again.' },
      { status: 500 }
    )
  }

  // Create member profile
  if (firstName || lastName) {
    const { error: memberError } = await adminSupabase
      .from('Member')
      .insert({
        id: crypto.randomUUID(),
        userId: authData.user.id,
        firstName: firstName || 'User',
        lastName: lastName || '',
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

    if (memberError) {
      // Non-fatal: user can create their profile during onboarding
      console.error('[Signup] Failed to create Member profile:', memberError)
    }
  }

  // Update invite usage count by counting actual users who used this token.
  const { count: usageCount } = await adminSupabase
    .from('User')
    .select('id', { count: 'exact', head: true })
    .eq('inviteLinkToken', inviteToken)

  await adminSupabase
    .from('InviteLink')
    .update({ usedCount: usageCount || 0 })
    .eq('id', invite.id)

  // Generate a confirmation link token via admin API and send branded email
  const origin = process.env.NEXT_PUBLIC_APP_URL ||
    `${request.nextUrl.protocol}//${request.nextUrl.host}`

  try {
    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
    })

    if (linkError) {
      console.error('[Signup] generateLink error:', linkError)
    } else {
      const hashedToken = linkData?.properties?.hashed_token
      if (hashedToken) {
        const confirmUrl = `${origin}/api/auth/callback?token_hash=${encodeURIComponent(hashedToken)}&type=signup`
        await sendEmailConfirmationEmail(email, confirmUrl, firstName)
        console.log('[Signup] confirmation email sent to', email)
      } else {
        console.error('[Signup] generateLink returned no hashed_token')
      }
    }
  } catch (err) {
    // Non-fatal: user was created, they can request a new confirmation email
    console.error('[Signup] Failed to send confirmation email:', err)
  }

  return NextResponse.json({
    success: true,
    user: {
      id: authData.user.id,
      email: authData.user.email,
      role: 'MEMBER',
    },
    message: 'Please check your email to confirm your account',
  })
}
