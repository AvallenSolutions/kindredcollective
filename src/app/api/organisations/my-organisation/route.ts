import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/session'

// GET /api/organisations/my-organisation - Get current user's organisation
export async function GET() {
  try {
    const user = await requireAuth()
    const adminSupabase = createAdminClient()

    // Get user's organisation membership
    const { data: membership, error: membershipError } = await adminSupabase
      .from('OrganisationMember')
      .select('*, organisation:Organisation(*)')
      .eq('userId', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'You are not a member of any organisation' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      organisation: membership.organisation,
      userRole: membership.role,
      membership,
    })
  } catch (error) {
    console.error('Error in GET /api/organisations/my-organisation:', error)
    return NextResponse.json(
      { error: 'Unauthorized or invalid request' },
      { status: 401 }
    )
  }
}
