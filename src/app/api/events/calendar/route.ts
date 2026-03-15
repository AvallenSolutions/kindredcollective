import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function formatIcalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeIcal(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export async function GET(request: Request) {
  const supabase = createAdminClient()

  const { data: events, error } = await supabase
    .from('Event')
    .select('id, title, slug, description, startDate, endDate, isVirtual, venueName, city, country, onlineUrl')
    .eq('status', 'PUBLISHED')
    .order('startDate', { ascending: true })
    .limit(200)

  if (error) {
    return new NextResponse('Failed to fetch events', { status: 500 })
  }

  const host = new URL(request.url).origin

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kindred Collective//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Kindred Collective Events',
    'X-WR-TIMEZONE:UTC',
  ]

  for (const event of events || []) {
    const start = new Date(event.startDate)
    const end = event.endDate ? new Date(event.endDate) : new Date(start.getTime() + 2 * 60 * 60 * 1000)

    const locationParts = []
    if (!event.isVirtual) {
      if (event.venueName) locationParts.push(event.venueName)
      if (event.city) locationParts.push(event.city)
      if (event.country) locationParts.push(event.country)
    }
    const location = event.isVirtual ? (event.onlineUrl || 'Online') : (locationParts.join(', ') || 'TBC')

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:event-${event.id}@kindredcollective.com`)
    lines.push(`DTSTART:${formatIcalDate(start)}`)
    lines.push(`DTEND:${formatIcalDate(end)}`)
    lines.push(`SUMMARY:${escapeIcal(event.title)}`)
    if (event.description) lines.push(`DESCRIPTION:${escapeIcal(event.description)}`)
    lines.push(`LOCATION:${escapeIcal(location)}`)
    lines.push(`URL:${host}/events/${event.slug}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  return new NextResponse(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="kindred-events.ics"',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
