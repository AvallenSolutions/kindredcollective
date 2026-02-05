import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
  const { searchParams } = new URL(request.url)

  const { page, limit, from, to } = parsePagination(searchParams)
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const isPublic = searchParams.get('isPublic')
  const isVerified = searchParams.get('isVerified')

  let query = supabase
    .from('Brand')
    .select('*, user:User(email), images:BrandImage(url, alt, order)', { count: 'exact' })
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

// POST /api/admin/brands - Create a new brand (without user association)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const supabase = await createClient()
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
    userId,
  } = body

  if (!name || !slug || !category) {
    return errorResponse('Name, slug, and category are required')
  }

  // Check if slug already exists
  const { data: existingBrand } = await supabase
    .from('Brand')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existingBrand) {
    return errorResponse('A brand with this slug already exists')
  }

  // If userId is provided, check if the user already has a brand
  if (userId) {
    const { data: existingUserBrand } = await supabase
      .from('Brand')
      .select('id')
      .eq('userId', userId)
      .single()

    if (existingUserBrand) {
      return errorResponse('This user already has a brand associated')
    }
  }

  const { data: brand, error } = await supabase
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
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('[AdminBrands] Error creating brand:', error)
    return serverErrorResponse('Failed to create brand')
  }

  return successResponse(brand, 201)
}
