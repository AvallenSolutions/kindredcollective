import Link from 'next/link'
import { Star, MapPin, Clock, CalendarPlus, Ticket, ArrowRight, Mail, Users } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { NewsletterForm } from '@/components/newsletter-form'
import { CalendarButtons } from '@/components/events/calendar-buttons'
import { EventsDirectory } from '@/components/events/events-directory'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const FALLBACK_PAST_IMAGE = 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'

async function getEvents() {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const [allResult, pastStripResult] = await Promise.all([
    supabase
      .from('Event')
      .select(
        'id, title, slug, description, type, status, startDate, endDate, isVirtual, venueName, city, country, capacity, isFree, price, imageUrl, isFeatured',
      )
      .eq('status', 'PUBLISHED')
      .order('startDate', { ascending: true }),
    supabase
      .from('Event')
      .select('id, title, slug, startDate, city, country, imageUrl, rsvps:EventRsvp(status)')
      .eq('status', 'PUBLISHED')
      .lt('startDate', now)
      .order('startDate', { ascending: false })
      .limit(3),
  ])

  const all = allResult.data || []
  const upcoming = all.filter((e) => e.startDate >= now)

  const pastStrip = (pastStripResult.data || []).map((e) => {
    const rsvps = (e.rsvps || []) as { status: string }[]
    return {
      ...e,
      rsvps: undefined,
      attendees: rsvps.filter((r) => r.status === 'GOING').length,
    }
  })

  return { all, upcoming, pastStrip }
}

export default async function EventsPage() {
  const { all, upcoming, pastStrip } = await getEvents()

  const featuredEvent = upcoming.find((e) => e.isFeatured) || upcoming[0] || null

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Page Header */}
      <section className="pt-32 pb-12 px-6 border-b-2 border-black bg-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="w-3 h-3 bg-coral rounded-full border border-black"></span>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Industry Events</span>
              </div>
              <h1 className="font-display text-5xl md:text-7xl font-bold uppercase tracking-tighter leading-none mb-4">
                Events
              </h1>
              <p className="text-xl font-medium text-gray-600 max-w-xl">
                Connect with the industry at trade shows, meetups, workshops, and exclusive Kindred community events.
              </p>
            </div>
            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="bg-white border-2 border-black p-4 text-center neo-shadow min-w-[100px]">
                <div className="text-3xl font-bold font-display">{upcoming.length}</div>
                <div className="text-[10px] font-bold uppercase text-gray-500">Upcoming</div>
              </div>
              <div className="bg-white border-2 border-black p-4 text-center neo-shadow min-w-[100px]">
                <div className="text-3xl font-bold font-display">UK+EU</div>
                <div className="text-[10px] font-bold uppercase text-gray-500">Locations</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED EVENT */}
      {featuredEvent && (() => {
        const date = new Date(featuredEvent.startDate)
        const dateLabel = date.toLocaleString('en-GB', { day: 'numeric', month: 'short' })
        const location = featuredEvent.isVirtual ? 'Online' : [featuredEvent.city, featuredEvent.country].filter(Boolean).join(', ') || 'TBC'
        return (
          <div className="max-w-7xl mx-auto px-6 pt-12">
            <section className="relative">
              <div className="absolute -top-6 -left-2 bg-black text-cyan px-3 py-1 font-bold font-display uppercase text-lg border-2 border-black transform -rotate-2 z-20">
                Featured Event
              </div>
              <Link href={`/community/events/${featuredEvent.slug}`} className="bg-coral border-2 border-black p-0 neo-shadow-lg grid grid-cols-1 lg:grid-cols-2 overflow-hidden group">
                <div className="p-8 md:p-12 flex flex-col justify-center relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-black text-white px-2 py-1 text-xs font-bold uppercase border border-black">{dateLabel}</span>
                    <span className="font-bold uppercase tracking-wide">{location}</span>
                  </div>
                  <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-bold uppercase leading-none mb-6 group-hover:translate-x-2 transition-transform break-words">
                    {featuredEvent.title}
                  </h2>
                  {featuredEvent.description && (
                    <p className="text-lg font-medium mb-8 max-w-md border-l-4 border-black pl-4">
                      {featuredEvent.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-4">
                    <span
                      className="px-8 py-3 bg-black text-cyan border-2 border-black font-bold uppercase hover:bg-white hover:text-black transition-colors neo-shadow neo-shadow-hover flex items-center gap-2"
                    >
                      <Ticket className="w-5 h-5" />
                      View Event
                    </span>
                  </div>
                </div>
                <div className="relative h-64 lg:h-auto border-t-2 lg:border-t-0 lg:border-l-2 border-black">
                  {featuredEvent.imageUrl ? (
                    <img
                      src={featuredEvent.imageUrl}
                      className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                      alt={featuredEvent.title}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-black/20" />
                  )}
                  <div className="absolute inset-0 bg-black/10"></div>
                  {/* Diagonal corner accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan border-l-2 border-b-2 border-black flex items-center justify-center">
                    <Star className="w-12 h-12 animate-spin" style={{ animationDuration: '8s' }} />
                  </div>
                </div>
              </Link>
            </section>
          </div>
        )
      })()}

      {/* DIRECTORY: filters + month-grouped grid (replaces the broken limited list) */}
      <EventsDirectory events={all as never} />

      <div className="max-w-7xl mx-auto px-6 pb-12 space-y-20">

        {/* ADD TO CALENDAR CTA */}
        <section className="bg-black text-white p-8 md:p-12 border-2 border-black neo-shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-cyan text-black rounded-full flex items-center justify-center shrink-0 border-2 border-black">
                <CalendarPlus className="w-10 h-10" />
              </div>
              <div>
                <h3 className="font-display text-2xl sm:text-3xl font-bold uppercase mb-2">Never Miss an Event</h3>
                <p className="text-gray-400 font-medium">Subscribe to our calendar and get automatic updates for all Kindred events.</p>
              </div>
            </div>
            <CalendarButtons />
          </div>
        </section>

        {/* PAST EVENTS */}
        {pastStrip.length > 0 && (
          <section>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <h2 className="text-3xl sm:text-4xl font-display font-bold uppercase">Past Events</h2>
              <span className="text-sm font-bold uppercase text-gray-400 whitespace-nowrap">View highlights &amp; recordings</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pastStrip.map((event) => {
                const date = new Date(event.startDate)
                const dateLabel = date.toLocaleString('en-GB', { month: 'short', year: 'numeric' })
                const location = event.city || event.country || 'TBC'
                return (
                  <Link key={event.id} href={`/community/events/${event.slug}`} className="group bg-white border-2 border-black neo-shadow hover:neo-shadow-lg transition-all">
                    <div className="h-40 overflow-hidden border-b-2 border-black relative">
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <span className="px-4 py-2 bg-white text-black font-bold uppercase text-sm border-2 border-black">
                          View Recap
                        </span>
                      </div>
                      <img
                        src={event.imageUrl || FALLBACK_PAST_IMAGE}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                        alt={event.title}
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-500 uppercase">
                        <Clock className="w-3 h-3" />
                        {dateLabel}
                        <span className="mx-1">•</span>
                        <MapPin className="w-3 h-3" />
                        {location}
                      </div>
                      <h3 className="font-display text-xl font-bold uppercase mb-2">{event.title}</h3>
                      <p className="text-sm text-gray-500">
                        <Users className="w-3 h-3 inline mr-1" />
                        {event.attendees} attendees
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* HOST YOUR OWN EVENT */}
        <section className="bg-gray-50 p-8 md:p-12 border-2 border-black neo-shadow">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold uppercase mb-2">Host Your Own Event</h3>
              <p className="text-gray-600 font-medium max-w-lg">
                Want to host a meetup, workshop, or industry event? We&apos;ll help you promote it to our community of 2,400+ drinks industry professionals.
              </p>
            </div>
            <Link
              href="/settings/events"
              className="px-8 py-4 bg-black text-white border-2 border-black font-bold uppercase hover:bg-cyan hover:text-black transition-colors neo-shadow flex items-center gap-2 whitespace-nowrap"
            >
              Submit an Event
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </div>

      {/* Newsletter Strip */}
      <section className="py-12 bg-coral border-t-2 border-black">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Mail className="w-10 h-10 mx-auto mb-4" />
          <h2 className="font-display text-3xl md:text-4xl font-bold uppercase mb-4">Get Event Updates</h2>
          <p className="text-black/80 mb-6 font-medium">
            Be the first to know about new events, early bird tickets, and exclusive invites.
          </p>
          <NewsletterForm
            source="events"
            inputClassName="flex-1 px-4 py-3 bg-white text-black font-bold focus:outline-none border-2 border-black"
            buttonClassName="px-6 py-3 bg-black text-white font-bold uppercase hover:bg-white hover:text-black transition-colors border-2 border-black"
            successClassName="flex items-center justify-center gap-2 font-bold py-3"
          />
        </div>
      </section>
    </div>
  )
}
