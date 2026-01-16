import Link from 'next/link'
import { Star, MapPin, Video, Calendar, Users, Clock, CalendarPlus, Ticket, ArrowRight, Mail } from 'lucide-react'

// Featured event data
const featuredEvent = {
  id: 'featured-1',
  title: "Kindreds 2026 Annual Party",
  date: 'Feb 10',
  location: 'London, UK',
  description: 'The biggest night in independent spirits. Celebrating makers, shakers, and innovators. Music, tastings, and networking.',
  image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
}

// Upcoming events data
const upcomingEvents = [
  {
    id: '1',
    title: 'Craft Spirits Expo',
    description: 'The largest gathering of craft distillers in the UK. Networking, tasting, and workshops.',
    month: 'Nov',
    day: '12',
    location: 'London',
    isVirtual: false,
    type: 'Trade Show',
    attendees: 450,
    hoverColor: 'group-hover:text-blue-500',
  },
  {
    id: '2',
    title: 'Sustainable Packaging Meetup',
    description: 'Deep dive into plastic-free alternatives. Guest speakers from major glassworks.',
    month: 'Nov',
    day: '24',
    location: 'Online',
    isVirtual: true,
    type: 'Webinar',
    attendees: 120,
    hoverColor: 'group-hover:text-coral',
  },
  {
    id: '3',
    title: "Founder's Winter Social",
    description: 'End of year drinks for community members. Open bar sponsored by SpiritLab.',
    month: 'Dec',
    day: '05',
    location: 'Manchester',
    isVirtual: false,
    type: 'Networking',
    attendees: 85,
    hoverColor: 'group-hover:text-cyan',
  },
  {
    id: '4',
    title: 'Brand Strategy Workshop',
    description: 'Learn how to position your drinks brand for success. Interactive 3-hour session.',
    month: 'Dec',
    day: '12',
    location: 'Online',
    isVirtual: true,
    type: 'Workshop',
    attendees: 60,
    hoverColor: 'group-hover:text-lime',
  },
  {
    id: '5',
    title: 'Imbibe Live 2026',
    description: 'The UK\'s biggest drinks trade show. Meet suppliers, discover trends, network with buyers.',
    month: 'Jan',
    day: '15',
    location: 'London',
    isVirtual: false,
    type: 'Trade Show',
    attendees: 2500,
    hoverColor: 'group-hover:text-blue-500',
  },
]

// Past events data
const pastEvents = [
  {
    id: 'past-1',
    title: 'Summer Spirits Festival',
    date: 'Aug 2025',
    location: 'Brighton',
    attendees: 350,
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'past-2',
    title: 'Distillery Tech Conference',
    date: 'Jul 2025',
    location: 'Edinburgh',
    attendees: 180,
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'past-3',
    title: 'Packaging Innovation Summit',
    date: 'Jun 2025',
    location: 'Birmingham',
    attendees: 220,
    image: 'https://images.unsplash.com/photo-1605733513597-a8f8341084e6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  },
]

// Event types for filtering
const eventTypes = [
  { key: 'all', label: 'All Events' },
  { key: 'trade-show', label: 'Trade Shows' },
  { key: 'networking', label: 'Networking' },
  { key: 'workshop', label: 'Workshops' },
  { key: 'webinar', label: 'Webinars' },
]

export default function EventsPage() {
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
                <div className="text-3xl font-bold font-display">{upcomingEvents.length}</div>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-20">

        {/* FEATURED EVENT */}
        <section className="relative">
          <div className="absolute -top-6 -left-2 bg-black text-cyan px-3 py-1 font-bold font-display uppercase text-lg border-2 border-black transform -rotate-2 z-20">
            Featured Event
          </div>
          <div className="bg-coral border-2 border-black p-0 neo-shadow-lg grid grid-cols-1 lg:grid-cols-2 overflow-hidden group">
            <div className="p-8 md:p-12 flex flex-col justify-center relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-black text-white px-2 py-1 text-xs font-bold uppercase border border-black">{featuredEvent.date}</span>
                <span className="font-bold uppercase tracking-wide">{featuredEvent.location}</span>
              </div>
              <h2 className="font-display text-5xl md:text-6xl font-bold uppercase leading-none mb-6 group-hover:translate-x-2 transition-transform">
                {featuredEvent.title}
              </h2>
              <p className="text-lg font-medium mb-8 max-w-md border-l-4 border-black pl-4">
                {featuredEvent.description}
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="px-8 py-3 bg-black text-cyan border-2 border-black font-bold uppercase hover:bg-white hover:text-black transition-colors neo-shadow neo-shadow-hover flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  Get Tickets
                </button>
                <button className="px-8 py-3 bg-transparent text-black border-2 border-black font-bold uppercase hover:bg-white transition-colors">
                  View Details
                </button>
              </div>
            </div>
            <div className="relative h-64 lg:h-auto border-t-2 lg:border-t-0 lg:border-l-2 border-black">
              <img
                src={featuredEvent.image}
                className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                alt={featuredEvent.title}
              />
              <div className="absolute inset-0 bg-black/10"></div>
              {/* Diagonal corner accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan border-l-2 border-b-2 border-black flex items-center justify-center">
                <Star className="w-12 h-12 animate-spin" style={{ animationDuration: '8s' }} />
              </div>
            </div>
          </div>
        </section>

        {/* EVENT TYPE FILTERS */}
        <section>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <h2 className="text-4xl font-display font-bold uppercase">Upcoming Events</h2>
            <div className="flex flex-wrap gap-2">
              {eventTypes.map((type) => (
                <button
                  key={type.key}
                  className={`px-4 py-2 border-2 border-black font-bold uppercase text-xs transition-colors ${
                    type.key === 'all'
                      ? 'bg-black text-white hover:bg-cyan hover:text-black'
                      : 'bg-white text-black hover:bg-cyan'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* UPCOMING EVENTS LIST */}
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="group bg-white border-2 border-black p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-6 hover:bg-gray-50 transition-colors neo-shadow-hover cursor-pointer"
              >
                <div className="shrink-0 flex flex-row md:flex-col items-center border-2 border-black">
                  <span className="px-4 py-1 bg-black text-white text-xs font-bold uppercase w-full text-center">
                    {event.month}
                  </span>
                  <span className="px-4 py-2 bg-white text-xl font-display font-bold">{event.day}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase text-gray-400 bg-gray-100 px-2 py-0.5 border border-gray-200">
                      {event.type}
                    </span>
                  </div>
                  <h3 className={`font-display font-bold text-2xl uppercase mb-1 ${event.hoverColor} transition-colors`}>
                    {event.title}
                  </h3>
                  <p className="text-gray-600 text-sm font-medium">{event.description}</p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs font-bold uppercase bg-gray-100 px-2 py-1 border border-black">
                      {event.isVirtual ? (
                        <>
                          <Video className="w-3 h-3" /> {event.location}
                        </>
                      ) : (
                        <>
                          <MapPin className="w-3 h-3" /> {event.location}
                        </>
                      )}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-gray-500">
                      <Users className="w-3 h-3" /> {event.attendees}
                    </span>
                  </div>
                  <button className="px-4 py-2 bg-cyan text-black border-2 border-black font-bold uppercase text-xs hover:bg-black hover:text-cyan transition-colors whitespace-nowrap">
                    RSVP
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ADD TO CALENDAR CTA */}
        <section className="bg-black text-white p-8 md:p-12 border-2 border-black neo-shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-cyan text-black rounded-full flex items-center justify-center shrink-0 border-2 border-black">
                <CalendarPlus className="w-10 h-10" />
              </div>
              <div>
                <h3 className="font-display text-3xl font-bold uppercase mb-2">Never Miss an Event</h3>
                <p className="text-gray-400 font-medium">Subscribe to our calendar and get automatic updates for all Kindred events.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-3 bg-cyan text-black border-2 border-black font-bold uppercase hover:bg-white transition-colors flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Add to Google
              </button>
              <button className="px-6 py-3 bg-white text-black border-2 border-black font-bold uppercase hover:bg-cyan transition-colors">
                iCal
              </button>
            </div>
          </div>
        </section>

        {/* PAST EVENTS */}
        <section>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-4xl font-display font-bold uppercase">Past Events</h2>
            <span className="text-sm font-bold uppercase text-gray-400">View highlights & recordings</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pastEvents.map((event) => (
              <div key={event.id} className="group bg-white border-2 border-black neo-shadow hover:neo-shadow-lg transition-all">
                <div className="h-40 overflow-hidden border-b-2 border-black relative">
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <span className="px-4 py-2 bg-white text-black font-bold uppercase text-sm border-2 border-black">
                      View Recap
                    </span>
                  </div>
                  <img
                    src={event.image}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    alt={event.title}
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-500 uppercase">
                    <Clock className="w-3 h-3" />
                    {event.date}
                    <span className="mx-1">•</span>
                    <MapPin className="w-3 h-3" />
                    {event.location}
                  </div>
                  <h3 className="font-display text-xl font-bold uppercase mb-2">{event.title}</h3>
                  <p className="text-sm text-gray-500">
                    <Users className="w-3 h-3 inline mr-1" />
                    {event.attendees} attendees
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* HOST YOUR OWN EVENT */}
        <section className="bg-gray-50 p-8 md:p-12 border-2 border-black neo-shadow">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="font-display text-3xl font-bold uppercase mb-2">Host Your Own Event</h3>
              <p className="text-gray-600 font-medium max-w-lg">
                Want to host a meetup, workshop, or industry event? We&apos;ll help you promote it to our community of 2,400+ drinks industry professionals.
              </p>
            </div>
            <Link
              href="/contact"
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
          <form className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-white text-black font-bold focus:outline-none border-2 border-black"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-black text-white font-bold uppercase hover:bg-white hover:text-black transition-colors border-2 border-black"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
