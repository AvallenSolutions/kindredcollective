import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSession } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { applyRateLimit } from '@/lib/api/rate-limit'

// GET /api/requests - List open RFPs
export async function GET(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, 60, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const session = await getSession()
  if (!session.isAuthenticated) return unauthorizedResponse()

  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const { page, limit, from, to } = parsePagination(searchParams)

  const category = searchParams.get('category')
  const status = searchParams.get('status') || 'OPEN'
  const location = searchParams.get('location')
  const remoteOk = searchParams.get('remoteOk')

  let query = supabase
    .from('RFP')
    .select(`
      id, title, description, category, subcategories,
      budget, deadline, location, isRemoteOk, status, createdAt,
      brand:Brand(id, name, slug, logoUrl, category, isVerified),
      responses:RFPResponse(count)
    `, { count: 'exact' })
    .eq('status', status)
    .order('createdAt', { ascending: false })
    .range(from, to)

  if (category) query = query.eq('category', category)
  if (location) query = query.ilike('location', `%${location}%`)
  if (remoteOk === 'true') query = query.eq('isRemoteOk', true)

  const { data: rfps, error, count } = await query

  if (error) {
    console.error('[Requests] Error fetching RFPs:', error)
    return serverErrorResponse('Failed to fetch requests')
  }

  return successResponse({
    rfps,
    pagination: paginationMeta(page, limit, count || 0),
  })
}

// POST /api/requests - Create new RFP (brand members only)
export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, 10, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const session = await getSession()
  if (!session.isAuthenticated || !session.user) return unauthorizedResponse()

  const brandOrg = session.organisations.find(o => o.organisationType === 'BRAND')
  if (!brandOrg?.brandId) {
    return errorResponse('Only brand members can post requests', 403)
  }

  const body = await request.json()
  const { title, description, category, subcategories, budget, deadline, location, isRemoteOk } = body

  if (!title?.trim()) return errorResponse('Title is required')
  if (!description?.trim()) return errorResponse('Description is required')
  if (!category) return errorResponse('Category is required')

  const supabase = createAdminClient()

  const { data: rfp, error } = await supabase
    .from('RFP')
    .insert({
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      brandId: brandOrg.brandId,
      postedByUserId: session.user.id,
      category,
      subcategories: subcategories || [],
      budget: budget?.trim() || null,
      deadline: deadline || null,
      location: location?.trim() || null,
      isRemoteOk: isRemoteOk || false,
      status: 'OPEN',
      updatedAt: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    console.error('[Requests] Error creating RFP:', error)
    return serverErrorResponse('Failed to create request')
  }

  return successResponse({ rfp }, 201)
}
