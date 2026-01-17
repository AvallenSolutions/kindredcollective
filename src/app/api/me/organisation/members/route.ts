import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/me/organisation/members - List organisation members
export async function GET() {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const supabase = await createClient()

  // Get user's organisation membership
  const { data: membership } = await supabase
    .from('OrganisationMember')
    .select('id, organisationId')
    .eq('userId', user.id)
    .single()

  if (!membership) {
    return notFoundResponse('You are not a member of any organisation')
  }

  // Get all members
  const { data: members, error } = await supabase
    .from('OrganisationMember')
    .select(`
      id,
      isOwner,
      joinedAt,
      user:User(
        id,
        email,
        role,
        member:Member(firstName, lastName, avatarUrl, jobTitle)
      )
    `)
    .eq('organisationId', membership.organisationId)
    .order('isOwner', { ascending: false })
    .order('joinedAt', { ascending: true })

  if (error) {
    console.error('Error fetching members:', error)
    return serverErrorResponse('Failed to fetch members')
  }

  // Process members
  const processedMembers = (members || []).map(member => ({
    id: member.id,
    isOwner: member.isOwner,
    joinedAt: member.joinedAt,
    userId: member.user?.id,
    email: member.user?.email,
    role: member.user?.role,
    firstName: member.user?.member?.firstName || null,
    lastName: member.user?.member?.lastName || null,
    fullName: member.user?.member
      ? `${member.user.member.firstName} ${member.user.member.lastName}`
      : member.user?.email?.split('@')[0] || 'Unknown',
    avatarUrl: member.user?.member?.avatarUrl || null,
    jobTitle: member.user?.member?.jobTitle || null,
  }))

  return successResponse({
    members: processedMembers,
    total: processedMembers.length,
  })
}
