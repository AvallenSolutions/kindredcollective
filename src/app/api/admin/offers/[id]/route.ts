import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/offers/[id] - Get single offer with all details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const { id } = await params
  const supabase = await createClient()

  const { data: offer, error } = await supabase
    .from('Offer')
    .select('*, supplier:Supplier(id, companyName, slug, logoUrl), claims:OfferClaim(*, user:User(email, member:Member(firstName, lastName)))')
    .eq('id', id)
    .single()

  if (error || !offer) {
    return notFoundResponse('Offer not found')
  }

  return successResponse(offer)
}

// PATCH /api/admin/offers/[id] - Update offer
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const { id } = await params
  const supabase = await createClient()
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
    'supplierId',
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
    .select('*, supplier:Supplier(id, companyName, slug)')
    .single()

  if (error) {
    console.error('Error updating offer:', error)
    return serverErrorResponse('Failed to update offer')
  }

  if (!offer) {
    return notFoundResponse('Offer not found')
  }

  return successResponse(offer)
}

// DELETE /api/admin/offers/[id] - Delete offer
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const { id } = await params
  const supabase = await createClient()

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
