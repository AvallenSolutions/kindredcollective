import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/admin/reviews - List all reviews for moderation
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const isPublic = searchParams.get('isPublic')
  const isVerified = searchParams.get('isVerified')
  const supplierId = searchParams.get('supplierId')
  const minRating = searchParams.get('minRating')
  const maxRating = searchParams.get('maxRating')

  let query = supabase
    .from('SupplierReview')
    .select('*, supplier:Supplier(id, companyName, slug), brand:Brand(id, name, slug), user:User(email)', { count: 'exact' })
    .order('createdAt', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

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
    console.error('Error fetching reviews:', error)
    return serverErrorResponse('Failed to fetch reviews')
  }

  // Calculate statistics
  const { data: stats } = await supabase
    .from('SupplierReview')
    .select('isPublic, isVerified')

  const statistics = {
    total: stats?.length || 0,
    published: stats?.filter(r => r.isPublic).length || 0,
    pending: stats?.filter(r => !r.isPublic).length || 0,
    verified: stats?.filter(r => r.isVerified).length || 0,
  }

  return successResponse({
    reviews,
    statistics,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  })
}
