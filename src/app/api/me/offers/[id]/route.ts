import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSession, getUserSupplierViaOrg } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  serverErrorResponse,
} from '@/lib/api/response'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/me/offers/[id]?orgId=xxx - Get single offer with claims
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getSession()
  if (!session.isAuthenticated || !session.user) {
    return unauthorizedResponse('Authentication required')
  }

  const orgId = request.nextUrl.searchParams.get('orgId')
  const { id } = await params
  const adminClient = createAdminClient()

  // Admin override: admins can view any offer
  if (session.isAdmin) {
    const { data: offer, error } = await adminClient
      .from('Offer')
      .select('*, claims:OfferClaim(id, claimedAt, user:User(email))')
      .eq('id', id)
      .single()

    if (error || !offer) {
      return notFoundResponse('Offer not found')
    }

    return successResponse(offer)
  }

  // Non-admin: orgId is required
  if (!orgId) {
    return errorResponse('orgId query parameter is required')
  }

  // GET is read-only: MEMBER access sufficient
  const supplier = await getUserSupplierViaOrg(session.user.id, orgId, 'MEMBER')
  if (!supplier) {
    return notFoundResponse('Supplier not found or access denied')
  }

  const { data: offer, error } = await adminClient
    .from('Offer')
    .select('*, claims:OfferClaim(id, claimedAt, user:User(email))')
    .eq('id', id)
    .single()

  if (error || !offer) {
    return notFoundResponse('Offer not found')
  }

  // Check ownership
  if (offer.supplierId !== supplier.id) {
    return forbiddenResponse('You can only view your own offers')
  }

  return successResponse(offer)
}

// PATCH /api/me/offers/[id]?orgId=xxx - Update offer
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getSession()
  if (!session.isAuthenticated || !session.user) {
    return unauthorizedResponse('Authentication required')
  }

  const orgId = request.nextUrl.searchParams.get('orgId')
  const { id } = await params
  const adminClient = createAdminClient()

  // Verify ownership (or admin)
  const { data: existing } = await adminClient
    .from('Offer')
    .select('supplierId, type')
    .eq('id', id)
    .single()

  if (!existing) {
    return notFoundResponse('Offer not found')
  }

  if (!session.isAdmin) {
    if (!orgId) {
      return errorResponse('orgId query parameter is required')
    }

    // PATCH requires ADMIN or OWNER role
    const supplier = await getUserSupplierViaOrg(session.user.id, orgId, 'ADMIN')
    if (!supplier) {
      return notFoundResponse('Supplier not found or access denied')
    }

    if (existing.supplierId !== supplier.id) {
      return forbiddenResponse('You can only update your own offers')
    }
  }

  let body
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON body')
  }

  const allowedFields = [
    'title',
    'description',
    'type',
    'discountValue',
    'code',
    'termsConditions',
    'status',
    'startDate',
    'endDate',
    'forBrandsOnly',
    'minOrderValue',
    'imageUrl',
  ]

  // Validate values before applying
  const validOfferTypes = ['PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT', 'FREE_TRIAL', 'BUNDLE', 'OTHER']
  const validStatuses = ['DRAFT', 'ACTIVE', 'EXPIRED', 'PAUSED']

  if (body.type !== undefined && !validOfferTypes.includes(body.type)) {
    return errorResponse('Invalid offer type')
  }
  if (body.status !== undefined && !validStatuses.includes(body.status)) {
    return errorResponse('Invalid offer status')
  }
  if (body.title !== undefined && body.title.length > 200) {
    return errorResponse('Title must be less than 200 characters')
  }
  if (body.description !== undefined && body.description && body.description.length > 5000) {
    return errorResponse('Description must be less than 5000 characters')
  }
  if (body.discountValue !== undefined && body.discountValue !== null) {
    if (typeof body.discountValue !== 'number' || body.discountValue < 0) {
      return errorResponse('Discount value must be a non-negative number')
    }
    const effectiveType = body.type || existing.type
    if (effectiveType === 'PERCENTAGE_DISCOUNT' && body.discountValue > 100) {
      return errorResponse('Percentage discount cannot exceed 100%')
    }
  }
  if (body.minOrderValue !== undefined && body.minOrderValue !== null) {
    if (typeof body.minOrderValue !== 'number' || body.minOrderValue < 0) {
      return errorResponse('Minimum order value must be a non-negative number')
    }
  }
  if (body.imageUrl !== undefined && body.imageUrl && !body.imageUrl.startsWith('https://')) {
    return errorResponse('Image URL must use HTTPS')
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  }

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field]
    }
  }

  const { data: offer, error } = await adminClient
    .from('Offer')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating offer:', error)
    return serverErrorResponse('Failed to update offer')
  }

  return successResponse(offer)
}

// DELETE /api/me/offers/[id]?orgId=xxx - Delete offer
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getSession()
  if (!session.isAuthenticated || !session.user) {
    return unauthorizedResponse('Authentication required')
  }

  const orgId = request.nextUrl.searchParams.get('orgId')
  const { id } = await params
  const adminClient = createAdminClient()

  // Verify ownership (or admin)
  const { data: existing } = await adminClient
    .from('Offer')
    .select('supplierId')
    .eq('id', id)
    .single()

  if (!existing) {
    return notFoundResponse('Offer not found')
  }

  if (!session.isAdmin) {
    if (!orgId) {
      return errorResponse('orgId query parameter is required')
    }

    // DELETE requires OWNER role
    const supplier = await getUserSupplierViaOrg(session.user.id, orgId, 'OWNER')
    if (!supplier) {
      return notFoundResponse('Supplier not found or access denied')
    }

    if (existing.supplierId !== supplier.id) {
      return forbiddenResponse('You can only delete your own offers')
    }
  }

  const { error } = await adminClient
    .from('Offer')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting offer:', error)
    return serverErrorResponse('Failed to delete offer')
  }

  return successResponse({ deleted: true })
}
