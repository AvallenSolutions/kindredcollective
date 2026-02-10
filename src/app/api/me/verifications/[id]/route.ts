import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth, getUserBrands, getUserSuppliers } from '@/lib/auth/session'
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

/**
 * Determine which side of a work relationship the user is on,
 * based on whether the brand or supplier belongs to any of the user's orgs.
 */
async function getUserRelationshipAccess(userId: string, relationship: {
  brandId: string
  supplierId: string
}) {
  const [userBrands, userSuppliers] = await Promise.all([
    getUserBrands(userId),
    getUserSuppliers(userId),
  ])

  const userBrandIds = userBrands.map((b: any) => b.id)
  const userSupplierIds = userSuppliers.map((s: any) => s.id)

  const isBrandSide = userBrandIds.includes(relationship.brandId)
  const isSupplierSide = userSupplierIds.includes(relationship.supplierId)

  return { isBrandSide, isSupplierSide, hasAccess: isBrandSide || isSupplierSide }
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
  const adminClient = createAdminClient()

  const { data: relationship, error } = await adminClient
    .from('WorkRelationship')
    .select(`
      id,
      brandId,
      supplierId,
      brandVerified,
      supplierVerified,
      projectDate,
      projectDescription,
      createdAt,
      updatedAt,
      brand:Brand(id, name, slug, logoUrl, category, isVerified),
      supplier:Supplier(id, companyName, slug, logoUrl, category, isVerified)
    `)
    .eq('id', id)
    .single()

  if (error || !relationship) {
    return notFoundResponse('Verification not found')
  }

  // Check if the user has access via org membership
  const access = await getUserRelationshipAccess(user.id, {
    brandId: relationship.brandId,
    supplierId: relationship.supplierId,
  })

  if (!access.hasAccess) {
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
  const adminClient = createAdminClient()
  const body = await request.json()

  const { verified, projectDate, projectDescription } = body

  // Get the relationship
  const { data: relationship } = await adminClient
    .from('WorkRelationship')
    .select('id, brandId, supplierId')
    .eq('id', id)
    .single()

  if (!relationship) {
    return notFoundResponse('Verification not found')
  }

  // Determine which side the user is on via org membership
  const access = await getUserRelationshipAccess(user.id, {
    brandId: relationship.brandId,
    supplierId: relationship.supplierId,
  })

  if (!access.hasAccess) {
    return notFoundResponse('Verification not found')
  }

  // Build updates
  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  }

  if (verified !== undefined) {
    if (access.isBrandSide) {
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

  const { data: updatedRelationship, error } = await adminClient
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
  const adminClient = createAdminClient()

  // Get the relationship
  const { data: relationship } = await adminClient
    .from('WorkRelationship')
    .select('id, brandId, supplierId')
    .eq('id', id)
    .single()

  if (!relationship) {
    return notFoundResponse('Verification not found')
  }

  // Check if the user has access via org membership
  const access = await getUserRelationshipAccess(user.id, {
    brandId: relationship.brandId,
    supplierId: relationship.supplierId,
  })

  if (!access.hasAccess) {
    return notFoundResponse('Verification not found')
  }

  // Delete the relationship
  const { error } = await adminClient
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
