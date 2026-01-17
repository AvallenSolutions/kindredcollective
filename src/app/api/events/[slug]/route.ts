import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  successResponse,
  notFoundResponse,
} from '@/lib/api/response'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// GET /api/events/[slug] - Get single event detail
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: event, error } = await supabase
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
      rsvps:EventRsvp(
        id,
        status,
        user:User(
          id,
          member:Member(firstName, lastName, avatarUrl, jobTitle)
        )
      )
    `)
    .eq('slug', slug)
    .eq('status', 'PUBLISHED')
    .single()

  if (error || !event) {
    return notFoundResponse('Event not found')
  }

  // Calculate RSVP counts
  const rsvps = event.rsvps || []
  const rsvpCounts = {
    going: rsvps.filter((r: { status: string }) => r.status === 'GOING').length,
    interested: rsvps.filter((r: { status: string }) => r.status === 'INTERESTED').length,
    notGoing: rsvps.filter((r: { status: string }) => r.status === 'NOT_GOING').length,
  }

  // Get attendees if showAttendees is true
  let attendees: Array<{
    firstName: string
    lastName: string
    avatarUrl: string | null
    jobTitle: string | null
    status: string
  }> = []

  if (event.showAttendees) {
    attendees = rsvps
      .filter((r: any) => {
        const user = Array.isArray(r.user) ? r.user[0] : r.user
        const member = user?.member
        const memberData = Array.isArray(member) ? member[0] : member
        return (r.status === 'GOING' || r.status === 'INTERESTED') && memberData
      })
      .map((r: any) => {
        const user = Array.isArray(r.user) ? r.user[0] : r.user
        const member = user?.member
        const memberData = Array.isArray(member) ? member[0] : member
        return {
          firstName: memberData.firstName,
          lastName: memberData.lastName,
          avatarUrl: memberData.avatarUrl,
          jobTitle: memberData.jobTitle,
          status: r.status,
        }
      })
  }

  // Calculate spots remaining
  const spotsRemaining = event.capacity
    ? event.capacity - rsvpCounts.going
    : null

  return successResponse({
    ...event,
    rsvps: undefined, // Remove raw rsvps
    rsvpCounts,
    attendees,
    spotsRemaining,
    isFull: event.capacity ? rsvpCounts.going >= event.capacity : false,
  })
}
