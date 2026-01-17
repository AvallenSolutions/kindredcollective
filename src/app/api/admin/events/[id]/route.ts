import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/events/[id] - Get single event with all details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const { id } = await params
  const supabase = await createClient()

  const { data: event, error } = await supabase
    .from('Event')
    .select('*, rsvps:EventRsvp(*, user:User(email, member:Member(firstName, lastName)))')
    .eq('id', id)
    .single()

  if (error || !event) {
    return notFoundResponse('Event not found')
  }

  // Calculate RSVP counts
  const rsvpCounts = {
    going: event.rsvps?.filter((r: { status: string }) => r.status === 'GOING').length || 0,
    interested: event.rsvps?.filter((r: { status: string }) => r.status === 'INTERESTED').length || 0,
    notGoing: event.rsvps?.filter((r: { status: string }) => r.status === 'NOT_GOING').length || 0,
  }

  return successResponse({ ...event, rsvpCounts })
}

// PATCH /api/admin/events/[id] - Update event
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()

  const allowedFields = [
    'title',
    'slug',
    'description',
    'type',
    'status',
    'startDate',
    'endDate',
    'timezone',
    'isVirtual',
    'venueName',
    'address',
    'city',
    'country',
    'virtualUrl',
    'imageUrl',
    'capacity',
    'isFree',
    'price',
    'registrationUrl',
    'showAttendees',
    'isFeatured',
  ]

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  }

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field]
    }
  }

  // Handle price based on isFree
  if (body.isFree === true) {
    updates.price = null
  }

  const { data: event, error } = await supabase
    .from('Event')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating event:', error)
    return serverErrorResponse('Failed to update event')
  }

  if (!event) {
    return notFoundResponse('Event not found')
  }

  return successResponse(event)
}

// DELETE /api/admin/events/[id] - Delete event
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const { id } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from('Event')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting event:', error)
    return serverErrorResponse('Failed to delete event')
  }

  return successResponse({ deleted: true })
}
