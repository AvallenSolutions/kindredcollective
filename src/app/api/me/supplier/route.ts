import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth, getUserSupplierViaOrg, getUserSuppliers } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/me/supplier?orgId=xxx - Get a specific supplier via org, or list all user's suppliers
export async function GET(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse('Authentication required')
  }

  const orgId = request.nextUrl.searchParams.get('orgId')
  const adminClient = createAdminClient()

  if (orgId) {
    const supplier = await getUserSupplierViaOrg(user.id, orgId)
    if (!supplier) {
      return notFoundResponse('Supplier not found or access denied')
    }

    // Get related data
    const [imagesResult, offersResult, reviewsResult] = await Promise.all([
      adminClient.from('SupplierImage').select('*').eq('supplierId', supplier.id).order('order'),
      adminClient.from('Offer').select('*').eq('supplierId', supplier.id),
      adminClient.from('SupplierReview').select('*').eq('supplierId', supplier.id).eq('isPublic', true),
    ])

    return successResponse({
      ...supplier,
      images: imagesResult.data || [],
      offers: offersResult.data || [],
      reviews: reviewsResult.data || [],
    })
  }

  // No orgId: return all user's suppliers
  const suppliers = await getUserSuppliers(user.id)
  return successResponse(suppliers)
}

// POST /api/me/supplier - Create supplier profile + organisation
export async function POST(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse('Authentication required')
  }

  const adminClient = createAdminClient()
  const body = await request.json()

  const {
    companyName, slug, tagline, description, category,
    services, subcategories, certifications,
    location, country, serviceRegions,
    websiteUrl, linkedinUrl, instagramUrl, portfolioUrl,
    logoUrl, heroImageUrl,
    contactName, contactEmail, contactPhone,
    moqMin, moqMax, leadTimeDays,
  } = body

  if (!companyName || !slug || !category) {
    return errorResponse('Company name, slug, and category are required')
  }

  // Create supplier (no userId)
  const { data: supplier, error } = await adminClient
    .from('Supplier')
    .insert({
      companyName, slug, tagline, description, category,
      services: services || [],
      subcategories: subcategories || [],
      certifications: certifications || [],
      location, country,
      serviceRegions: serviceRegions || [],
      websiteUrl, linkedinUrl, instagramUrl, portfolioUrl,
      logoUrl, heroImageUrl,
      contactName, contactEmail, contactPhone,
      moqMin, moqMax, leadTimeDays,
      isPublic: true,
      isVerified: false,
      claimStatus: 'CLAIMED',
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('[MeSupplier] Error creating supplier:', error)
    if (error.code === '23505') {
      return errorResponse('Slug already exists')
    }
    return serverErrorResponse('Failed to create supplier')
  }

  // Create Organisation
  const { data: org, error: orgError } = await adminClient
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
    console.error('[MeSupplier] Error creating organisation:', orgError)
  }

  if (org) {
    await adminClient.from('OrganisationMember').insert({
      organisationId: org.id,
      userId: user.id,
      role: 'OWNER',
      joinedAt: new Date().toISOString(),
    })
  }

  return successResponse(supplier, 201)
}

// PATCH /api/me/supplier?orgId=xxx - Update supplier profile
export async function PATCH(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse('Authentication required')
  }

  const orgId = request.nextUrl.searchParams.get('orgId')
  if (!orgId) {
    return errorResponse('orgId query parameter is required')
  }

  const supplier = await getUserSupplierViaOrg(user.id, orgId)
  if (!supplier) {
    return notFoundResponse('Supplier not found or access denied')
  }

  const adminClient = createAdminClient()
  const body = await request.json()

  const allowedFields = [
    'companyName', 'tagline', 'description', 'category',
    'services', 'subcategories', 'certifications',
    'location', 'country', 'serviceRegions',
    'websiteUrl', 'linkedinUrl', 'instagramUrl', 'portfolioUrl',
    'logoUrl', 'heroImageUrl',
    'contactName', 'contactEmail', 'contactPhone',
    'moqMin', 'moqMax', 'leadTimeDays', 'isPublic',
  ]

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  }

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field]
    }
  }

  const { data: updated, error } = await adminClient
    .from('Supplier')
    .update(updates)
    .eq('id', supplier.id)
    .select()
    .single()

  if (error) {
    console.error('[MeSupplier] Error updating supplier:', error)
    return serverErrorResponse('Failed to update supplier')
  }

  return successResponse(updated)
}

// DELETE /api/me/supplier?orgId=xxx - Delete supplier profile
export async function DELETE(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse('Authentication required')
  }

  const orgId = request.nextUrl.searchParams.get('orgId')
  if (!orgId) {
    return errorResponse('orgId query parameter is required')
  }

  const supplier = await getUserSupplierViaOrg(user.id, orgId)
  if (!supplier) {
    return notFoundResponse('Supplier not found or access denied')
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('Supplier')
    .delete()
    .eq('id', supplier.id)

  if (error) {
    console.error('[MeSupplier] Error deleting supplier:', error)
    return serverErrorResponse('Failed to delete supplier')
  }

  return successResponse({ deleted: true })
}
