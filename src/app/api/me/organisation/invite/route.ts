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
import { generateSecureToken } from '@/lib/api/token'

// RFC 5322 simplified email validation - more permissive than the old regex
// to support plus addressing, subdomains, and internationalized TLDs
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// POST /api/me/organisation/invite - Send invite
export async function POST(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const supabase = await createClient()
  const body = await request.json()

  const { email } = body

  if (!email) {
    return errorResponse('Email is required')
  }

  // Validate email format
  if (!EMAIL_REGEX.test(email)) {
    return errorResponse('Invalid email format')
  }

  // Get user's organisation membership
  const { data: membership, error: membershipError } = await supabase
    .from('OrganisationMember')
    .select('id, role, organisationId, organisation:Organisation(name)')
    .eq('userId', user.id)
    .single()

  if (membershipError && membershipError.code !== 'PGRST116') {
    console.error('[OrgInvite] Error fetching membership:', membershipError)
    return serverErrorResponse('Failed to verify membership')
  }

  if (!membership) {
    return notFoundResponse('You are not a member of any organisation')
  }

  if (membership.role !== 'OWNER') {
    return errorResponse('Only the organisation owner can send invites', 403)
  }

  // Check if email is already a member
  const { data: existingUser, error: userLookupError } = await supabase
    .from('User')
    .select('id')
    .eq('email', email)
    .single()

  if (userLookupError && userLookupError.code !== 'PGRST116') {
    console.error('[OrgInvite] Error looking up user:', userLookupError)
    return serverErrorResponse('Failed to check user')
  }

  if (existingUser) {
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('OrganisationMember')
      .select('id')
      .eq('organisationId', membership.organisationId)
      .eq('userId', existingUser.id)
      .single()

    if (memberCheckError && memberCheckError.code !== 'PGRST116') {
      console.error('[OrgInvite] Error checking membership:', memberCheckError)
      return serverErrorResponse('Failed to check membership')
    }

    if (existingMember) {
      return errorResponse('This user is already a member of your organisation')
    }
  }

  // Check if there's already a pending invite for this email
  const { data: existingInvite, error: inviteCheckError } = await supabase
    .from('OrganisationInvite')
    .select('id, expiresAt')
    .eq('organisationId', membership.organisationId)
    .eq('email', email)
    .is('acceptedAt', null)
    .single()

  if (inviteCheckError && inviteCheckError.code !== 'PGRST116') {
    console.error('[OrgInvite] Error checking existing invite:', inviteCheckError)
    return serverErrorResponse('Failed to check existing invites')
  }

  if (existingInvite && new Date(existingInvite.expiresAt) > new Date()) {
    return errorResponse('An invite has already been sent to this email')
  }

  // Delete any expired invites for this email
  await supabase
    .from('OrganisationInvite')
    .delete()
    .eq('organisationId', membership.organisationId)
    .eq('email', email)

  // Create invite using standardized token generation
  const token = generateSecureToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

  const { data: invite, error } = await supabase
    .from('OrganisationInvite')
    .insert({
      organisationId: membership.organisationId,
      email,
      token,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      createdById: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('[OrgInvite] Error creating invite:', error)
    return serverErrorResponse('Failed to create invite')
  }

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/invite/${token}`

  return successResponse({
    invite: {
      id: invite.id,
      email: invite.email,
      expiresAt: invite.expiresAt,
    },
    inviteUrl,
    message: `Invite sent to ${email}. They have 7 days to accept.`,
  }, 201)
}

// GET /api/me/organisation/invite - List pending invites
export async function GET() {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const supabase = await createClient()

  // Get user's organisation membership
  const { data: membership, error: membershipError } = await supabase
    .from('OrganisationMember')
    .select('id, role, organisationId')
    .eq('userId', user.id)
    .single()

  if (membershipError && membershipError.code !== 'PGRST116') {
    console.error('[OrgInvite] Error fetching membership:', membershipError)
    return serverErrorResponse('Failed to verify membership')
  }

  if (!membership) {
    return notFoundResponse('You are not a member of any organisation')
  }

  if (membership.role !== 'OWNER') {
    return errorResponse('Only the organisation owner can view invites', 403)
  }

  // Get pending invites
  const { data: invites, error } = await supabase
    .from('OrganisationInvite')
    .select('id, email, expiresAt, createdAt, acceptedAt')
    .eq('organisationId', membership.organisationId)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('[OrgInvite] Error fetching invites:', error)
    return serverErrorResponse('Failed to fetch invites')
  }

  const now = new Date()
  const processedInvites = (invites || []).map(invite => ({
    ...invite,
    status: invite.acceptedAt
      ? 'accepted'
      : new Date(invite.expiresAt) < now
        ? 'expired'
        : 'pending',
  }))

  return successResponse({
    invites: processedInvites,
    pendingCount: processedInvites.filter(i => i.status === 'pending').length,
  })
}
