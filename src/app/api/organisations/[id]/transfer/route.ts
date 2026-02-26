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

    // Transfer ownership atomically using a Postgres function via RPC.
    // Falls back to sequential updates if the RPC is not available.
    const { error: rpcError } = await adminSupabase.rpc('transfer_org_ownership', {
      p_org_id: params.id,
      p_old_owner_id: user.id,
      p_new_owner_id: newOwnerId,
    })

    if (rpcError) {
      // Fallback: sequential updates with rollback
      console.warn('RPC transfer_org_ownership not available, using fallback:', rpcError.message)

      // 1. Demote current owner first (safer order - prevents 2 owners)
      const { error: demoteError } = await adminSupabase
        .from('OrganisationMember')
        .update({ role: 'ADMIN' })
        .eq('organisationId', params.id)
        .eq('userId', user.id)

      if (demoteError) {
        console.error('Error demoting current owner:', demoteError)
        return NextResponse.json(
          { error: 'Failed to transfer ownership' },
          { status: 500 }
        )
      }

      // 2. Promote new owner
      const { error: promoteError } = await adminSupabase
        .from('OrganisationMember')
        .update({ role: 'OWNER' })
        .eq('organisationId', params.id)
        .eq('userId', newOwnerId)

      if (promoteError) {
        console.error('Error promoting new owner:', promoteError)
        // Rollback: restore original owner
        await adminSupabase
          .from('OrganisationMember')
          .update({ role: 'OWNER' })
          .eq('organisationId', params.id)
          .eq('userId', user.id)

        return NextResponse.json(
          { error: 'Failed to complete ownership transfer' },
          { status: 500 }
        )
      }
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
