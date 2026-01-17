import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  successResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// GET /api/suppliers/[slug] - Get single supplier detail
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: supplier, error } = await supabase
    .from('Supplier')
    .select(`
      id,
      companyName,
      slug,
      tagline,
      description,
      logoUrl,
      heroImageUrl,
      websiteUrl,
      linkedinUrl,
      instagramUrl,
      portfolioUrl,
      category,
      subcategories,
      services,
      certifications,
      moqMin,
      moqMax,
      leadTimeDays,
      location,
      country,
      serviceRegions,
      contactName,
      contactEmail,
      isVerified,
      claimStatus,
      viewCount,
      createdAt,
      portfolioImages:SupplierImage(id, url, alt, order),
      offers:Offer(id, title, description, type, discountValue, status, endDate, imageUrl),
      reviews:SupplierReview(
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
        brand:Brand(name, logoUrl, slug)
      )
    `)
    .eq('slug', slug)
    .eq('isPublic', true)
    .single()

  if (error || !supplier) {
    return notFoundResponse('Supplier not found')
  }

  // Filter to only show active offers and public reviews
  const activeOffers = (supplier.offers || []).filter(
    (o: { status: string; endDate?: string }) =>
      o.status === 'ACTIVE' && (!o.endDate || new Date(o.endDate) > new Date())
  )
  const publicReviews = (supplier.reviews || []).filter(
    (r: { isVerified?: boolean }) => true // All reviews are public if they're in the database with isPublic=true
  )

  // Calculate average rating
  const avgRating = publicReviews.length > 0
    ? publicReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / publicReviews.length
    : null

  // Increment view count (fire and forget)
  supabase
    .from('Supplier')
    .update({ viewCount: (supplier.viewCount || 0) + 1 })
    .eq('id', supplier.id)
    .then(() => {})

  return successResponse({
    ...supplier,
    offers: activeOffers,
    reviews: publicReviews,
    averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    reviewCount: publicReviews.length,
  })
}
