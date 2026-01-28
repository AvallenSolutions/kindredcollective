import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/session'

// POST /api/onboarding/join-organisation - Join existing organisation via invite token
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    const adminSupabase = createAdminClient()

    // Check if user is already in an organisation
    const { data: existingMembership } = await adminSupabase
      .from('OrganisationMember')
      .select('id')
      .eq('userId', user.id)
      .single()

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already a member of an organisation' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { inviteToken } = body

    if (!inviteToken) {
      return NextResponse.json(
        { error: 'Invite token is required' },
        { status: 400 }
      )
    }

    // Get organisation invite
    const { data: invite, error: inviteError } = await adminSupabase
      .from('OrganisationInvite')
      .select('*, organisation:Organisation(*)')
      .eq('token', inviteToken)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invalid invite token' },
        { status: 404 }
      )
    }

    // Check if invite has expired
    if (new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'This invite has expired' },
        { status: 400 }
      )
    }

    // Check if invite has already been accepted
    if (invite.acceptedAt) {
      return NextResponse.json(
        { error: 'This invite has already been used' },
        { status: 400 }
      )
    }

    // Check if invite is for this user's email
    if (invite.email !== user.email) {
      return NextResponse.json(
        { error: 'This invite is for a different email address' },
        { status: 403 }
      )
    }

    // Check if user's role matches organisation type
    const org = invite.organisation
    if ((org.type === 'BRAND' && user.role !== 'BRAND') ||
        (org.type === 'SUPPLIER' && user.role !== 'SUPPLIER')) {
      return NextResponse.json(
        { error: `This invite is for a ${org.type.toLowerCase()} organisation, but your account is for ${user.role.toLowerCase()}s` },
        { status: 400 }
      )
    }

    // Add user to organisation
    const { error: memberError } = await adminSupabase
      .from('OrganisationMember')
      .insert({
        organisationId: invite.organisationId,
        userId: user.id,
        role: invite.role, // Use role from invite (ADMIN or MEMBER)
        joinedAt: new Date().toISOString(),
      })

    if (memberError) {
      console.error('Error adding organisation member:', memberError)
      return NextResponse.json(
        { error: 'Failed to join organisation' },
        { status: 500 }
      )
    }

    // Mark invite as accepted
    await adminSupabase
      .from('OrganisationInvite')
      .update({ acceptedAt: new Date().toISOString() })
      .eq('id', invite.id)

    // If organisation is linked to a brand, link user to brand
    if (org.brandId) {
      const { data: brand } = await adminSupabase
        .from('Brand')
        .select('id')
        .eq('id', org.brandId)
        .single()

      return NextResponse.json({
        success: true,
        organisation: org,
        brand,
      })
    }

    // If organisation is linked to a supplier, link user to supplier
    if (org.supplierId) {
      const { data: supplier } = await adminSupabase
        .from('Supplier')
        .select('id')
        .eq('id', org.supplierId)
        .single()

      return NextResponse.json({
        success: true,
        organisation: org,
        supplier,
      })
    }

    return NextResponse.json({
      success: true,
      organisation: org,
    })
  } catch (error) {
    console.error('Error in POST /api/onboarding/join-organisation:', error)
    return NextResponse.json(
      { error: 'Unauthorized or invalid request' },
      { status: 401 }
    )
  }
}

// GET /api/onboarding/join-organisation?token=xxx - Validate organisation invite token
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Invite token is required' },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()

    // Get organisation invite
    const { data: invite, error: inviteError } = await adminSupabase
      .from('OrganisationInvite')
      .select('*, organisation:Organisation(*)')
      .eq('token', token)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invalid invite token' },
        { status: 404 }
      )
    }

    // Check if invite has expired
    if (new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'This invite has expired' },
        { status: 400 }
      )
    }

    // Check if invite has already been accepted
    if (invite.acceptedAt) {
      return NextResponse.json(
        { error: 'This invite has already been used' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      invite: {
        email: invite.email,
        role: invite.role,
        organisation: {
          name: invite.organisation.name,
          type: invite.organisation.type,
        },
      },
    })
  } catch (error) {
    console.error('Error in GET /api/onboarding/join-organisation:', error)
    return NextResponse.json(
      { error: 'Unauthorized or invalid request' },
      { status: 401 }
    )
  }
}
