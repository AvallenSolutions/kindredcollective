import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()
  const body = await request.json()

  const { email, password, role, firstName, lastName, inviteToken } = body

  if (!email || !password || !role) {
    return NextResponse.json(
      { error: 'Email, password, and role are required' },
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
    .select('id, token, isActive, expiresAt, maxUses, usedCount, targetRole')
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

  let userRole = role.toUpperCase()
  if (!['BRAND', 'SUPPLIER', 'MEMBER'].includes(userRole)) {
    return NextResponse.json(
      { error: 'Invalid role' },
      { status: 400 }
    )
  }

  // If the invite specifies a target role, enforce it
  if (invite.targetRole) {
    userRole = invite.targetRole
  }

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: userRole,
        first_name: firstName,
        last_name: lastName,
      },
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
      role: userRole,
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
  // This avoids race conditions from concurrent signups reading the same
  // usedCount value and both incrementing to the same number.
  const { count: usageCount } = await adminSupabase
    .from('User')
    .select('id', { count: 'exact', head: true })
    .eq('inviteLinkToken', inviteToken)

  await adminSupabase
    .from('InviteLink')
    .update({ usedCount: usageCount || 0 })
    .eq('id', invite.id)

  return NextResponse.json({
    success: true,
    user: {
      id: authData.user.id,
      email: authData.user.email,
      role: userRole,
    },
    message: authData.user.email_confirmed_at
      ? 'Account created successfully'
      : 'Please check your email to verify your account',
  })
}
