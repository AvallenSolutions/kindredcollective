import Image from 'next/image'
import Link from 'next/link'
import { Calendar, MapPin, Users, Video, Clock, ArrowRight, ImageIcon } from 'lucide-react'
import { Badge, Card, CardContent } from '@/components/ui'
import { cn, formatDate } from '@/lib/utils'
import { EVENT_TYPE_LABELS } from '@/types/database'
import type { EventType, EventStatus } from '@prisma/client'
import { EventRsvpBox } from './event-rsvp-box'

interface EventCardProps {
  event: {
    id: string
    title: string
    slug: string
    description: string | null
    type: EventType
    status: EventStatus
    startDate: Date
    endDate: Date | null
    isVirtual: boolean
    venueName: string | null
    city: string | null
    country: string | null
    capacity: number | null
    isFree: boolean
    price: number | null
    imageUrl?: string | null
    attendeeCount?: number
  }
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

export function EventCard({ event }: EventCardProps) {
  const typeColor = typeColors[event.type] || 'bg-gray-400'

  return (
    <Link href={`/community/events/${event.slug}`}>
      <Card className="h-full group cursor-pointer">
        <CardContent className="p-0">
          {/* Date Banner */}
          <div className={cn('p-4 border-b-3 border-black', typeColor)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-2xl font-bold">
                  {new Date(event.startDate).getDate()}
                </p>
                <p className="font-display text-sm font-bold uppercase">
                  {new Date(event.startDate).toLocaleDateString('en-GB', { month: 'short' })}
                </p>
              </div>
              <Badge variant="outline" className="bg-white/90">
                {EVENT_TYPE_LABELS[event.type]}
              </Badge>
            </div>
          </div>

          {/* Event Image */}
          {event.imageUrl ? (
            <div className="relative w-full h-40 border-b-3 border-black overflow-hidden">
              <Image
                src={event.imageUrl}
                alt={event.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          ) : (
            <div className="relative w-full h-40 border-b-3 border-black overflow-hidden bg-gray-100 flex items-center justify-center">
              <ImageIcon className="w-10 h-10 text-gray-300" />
            </div>
          )}

          {/* Content */}
          <div className="p-5">
            {/* Title */}
            <h3 className="font-display text-lg font-bold mb-2 group-hover:text-cyan transition-colors">
              {event.title}
            </h3>

            {/* Description */}
            {event.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {event.description}
              </p>
            )}

            {/* Meta */}
            <div className="space-y-2 text-sm text-gray-500 mb-4">
              {/* Date & Time */}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>
                  {formatDate(event.startDate, { weekday: 'short', day: 'numeric', month: 'short' })}
                  {event.endDate && new Date(event.endDate).getDate() !== new Date(event.startDate).getDate() && (
                    <> - {formatDate(event.endDate, { day: 'numeric', month: 'short' })}</>
                  )}
                </span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2">
                {event.isVirtual ? (
                  <>
                    <Video className="w-4 h-4" />
                    <span>Online Event</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    <span>{event.city}, {event.country}</span>
                  </>
                )}
              </div>

              {/* Attendees */}
              {event.attendeeCount !== undefined && event.attendeeCount > 0 && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{event.attendeeCount} attending</span>
                </div>
              )}
            </div>

            {/* RSVP Attendees */}
            <EventRsvpBox eventId={event.id} eventSlug={event.slug} compact />

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              {/* Price */}
              <span className={cn(
                'font-display text-sm font-bold',
                event.isFree ? 'text-lime-600' : 'text-black'
              )}>
                {event.isFree ? 'FREE' : `£${event.price}`}
              </span>

              {/* CTA */}
              <span className="inline-flex items-center text-xs font-display font-bold uppercase tracking-wide text-black group-hover:text-cyan transition-colors">
                View Event
                <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
