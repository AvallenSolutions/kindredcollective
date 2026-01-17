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

  // Process members - Supabase returns nested relations as arrays
  const processedMembers = (members || []).map((member: any) => {
    const user = Array.isArray(member.user) ? member.user[0] : member.user
    const memberProfile = user?.member
    const profile = Array.isArray(memberProfile) ? memberProfile[0] : memberProfile
    return {
      id: member.id,
      isOwner: member.isOwner,
      joinedAt: member.joinedAt,
      userId: user?.id,
      email: user?.email,
      role: user?.role,
      firstName: profile?.firstName || null,
      lastName: profile?.lastName || null,
      fullName: profile
        ? `${profile.firstName} ${profile.lastName}`
        : user?.email?.split('@')[0] || 'Unknown',
      avatarUrl: profile?.avatarUrl || null,
      jobTitle: profile?.jobTitle || null,
    }
  })

  return successResponse({
    members: processedMembers,
    total: processedMembers.length,
  })
}
