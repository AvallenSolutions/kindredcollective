import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { getSession } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/suppliers/[id]/reviews - List public reviews for a supplier
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  // Check if supplier exists
  const { data: supplier } = await supabase
    .from('Supplier')
    .select('id, isPublic')
    .eq('id', id)
    .single()

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
    .eq('supplierId', id)
    .eq('isPublic', true)
    .order('createdAt', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (error) {
    console.error('Error fetching reviews:', error)
    return serverErrorResponse('Failed to fetch reviews')
  }

  // Calculate stats
  const { data: allReviews } = await supabase
    .from('SupplierReview')
    .select('rating, serviceRating, valueRating, wouldRecommend')
    .eq('supplierId', id)
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
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  })
}

// POST /api/suppliers/[id]/reviews - Submit a review (BRAND users only)
export async function POST(request: NextRequest, { params }: RouteParams) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const session = await getSession()
  if (!session.isBrand && !session.isAdmin) {
    return errorResponse('Only brand users can submit reviews', 403)
  }

  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()

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

  if (!content || content.length < 10) {
    return errorResponse('Review content is required and must be at least 10 characters')
  }

  // Validate optional ratings
  if (serviceRating !== undefined && (serviceRating < 1 || serviceRating > 5)) {
    return errorResponse('Service rating must be between 1 and 5')
  }

  if (valueRating !== undefined && (valueRating < 1 || valueRating > 5)) {
    return errorResponse('Value rating must be between 1 and 5')
  }

  // Check if supplier exists
  const { data: supplier } = await supabase
    .from('Supplier')
    .select('id, isPublic')
    .eq('id', id)
    .single()

  if (!supplier) {
    return notFoundResponse('Supplier not found')
  }

  // Get user's brand if they have one
  const { data: userBrand } = await supabase
    .from('Brand')
    .select('id, name')
    .eq('userId', user.id)
    .single()

  // Get member info for reviewer name
  const { data: member } = await supabase
    .from('Member')
    .select('firstName, lastName')
    .eq('userId', user.id)
    .single()

  const reviewerName = member ? `${member.firstName} ${member.lastName}` : user.email.split('@')[0]

  // Create the review
  const { data: review, error } = await supabase
    .from('SupplierReview')
    .insert({
      supplierId: id,
      brandId: userBrand?.id || null,
      userId: user.id,
      reviewerName,
      reviewerCompany: userBrand?.name || null,
      rating,
      title,
      content,
      wouldRecommend,
      serviceRating,
      valueRating,
      isVerified: false, // Admin must verify
      isPublic: false, // Admin must approve
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating review:', error)
    return serverErrorResponse('Failed to create review')
  }

  return successResponse({
    ...review,
    message: 'Review submitted successfully. It will be visible after admin approval.',
  }, 201)
}
