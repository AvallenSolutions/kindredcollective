import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  successResponse,
  serverErrorResponse,
} from '@/lib/api/response'
import { sanitizeFilterInput } from '@/lib/api/sanitize'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { applyRateLimit } from '@/lib/api/rate-limit'

// GET /api/suppliers - List public suppliers with filtering
export async function GET(request: NextRequest) {
  // Rate limit: 60 requests per minute per IP
  const rateLimitResponse = applyRateLimit(request, 60, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  // Pagination (clamped to [1, 100])
  const { page, limit, from, to } = parsePagination(searchParams)

  // Filters
  const category = searchParams.get('category')
  const rawLocation = searchParams.get('location')
  const rawSearch = searchParams.get('search')
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
    .range(from, to)

  if (category) {
    query = query.eq('category', category)
  }

  if (rawLocation) {
    const location = sanitizeFilterInput(rawLocation)
    query = query.or(`location.ilike.%${location}%,country.ilike.%${location}%`)
  }

  if (rawSearch) {
    const search = sanitizeFilterInput(rawSearch)
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
    console.error('[Suppliers] Error fetching suppliers:', error)
    return serverErrorResponse('Failed to fetch suppliers')
  }

  // Get unique categories for filter options
  const { data: categoriesData } = await supabase
    .from('Supplier')
    .select('category')
    .eq('isPublic', true)

  const categories = Array.from(new Set(categoriesData?.map(s => s.category) || []))

  return successResponse({
    suppliers,
    pagination: paginationMeta(page, limit, count || 0),
    filters: {
      categories,
    },
  })
}
