import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

interface MemberProfile {
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  jobTitle: string | null
}

interface MemberUser {
  id: string
  email: string
  role: string
  member: MemberProfile | MemberProfile[]
}

interface OrgMember {
  id: string
  role: string
  joinedAt: string
  user: MemberUser | MemberUser[]
}

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
  const { data: membership, error: membershipError } = await supabase
    .from('OrganisationMember')
    .select('id, organisationId')
    .eq('userId', user.id)
    .single()

  if (membershipError && membershipError.code !== 'PGRST116') {
    console.error('[OrgMembers] Error fetching membership:', membershipError)
    return serverErrorResponse('Failed to verify membership')
  }

  if (!membership) {
    return notFoundResponse('You are not a member of any organisation')
  }

  // Get all members
  const { data: members, error } = await supabase
    .from('OrganisationMember')
    .select(`
      id,
      role,
      joinedAt,
      user:User(
        id,
        email,
        role,
        member:Member(firstName, lastName, avatarUrl, jobTitle)
      )
    `)
    .eq('organisationId', membership.organisationId)
    .order('role', { ascending: true })
    .order('joinedAt', { ascending: true })

  if (error) {
    console.error('[OrgMembers] Error fetching members:', error)
    return serverErrorResponse('Failed to fetch members')
  }

  // Process members - Supabase returns nested relations as arrays
  const processedMembers = ((members || []) as OrgMember[]).map((member) => {
    const memberUser = Array.isArray(member.user) ? member.user[0] : member.user
    const memberProfile = memberUser?.member
    const profile = Array.isArray(memberProfile) ? memberProfile[0] : memberProfile
    return {
      id: member.id,
      orgRole: member.role,
      isOwner: member.role === 'OWNER',
      joinedAt: member.joinedAt,
      userId: memberUser?.id,
      email: memberUser?.email,
      role: memberUser?.role,
      firstName: profile?.firstName || null,
      lastName: profile?.lastName || null,
      fullName: profile
        ? `${profile.firstName} ${profile.lastName}`
        : memberUser?.email?.split('@')[0] || 'Unknown',
      avatarUrl: profile?.avatarUrl || null,
      jobTitle: profile?.jobTitle || null,
    }
  })

  return successResponse({
    members: processedMembers,
    total: processedMembers.length,
  })
}
