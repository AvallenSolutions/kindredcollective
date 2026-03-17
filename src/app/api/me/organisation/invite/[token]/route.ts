import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/me/organisation/invite/[token] - Get invite details
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params
  const supabase = createAdminClient()

  const { data: invite } = await supabase
    .from('OrganisationInvite')
    .select(`
      id,
      email,
      expiresAt,
      acceptedAt,
      organisation:Organisation(id, name, type)
    `)
    .eq('token', token)
    .single()

  if (!invite) {
    return notFoundResponse('Invite not found')
  }

  if (invite.acceptedAt) {
    return errorResponse('This invite has already been accepted')
  }

  if (new Date(invite.expiresAt) < new Date()) {
    return errorResponse('This invite has expired')
  }

  return successResponse({
    invite: {
      email: invite.email,
      organisation: invite.organisation,
      expiresAt: invite.expiresAt,
    },
  })
}

// POST /api/me/organisation/invite/[token] - Accept invite
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const { token } = params
  const supabase = createAdminClient()

  // Get the invite — include role so we honour what was set by the inviter
  const { data: invite } = await supabase
    .from('OrganisationInvite')
    .select('id, email, organisationId, role, expiresAt, acceptedAt')
    .eq('token', token)
    .single()

  if (!invite) {
    return notFoundResponse('Invite not found')
  }

  if (invite.acceptedAt) {
    return errorResponse('This invite has already been accepted')
  }

  if (new Date(invite.expiresAt) < new Date()) {
    return errorResponse('This invite has expired')
  }

  // Check if user is already a member of this specific organisation
  const { data: existingMembership } = await supabase
    .from('OrganisationMember')
    .select('id')
    .eq('organisationId', invite.organisationId)
    .eq('userId', user.id)
    .single()

  if (existingMembership) {
    return errorResponse('You are already a member of this organisation.')
  }

  // Add user to organisation using the role stored on the invite
  const { error: memberError } = await supabase
    .from('OrganisationMember')
    .insert({
      id: crypto.randomUUID(),
      organisationId: invite.organisationId,
      userId: user.id,
      role: invite.role ?? 'MEMBER',
      joinedAt: new Date().toISOString(),
    })

  if (memberError) {
    console.error('Error adding member:', memberError)
    return serverErrorResponse('Failed to join organisation')
  }

  // Mark invite as accepted
  await supabase
    .from('OrganisationInvite')
    .update({ acceptedAt: new Date().toISOString() })
    .eq('id', invite.id)

  // Get organisation details
  const { data: organisation } = await supabase
    .from('Organisation')
    .select('id, name, slug, type')
    .eq('id', invite.organisationId)
    .single()

  return successResponse({
    message: `You have joined ${organisation?.name || 'the organisation'} successfully!`,
    organisation,
  })
}

// DELETE /api/me/organisation/invite/[token] - Cancel/delete invite (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const { token } = params
  const supabase = createAdminClient()

  // Get the invite
  const { data: invite } = await supabase
    .from('OrganisationInvite')
    .select('id, organisationId')
    .eq('token', token)
    .single()

  if (!invite) {
    return notFoundResponse('Invite not found')
  }

  // Verify user is the organisation owner or admin
  const { data: membership } = await supabase
    .from('OrganisationMember')
    .select('role')
    .eq('organisationId', invite.organisationId)
    .eq('userId', user.id)
    .single()

  if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
    return errorResponse('Only the organisation owner or admin can cancel invites', 403)
  }

  // Delete invite
  const { error } = await supabase
    .from('OrganisationInvite')
    .delete()
    .eq('id', invite.id)

  if (error) {
    console.error('Error deleting invite:', error)
    return serverErrorResponse('Failed to cancel invite')
  }

  return successResponse({
    deleted: true,
    message: 'Invite cancelled successfully',
  })
}
