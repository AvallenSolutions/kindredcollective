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
  const { data: offer, error: offerError } = await supabase
    .from('Offer')
    .select('id, title, status, forBrandsOnly, startDate, endDate, claimCount')
    .eq('id', id)
    .single()

  if (offerError || !offer) {
    if (offerError && offerError.code !== 'PGRST116') {
      console.error('[OfferClaim] Error fetching offer:', offerError)
      return serverErrorResponse('Failed to fetch offer')
    }
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
  if (offer.forBrandsOnly && !session.hasBrandAffiliation) {
    return errorResponse('This offer is only available to brand users')
  }

  // Check if already claimed (PGRST116 = no rows found, which is expected)
  const { data: existing, error: existingError } = await supabase
    .from('OfferClaim')
    .select('id')
    .eq('offerId', id)
    .eq('userId', user.id)
    .single()

  if (existingError && existingError.code !== 'PGRST116') {
    console.error('[OfferClaim] Error checking existing claim:', existingError)
    return serverErrorResponse('Failed to check existing claim')
  }

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
    console.error('[OfferClaim] Error creating claim:', claimError)
    return serverErrorResponse('Failed to claim offer')
  }

  // Update claim count using a count query to avoid race conditions.
  // The old read-modify-write pattern (claimCount + 1) loses increments
  // when two requests read the same value concurrently.
  const { count } = await supabase
    .from('OfferClaim')
    .select('id', { count: 'exact', head: true })
    .eq('offerId', id)

  await supabase
    .from('Offer')
    .update({ claimCount: count || 0 })
    .eq('id', id)

  return successResponse(claim, 201)
}
