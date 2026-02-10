import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/session'
import {
  successResponse,
  serverErrorResponse,
} from '@/lib/api/response'
import { sanitizeFilterInput } from '@/lib/api/sanitize'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { applyRateLimit } from '@/lib/api/rate-limit'

// GET /api/offers - List active offers
export async function GET(request: NextRequest) {
  // Rate limit: 60 requests per minute per IP
  const rateLimitResponse = applyRateLimit(request, 60, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  // Get session to check if user is a brand (for brand-only offers)
  const session = await getSession()
  const isBrandUser = session.hasBrandAffiliation

  // Pagination (clamped to [1, 100])
  const { page, limit, from, to } = parsePagination(searchParams)

  // Filters
  const type = searchParams.get('type')
  const supplierId = searchParams.get('supplierId')
  const rawSearch = searchParams.get('search')

  const now = new Date().toISOString()

  let query = supabase
    .from('Offer')
    .select(`
      id,
      title,
      description,
      type,
      discountValue,
      code,
      termsConditions,
      status,
      startDate,
      endDate,
      forBrandsOnly,
      minOrderValue,
      imageUrl,
      viewCount,
      claimCount,
      createdAt,
      supplier:Supplier(
        id,
        companyName,
        slug,
        logoUrl,
        category,
        isVerified
      )
    `, { count: 'exact' })
    .eq('status', 'ACTIVE')
    .or(`endDate.is.null,endDate.gte.${now}`)
    .or(`startDate.is.null,startDate.lte.${now}`)
    .order('createdAt', { ascending: false })
    .range(from, to)

  // Filter out brand-only offers for non-brand users
  if (!isBrandUser) {
    query = query.eq('forBrandsOnly', false)
  }

  if (type) {
    query = query.eq('type', type)
  }

  if (supplierId) {
    query = query.eq('supplierId', supplierId)
  }

  if (rawSearch) {
    const search = sanitizeFilterInput(rawSearch)
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  const { data: offers, error, count } = await query

  if (error) {
    console.error('[Offers] Error fetching offers:', error)
    return serverErrorResponse('Failed to fetch offers')
  }

  // Get filter options - only fetch the type column for unique values
  const { data: typesData } = await supabase
    .from('Offer')
    .select('type')
    .eq('status', 'ACTIVE')

  const types = Array.from(new Set(typesData?.map(o => o.type) || []))

  return successResponse({
    offers,
    pagination: paginationMeta(page, limit, count || 0),
    filters: {
      types,
    },
  })
}
