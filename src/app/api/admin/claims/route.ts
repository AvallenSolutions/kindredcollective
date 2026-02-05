import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'

// GET /api/admin/claims - List all supplier claims
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const { page, limit, from, to } = parsePagination(searchParams)
  const status = searchParams.get('status')

  let query = supabase
    .from('SupplierClaim')
    .select('*, supplier:Supplier(id, companyName, slug, contactEmail), user:User(email, member:Member(firstName, lastName))', { count: 'exact' })
    .order('createdAt', { ascending: false })
    .range(from, to)

  if (status) {
    query = query.eq('status', status)
  }

  const { data: claims, error, count } = await query

  if (error) {
    console.error('[AdminClaims] Error fetching claims:', error)
    return serverErrorResponse('Failed to fetch claims')
  }

  // Calculate statistics
  const { data: stats } = await supabase
    .from('SupplierClaim')
    .select('status')

  const statistics = {
    total: stats?.length || 0,
    pending: stats?.filter(c => c.status === 'PENDING').length || 0,
    claimed: stats?.filter(c => c.status === 'CLAIMED').length || 0,
    rejected: stats?.filter(c => c.status === 'REJECTED').length || 0,
  }

  return successResponse({
    claims,
    statistics,
    pagination: paginationMeta(page, limit, count || 0),
  })
}
