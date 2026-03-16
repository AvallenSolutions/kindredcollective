import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  successResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'
import { applyRateLimit } from '@/lib/api/rate-limit'

// GET /api/events/[slug]/attendees - Fetch public attendees for an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, 30, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { slug } = await params
    const supabase = createAdminClient()

    // Get event by slug
    const { data: event, error: eventError } = await supabase
      .from('Event')
      .select('id')
      .eq('slug', slug)
      .eq('status', 'PUBLISHED')
      .single()

    if (eventError || !event) {
      return notFoundResponse('Event not found')
    }

    // Get GOING RSVPs
    const { data: rsvps, count } = await supabase
      .from('EventRsvp')
      .select('userId', { count: 'exact' })
      .eq('eventId', event.id)
      .eq('status', 'GOING')
      .limit(12)

    if (!rsvps || rsvps.length === 0) {
      return successResponse({ attendees: [], totalCount: 0 })
    }

    const userIds = rsvps.map(r => r.userId)

    // Fetch member names (public profiles)
    const { data: members } = await supabase
      .from('Member')
      .select('userId, firstName, lastName')
      .in('userId', userIds)
      .eq('isPublic', true)

    // Fetch company info
    const { data: brands } = await supabase
      .from('Brand')
      .select('userId, name')
      .in('userId', userIds)
    const { data: suppliers } = await supabase
      .from('Supplier')
      .select('userId, companyName')
      .in('userId', userIds)

    const brandMap = new Map(brands?.map(b => [b.userId, b.name]) ?? [])
    const supplierMap = new Map(suppliers?.map(s => [s.userId, s.companyName]) ?? [])

    const attendees = (members ?? []).map(m => ({
      name: `${m.firstName} ${m.lastName}`,
      company: brandMap.get(m.userId) || supplierMap.get(m.userId) || undefined,
    }))

    return successResponse({
      attendees,
      totalCount: count ?? attendees.length,
    })
  } catch {
    return serverErrorResponse()
  }
}
