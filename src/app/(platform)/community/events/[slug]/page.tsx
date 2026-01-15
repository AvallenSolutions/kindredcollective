'use client'

import { useState } from 'react'
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
  Check,
  Ticket,
} from 'lucide-react'
import { Badge, Button, Card, CardContent } from '@/components/ui'
import { events } from '../../../../../../prisma/seed-events'
import { EVENT_TYPE_LABELS } from '@/types/database'
import type { EventType } from '@prisma/client'
import { cn, formatDate } from '@/lib/utils'
import { use } from 'react'

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

// Sample attendees for demo
const sampleAttendees = [
  { id: '1', name: 'Sarah Mitchell', company: 'Tarquin\'s Gin', avatarUrl: null },
  { id: '2', name: 'James Cooper', company: 'Scale Drinks', avatarUrl: null },
  { id: '3', name: 'Emma Thompson', company: 'Lucky Saint', avatarUrl: null },
  { id: '4', name: 'David Chen', company: 'Berlin Packaging', avatarUrl: null },
  { id: '5', name: 'Lucy Williams', company: 'BB Comms', avatarUrl: null },
  { id: '6', name: 'Tom Richards', company: 'Chapel Down', avatarUrl: null },
]

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = use(params)
  const event = events.find((e) => e.slug === slug)
  const [rsvpStatus, setRsvpStatus] = useState<'none' | 'going' | 'interested'>('none')

  if (!event) {
    notFound()
  }

  const typeColor = typeColors[event.type] || 'bg-gray-400'
  const isPast = new Date(event.startDate) < new Date()

  const handleRsvp = (status: 'going' | 'interested') => {
    setRsvpStatus(status === rsvpStatus ? 'none' : status)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className={cn(typeColor, 'border-b-4 border-black')}>
        <div className="section-container py-8">
          {/* Back Link */}
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
                  {EVENT_TYPE_LABELS[event.type]}
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

              {/* Meta */}
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

            {/* RSVP/Price */}
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
                  <Button
                    size="lg"
                    onClick={() => handleRsvp('going')}
                    className={cn(
                      rsvpStatus === 'going' && 'bg-lime text-black border-lime'
                    )}
                  >
                    {rsvpStatus === 'going' ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Going
                      </>
                    ) : (
                      <>
                        <Ticket className="w-4 h-4 mr-2" />
                        {event.isFree ? 'RSVP' : 'Get Tickets'}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleRsvp('interested')}
                    className={cn(
                      rsvpStatus === 'interested' && 'bg-cyan text-black border-cyan'
                    )}
                  >
                    {rsvpStatus === 'interested' ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Interested
                      </>
                    ) : (
                      'Interested'
                    )}
                  </Button>
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
          {/* Main Content */}
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
            {event.showAttendees && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-xl font-bold">
                      Who&apos;s Attending
                    </h2>
                    <Badge variant="cyan">
                      <Users className="w-3 h-3 mr-1" />
                      {sampleAttendees.length} attending
                    </Badge>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {sampleAttendees.map((attendee) => (
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
                  <p className="text-sm text-gray-500 mt-4">
                    + more attendees
                  </p>
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
                      {event.city}, {event.country}
                    </p>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(`${event.venueName} ${event.address} ${event.city}`)}`}
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
                    <span className="font-bold">{EVENT_TYPE_LABELS[event.type]}</span>
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
