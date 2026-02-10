import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth, getUserBrandViaOrg, getUserBrands } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/me/brand?orgId=xxx - Get a specific brand via org, or list all user's brands
export async function GET(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse('Authentication required')
  }

  const orgId = request.nextUrl.searchParams.get('orgId')
  const adminClient = createAdminClient()

  // If orgId provided, get specific brand
  if (orgId) {
    const brand = await getUserBrandViaOrg(user.id, orgId)
    if (!brand) {
      return notFoundResponse('Brand not found or access denied')
    }

    // Get images
    const { data: images } = await adminClient
      .from('BrandImage')
      .select('*')
      .eq('brandId', brand.id)
      .order('order')

    return successResponse({ ...brand, images: images || [] })
  }

  // No orgId: return all user's brands
  const brands = await getUserBrands(user.id)
  return successResponse(brands)
}

// POST /api/me/brand - Create a new brand + organisation
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
    name,
    slug,
    tagline,
    description,
    story,
    category,
    subcategories,
    yearFounded,
    location,
    country,
    websiteUrl,
    instagramUrl,
    linkedinUrl,
    twitterUrl,
    logoUrl,
    heroImageUrl,
  } = body

  if (!name || !slug || !category) {
    return errorResponse('Name, slug, and category are required')
  }

  // Check if slug already exists
  const { data: existingBrand } = await adminClient
    .from('Brand')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existingBrand) {
    return errorResponse('A brand with this slug already exists')
  }

  // Create brand (no userId)
  const { data: brand, error } = await adminClient
    .from('Brand')
    .insert({
      name,
      slug,
      tagline,
      description,
      story,
      category,
      subcategories: subcategories || [],
      yearFounded,
      location,
      country,
      websiteUrl,
      instagramUrl,
      linkedinUrl,
      twitterUrl,
      logoUrl,
      heroImageUrl,
      isPublic: true,
      isVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('[MeBrand] Error creating brand:', error)
    if (error.code === '23505') {
      return errorResponse('Slug already exists')
    }
    return serverErrorResponse('Failed to create brand')
  }

  // Create Organisation linked to this brand
  const { data: org, error: orgError } = await adminClient
    .from('Organisation')
    .insert({
      name: brand.name,
      slug: brand.slug,
      type: 'BRAND',
      brandId: brand.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (orgError) {
    console.error('[MeBrand] Error creating organisation:', orgError)
  }

  // Create OrganisationMember as OWNER
  if (org) {
    await adminClient.from('OrganisationMember').insert({
      organisationId: org.id,
      userId: user.id,
      role: 'OWNER',
      joinedAt: new Date().toISOString(),
    })
  }

  return successResponse(brand, 201)
}

// PATCH /api/me/brand?orgId=xxx - Update brand profile
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

  const brand = await getUserBrandViaOrg(user.id, orgId)
  if (!brand) {
    return notFoundResponse('Brand not found or access denied')
  }

  const adminClient = createAdminClient()
  const body = await request.json()

  const allowedFields = [
    'name', 'tagline', 'description', 'story', 'category', 'subcategories',
    'yearFounded', 'location', 'country', 'websiteUrl', 'instagramUrl',
    'linkedinUrl', 'twitterUrl', 'logoUrl', 'heroImageUrl', 'isPublic',
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
    .from('Brand')
    .update(updates)
    .eq('id', brand.id)
    .select()
    .single()

  if (error) {
    console.error('[MeBrand] Error updating brand:', error)
    return serverErrorResponse('Failed to update brand')
  }

  return successResponse(updated)
}

// DELETE /api/me/brand?orgId=xxx - Delete brand profile
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

  const brand = await getUserBrandViaOrg(user.id, orgId)
  if (!brand) {
    return notFoundResponse('Brand not found or access denied')
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('Brand')
    .delete()
    .eq('id', brand.id)

  if (error) {
    console.error('[MeBrand] Error deleting brand:', error)
    return serverErrorResponse('Failed to delete brand')
  }

  return successResponse({ deleted: true })
}
