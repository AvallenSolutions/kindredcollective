import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/session'
import {
  successResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/offers - List active offers
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  // Get session to check if user is a brand (for brand-only offers)
  const session = await getSession()
  const isBrandUser = session.isBrand

  // Pagination
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  // Filters
  const type = searchParams.get('type')
  const supplierId = searchParams.get('supplierId')
  const search = searchParams.get('search')

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
    .range((page - 1) * limit, page * limit - 1)

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

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  const { data: offers, error, count } = await query

  if (error) {
    console.error('Error fetching offers:', error)
    return serverErrorResponse('Failed to fetch offers')
  }

  // Get filter options
  const { data: typesData } = await supabase
    .from('Offer')
    .select('type')
    .eq('status', 'ACTIVE')

  const types = [...new Set(typesData?.map(o => o.type) || [])]

  return successResponse({
    offers,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
    filters: {
      types,
    },
  })
}
