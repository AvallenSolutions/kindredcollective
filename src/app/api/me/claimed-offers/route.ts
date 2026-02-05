import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

interface OfferData {
  id: string
  title: string
  description: string | null
  type: string
  discountValue: number | null
  code: string | null
  termsConditions: string | null
  status: string
  endDate: string | null
  imageUrl: string | null
  supplier: {
    id: string
    companyName: string
    slug: string
    logoUrl: string | null
    contactEmail: string | null
  } | Array<{
    id: string
    companyName: string
    slug: string
    logoUrl: string | null
    contactEmail: string | null
  }>
}

interface ClaimData {
  id: string
  claimedAt: string
  offer: OfferData | OfferData[]
}

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
    console.error('[ClaimedOffers] Error fetching claimed offers:', error)
    return serverErrorResponse('Failed to fetch claimed offers')
  }

  // Add expired status to each claim
  const now = new Date()
  const processedClaims = ((claims || []) as ClaimData[]).map((claim) => {
    // Supabase returns nested relations as arrays
    const offer = Array.isArray(claim.offer) ? claim.offer[0] : claim.offer
    return {
      ...claim,
      offer,
      isExpired: offer?.endDate ? new Date(offer.endDate) < now : false,
      isActive: offer?.status === 'ACTIVE' && (!offer?.endDate || new Date(offer.endDate) >= now),
    }
  })

  return successResponse({
    claims: processedClaims,
    total: processedClaims.length,
    activeCount: processedClaims.filter(c => c.isActive).length,
  })
}
