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

// POST /api/offers/[id]/claim - Claim an offer
export async function POST(request: NextRequest, { params }: RouteParams) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const { id } = await params
  const supabase = await createClient()
  const session = await getSession()

  // Get the offer
  const { data: offer } = await supabase
    .from('Offer')
    .select('id, title, status, forBrandsOnly, startDate, endDate, claimCount')
    .eq('id', id)
    .single()

  if (!offer) {
    return notFoundResponse('Offer not found')
  }

  // Check if offer is active
  if (offer.status !== 'ACTIVE') {
    return errorResponse('This offer is not active')
  }

  // Check if offer has started
  if (offer.startDate && new Date(offer.startDate) > new Date()) {
    return errorResponse('This offer has not started yet')
  }

  // Check if offer has expired
  if (offer.endDate && new Date(offer.endDate) < new Date()) {
    return errorResponse('This offer has expired')
  }

  // Check if offer is for brands only
  if (offer.forBrandsOnly && !session.isBrand) {
    return errorResponse('This offer is only available to brand users')
  }

  // Check if already claimed
  const { data: existing } = await supabase
    .from('OfferClaim')
    .select('id')
    .eq('offerId', id)
    .eq('userId', user.id)
    .single()

  if (existing) {
    return errorResponse('You have already claimed this offer')
  }

  // Create the claim
  const { data: claim, error: claimError } = await supabase
    .from('OfferClaim')
    .insert({
      offerId: id,
      userId: user.id,
      claimedAt: new Date().toISOString(),
    })
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
        supplier:Supplier(id, companyName, slug, contactEmail)
      )
    `)
    .single()

  if (claimError) {
    console.error('Error claiming offer:', claimError)
    return serverErrorResponse('Failed to claim offer')
  }

  // Increment claim count on the offer
  await supabase
    .from('Offer')
    .update({ claimCount: (offer.claimCount || 0) + 1 })
    .eq('id', id)

  return successResponse(claim, 201)
}
