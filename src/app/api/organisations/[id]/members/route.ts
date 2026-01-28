import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/session'

// GET /api/organisations/[id]/members - List all organisation members
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const adminSupabase = createAdminClient()

    // Check if user is a member
    const { data: membership } = await adminSupabase
      .from('OrganisationMember')
      .select('role')
      .eq('organisationId', params.id)
      .eq('userId', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this organisation' },
        { status: 403 }
      )
    }

    // Get all members with their user and member profile info
    const { data: members, error } = await adminSupabase
      .from('OrganisationMember')
      .select(`
        id,
        role,
        joinedAt,
        user:User!OrganisationMember_userId_fkey(
          id,
          email,
          role,
          member:Member(
            firstName,
            lastName,
            jobTitle,
            avatarUrl
          )
        )
      `)
      .eq('organisationId', params.id)
      .order('joinedAt', { ascending: true })

    if (error) {
      console.error('Error fetching members:', error)
      return NextResponse.json(
        { error: 'Failed to fetch members' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      members: members || [],
      userRole: membership.role,
    })
  } catch (error) {
    console.error('Error in GET /api/organisations/[id]/members:', error)
    return NextResponse.json(
      { error: 'Unauthorized or invalid request' },
      { status: 401 }
    )
  }
}
