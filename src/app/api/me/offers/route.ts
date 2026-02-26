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

  // GET is read-only: MEMBER access sufficient
  const supplier = await getUserSupplierViaOrg(user.id, orgId, 'MEMBER')
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

  // POST requires ADMIN or OWNER role
  const supplier = await getUserSupplierViaOrg(user.id, orgId, 'ADMIN')
  if (!supplier) {
    return notFoundResponse('Supplier not found or access denied')
  }

  const adminClient = createAdminClient()

  let body
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON body')
  }

  const {
    title, description, type, discountValue, code,
    termsConditions, startDate, endDate,
    forBrandsOnly = false, minOrderValue, imageUrl,
  } = body

  if (!title || !type) {
    return errorResponse('Title and type are required')
  }

  // Validate type enum
  const validOfferTypes = ['PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT', 'FREE_TRIAL', 'BUNDLE', 'OTHER']
  if (!validOfferTypes.includes(type)) {
    return errorResponse('Invalid offer type')
  }

  // Validate string lengths
  if (title.length > 200) {
    return errorResponse('Title must be less than 200 characters')
  }
  if (description && description.length > 5000) {
    return errorResponse('Description must be less than 5000 characters')
  }
  if (code && code.length > 50) {
    return errorResponse('Code must be less than 50 characters')
  }

  // Validate numeric values
  if (discountValue !== undefined && discountValue !== null) {
    if (typeof discountValue !== 'number' || discountValue < 0) {
      return errorResponse('Discount value must be a non-negative number')
    }
    if (type === 'PERCENTAGE_DISCOUNT' && discountValue > 100) {
      return errorResponse('Percentage discount cannot exceed 100%')
    }
  }
  if (minOrderValue !== undefined && minOrderValue !== null) {
    if (typeof minOrderValue !== 'number' || minOrderValue < 0) {
      return errorResponse('Minimum order value must be a non-negative number')
    }
  }

  // Validate date ordering
  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    return errorResponse('End date must be after start date')
  }

  // Validate imageUrl format
  if (imageUrl && typeof imageUrl === 'string' && !imageUrl.startsWith('https://')) {
    return errorResponse('Image URL must use HTTPS')
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
