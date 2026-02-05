import { NextRequest } from 'next/server'
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

// GET /api/admin/suppliers - List all suppliers (including private)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)

  const { page, limit, from, to } = parsePagination(searchParams)
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const isPublic = searchParams.get('isPublic')
  const claimStatus = searchParams.get('claimStatus')

  let query = supabase
    .from('Supplier')
    .select('*, user:User(email)', { count: 'exact' })
    .order('createdAt', { ascending: false })
    .range(from, to)

  if (category) {
    query = query.eq('category', category)
  }

  if (search) {
    query = query.ilike('companyName', `%${sanitizeFilterInput(search)}%`)
  }

  if (isPublic !== null && isPublic !== undefined) {
    query = query.eq('isPublic', isPublic === 'true')
  }

  if (claimStatus) {
    query = query.eq('claimStatus', claimStatus)
  }

  const { data: suppliers, error, count } = await query

  if (error) {
    console.error('[AdminSuppliers] Error fetching suppliers:', error)
    return serverErrorResponse('Failed to fetch suppliers')
  }

  return successResponse({
    suppliers,
    pagination: paginationMeta(page, limit, count || 0),
  })
}

// POST /api/admin/suppliers - Create a new supplier
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const supabase = createAdminClient()
  const body = await request.json()

  const {
    companyName,
    slug,
    tagline,
    description,
    category,
    services,
    location,
    country,
    websiteUrl,
    logoUrl,
    heroImageUrl,
    contactName,
    contactEmail,
    isPublic = true,
    isVerified = false,
  } = body

  if (!companyName || !slug || !category) {
    return errorResponse('Company name, slug, and category are required')
  }

  const { data: supplier, error } = await supabase
    .from('Supplier')
    .insert({
      companyName,
      slug,
      tagline,
      description,
      category,
      services: services || [],
      location,
      country,
      websiteUrl,
      logoUrl,
      heroImageUrl,
      contactName,
      contactEmail,
      isPublic,
      isVerified,
      claimStatus: 'UNCLAIMED',
      serviceRegions: [],
      subcategories: [],
      certifications: [],
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('[AdminSuppliers] Error creating supplier:', error)
    return serverErrorResponse('Failed to create supplier')
  }

  return successResponse(supplier, 201)
}
