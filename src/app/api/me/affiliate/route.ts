import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth, getUserBrands } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// POST /api/me/affiliate - Create a brand or claim a supplier profile (via Organisation)
export async function POST(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
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

    // Create brand (no userId)
    const { data: brand, error: brandError } = await adminSupabase
      .from('Brand')
      .insert({
        name: brandName,
        slug: finalSlug,
        category: brandCategory || 'OTHER',
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

    // Create Organisation for brand
    const { data: org, error: orgError } = await adminSupabase
      .from('Organisation')
      .insert({
        name: brandName,
        slug: finalSlug,
        type: 'BRAND',
        brandId: brand.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single()

    if (orgError) {
      console.error('[Affiliate] Error creating organisation:', orgError)
      return serverErrorResponse('Failed to create organisation')
    }

    // Add user as owner
    await adminSupabase.from('OrganisationMember').insert({
      organisationId: org.id,
      userId: user.id,
      role: 'OWNER',
      joinedAt: new Date().toISOString(),
    })

    return successResponse({
      brand,
      organisation: org,
      message: 'Brand created with organisation. Please refresh the page.',
    }, 201)
  }

  // type === 'SUPPLIER'
  if (!supplierId) {
    return errorResponse('Supplier ID is required to claim a supplier profile')
  }

  // Check if supplier exists and is unclaimed
  const { data: supplier, error: supplierError } = await adminSupabase
    .from('Supplier')
    .select('id, companyName, slug, claimStatus')
    .eq('id', supplierId)
    .single()

  if (supplierError || !supplier) {
    return errorResponse('Supplier not found', 404)
  }

  if (supplier.claimStatus === 'CLAIMED') {
    return errorResponse('This supplier profile has already been claimed')
  }

  // Update claim status (no userId)
  const { error: claimError } = await adminSupabase
    .from('Supplier')
    .update({ claimStatus: 'CLAIMED', updatedAt: new Date().toISOString() })
    .eq('id', supplierId)

  if (claimError) {
    console.error('[Affiliate] Error claiming supplier:', claimError)
    return serverErrorResponse('Failed to claim supplier')
  }

  // Create Organisation for supplier
  const { data: org, error: orgError } = await adminSupabase
    .from('Organisation')
    .insert({
      name: supplier.companyName,
      slug: supplier.slug,
      type: 'SUPPLIER',
      supplierId: supplier.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (orgError) {
    console.error('[Affiliate] Error creating organisation:', orgError)
    return serverErrorResponse('Failed to create organisation')
  }

  // Add user as owner
  await adminSupabase.from('OrganisationMember').insert({
    organisationId: org.id,
    userId: user.id,
    role: 'OWNER',
    joinedAt: new Date().toISOString(),
  })

  return successResponse({
    supplier,
    organisation: org,
    message: 'Supplier claimed with organisation. Please refresh the page.',
  })
}
