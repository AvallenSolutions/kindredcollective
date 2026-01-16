import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireBrand } from '@/lib/auth'
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  serverErrorResponse,
} from '@/lib/api/response'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/me/events/[id] - Get single event with RSVPs
export async function GET(request: NextRequest, { params }: RouteParams) {
  let user
  try {
    user = await requireBrand()
  } catch {
    return unauthorizedResponse('Brand access required')
  }

  const { id } = await params
  const supabase = await createClient()

  const { data: event, error } = await supabase
    .from('Event')
    .select('*, rsvps:EventRsvp(*, user:User(email))')
    .eq('id', id)
    .single()

  if (error || !event) {
    return notFoundResponse('Event not found')
  }

  // Check ownership
  if (event.createdById !== user.id && user.role !== 'ADMIN') {
    return forbiddenResponse('You can only view your own events')
  }

  return successResponse(event)
}

// PATCH /api/me/events/[id] - Update event
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  let user
  try {
    user = await requireBrand()
  } catch {
    return unauthorizedResponse('Brand access required')
  }

  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()

  // Verify ownership
  const { data: existing } = await supabase
    .from('Event')
    .select('createdById')
    .eq('id', id)
    .single()

  if (!existing) {
    return notFoundResponse('Event not found')
  }

  if (existing.createdById !== user.id && user.role !== 'ADMIN') {
    return forbiddenResponse('You can only update your own events')
  }

  const allowedFields = [
    'title',
    'description',
    'type',
    'status',
    'startDate',
    'endDate',
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

  return successResponse(event)
}

// DELETE /api/me/events/[id] - Delete event
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  let user
  try {
    user = await requireBrand()
  } catch {
    return unauthorizedResponse('Brand access required')
  }

  const { id } = await params
  const supabase = await createClient()

  // Verify ownership
  const { data: existing } = await supabase
    .from('Event')
    .select('createdById')
    .eq('id', id)
    .single()

  if (!existing) {
    return notFoundResponse('Event not found')
  }

  if (existing.createdById !== user.id && user.role !== 'ADMIN') {
    return forbiddenResponse('You can only delete your own events')
  }

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
