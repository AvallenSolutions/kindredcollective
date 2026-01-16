import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireSupplier, getUserSupplier } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/me/offers - Get current supplier's offers
export async function GET(request: NextRequest) {
  let user
  try {
    user = await requireSupplier()
  } catch {
    return unauthorizedResponse('Supplier access required')
  }

  const supabase = await createClient()

  // Get user's supplier
  const supplier = await getUserSupplier(user.id)
  if (!supplier) {
    return errorResponse('No supplier profile found')
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const status = searchParams.get('status')

  let query = supabase
    .from('Offer')
    .select('*, claims:OfferClaim(count)', { count: 'exact' })
    .eq('supplierId', supplier.id)
    .order('createdAt', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  const { data: offers, error, count } = await query

  if (error) {
    console.error('Error fetching offers:', error)
    return serverErrorResponse('Failed to fetch offers')
  }

  return successResponse({
    offers,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  })
}

// POST /api/me/offers - Create a new offer
export async function POST(request: NextRequest) {
  let user
  try {
    user = await requireSupplier()
  } catch {
    return unauthorizedResponse('Supplier access required')
  }

  const supabase = await createClient()

  // Get user's supplier
  const supplier = await getUserSupplier(user.id)
  if (!supplier) {
    return errorResponse('No supplier profile found. Create a supplier profile first.')
  }

  const body = await request.json()

  const {
    title,
    description,
    type,
    discountValue,
    code,
    termsConditions,
    startDate,
    endDate,
    forBrandsOnly = false,
    minOrderValue,
    imageUrl,
  } = body

  if (!title || !type) {
    return errorResponse('Title and type are required')
  }

  const { data: offer, error } = await supabase
    .from('Offer')
    .insert({
      supplierId: supplier.id,
      title,
      description,
      type,
      discountValue,
      code,
      termsConditions,
      status: 'DRAFT',
      startDate,
      endDate,
      forBrandsOnly,
      minOrderValue,
      imageUrl,
      viewCount: 0,
      claimCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating offer:', error)
    return serverErrorResponse('Failed to create offer')
  }

  return successResponse(offer, 201)
}
