import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/session'

// GET /api/onboarding/search-suppliers?q=search - Search unclaimed suppliers
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    const adminSupabase = createAdminClient()

    let dbQuery = adminSupabase
      .from('Supplier')
      .select('id, companyName, slug, category, description, logoUrl, claimStatus')
      .eq('claimStatus', 'UNCLAIMED')
      .eq('isPublic', true)
      .order('companyName', { ascending: true })
      .limit(20)

    if (query) {
      dbQuery = dbQuery.ilike('companyName', `%${query}%`)
    }

    const { data: suppliers, error } = await dbQuery

    if (error) {
      console.error('Error searching suppliers:', error)
      return NextResponse.json(
        { error: 'Failed to search suppliers' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      suppliers: suppliers || [],
    })
  } catch (error) {
    console.error('Error in GET /api/onboarding/search-suppliers:', error)
    return NextResponse.json(
      { error: 'Unauthorized or invalid request' },
      { status: 401 }
    )
  }
}
