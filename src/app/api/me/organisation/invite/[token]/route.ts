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
  params: Promise<{ token: string }>
}

// GET /api/me/organisation/invite/[token] - Get invite details
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { token } = await params
  const supabase = await createClient()

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
export async function POST(request: NextRequest, { params }: RouteParams) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const { token } = await params
  const supabase = await createClient()

  // Get the invite
  const { data: invite } = await supabase
    .from('OrganisationInvite')
    .select('id, email, organisationId, expiresAt, acceptedAt')
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

  // Verify email matches (optional - depends on your requirements)
  // If you want to enforce email matching:
  // if (invite.email !== user.email) {
  //   return errorResponse('This invite was sent to a different email address')
  // }

  // Check if user is already in an organisation
  const { data: existingMembership } = await supabase
    .from('OrganisationMember')
    .select('id')
    .eq('userId', user.id)
    .single()

  if (existingMembership) {
    return errorResponse('You are already a member of an organisation. Leave your current organisation first.')
  }

  // Add user to organisation
  const { error: memberError } = await supabase
    .from('OrganisationMember')
    .insert({
      organisationId: invite.organisationId,
      userId: user.id,
      isOwner: false,
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
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const { token } = await params
  const supabase = await createClient()

  // Get the invite
  const { data: invite } = await supabase
    .from('OrganisationInvite')
    .select('id, organisationId')
    .eq('token', token)
    .single()

  if (!invite) {
    return notFoundResponse('Invite not found')
  }

  // Verify user is the organisation owner
  const { data: membership } = await supabase
    .from('OrganisationMember')
    .select('isOwner')
    .eq('organisationId', invite.organisationId)
    .eq('userId', user.id)
    .single()

  if (!membership?.isOwner) {
    return errorResponse('Only the organisation owner can cancel invites', 403)
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
