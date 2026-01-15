import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const { email, password, role, firstName, lastName, companyName } = body

  if (!email || !password || !role) {
    return NextResponse.json(
      { error: 'Email, password, and role are required' },
      { status: 400 }
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
        company_name: companyName,
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

  // Create user record in our database
  const { error: userError } = await supabase
    .from('User')
    .insert({
      id: authData.user.id,
      email: authData.user.email!,
      role: userRole,
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
    await supabase
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
