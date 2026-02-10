import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { sanitizeFilterInput } from '@/lib/api/sanitize'

// GET /api/admin/brands - List all brands (including private)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const supabase = await createClient()
  const adminClient = createAdminClient()
  const { searchParams } = new URL(request.url)

  const { page, limit, from, to } = parsePagination(searchParams)
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const isPublic = searchParams.get('isPublic')
  const isVerified = searchParams.get('isVerified')

  let query = supabase
    .from('Brand')
    .select('*, images:BrandImage(url, alt, order), organisation:Organisation(id, name, slug, members:OrganisationMember(userId, role))', { count: 'exact' })
    .order('createdAt', { ascending: false })
    .range(from, to)

  if (category) {
    query = query.eq('category', category)
  }

  if (search) {
    query = query.ilike('name', `%${sanitizeFilterInput(search)}%`)
  }

  if (isPublic !== null && isPublic !== undefined) {
    query = query.eq('isPublic', isPublic === 'true')
  }

  if (isVerified !== null && isVerified !== undefined) {
    query = query.eq('isVerified', isVerified === 'true')
  }

  const { data: brands, error, count } = await query

  if (error) {
    console.error('[AdminBrands] Error fetching brands:', error)
    return serverErrorResponse('Failed to fetch brands')
  }

  return successResponse({
    brands,
    pagination: paginationMeta(page, limit, count || 0),
  })
}

// POST /api/admin/brands - Create a new brand (optionally with org + owner)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
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
    isPublic = true,
    isVerified = false,
    ownerId, // Optional: userId of the owner
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

  // Create the brand
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
      isPublic,
      isVerified,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('[AdminBrands] Error creating brand:', error)
    return serverErrorResponse('Failed to create brand')
  }

  // If ownerId is provided, create Organisation + OrganisationMember
  if (ownerId && brand) {
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

    if (org && !orgError) {
      await adminClient.from('OrganisationMember').insert({
        organisationId: org.id,
        userId: ownerId,
        role: 'OWNER',
        joinedAt: new Date().toISOString(),
      })
    }
  }

  return successResponse(brand, 201)
}
