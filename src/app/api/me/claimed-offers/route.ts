import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/me/claimed-offers - List user's claimed offers
export async function GET() {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const supabase = await createClient()

  const { data: claims, error } = await supabase
    .from('OfferClaim')
    .select(`
      id,
      claimedAt,
      offer:Offer(
        id,
        title,
        description,
        type,
        discountValue,
        code,
        termsConditions,
        status,
        endDate,
        imageUrl,
        supplier:Supplier(
          id,
          companyName,
          slug,
          logoUrl,
          contactEmail
        )
      )
    `)
    .eq('userId', user.id)
    .order('claimedAt', { ascending: false })

  if (error) {
    console.error('Error fetching claimed offers:', error)
    return serverErrorResponse('Failed to fetch claimed offers')
  }

  // Add expired status to each claim
  const now = new Date()
  const processedClaims = (claims || []).map(claim => ({
    ...claim,
    isExpired: claim.offer?.endDate ? new Date(claim.offer.endDate) < now : false,
    isActive: claim.offer?.status === 'ACTIVE' && (!claim.offer?.endDate || new Date(claim.offer.endDate) >= now),
  }))

  return successResponse({
    claims: processedClaims,
    total: processedClaims.length,
    activeCount: processedClaims.filter(c => c.isActive).length,
  })
}
