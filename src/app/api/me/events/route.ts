import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSession, requireAuth } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'

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

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const { page, limit, from, to } = parsePagination(searchParams)
  const status = searchParams.get('status')

  let query = supabase
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

  const supabase = await createClient()
  const body = await request.json()

  const {
    title, description, type, startDate, endDate,
    location, isOnline, onlineUrl, capacity,
    imageUrl, tags,
  } = body

  if (!title || !type || !startDate) {
    return errorResponse('Title, type, and start date are required')
  }

  const { data: event, error } = await supabase
    .from('Event')
    .insert({
      createdById: session.user.id,
      title, description, type,
      startDate, endDate,
      location, isOnline, onlineUrl, capacity,
      imageUrl,
      tags: tags || [],
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
