'use client'

import { useState, useMemo } from 'react'
import { Calendar, MapPin, Video, Filter } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { EventCard } from '@/components/events'
import { events } from '../../../../../prisma/seed-events'
import { EVENT_TYPE_LABELS } from '@/types/database'
import type { EventType } from '@prisma/client'
import { cn } from '@/lib/utils'

// Transform seed data
const eventData = events.map((e, index) => ({
  id: `event-${index}`,
  ...e,
  attendeeCount: Math.floor(Math.random() * 50) + 10, // Random attendee count for demo
}))

const eventTypes = Object.entries(EVENT_TYPE_LABELS) as [EventType, string][]

type ViewMode = 'list' | 'calendar'
type TimeFilter = 'upcoming' | 'past' | 'all'

export default function EventsPage() {
  const [selectedType, setSelectedType] = useState<EventType | null>(null)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('upcoming')
  const [locationFilter, setLocationFilter] = useState<'all' | 'in-person' | 'virtual'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const now = new Date()

  const filteredEvents = useMemo(() => {
    return eventData
      .filter((event) => {
        // Time filter
        if (timeFilter === 'upcoming' && new Date(event.startDate) < now) return false
        if (timeFilter === 'past' && new Date(event.startDate) >= now) return false

        // Type filter
        if (selectedType && event.type !== selectedType) return false

        // Location filter
        if (locationFilter === 'in-person' && event.isVirtual) return false
        if (locationFilter === 'virtual' && !event.isVirtual) return false

        return true
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
  }, [selectedType, timeFilter, locationFilter])

  // Group events by month for calendar view
  const eventsByMonth = useMemo(() => {
    const grouped: Record<string, typeof eventData> = {}
    filteredEvents.forEach((event) => {
      const monthKey = new Date(event.startDate).toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
      })
      if (!grouped[monthKey]) grouped[monthKey] = []
      grouped[monthKey].push(event)
    })
    return grouped
  }, [filteredEvents])

  const featuredEvents = filteredEvents.filter((e) => e.isFeatured)
  const regularEvents = filteredEvents.filter((e) => !e.isFeatured)

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-amber-400 py-12 border-b-4 border-black">
        <div className="section-container">
          <Badge className="mb-4 bg-black text-amber-400 border-black">
            <Calendar className="w-3 h-3 mr-1" />
            {eventData.length} Events
          </Badge>
          <h1 className="font-display text-display-sm lg:text-display-md mb-4">
            Events & Meetups
          </h1>
          <p className="text-lg max-w-2xl">
            Trade shows, networking events, workshops, and Kindred community gatherings.
            Connect with the industry in person and online.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b-3 border-black sticky top-16 lg:top-20 z-40">
        <div className="section-container py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Time Filter */}
            <div className="flex gap-2">
              {(['upcoming', 'past', 'all'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={cn(
                    'px-4 py-2 text-sm font-bold border-2 transition-colors capitalize',
                    timeFilter === filter
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-gray-200 hover:border-black'
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Location Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setLocationFilter('all')}
                className={cn(
                  'px-4 py-2 text-sm font-bold border-2 transition-colors',
                  locationFilter === 'all'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-gray-200 hover:border-black'
                )}
              >
                All
              </button>
              <button
                onClick={() => setLocationFilter('in-person')}
                className={cn(
                  'px-4 py-2 text-sm font-bold border-2 transition-colors inline-flex items-center gap-1',
                  locationFilter === 'in-person'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-gray-200 hover:border-black'
                )}
              >
                <MapPin className="w-3 h-3" />
                In-Person
              </button>
              <button
                onClick={() => setLocationFilter('virtual')}
                className={cn(
                  'px-4 py-2 text-sm font-bold border-2 transition-colors inline-flex items-center gap-1',
                  locationFilter === 'virtual'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-gray-200 hover:border-black'
                )}
              >
                <Video className="w-3 h-3" />
                Virtual
              </button>
            </div>

            {/* Type Filter - Scrollable */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedType(null)}
                className={cn(
                  'px-3 py-1 text-xs font-bold border-2 transition-colors whitespace-nowrap',
                  !selectedType
                    ? 'bg-amber-400 text-black border-black'
                    : 'bg-white text-black border-gray-200 hover:border-black'
                )}
              >
                All Types
              </button>
              {eventTypes.map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setSelectedType(value)}
                  className={cn(
                    'px-3 py-1 text-xs font-bold border-2 transition-colors whitespace-nowrap',
                    selectedType === value
                      ? 'bg-amber-400 text-black border-black'
                      : 'bg-white text-black border-gray-200 hover:border-black'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="section-container py-8 lg:py-12">
        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-600">
            Showing <span className="font-bold text-black">{filteredEvents.length}</span> events
          </p>
        </div>

        {filteredEvents.length > 0 ? (
          <>
            {/* Featured Events */}
            {featuredEvents.length > 0 && timeFilter !== 'past' && (
              <div className="mb-12">
                <h2 className="font-display text-xl font-bold mb-6">Featured Events</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredEvents.map((event) => (
                    <EventCard key={event.id} event={event} variant="featured" />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Events by Month */}
            {Object.entries(eventsByMonth).map(([month, monthEvents]) => {
              const nonFeatured = monthEvents.filter((e) => !e.isFeatured)
              if (nonFeatured.length === 0) return null

              return (
                <div key={month} className="mb-12">
                  <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {month}
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {nonFeatured.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        ) : (
          <div className="text-center py-16 bg-white border-3 border-black">
            <div className="w-16 h-16 bg-gray-100 border-3 border-black mx-auto mb-4 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-display text-xl font-bold mb-2">No events found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedType(null)
                setTimeFilter('upcoming')
                setLocationFilter('all')
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </section>

      {/* Host CTA */}
      <section className="bg-black text-white py-12">
        <div className="section-container text-center">
          <h2 className="font-display text-2xl lg:text-3xl font-bold mb-4">
            Want to Host an Event?
          </h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            Got an event that would interest the Kindred community? Get in touch to have it listed.
          </p>
          <Button size="lg">
            Submit an Event
          </Button>
        </div>
      </section>
    </div>
  )
}
