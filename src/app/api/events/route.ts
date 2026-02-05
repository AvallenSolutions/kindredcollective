import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  successResponse,
  serverErrorResponse,
} from '@/lib/api/response'
import { sanitizeFilterInput } from '@/lib/api/sanitize'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { applyRateLimit } from '@/lib/api/rate-limit'

// GET /api/events - List published events with filtering
export async function GET(request: NextRequest) {
  // Rate limit: 60 requests per minute per IP
  const rateLimitResponse = applyRateLimit(request, 60, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  // Pagination (clamped to [1, 100])
  const { page, limit, from, to } = parsePagination(searchParams)

  // Filters
  const type = searchParams.get('type')
  const rawCity = searchParams.get('city')
  const rawCountry = searchParams.get('country')
  const rawSearch = searchParams.get('search')
  const isVirtual = searchParams.get('virtual')
  const isFree = searchParams.get('free')
  const upcoming = searchParams.get('upcoming') !== 'false' // Default to upcoming only
  const featured = searchParams.get('featured')

  let query = supabase
    .from('Event')
    .select(`
      id,
      title,
      slug,
      description,
      type,
      status,
      startDate,
      endDate,
      timezone,
      isVirtual,
      venueName,
      address,
      city,
      country,
      virtualUrl,
      imageUrl,
      capacity,
      isFree,
      price,
      registrationUrl,
      showAttendees,
      isFeatured,
      createdAt,
      rsvps:EventRsvp(status)
    `, { count: 'exact' })
    .eq('status', 'PUBLISHED')
    .order('isFeatured', { ascending: false })
    .order('startDate', { ascending: true })
    .range(from, to)

  // Only show upcoming events by default
  if (upcoming) {
    query = query.gte('startDate', new Date().toISOString())
  }

  if (type) {
    query = query.eq('type', type)
  }

  if (rawCity) {
    const city = sanitizeFilterInput(rawCity)
    query = query.ilike('city', `%${city}%`)
  }

  if (rawCountry) {
    const country = sanitizeFilterInput(rawCountry)
    query = query.ilike('country', `%${country}%`)
  }

  if (rawSearch) {
    const search = sanitizeFilterInput(rawSearch)
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (isVirtual === 'true') {
    query = query.eq('isVirtual', true)
  } else if (isVirtual === 'false') {
    query = query.eq('isVirtual', false)
  }

  if (isFree === 'true') {
    query = query.eq('isFree', true)
  } else if (isFree === 'false') {
    query = query.eq('isFree', false)
  }

  if (featured === 'true') {
    query = query.eq('isFeatured', true)
  }

  const { data: events, error, count } = await query

  if (error) {
    console.error('[Events] Error fetching events:', error)
    return serverErrorResponse('Failed to fetch events')
  }

  // Process events to add RSVP counts
  const processedEvents = (events || []).map(event => {
    const rsvps = event.rsvps || []
    return {
      ...event,
      rsvps: undefined,
      rsvpCounts: {
        going: rsvps.filter((r: { status: string }) => r.status === 'GOING').length,
        interested: rsvps.filter((r: { status: string }) => r.status === 'INTERESTED').length,
      },
      spotsRemaining: event.capacity
        ? event.capacity - rsvps.filter((r: { status: string }) => r.status === 'GOING').length
        : null,
    }
  })

  // Get filter options
  const { data: typesData } = await supabase
    .from('Event')
    .select('type')
    .eq('status', 'PUBLISHED')

  const { data: citiesData } = await supabase
    .from('Event')
    .select('city')
    .eq('status', 'PUBLISHED')
    .not('city', 'is', null)

  const types = Array.from(new Set(typesData?.map(e => e.type) || []))
  const cities = Array.from(new Set(citiesData?.map(e => e.city).filter(Boolean) || []))

  return successResponse({
    events: processedEvents,
    pagination: paginationMeta(page, limit, count || 0),
    filters: {
      types,
      cities,
    },
  })
}
