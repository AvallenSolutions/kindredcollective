import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/admin/events - List all events
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
  const search = searchParams.get('search')

  let query = supabase
    .from('Event')
    .select('*, rsvps:EventRsvp(count)', { count: 'exact' })
    .order('startDate', { ascending: true })
    .range((page - 1) * limit, page * limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  if (type) {
    query = query.eq('type', type)
  }

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  const { data: events, error, count } = await query

  if (error) {
    console.error('Error fetching events:', error)
    return serverErrorResponse('Failed to fetch events')
  }

  return successResponse({
    events,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  })
}

// POST /api/admin/events - Create a new event
export async function POST(request: NextRequest) {
  let admin
  try {
    admin = await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const supabase = await createClient()
  const body = await request.json()

  const {
    title,
    slug,
    description,
    type,
    status = 'DRAFT',
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
    isFeatured = false,
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
      status,
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
      isFeatured,
      showAttendees: true,
      timezone: 'Europe/London',
      createdById: admin.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating event:', error)
    return serverErrorResponse('Failed to create event')
  }

  return successResponse(event, 201)
}
