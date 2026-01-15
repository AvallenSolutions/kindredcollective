import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireSupplier, getUserSupplier } from '@/lib/auth'
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

// GET /api/me/offers/[id] - Get single offer with claims
export async function GET(request: NextRequest, { params }: RouteParams) {
  let user
  try {
    user = await requireSupplier()
  } catch {
    return unauthorizedResponse('Supplier access required')
  }

  const { id } = await params
  const supabase = await createClient()

  // Get user's supplier
  const supplier = await getUserSupplier(user.id)
  if (!supplier) {
    return errorResponse('No supplier profile found')
  }

  const { data: offer, error } = await supabase
    .from('Offer')
    .select('*, claims:OfferClaim(*, user:User(email))')
    .eq('id', id)
    .single()

  if (error || !offer) {
    return notFoundResponse('Offer not found')
  }

  // Check ownership
  if (offer.supplierId !== supplier.id && user.role !== 'ADMIN') {
    return forbiddenResponse('You can only view your own offers')
  }

  return successResponse(offer)
}

// PATCH /api/me/offers/[id] - Update offer
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  let user
  try {
    user = await requireSupplier()
  } catch {
    return unauthorizedResponse('Supplier access required')
  }

  const { id } = await params
  const supabase = await createClient()

  // Get user's supplier
  const supplier = await getUserSupplier(user.id)
  if (!supplier) {
    return errorResponse('No supplier profile found')
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from('Offer')
    .select('supplierId')
    .eq('id', id)
    .single()

  if (!existing) {
    return notFoundResponse('Offer not found')
  }

  if (existing.supplierId !== supplier.id && user.role !== 'ADMIN') {
    return forbiddenResponse('You can only update your own offers')
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

  const { data: offer, error } = await supabase
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

// DELETE /api/me/offers/[id] - Delete offer
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  let user
  try {
    user = await requireSupplier()
  } catch {
    return unauthorizedResponse('Supplier access required')
  }

  const { id } = await params
  const supabase = await createClient()

  // Get user's supplier
  const supplier = await getUserSupplier(user.id)
  if (!supplier) {
    return errorResponse('No supplier profile found')
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from('Offer')
    .select('supplierId')
    .eq('id', id)
    .single()

  if (!existing) {
    return notFoundResponse('Offer not found')
  }

  if (existing.supplierId !== supplier.id && user.role !== 'ADMIN') {
    return forbiddenResponse('You can only delete your own offers')
  }

  const { error } = await supabase
    .from('Offer')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting offer:', error)
    return serverErrorResponse('Failed to delete offer')
  }

  return successResponse({ deleted: true })
}
