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

// GET /api/me/verifications/[id] - Get single verification details
export async function GET(request: NextRequest, { params }: RouteParams) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const { id } = await params
  const session = await getSession()
  const supabase = await createClient()

  const { data: relationship, error } = await supabase
    .from('WorkRelationship')
    .select(`
      id,
      brandVerified,
      supplierVerified,
      projectDate,
      projectDescription,
      createdAt,
      updatedAt,
      brand:Brand(id, name, slug, logoUrl, category, isVerified, userId),
      supplier:Supplier(id, companyName, slug, logoUrl, category, isVerified, userId)
    `)
    .eq('id', id)
    .single()

  if (error || !relationship) {
    return notFoundResponse('Verification not found')
  }

  // Supabase returns nested relations as arrays
  const brand = Array.isArray(relationship.brand) ? relationship.brand[0] : relationship.brand
  const supplier = Array.isArray(relationship.supplier) ? relationship.supplier[0] : relationship.supplier

  // Verify user has access
  const hasAccess =
    (session.isBrand && brand?.userId === user.id) ||
    (session.isSupplier && supplier?.userId === user.id)

  if (!hasAccess) {
    return notFoundResponse('Verification not found')
  }

  return successResponse({
    relationship: {
      ...relationship,
      isFullyVerified: relationship.brandVerified && relationship.supplierVerified,
    },
  })
}

// PATCH /api/me/verifications/[id] - Confirm or update verification
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const { id } = await params
  const session = await getSession()
  const supabase = await createClient()
  const body = await request.json()

  const { verified, projectDate, projectDescription } = body

  // Get the relationship
  const { data: relationship } = await supabase
    .from('WorkRelationship')
    .select(`
      id,
      brandId,
      supplierId,
      brand:Brand(userId),
      supplier:Supplier(userId)
    `)
    .eq('id', id)
    .single()

  if (!relationship) {
    return notFoundResponse('Verification not found')
  }

  // Supabase returns nested relations as arrays
  const brandData = Array.isArray(relationship.brand) ? relationship.brand[0] : relationship.brand
  const supplierData = Array.isArray(relationship.supplier) ? relationship.supplier[0] : relationship.supplier

  // Determine which side the user is on
  const isBrandSide = session.isBrand && brandData?.userId === user.id
  const isSupplierSide = session.isSupplier && supplierData?.userId === user.id

  if (!isBrandSide && !isSupplierSide) {
    return notFoundResponse('Verification not found')
  }

  // Build updates
  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  }

  if (verified !== undefined) {
    if (isBrandSide) {
      updates.brandVerified = verified
    } else {
      updates.supplierVerified = verified
    }
  }

  if (projectDate !== undefined) {
    updates.projectDate = projectDate
  }

  if (projectDescription !== undefined) {
    updates.projectDescription = projectDescription
  }

  const { data: updatedRelationship, error } = await supabase
    .from('WorkRelationship')
    .update(updates)
    .eq('id', id)
    .select(`
      id,
      brandVerified,
      supplierVerified,
      projectDate,
      projectDescription,
      createdAt,
      updatedAt
    `)
    .single()

  if (error) {
    console.error('Error updating verification:', error)
    return serverErrorResponse('Failed to update verification')
  }

  const isFullyVerified = updatedRelationship.brandVerified && updatedRelationship.supplierVerified

  return successResponse({
    relationship: {
      ...updatedRelationship,
      isFullyVerified,
    },
    message: isFullyVerified
      ? 'Work relationship fully verified by both parties!'
      : 'Verification updated successfully',
  })
}

// DELETE /api/me/verifications/[id] - Remove verification
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const { id } = await params
  const session = await getSession()
  const supabase = await createClient()

  // Get the relationship
  const { data: relationship } = await supabase
    .from('WorkRelationship')
    .select(`
      id,
      brand:Brand(userId),
      supplier:Supplier(userId)
    `)
    .eq('id', id)
    .single()

  if (!relationship) {
    return notFoundResponse('Verification not found')
  }

  // Supabase returns nested relations as arrays
  const delBrand = Array.isArray(relationship.brand) ? relationship.brand[0] : relationship.brand
  const delSupplier = Array.isArray(relationship.supplier) ? relationship.supplier[0] : relationship.supplier

  // Verify user has access
  const hasAccess =
    (session.isBrand && delBrand?.userId === user.id) ||
    (session.isSupplier && delSupplier?.userId === user.id)

  if (!hasAccess) {
    return notFoundResponse('Verification not found')
  }

  // Delete the relationship
  const { error } = await supabase
    .from('WorkRelationship')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting verification:', error)
    return serverErrorResponse('Failed to delete verification')
  }

  return successResponse({
    deleted: true,
    message: 'Verification removed successfully',
  })
}
