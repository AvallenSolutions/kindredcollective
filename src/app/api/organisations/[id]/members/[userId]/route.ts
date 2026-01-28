import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/session'

// PATCH /api/organisations/[id]/members/[userId] - Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const user = await requireAuth()
    const adminSupabase = createAdminClient()

    // Check if current user is owner or admin
    const { data: currentMembership } = await adminSupabase
      .from('OrganisationMember')
      .select('role')
      .eq('organisationId', params.id)
      .eq('userId', user.id)
      .single()

    if (!currentMembership || !['OWNER', 'ADMIN'].includes(currentMembership.role)) {
      return NextResponse.json(
        { error: 'Only owners and admins can update member roles' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { role } = body

    if (!role || !['OWNER', 'ADMIN', 'MEMBER'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Check if target member exists
    const { data: targetMembership } = await adminSupabase
      .from('OrganisationMember')
      .select('role')
      .eq('organisationId', params.id)
      .eq('userId', params.userId)
      .single()

    if (!targetMembership) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Only owners can change roles to/from OWNER
    if (role === 'OWNER' || targetMembership.role === 'OWNER') {
      if (currentMembership.role !== 'OWNER') {
        return NextResponse.json(
          { error: 'Only the owner can transfer ownership' },
          { status: 403 }
        )
      }
    }

    // Admins can't change other admin roles (only owner can)
    if (currentMembership.role === 'ADMIN' && targetMembership.role === 'ADMIN' && role !== 'MEMBER') {
      return NextResponse.json(
        { error: 'Only the owner can change admin roles' },
        { status: 403 }
      )
    }

    // Update role
    const { error: updateError } = await adminSupabase
      .from('OrganisationMember')
      .update({ role })
      .eq('organisationId', params.id)
      .eq('userId', params.userId)

    if (updateError) {
      console.error('Error updating member role:', updateError)
      return NextResponse.json(
        { error: 'Failed to update member role' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Member role updated successfully',
    })
  } catch (error) {
    console.error('Error in PATCH /api/organisations/[id]/members/[userId]:', error)
    return NextResponse.json(
      { error: 'Unauthorized or invalid request' },
      { status: 401 }
    )
  }
}

// DELETE /api/organisations/[id]/members/[userId] - Remove member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const user = await requireAuth()
    const adminSupabase = createAdminClient()

    // Check if current user is owner or admin
    const { data: currentMembership } = await adminSupabase
      .from('OrganisationMember')
      .select('role')
      .eq('organisationId', params.id)
      .eq('userId', user.id)
      .single()

    if (!currentMembership || !['OWNER', 'ADMIN'].includes(currentMembership.role)) {
      return NextResponse.json(
        { error: 'Only owners and admins can remove members' },
        { status: 403 }
      )
    }

    // Check if target member exists
    const { data: targetMembership } = await adminSupabase
      .from('OrganisationMember')
      .select('role')
      .eq('organisationId', params.id)
      .eq('userId', params.userId)
      .single()

    if (!targetMembership) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Can't remove the owner
    if (targetMembership.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot remove the owner. Transfer ownership first.' },
        { status: 400 }
      )
    }

    // Can't remove yourself
    if (params.userId === user.id) {
      return NextResponse.json(
        { error: 'You cannot remove yourself. Ask another admin or the owner.' },
        { status: 400 }
      )
    }

    // Admins can't remove other admins (only owner can)
    if (currentMembership.role === 'ADMIN' && targetMembership.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Only the owner can remove admins' },
        { status: 403 }
      )
    }

    // Remove member
    const { error: deleteError } = await adminSupabase
      .from('OrganisationMember')
      .delete()
      .eq('organisationId', params.id)
      .eq('userId', params.userId)

    if (deleteError) {
      console.error('Error removing member:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove member' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
    })
  } catch (error) {
    console.error('Error in DELETE /api/organisations/[id]/members/[userId]:', error)
    return NextResponse.json(
      { error: 'Unauthorized or invalid request' },
      { status: 401 }
    )
  }
}
