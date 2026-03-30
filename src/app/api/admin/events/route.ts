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

// GET /api/admin/events - List all events
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)

  const { page, limit, from, to } = parsePagination(searchParams)
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  const search = searchParams.get('search')

  let query = supabase
    .from('Event')
    .select('*, rsvps:EventRsvp(count)', { count: 'exact' })
    .order('startDate', { ascending: true })
    .range(from, to)

  if (status) {
    query = query.eq('status', status)
  }

  if (type) {
    query = query.eq('type', type)
  }

  if (search) {
    query = query.ilike('title', `%${sanitizeFilterInput(search)}%`)
  }

  const { data: events, error, count } = await query

  if (error) {
    console.error('[AdminEvents] Error fetching events:', error)
    return serverErrorResponse('Failed to fetch events')
  }

  // Fetch creator info separately (no FK relation on createdById)
  const creatorIds = [...new Set((events || []).map((e: { createdById: string | null }) => e.createdById).filter(Boolean))]
  let creatorMap: Record<string, { email: string; member: { firstName: string; lastName: string } | null }> = {}

  if (creatorIds.length > 0) {
    const { data: users } = await supabase
      .from('User')
      .select('id, email, member:Member(firstName, lastName)')
      .in('id', creatorIds)

    if (users) {
      for (const u of users as any[]) {
        const memberData = Array.isArray(u.member) ? u.member[0] || null : u.member
        creatorMap[u.id] = { email: u.email, member: memberData }
      }
    }
  }

  const eventsWithCreators = (events || []).map((e: { createdById: string | null }) => ({
    ...e,
    createdBy: e.createdById ? creatorMap[e.createdById] || null : null,
  }))

  return successResponse({
    events: eventsWithCreators,
    pagination: paginationMeta(page, limit, count || 0),
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

  const supabase = createAdminClient()
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
      id: crypto.randomUUID(),
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
    console.error('[AdminEvents] Error creating event:', error)
    return serverErrorResponse('Failed to create event')
  }

  return successResponse(event, 201)
}
