import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/session'

// GET /api/organisations/my-organisation - Get all of the current user's organisations
export async function GET() {
  try {
    const user = await requireAuth()
    const adminSupabase = createAdminClient()

    // Get all of the user's organisation memberships
    const { data: memberships, error: membershipError } = await adminSupabase
      .from('OrganisationMember')
      .select('*, organisation:Organisation(*)')
      .eq('userId', user.id)

    if (membershipError) {
      console.error('Error fetching organisations:', membershipError)
      return NextResponse.json(
        { error: 'Failed to fetch organisations' },
        { status: 500 }
      )
    }

    const organisations = (memberships || []).map((membership) => ({
      ...membership.organisation,
      userRole: membership.role,
      joinedAt: membership.joinedAt,
    }))

    return NextResponse.json({
      success: true,
      organisations,
      total: organisations.length,
    })
  } catch (error) {
    console.error('Error in GET /api/organisations/my-organisation:', error)
    return NextResponse.json(
      { error: 'Unauthorized or invalid request' },
      { status: 401 }
    )
  }
}
