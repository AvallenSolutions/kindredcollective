import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth, getSession } from '@/lib/auth/session'
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
    user = await requireAuth()
  } catch {
    return unauthorizedResponse('Authentication required')
  }

  const session = await getSession()

  // Only users with brand/supplier affiliations or admins can manage events
  if (!session.hasBrandAffiliation && !session.hasSupplierAffiliation && !session.isAdmin) {
    return unauthorizedResponse('Brand or Supplier affiliation required')
  }

  const { id } = await params
  const adminClient = createAdminClient()

  const { data: event, error } = await adminClient
    .from('Event')
    .select('*, rsvps:EventRsvp(*, user:User(email))')
    .eq('id', id)
    .single()

  if (error || !event) {
    return notFoundResponse('Event not found')
  }

  // Check ownership (events use createdById)
  if (event.createdById !== user.id && !session.isAdmin) {
    return forbiddenResponse('You can only view your own events')
  }

  return successResponse(event)
}

// PATCH /api/me/events/[id] - Update event
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse('Authentication required')
  }

  const session = await getSession()

  if (!session.hasBrandAffiliation && !session.hasSupplierAffiliation && !session.isAdmin) {
    return unauthorizedResponse('Brand or Supplier affiliation required')
  }

  const { id } = await params
  const adminClient = createAdminClient()
  const body = await request.json()

  // Verify ownership
  const { data: existing } = await adminClient
    .from('Event')
    .select('createdById')
    .eq('id', id)
    .single()

  if (!existing) {
    return notFoundResponse('Event not found')
  }

  if (existing.createdById !== user.id && !session.isAdmin) {
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

  const { data: event, error } = await adminClient
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
    user = await requireAuth()
  } catch {
    return unauthorizedResponse('Authentication required')
  }

  const session = await getSession()

  if (!session.hasBrandAffiliation && !session.hasSupplierAffiliation && !session.isAdmin) {
    return unauthorizedResponse('Brand or Supplier affiliation required')
  }

  const { id } = await params
  const adminClient = createAdminClient()

  // Verify ownership
  const { data: existing } = await adminClient
    .from('Event')
    .select('createdById')
    .eq('id', id)
    .single()

  if (!existing) {
    return notFoundResponse('Event not found')
  }

  if (existing.createdById !== user.id && !session.isAdmin) {
    return forbiddenResponse('You can only delete your own events')
  }

  const { error } = await adminClient
    .from('Event')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting event:', error)
    return serverErrorResponse('Failed to delete event')
  }

  return successResponse({ deleted: true })
}
