import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSession } from '@/lib/auth/session'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from '@/lib/api/response'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'

// GET /api/admin/requests - Admin: list all RFPs
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated) return unauthorizedResponse()
  if (!session.isAdmin) return forbiddenResponse()

  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const { page, limit, from, to } = parsePagination(searchParams)
  const status = searchParams.get('status')

  let query = supabase
    .from('RFP')
    .select(`
      id, title, category, status, createdAt,
      brand:Brand(id, name, slug),
      responses:RFPResponse(count)
    `, { count: 'exact' })
    .order('createdAt', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)

  const { data: rfps, error, count } = await query

  if (error) {
    console.error('[Admin/Requests] Error fetching RFPs:', error)
    return serverErrorResponse('Failed to fetch requests')
  }

  return successResponse({
    rfps,
    pagination: paginationMeta(page, limit, count || 0),
  })
}
