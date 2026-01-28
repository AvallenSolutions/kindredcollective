import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/session'
import { randomBytes } from 'crypto'

// GET /api/organisations/[id]/invites - List organisation invites
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const adminSupabase = createAdminClient()

    // Check if user is owner or admin
    const { data: membership } = await adminSupabase
      .from('OrganisationMember')
      .select('role')
      .eq('organisationId', params.id)
      .eq('userId', user.id)
      .single()

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only owners and admins can view invites' },
        { status: 403 }
      )
    }

    // Get all invites
    const { data: invites, error } = await adminSupabase
      .from('OrganisationInvite')
      .select('*')
      .eq('organisationId', params.id)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching invites:', error)
      return NextResponse.json(
        { error: 'Failed to fetch invites' },
        { status: 500 }
      )
    }

    // Separate pending and accepted invites
    const pending = invites?.filter(inv => !inv.acceptedAt && new Date(inv.expiresAt) > new Date()) || []
    const used = invites?.filter(inv => inv.acceptedAt) || []
    const expired = invites?.filter(inv => !inv.acceptedAt && new Date(inv.expiresAt) <= new Date()) || []

    return NextResponse.json({
      success: true,
      invites: {
        pending,
        used,
        expired,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/organisations/[id]/invites:', error)
    return NextResponse.json(
      { error: 'Unauthorized or invalid request' },
      { status: 401 }
    )
  }
}

// POST /api/organisations/[id]/invites - Create new invite
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const adminSupabase = createAdminClient()

    // Check if user is owner or admin
    const { data: membership } = await adminSupabase
      .from('OrganisationMember')
      .select('role')
      .eq('organisationId', params.id)
      .eq('userId', user.id)
      .single()

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only owners and admins can invite members' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, role = 'MEMBER' } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!['ADMIN', 'MEMBER'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Can only invite as ADMIN or MEMBER' },
        { status: 400 }
      )
    }

    // Only owners can invite admins
    if (role === 'ADMIN' && membership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only the owner can invite admins' },
        { status: 403 }
      )
    }

    // Check if user already exists and is in the organisation
    const { data: existingUser } = await adminSupabase
      .from('User')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      const { data: existingMembership } = await adminSupabase
        .from('OrganisationMember')
        .select('id')
        .eq('organisationId', params.id)
        .eq('userId', existingUser.id)
        .single()

      if (existingMembership) {
        return NextResponse.json(
          { error: 'This user is already a member of your organisation' },
          { status: 400 }
        )
      }
    }

    // Check for existing pending invite
    const { data: existingInvite } = await adminSupabase
      .from('OrganisationInvite')
      .select('id, expiresAt')
      .eq('organisationId', params.id)
      .eq('email', email)
      .is('acceptedAt', null)
      .single()

    if (existingInvite && new Date(existingInvite.expiresAt) > new Date()) {
      return NextResponse.json(
        { error: 'An active invite already exists for this email' },
        { status: 400 }
      )
    }

    // Generate secure token
    const token = randomBytes(24).toString('base64url')

    // Create invite (expires in 7 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { data: invite, error: inviteError } = await adminSupabase
      .from('OrganisationInvite')
      .insert({
        organisationId: params.id,
        email,
        token,
        role,
        expiresAt: expiresAt.toISOString(),
        createdById: user.id,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Error creating invite:', inviteError)
      return NextResponse.json(
        { error: 'Failed to create invite' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      invite,
      inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signup?invite=${token}`,
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/organisations/[id]/invites:', error)
    return NextResponse.json(
      { error: 'Unauthorized or invalid request' },
      { status: 401 }
    )
  }
}
