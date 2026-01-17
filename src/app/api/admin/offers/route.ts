import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/admin/offers - List all offers
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  const supplierId = searchParams.get('supplierId')
  const search = searchParams.get('search')

  let query = supabase
    .from('Offer')
    .select('*, supplier:Supplier(id, companyName, slug, logoUrl), claims:OfferClaim(count)', { count: 'exact' })
    .order('createdAt', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  if (type) {
    query = query.eq('type', type)
  }

  if (supplierId) {
    query = query.eq('supplierId', supplierId)
  }

  if (search) {
    query = query.ilike('title', `%${search}%`)
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

// POST /api/admin/offers - Create a new offer
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const supabase = await createClient()
  const body = await request.json()

  const {
    supplierId,
    title,
    description,
    type,
    discountValue,
    code,
    termsConditions,
    status = 'DRAFT',
    startDate,
    endDate,
    forBrandsOnly = false,
    minOrderValue,
    imageUrl,
  } = body

  if (!supplierId || !title || !type) {
    return errorResponse('Supplier ID, title, and type are required')
  }

  // Verify supplier exists
  const { data: supplier } = await supabase
    .from('Supplier')
    .select('id')
    .eq('id', supplierId)
    .single()

  if (!supplier) {
    return errorResponse('Supplier not found')
  }

  const { data: offer, error } = await supabase
    .from('Offer')
    .insert({
      supplierId,
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
      viewCount: 0,
      claimCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select('*, supplier:Supplier(id, companyName, slug)')
    .single()

  if (error) {
    console.error('Error creating offer:', error)
    return serverErrorResponse('Failed to create offer')
  }

  return successResponse(offer, 201)
}
