import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth, getUserSupplierViaOrg } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'

// GET /api/me/offers?orgId=xxx - Get supplier's offers
export async function GET(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse('Authentication required')
  }

  const orgId = request.nextUrl.searchParams.get('orgId')
  if (!orgId) {
    return errorResponse('orgId query parameter is required')
  }

  const supplier = await getUserSupplierViaOrg(user.id, orgId)
  if (!supplier) {
    return notFoundResponse('Supplier not found or access denied')
  }

  const adminClient = createAdminClient()
  const { searchParams } = new URL(request.url)
  const { page, limit, from, to } = parsePagination(searchParams)
  const status = searchParams.get('status')

  let query = adminClient
    .from('Offer')
    .select('*, claims:OfferClaim(count)', { count: 'exact' })
    .eq('supplierId', supplier.id)
    .order('createdAt', { ascending: false })
    .range(from, to)

  if (status) {
    query = query.eq('status', status)
  }

  const { data: offers, error, count } = await query

  if (error) {
    console.error('[MyOffers] Error fetching offers:', error)
    return serverErrorResponse('Failed to fetch offers')
  }

  return successResponse({
    offers,
    pagination: paginationMeta(page, limit, count || 0),
  })
}

// POST /api/me/offers?orgId=xxx - Create a new offer
export async function POST(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse('Authentication required')
  }

  const orgId = request.nextUrl.searchParams.get('orgId')
  if (!orgId) {
    return errorResponse('orgId query parameter is required')
  }

  const supplier = await getUserSupplierViaOrg(user.id, orgId)
  if (!supplier) {
    return notFoundResponse('Supplier not found or access denied')
  }

  const adminClient = createAdminClient()
  const body = await request.json()

  const {
    title, description, type, discountValue, code,
    termsConditions, startDate, endDate,
    forBrandsOnly = false, minOrderValue, imageUrl,
  } = body

  if (!title || !type) {
    return errorResponse('Title and type are required')
  }

  const { data: offer, error } = await adminClient
    .from('Offer')
    .insert({
      supplierId: supplier.id,
      title, description, type, discountValue, code,
      termsConditions,
      status: 'DRAFT',
      startDate, endDate, forBrandsOnly, minOrderValue, imageUrl,
      viewCount: 0,
      claimCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('[MyOffers] Error creating offer:', error)
    return serverErrorResponse('Failed to create offer')
  }

  return successResponse(offer, 201)
}
