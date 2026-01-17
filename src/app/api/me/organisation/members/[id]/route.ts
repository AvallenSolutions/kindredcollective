import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

interface RouteParams {
  params: Promise<{ id: string }>
}

// DELETE /api/me/organisation/members/[id] - Remove member from organisation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const { id } = await params
  const supabase = await createClient()

  // Get user's organisation membership
  const { data: userMembership } = await supabase
    .from('OrganisationMember')
    .select('id, isOwner, organisationId')
    .eq('userId', user.id)
    .single()

  if (!userMembership) {
    return notFoundResponse('You are not a member of any organisation')
  }

  // Get the target member
  const { data: targetMember } = await supabase
    .from('OrganisationMember')
    .select('id, isOwner, organisationId, userId')
    .eq('id', id)
    .single()

  if (!targetMember) {
    return notFoundResponse('Member not found')
  }

  // Verify same organisation
  if (targetMember.organisationId !== userMembership.organisationId) {
    return notFoundResponse('Member not found')
  }

  // Check permissions
  if (targetMember.userId === user.id) {
    // User is removing themselves
    if (targetMember.isOwner) {
      return errorResponse('Organisation owner cannot leave. Transfer ownership or delete the organisation.')
    }
  } else {
    // Removing someone else - must be owner
    if (!userMembership.isOwner) {
      return errorResponse('Only the organisation owner can remove members', 403)
    }
    if (targetMember.isOwner) {
      return errorResponse('Cannot remove the organisation owner')
    }
  }

  // Remove member
  const { error } = await supabase
    .from('OrganisationMember')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error removing member:', error)
    return serverErrorResponse('Failed to remove member')
  }

  return successResponse({
    deleted: true,
    message: targetMember.userId === user.id
      ? 'You have left the organisation'
      : 'Member removed successfully',
  })
}

// PATCH /api/me/organisation/members/[id] - Transfer ownership (owner only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()

  const { isOwner } = body

  if (isOwner !== true) {
    return errorResponse('Invalid request. Use isOwner: true to transfer ownership.')
  }

  // Get user's organisation membership
  const { data: userMembership } = await supabase
    .from('OrganisationMember')
    .select('id, isOwner, organisationId')
    .eq('userId', user.id)
    .single()

  if (!userMembership) {
    return notFoundResponse('You are not a member of any organisation')
  }

  if (!userMembership.isOwner) {
    return errorResponse('Only the organisation owner can transfer ownership', 403)
  }

  // Get the target member
  const { data: targetMember } = await supabase
    .from('OrganisationMember')
    .select('id, organisationId, userId')
    .eq('id', id)
    .single()

  if (!targetMember) {
    return notFoundResponse('Member not found')
  }

  if (targetMember.organisationId !== userMembership.organisationId) {
    return notFoundResponse('Member not found')
  }

  if (targetMember.id === userMembership.id) {
    return errorResponse('You are already the owner')
  }

  // Transfer ownership
  const { error: removeOwnerError } = await supabase
    .from('OrganisationMember')
    .update({ isOwner: false })
    .eq('id', userMembership.id)

  if (removeOwnerError) {
    console.error('Error removing ownership:', removeOwnerError)
    return serverErrorResponse('Failed to transfer ownership')
  }

  const { error: addOwnerError } = await supabase
    .from('OrganisationMember')
    .update({ isOwner: true })
    .eq('id', targetMember.id)

  if (addOwnerError) {
    console.error('Error adding ownership:', addOwnerError)
    // Rollback
    await supabase
      .from('OrganisationMember')
      .update({ isOwner: true })
      .eq('id', userMembership.id)
    return serverErrorResponse('Failed to transfer ownership')
  }

  return successResponse({
    message: 'Ownership transferred successfully',
  })
}
