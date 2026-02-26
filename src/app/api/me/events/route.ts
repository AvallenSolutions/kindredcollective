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

const VALID_EVENT_TYPES = ['TRADE_SHOW', 'MEETUP', 'WORKSHOP', 'WEBINAR', 'NETWORKING', 'LAUNCH', 'PARTY', 'OTHER']

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// GET /api/me/events - Get current user's events
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated || !session.user) {
    return unauthorizedResponse('Authentication required')
  }

  // Only users with brand/supplier affiliations or admins can manage events
  if (!session.hasBrandAffiliation && !session.hasSupplierAffiliation && !session.isAdmin) {
    return unauthorizedResponse('Brand or Supplier affiliation required')
  }

  const adminClient = createAdminClient()
  const { searchParams } = new URL(request.url)

  const { page, limit, from, to } = parsePagination(searchParams)
  const status = searchParams.get('status')

  let query = adminClient
    .from('Event')
    .select('*, rsvps:EventRsvp(count)', { count: 'exact' })
    .eq('createdById', session.user.id)
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
  const session = await getSession()
  if (!session.isAuthenticated || !session.user) {
    return unauthorizedResponse('Authentication required')
  }

  if (!session.hasBrandAffiliation && !session.hasSupplierAffiliation && !session.isAdmin) {
    return unauthorizedResponse('Brand or Supplier affiliation required')
  }

  const adminClient = createAdminClient()

  let body
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON body')
  }

  const {
    title, description, type, startDate, endDate,
    venueName, address, city, country,
    isVirtual, virtualUrl, capacity,
    imageUrl, isFree, price, registrationUrl,
  } = body

  if (!title || !type || !startDate) {
    return errorResponse('Title, type, and start date are required')
  }

  if (!VALID_EVENT_TYPES.includes(type)) {
    return errorResponse('Invalid event type')
  }

  // Generate unique slug
  let slug = generateSlug(title)
  const { data: existingEvent } = await adminClient
    .from('Event')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existingEvent) {
    slug = `${slug}-${Date.now()}`
  }

  const { data: event, error } = await adminClient
    .from('Event')
    .insert({
      createdById: session.user.id,
      title,
      slug,
      description,
      type,
      startDate,
      endDate,
      venueName,
      address,
      city,
      country,
      isVirtual: isVirtual || false,
      virtualUrl,
      capacity,
      imageUrl,
      isFree: isFree !== false,
      price: isFree === false ? price : null,
      registrationUrl,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('[MyEvents] Error creating event:', error)
    return serverErrorResponse('Failed to create event')
  }

  return successResponse(event, 201)
}
