import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getSession } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// POST /api/me/affiliate - Allow a MEMBER to claim/create a brand or supplier profile
export async function POST(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const session = await getSession()
  if (!session.isMember) {
    return errorResponse('Only members can affiliate with a brand or supplier', 403)
  }

  const adminSupabase = createAdminClient()
  const body = await request.json()

  const { type, brandName, brandCategory, supplierId } = body

  if (!type || !['BRAND', 'SUPPLIER'].includes(type)) {
    return errorResponse('Type must be BRAND or SUPPLIER')
  }

  if (type === 'BRAND') {
    if (!brandName) {
      return errorResponse('Brand name is required')
    }

    // Generate slug from brand name
    const slug = brandName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if slug exists
    const { data: existing } = await adminSupabase
      .from('Brand')
      .select('id')
      .eq('slug', slug)
      .single()

    const finalSlug = existing ? `${slug}-${Date.now()}` : slug

    // Create brand
    const { data: brand, error: brandError } = await adminSupabase
      .from('Brand')
      .insert({
        name: brandName,
        slug: finalSlug,
        category: brandCategory || 'OTHER',
        userId: user.id,
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single()

    if (brandError) {
      console.error('[Affiliate] Error creating brand:', brandError)
      return serverErrorResponse('Failed to create brand')
    }

    // Update user role to BRAND
    const { error: roleError } = await adminSupabase
      .from('User')
      .update({ role: 'BRAND', updatedAt: new Date().toISOString() })
      .eq('id', user.id)

    if (roleError) {
      console.error('[Affiliate] Error updating role:', roleError)
      return serverErrorResponse('Failed to update role')
    }

    return successResponse({
      brand,
      newRole: 'BRAND',
      message: 'Brand created and role updated. Please refresh the page.',
    }, 201)
  }

  // type === 'SUPPLIER'
  if (!supplierId) {
    return errorResponse('Supplier ID is required to claim a supplier profile')
  }

  // Check if supplier exists and is unclaimed
  const { data: supplier, error: supplierError } = await adminSupabase
    .from('Supplier')
    .select('id, companyName, userId')
    .eq('id', supplierId)
    .single()

  if (supplierError || !supplier) {
    return errorResponse('Supplier not found', 404)
  }

  if (supplier.userId) {
    return errorResponse('This supplier profile has already been claimed')
  }

  // Claim supplier
  const { error: claimError } = await adminSupabase
    .from('Supplier')
    .update({ userId: user.id, updatedAt: new Date().toISOString() })
    .eq('id', supplierId)

  if (claimError) {
    console.error('[Affiliate] Error claiming supplier:', claimError)
    return serverErrorResponse('Failed to claim supplier')
  }

  // Update user role to SUPPLIER
  const { error: roleError } = await adminSupabase
    .from('User')
    .update({ role: 'SUPPLIER', updatedAt: new Date().toISOString() })
    .eq('id', user.id)

  if (roleError) {
    console.error('[Affiliate] Error updating role:', roleError)
    return serverErrorResponse('Failed to update role')
  }

  return successResponse({
    supplier,
    newRole: 'SUPPLIER',
    message: 'Supplier claimed and role updated. Please refresh the page.',
  })
}
