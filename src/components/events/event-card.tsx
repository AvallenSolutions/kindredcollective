import Link from 'next/link'
import { Calendar, MapPin, Users, Video, Clock, ArrowRight } from 'lucide-react'
import { Badge, Card, CardContent } from '@/components/ui'
import { cn, formatDate } from '@/lib/utils'
import { EVENT_TYPE_LABELS } from '@/types/database'
import type { EventType, EventStatus } from '@prisma/client'

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
    isFeatured: boolean
    attendeeCount?: number
  }
  variant?: 'default' | 'featured'
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

export function EventCard({ event, variant = 'default' }: EventCardProps) {
  const typeColor = typeColors[event.type] || 'bg-gray-400'
  const isFeatured = variant === 'featured' || event.isFeatured

  return (
    <Link href={`/community/events/${event.slug}`}>
      <Card className={cn('h-full group cursor-pointer', isFeatured && 'border-4 border-cyan')}>
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

          {/* Content */}
          <div className="p-5">
            {/* Featured Badge */}
            {isFeatured && (
              <Badge variant="coral" className="mb-3">
                Featured
              </Badge>
            )}

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
