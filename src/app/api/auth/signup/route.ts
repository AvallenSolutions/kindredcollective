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
    .select('id, token, isActive, expiresAt, maxUses, usedCount')
    .eq('token', inviteToken)
    .single()

  if (inviteError || !invite) {
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

  const userRole = role.toUpperCase()
  if (!['BRAND', 'SUPPLIER'].includes(userRole)) {
    return NextResponse.json(
      { error: 'Invalid role' },
      { status: 400 }
    )
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

  // Create user record in our database with invite tracking
  const { error: userError } = await adminSupabase
    .from('User')
    .insert({
      id: authData.user.id,
      email: authData.user.email!,
      role: userRole,
      inviteLinkToken: inviteToken, // Track which invite was used
      emailVerified: null, // Will be set when email is confirmed
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

  if (userError) {
    console.error('Error creating user record:', userError)
    // Don't fail - the user can still use the app
  }

  // Create member profile
  if (firstName || lastName) {
    await adminSupabase
      .from('Member')
      .insert({
        userId: authData.user.id,
        firstName: firstName || 'User',
        lastName: lastName || '',
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
  }

  // Increment invite usage count
  await adminSupabase
    .from('InviteLink')
    .update({ usedCount: invite.usedCount + 1 })
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
