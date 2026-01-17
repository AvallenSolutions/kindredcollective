import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

// GET /api/admin/suppliers/[id] - Get single supplier with all details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const { id } = await params
  const supabase = createAdminClient()

  const { data: supplier, error } = await supabase
    .from('Supplier')
    .select('*, user:User(email, role), offers:Offer(*), reviews:SupplierReview(*)')
    .eq('id', id)
    .single()

  if (error || !supplier) {
    return notFoundResponse('Supplier not found')
  }

  return successResponse(supplier)
}

// PATCH /api/admin/suppliers/[id] - Update supplier
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const { id } = await params
  const supabase = createAdminClient()
  const body = await request.json()

  // Admin can update any field
  const allowedFields = [
    'companyName',
    'slug',
    'tagline',
    'description',
    'category',
    'services',
    'location',
    'country',
    'serviceRegions',
    'websiteUrl',
    'linkedinUrl',
    'instagramUrl',
    'portfolioUrl',
    'logoUrl',
    'heroImageUrl',
    'contactName',
    'contactEmail',
    'contactPhone',
    'isPublic',
    'isVerified',
    'claimStatus',
    'userId',
    'subcategories',
    'certifications',
    'moqMin',
    'moqMax',
    'leadTimeDays',
  ]

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  }

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field]
    }
  }

  const { data: supplier, error } = await supabase
    .from('Supplier')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating supplier:', error)
    return serverErrorResponse('Failed to update supplier')
  }

  if (!supplier) {
    return notFoundResponse('Supplier not found')
  }

  return successResponse(supplier)
}

// DELETE /api/admin/suppliers/[id] - Delete supplier
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const { id } = await params
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('Supplier')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting supplier:', error)
    return serverErrorResponse('Failed to delete supplier')
  }

  return successResponse({ deleted: true })
}
