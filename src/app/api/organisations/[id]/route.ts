import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/session'

// GET /api/organisations/[id] - Get organisation details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const adminSupabase = createAdminClient()

    // Get organisation
    const { data: org, error: orgError } = await adminSupabase
      .from('Organisation')
      .select('*, brand:Brand(*), supplier:Supplier(*)')
      .eq('id', params.id)
      .single()

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      )
    }

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

    return NextResponse.json({
      success: true,
      organisation: org,
      userRole: membership.role,
    })
  } catch (error) {
    console.error('Error in GET /api/organisations/[id]:', error)
    return NextResponse.json(
      { error: 'Unauthorized or invalid request' },
      { status: 401 }
    )
  }
}
