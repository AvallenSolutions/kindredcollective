import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'

// GET /api/me/events - Get current user's events
export async function GET(request: NextRequest) {
  let user
  try {
    user = await requireRole(['BRAND', 'SUPPLIER', 'ADMIN'])
  } catch {
    return unauthorizedResponse('Brand or Supplier access required')
  }

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const { page, limit, from, to } = parsePagination(searchParams)
  const status = searchParams.get('status')

  let query = supabase
    .from('Event')
    .select('*, rsvps:EventRsvp(count)', { count: 'exact' })
    .eq('createdById', user.id)
    .order('startDate', { ascending: true })
    .range(from, to)

  if (status) {
    query = query.eq('status', status)
  }

  const { data: events, error, count } = await query

  if (error) {
    console.error('[MyEvents] Error fetching events:', error)
    return serverErrorResponse('Failed to fetch events')
  }

  return successResponse({
    events,
    pagination: paginationMeta(page, limit, count || 0),
  })
}

// POST /api/me/events - Create a new event
export async function POST(request: NextRequest) {
  let user
  try {
    user = await requireRole(['BRAND', 'SUPPLIER', 'ADMIN'])
  } catch {
    return unauthorizedResponse('Brand or Supplier access required')
  }

  const supabase = await createClient()
  const body = await request.json()

  const {
    title,
    slug,
    description,
    type,
    startDate,
    endDate,
    isVirtual = false,
    venueName,
    address,
    city,
    country,
    virtualUrl,
    imageUrl,
    capacity,
    isFree = true,
    price,
    registrationUrl,
  } = body

  if (!title || !slug || !type || !startDate) {
    return errorResponse('Title, slug, type, and start date are required')
  }

  const { data: event, error } = await supabase
    .from('Event')
    .insert({
      title,
      slug,
      description,
      type,
      status: 'DRAFT', // User events start as draft
      startDate,
      endDate,
      isVirtual,
      venueName,
      address,
      city,
      country,
      virtualUrl,
      imageUrl,
      capacity,
      isFree,
      price: isFree ? null : price,
      registrationUrl,
      showAttendees: true,
      isFeatured: false, // Only admins can feature events
      timezone: 'Europe/London',
      createdById: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('[MyEvents] Error creating event:', error)
    if (error.code === '23505') {
      return errorResponse('Slug already exists')
    }
    return serverErrorResponse('Failed to create event')
  }

  return successResponse(event, 201)
}
