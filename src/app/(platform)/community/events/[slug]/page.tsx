import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  Share2,
  ExternalLink,
  Ticket,
} from 'lucide-react'
import { Badge, Button, Card, CardContent } from '@/components/ui'
import { createAdminClient } from '@/lib/supabase/admin'
import { EVENT_TYPE_LABELS } from '@/types/database'
import type { EventType } from '@prisma/client'
import { cn, formatDate } from '@/lib/utils'
import { EventRsvpButton } from '@/components/events/event-rsvp-button'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface EventDetailPageProps {
  params: Promise<{ slug: string }>
}

const typeColors: Record<EventType, string> = {
  TRADE_SHOW: 'bg-cyan',
  MEETUP: 'bg-lime',
  WORKSHOP: 'bg-purple-500',
  WEBINAR: 'bg-blue-500',
  NETWORKING: 'bg-pink-500',
  LAUNCH: 'bg-coral',
  PARTY: 'bg-amber-400',
  OTHER: 'bg-gray-400',
}

async function getEvent(slug: string) {
  try {
    const supabase = createAdminClient()

    const { data: event, error } = await supabase
      .from('Event')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'PUBLISHED')
      .single()

    if (error || !event) {
      return null
    }

    // Fetch RSVP count
    const { count } = await supabase
      .from('EventRsvp')
      .select('id', { count: 'exact', head: true })
      .eq('eventId', event.id)
      .eq('status', 'GOING')

    // Fetch attendees (public members who RSVP'd)
    const { data: rsvps } = await supabase
      .from('EventRsvp')
      .select('userId')
      .eq('eventId', event.id)
      .eq('status', 'GOING')
      .limit(6)

    let attendees: Array<{ id: string; name: string; company: string }> = []
    if (rsvps && rsvps.length > 0) {
      const userIds = rsvps.map((r) => r.userId)
      const { data: members } = await supabase
        .from('Member')
        .select('userId, firstName, lastName')
        .in('userId', userIds)
        .eq('isPublic', true)

      const { data: brands } = await supabase
        .from('Brand')
        .select('userId, name')
        .in('userId', userIds)
      const { data: suppliers } = await supabase
        .from('Supplier')
        .select('userId, companyName')
        .in('userId', userIds)

      const brandMap = new Map(brands?.map((b) => [b.userId, b.name]) || [])
      const supplierMap = new Map(suppliers?.map((s) => [s.userId, s.companyName]) || [])

      attendees = (members || []).map((m) => ({
        id: m.userId,
        name: `${m.firstName} ${m.lastName}`,
        company: brandMap.get(m.userId) || supplierMap.get(m.userId) || '',
      }))
    }

    return {
      ...event,
      attendeeCount: count || 0,
      attendees,
    }
  } catch {
    return null
  }
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params
  const event = await getEvent(slug)

  if (!event) {
    notFound()
  }

  const typeColor = typeColors[event.type as EventType] || 'bg-gray-400'
  const isPast = new Date(event.startDate) < new Date()

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className={cn(typeColor, 'border-b-4 border-black')}>
        <div className="section-container py-8">
          <Link
            href="/community/events"
            className="inline-flex items-center text-sm font-bold mb-6 hover:underline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Date Box */}
            <div className="w-24 h-24 lg:w-32 lg:h-32 bg-white border-3 border-black flex flex-col items-center justify-center flex-shrink-0">
              <span className="font-display text-3xl lg:text-4xl font-bold">
                {new Date(event.startDate).getDate()}
              </span>
              <span className="font-display text-sm font-bold uppercase">
                {new Date(event.startDate).toLocaleDateString('en-GB', { month: 'short' })}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <Badge variant="outline" className="bg-white/90">
                  {EVENT_TYPE_LABELS[event.type as EventType]}
                </Badge>
                {event.isFeatured && (
                  <Badge variant="coral">Featured</Badge>
                )}
                {isPast && (
                  <Badge variant="outline" className="bg-gray-200">Past Event</Badge>
                )}
              </div>

              <h1 className="font-display text-3xl lg:text-4xl font-bold mb-4">
                {event.title}
              </h1>

              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(event.startDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {new Date(event.startDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  {event.endDate && (
                    <> - {new Date(event.endDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</>
                  )}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex flex-col gap-3">
              {!isPast ? (
                <>
                  <div className="text-center mb-2">
                    <span className={cn(
                      'font-display text-2xl font-bold',
                      event.isFree ? 'text-lime-700' : 'text-black'
                    )}>
                      {event.isFree ? 'FREE' : `£${event.price}`}
                    </span>
                  </div>
                  <EventRsvpButton
                    eventSlug={event.slug}
                    eventId={event.id}
                    eventTitle={event.title}
                    isFree={event.isFree}
                    isRegistrationExternal={!!event.registrationUrl}
                    registrationUrl={event.registrationUrl}
                    isPast={isPast}
                    capacity={event.capacity}
                    currentAttendees={event.attendeeCount}
                  />
                </>
              ) : (
                <Badge variant="outline" className="bg-gray-200 text-gray-600">
                  This event has ended
                </Badge>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-container py-8 lg:py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-display text-xl font-bold mb-4">About This Event</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </CardContent>
            </Card>

            {/* Attendees */}
            {event.attendees.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-xl font-bold">
                      Who&apos;s Attending
                    </h2>
                    <Badge variant="cyan">
                      <Users className="w-3 h-3 mr-1" />
                      {event.attendeeCount} attending
                    </Badge>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {event.attendees.map((attendee: { id: string; name: string; company: string }) => (
                      <div
                        key={attendee.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 border-2 border-gray-200"
                      >
                        <div className="w-10 h-10 bg-cyan border-2 border-black flex items-center justify-center flex-shrink-0">
                          <span className="font-display font-bold">
                            {attendee.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-sm">{attendee.name}</p>
                          <p className="text-xs text-gray-500">{attendee.company}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {event.attendeeCount > event.attendees.length && (
                    <p className="text-sm text-gray-500 mt-4">
                      + {event.attendeeCount - event.attendees.length} more attendees
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Location */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-bold mb-4">
                  {event.isVirtual ? 'Virtual Event' : 'Location'}
                </h3>
                {event.isVirtual ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border-2 border-blue-200">
                      <Video className="w-5 h-5 text-blue-500" />
                      <span className="font-medium">Online Event</span>
                    </div>
                    {event.virtualUrl && !isPast && (
                      <a
                        href={event.virtualUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-500 hover:underline"
                      >
                        Join Link (available after RSVP)
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {event.venueName && (
                      <p className="font-bold">{event.venueName}</p>
                    )}
                    {event.address && (
                      <p className="text-sm text-gray-600">{event.address}</p>
                    )}
                    <p className="text-sm text-gray-600">
                      {[event.city, event.country].filter(Boolean).join(', ')}
                    </p>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent([event.venueName, event.address, event.city].filter(Boolean).join(' '))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-cyan hover:underline mt-2"
                    >
                      <MapPin className="w-4 h-4 mr-1" />
                      View on Map
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Details */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-bold mb-4">Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date</span>
                    <span className="font-bold">
                      {formatDate(event.startDate, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Time</span>
                    <span className="font-bold">
                      {new Date(event.startDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type</span>
                    <span className="font-bold">{EVENT_TYPE_LABELS[event.type as EventType]}</span>
                  </div>
                  {event.capacity && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Capacity</span>
                      <span className="font-bold">{event.capacity} people</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Price</span>
                    <span className={cn('font-bold', event.isFree && 'text-lime-600')}>
                      {event.isFree ? 'FREE' : `£${event.price}`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-bold mb-4">Share Event</h3>
                <Button variant="outline" className="w-full">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
