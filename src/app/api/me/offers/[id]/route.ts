import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth, getSession, getUserSupplierViaOrg } from '@/lib/auth/session'
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
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse('Authentication required')
  }

  const orgId = request.nextUrl.searchParams.get('orgId')
  const session = await getSession()
  const { id } = await params
  const adminClient = createAdminClient()

  // Admin override: admins can view any offer
  if (session.isAdmin) {
    const { data: offer, error } = await adminClient
      .from('Offer')
      .select('*, claims:OfferClaim(*, user:User(email))')
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

  const supplier = await getUserSupplierViaOrg(user.id, orgId)
  if (!supplier) {
    return notFoundResponse('Supplier not found or access denied')
  }

  const { data: offer, error } = await adminClient
    .from('Offer')
    .select('*, claims:OfferClaim(*, user:User(email))')
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
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse('Authentication required')
  }

  const orgId = request.nextUrl.searchParams.get('orgId')
  const session = await getSession()
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

    const supplier = await getUserSupplierViaOrg(user.id, orgId)
    if (!supplier) {
      return notFoundResponse('Supplier not found or access denied')
    }

    if (existing.supplierId !== supplier.id) {
      return forbiddenResponse('You can only update your own offers')
    }
  }

  const body = await request.json()

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
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse('Authentication required')
  }

  const orgId = request.nextUrl.searchParams.get('orgId')
  const session = await getSession()
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

    const supplier = await getUserSupplierViaOrg(user.id, orgId)
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
