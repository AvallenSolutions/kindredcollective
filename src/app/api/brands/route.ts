import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  successResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/brands - List public brands with filtering
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  // Pagination
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  // Filters
  const category = searchParams.get('category')
  const location = searchParams.get('location')
  const search = searchParams.get('search')
  const isVerified = searchParams.get('verified')

  let query = supabase
    .from('Brand')
    .select(`
      id,
      name,
      slug,
      tagline,
      description,
      logoUrl,
      heroImageUrl,
      category,
      subcategories,
      yearFounded,
      location,
      country,
      isVerified,
      createdAt,
      images:BrandImage(url, alt, order)
    `, { count: 'exact' })
    .eq('isPublic', true)
    .order('isVerified', { ascending: false })
    .order('createdAt', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (category) {
    query = query.eq('category', category)
  }

  if (location) {
    query = query.or(`location.ilike.%${location}%,country.ilike.%${location}%`)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,tagline.ilike.%${search}%`)
  }

  if (isVerified === 'true') {
    query = query.eq('isVerified', true)
  }

  const { data: brands, error, count } = await query

  if (error) {
    console.error('Error fetching brands:', error)
    return serverErrorResponse('Failed to fetch brands')
  }

  // Get all unique categories for filter options
  const { data: categoriesData } = await supabase
    .from('Brand')
    .select('category')
    .eq('isPublic', true)

  const categories = Array.from(new Set(categoriesData?.map(b => b.category) || []))

  return successResponse({
    brands,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
    filters: {
      categories,
    },
  })
}
