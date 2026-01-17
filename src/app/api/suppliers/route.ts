import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  successResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/suppliers - List public suppliers with filtering
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
  const certifications = searchParams.getAll('certification')
  const services = searchParams.getAll('service')
  const isVerified = searchParams.get('verified')

  let query = supabase
    .from('Supplier')
    .select(`
      id,
      companyName,
      slug,
      tagline,
      description,
      logoUrl,
      heroImageUrl,
      category,
      subcategories,
      services,
      certifications,
      location,
      country,
      serviceRegions,
      isVerified,
      viewCount,
      createdAt,
      portfolioImages:SupplierImage(url, alt, order)
    `, { count: 'exact' })
    .eq('isPublic', true)
    .order('isVerified', { ascending: false })
    .order('viewCount', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (category) {
    query = query.eq('category', category)
  }

  if (location) {
    query = query.or(`location.ilike.%${location}%,country.ilike.%${location}%`)
  }

  if (search) {
    query = query.or(`companyName.ilike.%${search}%,description.ilike.%${search}%,tagline.ilike.%${search}%`)
  }

  if (certifications.length > 0) {
    query = query.contains('certifications', certifications)
  }

  if (services.length > 0) {
    query = query.overlaps('services', services)
  }

  if (isVerified === 'true') {
    query = query.eq('isVerified', true)
  }

  const { data: suppliers, error, count } = await query

  if (error) {
    console.error('Error fetching suppliers:', error)
    return serverErrorResponse('Failed to fetch suppliers')
  }

  // Get all unique categories for filter options
  const { data: categoriesData } = await supabase
    .from('Supplier')
    .select('category')
    .eq('isPublic', true)

  const categories = [...new Set(categoriesData?.map(s => s.category) || [])]

  return successResponse({
    suppliers,
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
