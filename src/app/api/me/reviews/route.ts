import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/me/reviews - List user's submitted reviews
export async function GET() {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const supabase = await createClient()

  const { data: reviews, error } = await supabase
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
      isPublic,
      createdAt,
      updatedAt,
      supplier:Supplier(
        id,
        companyName,
        slug,
        logoUrl,
        category
      )
    `)
    .eq('userId', user.id)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('Error fetching reviews:', error)
    return serverErrorResponse('Failed to fetch reviews')
  }

  // Add status to each review
  const processedReviews = (reviews || []).map(review => ({
    ...review,
    status: review.isPublic ? 'published' : 'pending',
  }))

  return successResponse({
    reviews: processedReviews,
    total: processedReviews.length,
    publishedCount: processedReviews.filter(r => r.isPublic).length,
    pendingCount: processedReviews.filter(r => !r.isPublic).length,
  })
}
