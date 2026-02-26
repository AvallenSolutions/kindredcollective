import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'

// GET /api/admin/reviews - List all reviews for moderation
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const { page, limit, from, to } = parsePagination(searchParams)
  const isPublic = searchParams.get('isPublic')
  const isVerified = searchParams.get('isVerified')
  const supplierId = searchParams.get('supplierId')
  const minRating = searchParams.get('minRating')
  const maxRating = searchParams.get('maxRating')

  let query = supabase
    .from('SupplierReview')
    .select('*, supplier:Supplier(id, companyName, slug), brand:Brand(id, name, slug), user:User(email)', { count: 'exact' })
    .order('createdAt', { ascending: false })
    .range(from, to)

  if (isPublic !== null && isPublic !== undefined) {
    query = query.eq('isPublic', isPublic === 'true')
  }

  if (isVerified !== null && isVerified !== undefined) {
    query = query.eq('isVerified', isVerified === 'true')
  }

  if (supplierId) {
    query = query.eq('supplierId', supplierId)
  }

  if (minRating) {
    query = query.gte('rating', parseInt(minRating))
  }

  if (maxRating) {
    query = query.lte('rating', parseInt(maxRating))
  }

  const { data: reviews, error, count } = await query

  if (error) {
    console.error('[AdminReviews] Error fetching reviews:', error)
    return serverErrorResponse('Failed to fetch reviews')
  }

  // Calculate statistics using count queries (efficient, no full-table scan)
  const [totalResult, publishedResult, pendingResult, verifiedResult] = await Promise.all([
    supabase.from('SupplierReview').select('*', { count: 'exact', head: true }),
    supabase.from('SupplierReview').select('*', { count: 'exact', head: true }).eq('isPublic', true),
    supabase.from('SupplierReview').select('*', { count: 'exact', head: true }).eq('isPublic', false),
    supabase.from('SupplierReview').select('*', { count: 'exact', head: true }).eq('isVerified', true),
  ])

  const statistics = {
    total: totalResult.count || 0,
    published: publishedResult.count || 0,
    pending: pendingResult.count || 0,
    verified: verifiedResult.count || 0,
  }

  return successResponse({
    reviews,
    statistics,
    pagination: paginationMeta(page, limit, count || 0),
  })
}
