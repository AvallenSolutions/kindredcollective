import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/session'

// POST /api/organisations/[id]/transfer - Transfer ownership
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const adminSupabase = createAdminClient()

    // Check if current user is the owner
    const { data: currentMembership } = await adminSupabase
      .from('OrganisationMember')
      .select('role')
      .eq('organisationId', params.id)
      .eq('userId', user.id)
      .single()

    if (!currentMembership || currentMembership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only the owner can transfer ownership' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { newOwnerId } = body

    if (!newOwnerId) {
      return NextResponse.json(
        { error: 'New owner ID is required' },
        { status: 400 }
      )
    }

    // Can't transfer to yourself
    if (newOwnerId === user.id) {
      return NextResponse.json(
        { error: 'You are already the owner' },
        { status: 400 }
      )
    }

    // Check if new owner is a member (must be at least ADMIN)
    const { data: newOwnerMembership } = await adminSupabase
      .from('OrganisationMember')
      .select('role')
      .eq('organisationId', params.id)
      .eq('userId', newOwnerId)
      .single()

    if (!newOwnerMembership) {
      return NextResponse.json(
        { error: 'New owner must be a member of the organisation' },
        { status: 400 }
      )
    }

    if (newOwnerMembership.role === 'MEMBER') {
      return NextResponse.json(
        { error: 'New owner must be an admin. Promote them to admin first.' },
        { status: 400 }
      )
    }

    // Transfer ownership: demote current owner to admin, promote new owner
    // Use a transaction-like approach by doing updates in sequence

    // 1. Update new owner to OWNER
    const { error: promoteError } = await adminSupabase
      .from('OrganisationMember')
      .update({ role: 'OWNER' })
      .eq('organisationId', params.id)
      .eq('userId', newOwnerId)

    if (promoteError) {
      console.error('Error promoting new owner:', promoteError)
      return NextResponse.json(
        { error: 'Failed to transfer ownership' },
        { status: 500 }
      )
    }

    // 2. Demote current owner to ADMIN
    const { error: demoteError } = await adminSupabase
      .from('OrganisationMember')
      .update({ role: 'ADMIN' })
      .eq('organisationId', params.id)
      .eq('userId', user.id)

    if (demoteError) {
      console.error('Error demoting current owner:', demoteError)
      // Try to rollback by demoting new owner back
      await adminSupabase
        .from('OrganisationMember')
        .update({ role: 'ADMIN' })
        .eq('organisationId', params.id)
        .eq('userId', newOwnerId)

      return NextResponse.json(
        { error: 'Failed to complete ownership transfer' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Ownership transferred successfully',
    })
  } catch (error) {
    console.error('Error in POST /api/organisations/[id]/transfer:', error)
    return NextResponse.json(
      { error: 'Unauthorized or invalid request' },
      { status: 401 }
    )
  }
}
