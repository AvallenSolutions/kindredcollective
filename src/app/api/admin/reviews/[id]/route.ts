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

// GET /api/admin/reviews/[id] - Get single review
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const { id } = await params
  const supabase = await createClient()

  const { data: review, error } = await supabase
    .from('SupplierReview')
    .select('*, supplier:Supplier(id, companyName, slug, logoUrl), brand:Brand(id, name, slug, logoUrl), user:User(email, member:Member(firstName, lastName))')
    .eq('id', id)
    .single()

  if (error || !review) {
    return notFoundResponse('Review not found')
  }

  return successResponse(review)
}

// PATCH /api/admin/reviews/[id] - Moderate review (approve/reject, verify)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()

  // Admin can only update moderation-related fields
  const allowedFields = [
    'isPublic',    // Approve/reject for public display
    'isVerified',  // Mark as verified review
  ]

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  }

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field]
    }
  }

  const { data: review, error } = await supabase
    .from('SupplierReview')
    .update(updates)
    .eq('id', id)
    .select('*, supplier:Supplier(id, companyName, slug), brand:Brand(id, name, slug)')
    .single()

  if (error) {
    console.error('Error updating review:', error)
    return serverErrorResponse('Failed to update review')
  }

  if (!review) {
    return notFoundResponse('Review not found')
  }

  return successResponse(review)
}

// DELETE /api/admin/reviews/[id] - Delete review
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const { id } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from('SupplierReview')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting review:', error)
    return serverErrorResponse('Failed to delete review')
  }

  return successResponse({ deleted: true })
}
