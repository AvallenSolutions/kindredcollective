import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  successResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/events - List published events with filtering
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  // Pagination
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  // Filters
  const type = searchParams.get('type')
  const city = searchParams.get('city')
  const country = searchParams.get('country')
  const search = searchParams.get('search')
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
    .range((page - 1) * limit, page * limit - 1)

  // Only show upcoming events by default
  if (upcoming) {
    query = query.gte('startDate', new Date().toISOString())
  }

  if (type) {
    query = query.eq('type', type)
  }

  if (city) {
    query = query.ilike('city', `%${city}%`)
  }

  if (country) {
    query = query.ilike('country', `%${country}%`)
  }

  if (search) {
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
    console.error('Error fetching events:', error)
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
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
    filters: {
      types,
      cities,
    },
  })
}
