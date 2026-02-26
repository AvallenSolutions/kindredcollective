import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/session'
import { getSession } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { getUserBrands } from '@/lib/auth/session'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// Helper to get supplier by slug
async function getSupplierBySlug(supabase: Awaited<ReturnType<typeof createClient>>, slug: string) {
  const { data: supplier, error } = await supabase
    .from('Supplier')
    .select('id, isPublic')
    .eq('slug', slug)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('[SupplierReviews] Error fetching supplier:', error)
  }

  return supplier
}

// GET /api/suppliers/[slug]/reviews - List public reviews for a supplier
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const { page, limit, from, to } = parsePagination(searchParams, { limit: 10 })

  // Check if supplier exists
  const supplier = await getSupplierBySlug(supabase, slug)

  if (!supplier) {
    return notFoundResponse('Supplier not found')
  }

  // Get reviews
  const { data: reviews, error, count } = await supabase
    .from('SupplierReview')
    .select(`
      id,
      reviewerName,
      reviewerCompany,
      rating,
      title,
      content,
      wouldRecommend,
      serviceRating,
      valueRating,
      isVerified,
      createdAt,
      brand:Brand(id, name, slug, logoUrl)
    `, { count: 'exact' })
    .eq('supplierId', supplier.id)
    .eq('isPublic', true)
    .order('createdAt', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('[SupplierReviews] Error fetching reviews:', error)
    return serverErrorResponse('Failed to fetch reviews')
  }

  // Calculate stats
  const { data: allReviews } = await supabase
    .from('SupplierReview')
    .select('rating, serviceRating, valueRating, wouldRecommend')
    .eq('supplierId', supplier.id)
    .eq('isPublic', true)

  const stats = {
    totalReviews: allReviews?.length || 0,
    averageRating: allReviews && allReviews.length > 0
      ? Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length) * 10) / 10
      : null,
    averageServiceRating: allReviews && allReviews.filter(r => r.serviceRating).length > 0
      ? Math.round((allReviews.filter(r => r.serviceRating).reduce((sum, r) => sum + (r.serviceRating || 0), 0) / allReviews.filter(r => r.serviceRating).length) * 10) / 10
      : null,
    averageValueRating: allReviews && allReviews.filter(r => r.valueRating).length > 0
      ? Math.round((allReviews.filter(r => r.valueRating).reduce((sum, r) => sum + (r.valueRating || 0), 0) / allReviews.filter(r => r.valueRating).length) * 10) / 10
      : null,
    recommendPercentage: allReviews && allReviews.length > 0
      ? Math.round((allReviews.filter(r => r.wouldRecommend).length / allReviews.length) * 100)
      : null,
  }

  return successResponse({
    reviews,
    stats,
    pagination: paginationMeta(page, limit, count || 0),
  })
}

// POST /api/suppliers/[slug]/reviews - Submit a review (any authenticated user)
export async function POST(request: NextRequest, { params }: RouteParams) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const { slug } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()

  let body
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON body')
  }

  const {
    rating,
    title,
    content,
    wouldRecommend = true,
    serviceRating,
    valueRating,
  } = body

  // Validate required fields
  if (!rating || rating < 1 || rating > 5) {
    return errorResponse('Rating is required and must be between 1 and 5')
  }

  if (!content || content.trim().length < 10) {
    return errorResponse('Review content is required and must be at least 10 characters')
  }

  if (content.length > 5000) {
    return errorResponse('Review content must be less than 5000 characters')
  }

  if (title && title.length > 120) {
    return errorResponse('Review title must be less than 120 characters')
  }

  // Validate optional ratings
  if (serviceRating !== undefined && (serviceRating < 1 || serviceRating > 5)) {
    return errorResponse('Service rating must be between 1 and 5')
  }

  if (valueRating !== undefined && (valueRating < 1 || valueRating > 5)) {
    return errorResponse('Value rating must be between 1 and 5')
  }

  // Check if supplier exists
  const supplier = await getSupplierBySlug(supabase, slug)

  if (!supplier) {
    return notFoundResponse('Supplier not found')
  }

  // Check for duplicate review from this user
  const { data: existingReview } = await adminClient
    .from('SupplierReview')
    .select('id')
    .eq('supplierId', supplier.id)
    .eq('userId', user.id)
    .single()

  if (existingReview) {
    return errorResponse('You have already reviewed this supplier')
  }

  // Get user's first brand via org (if they have one) for the review
  const userBrands = await getUserBrands(user.id)
  const firstBrand = userBrands.length > 0 ? userBrands[0] : null

  // Get member info for reviewer name
  const { data: member, error: memberError } = await adminClient
    .from('Member')
    .select('firstName, lastName, company')
    .eq('userId', user.id)
    .single()

  if (memberError && memberError.code !== 'PGRST116') {
    console.error('[SupplierReviews] Error fetching member info:', memberError)
  }

  const reviewerName = member ? `${member.firstName} ${member.lastName}` : user.email.split('@')[0]
  const reviewerCompany = firstBrand?.name || member?.company || null

  // Create the review
  const { data: review, error } = await adminClient
    .from('SupplierReview')
    .insert({
      supplierId: supplier.id,
      brandId: firstBrand?.id || null,
      userId: user.id,
      reviewerName,
      reviewerCompany,
      rating,
      title,
      content,
      wouldRecommend,
      serviceRating,
      valueRating,
      isVerified: false,
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('[SupplierReviews] Error creating review:', error)
    return serverErrorResponse('Failed to create review')
  }

  return successResponse({
    ...review,
    message: 'Review submitted successfully and is pending moderation.',
  }, 201)
}
