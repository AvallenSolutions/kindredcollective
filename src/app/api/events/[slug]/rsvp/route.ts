import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// Helper to get event by slug
async function getEventBySlug(supabase: Awaited<ReturnType<typeof createClient>>, slug: string) {
  const { data: event } = await supabase
    .from('Event')
    .select('id, status, startDate, capacity')
    .eq('slug', slug)
    .single()
  return event
}

// GET /api/events/[slug]/rsvp - Get user's RSVP status for an event
export async function GET(request: NextRequest, { params }: RouteParams) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const { slug } = await params
  const supabase = await createClient()

  const event = await getEventBySlug(supabase, slug)
  if (!event) {
    return notFoundResponse('Event not found')
  }

  const { data: rsvp, error } = await supabase
    .from('EventRsvp')
    .select('id, status, createdAt, updatedAt')
    .eq('eventId', event.id)
    .eq('userId', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching RSVP:', error)
    return serverErrorResponse('Failed to fetch RSVP')
  }

  return successResponse({
    rsvp: rsvp || null,
    hasRsvp: !!rsvp,
  })
}

// POST /api/events/[slug]/rsvp - Create RSVP
export async function POST(request: NextRequest, { params }: RouteParams) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const { slug } = await params
  const supabase = await createClient()
  const body = await request.json()

  const { status } = body

  if (!status || !['GOING', 'INTERESTED', 'NOT_GOING'].includes(status)) {
    return errorResponse('Invalid RSVP status. Must be GOING, INTERESTED, or NOT_GOING')
  }

  // Check if event exists and is published
  const event = await getEventBySlug(supabase, slug)

  if (!event) {
    return notFoundResponse('Event not found')
  }

  if (event.status !== 'PUBLISHED') {
    return errorResponse('Cannot RSVP to an unpublished event')
  }

  if (new Date(event.startDate) < new Date()) {
    return errorResponse('Cannot RSVP to a past event')
  }

  // Check if already has an RSVP
  const { data: existing } = await supabase
    .from('EventRsvp')
    .select('id')
    .eq('eventId', event.id)
    .eq('userId', user.id)
    .single()

  if (existing) {
    return errorResponse('You have already RSVPed to this event. Use PATCH to update.')
  }

  // If status is GOING, check capacity
  if (status === 'GOING' && event.capacity) {
    const { data: goingRsvps } = await supabase
      .from('EventRsvp')
      .select('id')
      .eq('eventId', event.id)
      .eq('status', 'GOING')

    if ((goingRsvps?.length || 0) >= event.capacity) {
      return errorResponse('Event is at full capacity')
    }
  }

  const { data: rsvp, error } = await supabase
    .from('EventRsvp')
    .insert({
      eventId: event.id,
      userId: user.id,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating RSVP:', error)
    return serverErrorResponse('Failed to create RSVP')
  }

  return successResponse(rsvp, 201)
}

// PATCH /api/events/[slug]/rsvp - Update RSVP status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const { slug } = await params
  const supabase = await createClient()
  const body = await request.json()

  const { status } = body

  if (!status || !['GOING', 'INTERESTED', 'NOT_GOING'].includes(status)) {
    return errorResponse('Invalid RSVP status. Must be GOING, INTERESTED, or NOT_GOING')
  }

  // Check if event exists
  const event = await getEventBySlug(supabase, slug)

  if (!event) {
    return notFoundResponse('Event not found')
  }

  if (new Date(event.startDate) < new Date()) {
    return errorResponse('Cannot update RSVP for a past event')
  }

  // If changing to GOING, check capacity
  if (status === 'GOING' && event.capacity) {
    const { data: goingRsvps } = await supabase
      .from('EventRsvp')
      .select('id, userId')
      .eq('eventId', event.id)
      .eq('status', 'GOING')

    // Exclude current user from count
    const otherGoing = goingRsvps?.filter(r => r.userId !== user.id) || []
    if (otherGoing.length >= event.capacity) {
      return errorResponse('Event is at full capacity')
    }
  }

  const { data: rsvp, error } = await supabase
    .from('EventRsvp')
    .update({
      status,
      updatedAt: new Date().toISOString(),
    })
    .eq('eventId', event.id)
    .eq('userId', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating RSVP:', error)
    return serverErrorResponse('Failed to update RSVP')
  }

  if (!rsvp) {
    return notFoundResponse('RSVP not found')
  }

  return successResponse(rsvp)
}

// DELETE /api/events/[slug]/rsvp - Remove RSVP
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const { slug } = await params
  const supabase = await createClient()

  const event = await getEventBySlug(supabase, slug)
  if (!event) {
    return notFoundResponse('Event not found')
  }

  const { error } = await supabase
    .from('EventRsvp')
    .delete()
    .eq('eventId', event.id)
    .eq('userId', user.id)

  if (error) {
    console.error('Error deleting RSVP:', error)
    return serverErrorResponse('Failed to delete RSVP')
  }

  return successResponse({ deleted: true })
}
