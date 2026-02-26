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
import { sendOrgInviteEmail } from '@/lib/email'

// RFC 5322 simplified email validation - more permissive than the old regex
// to support plus addressing, subdomains, and internationalized TLDs
// Improved email validation: requires non-empty local part, non-empty domain, and valid TLD
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

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

  const { email, role = 'MEMBER' } = body

  if (!email) {
    return errorResponse('Email is required')
  }

  // Validate role
  if (!['ADMIN', 'MEMBER'].includes(role)) {
    return errorResponse('Invalid role. Can only invite as ADMIN or MEMBER')
  }

  // Validate email format
  if (!EMAIL_REGEX.test(email)) {
    return errorResponse('Invalid email format')
  }

  // Get user's organisation membership
  // Support orgId query param for users with multiple organisations
  const orgId = request.nextUrl.searchParams.get('orgId')
  const query = supabase
    .from('OrganisationMember')
    .select('id, role, organisationId, organisation:Organisation(name)')
    .eq('userId', user.id)

  if (orgId) {
    query.eq('organisationId', orgId)
  }

  const { data: memberships, error: membershipError } = await query

  if (membershipError) {
    console.error('[OrgInvite] Error fetching membership:', membershipError)
    return serverErrorResponse('Failed to verify membership')
  }

  if (!memberships || memberships.length === 0) {
    return notFoundResponse('You are not a member of any organisation')
  }

  // If multiple memberships and no orgId specified, require orgId
  if (memberships.length > 1 && !orgId) {
    return errorResponse('You belong to multiple organisations. Please specify orgId query parameter.')
  }

  const membership = memberships[0]

  if (!['OWNER', 'ADMIN'].includes(membership.role)) {
    return errorResponse('Only owners and admins can send invites', 403)
  }

  // Only owners can invite admins
  if (role === 'ADMIN' && membership.role !== 'OWNER') {
    return errorResponse('Only the organisation owner can invite admins', 403)
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
      role,
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

  // Send invite email
  const orgData = membership.organisation as unknown as { name: string } | { name: string }[] | null
  const orgName = (Array.isArray(orgData) ? orgData[0]?.name : orgData?.name) || 'your organisation'
  try {
    // Get inviter's name
    const { data: inviterMember } = await supabase
      .from('Member')
      .select('firstName, lastName')
      .eq('userId', user.id)
      .single()
    const inviterName = inviterMember
      ? `${inviterMember.firstName} ${inviterMember.lastName}`
      : user.email || 'A team member'

    await sendOrgInviteEmail(email, token, orgName, inviterName, role === 'ADMIN' ? 'Admin' : 'Member')
  } catch (emailError) {
    console.error('[OrgInvite] Failed to send invite email:', emailError)
    // Don't fail the invite creation if email fails
  }

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

// GET /api/me/organisation/invite?orgId=xxx - List pending invites
export async function GET(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const supabase = await createClient()
  const orgId = request.nextUrl.searchParams.get('orgId')

  // Get user's organisation membership
  const query = supabase
    .from('OrganisationMember')
    .select('id, role, organisationId')
    .eq('userId', user.id)

  if (orgId) {
    query.eq('organisationId', orgId)
  }

  const { data: memberships, error: membershipError } = await query

  if (membershipError) {
    console.error('[OrgInvite] Error fetching membership:', membershipError)
    return serverErrorResponse('Failed to verify membership')
  }

  if (!memberships || memberships.length === 0) {
    return notFoundResponse('You are not a member of any organisation')
  }

  if (memberships.length > 1 && !orgId) {
    return errorResponse('You belong to multiple organisations. Please specify orgId query parameter.')
  }

  const membership = memberships[0]

  if (!['OWNER', 'ADMIN'].includes(membership.role)) {
    return errorResponse('Only owners and admins can view invites', 403)
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
