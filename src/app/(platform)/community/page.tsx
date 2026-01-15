import Link from 'next/link'
import { PlusCircle, UserPlus, Star, MapPin, Video, Search, MessageCircle, ArrowDown, Mail } from 'lucide-react'
import { brands } from '../../../../prisma/seed-brands'

// Transform seed data for brand cards
const brandData = brands.slice(0, 3).map((b, index) => ({
  id: `brand-${index}`,
  ...b,
  logoUrl: null,
  heroImageUrl: null,
}))

// Sample upcoming events
const upcomingEvents = [
  {
    id: '1',
    title: 'Craft Spirits Expo',
    description: 'The largest gathering of craft distillers in the UK. Networking, tasting, and workshops.',
    month: 'Nov',
    day: '12',
    location: 'London',
    isVirtual: false,
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
    hoverColor: 'group-hover:text-cyan',
  },
]

// Sample members
const members = [
  {
    id: '1',
    name: 'Alex Chen',
    role: 'Founder',
    company: '@Botanical.io',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
  },
  {
    id: '2',
    name: 'Sarah Jenkins',
    role: 'Co-Founder',
    company: '@SpiritLab',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
  },
  {
    id: '3',
    name: 'Marcus Cole',
    role: 'Head Distiller',
    company: '@Rye&Co',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
  },
  {
    id: '4',
    name: 'Elena Rod.',
    role: 'CEO',
    company: '@AgaveFuture',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
  },
]

// Sample brand cards for display
const displayBrands = [
  {
    id: '1',
    name: 'SpiritLab',
    location: 'Manchester, UK',
    description: 'Small batch botanical spirits crafted with locally foraged ingredients. Redefining modern gin.',
    tags: ['Gin', 'Organic'],
    badge: 'Trending',
    badgeColor: 'bg-cyan',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1606757366367-2c9ccf69c0d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
  },
  {
    id: '2',
    name: 'Rye&Co',
    location: 'Bristol, UK',
    description: 'Heritage grains meeting modern fermentation. Award-winning rye whiskey for the bold.',
    tags: ['Whiskey', 'Aged'],
    badge: null,
    image: 'https://images.unsplash.com/photo-1527281473232-9c47ce3039e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1560523182-bb1685ad7773?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
  },
  {
    id: '3',
    name: 'Botanical.io',
    location: 'Berlin, DE',
    description: 'Tech-enabled supply chain solutions for craft distillers. Sourcing the rarest botanicals.',
    tags: ['B2B', 'Supply'],
    badge: 'New',
    badgeColor: 'bg-coral text-white',
    image: 'https://images.unsplash.com/photo-1597075687490-8f1444465cb7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1614313511387-1436a4480ebb?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
  },
]

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Page Header */}
      <section className="pt-32 pb-12 px-6 border-b-2 border-black bg-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="w-3 h-3 bg-cyan rounded-full border border-black"></span>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Directory & Events</span>
              </div>
              <h1 className="font-display text-5xl md:text-7xl font-bold uppercase tracking-tighter leading-none mb-4">
                The Collective
              </h1>
              <p className="text-xl font-medium text-gray-600 max-w-xl">
                Explore the brands defining the future of independent drinks, connect with members, and join us at upcoming events.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/community/brands"
                className="px-6 py-3 bg-white border-2 border-black font-bold uppercase hover:bg-black hover:text-white transition-colors neo-shadow flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                List Brand
              </Link>
              <Link
                href="/signup"
                className="px-6 py-3 bg-cyan border-2 border-black font-bold uppercase hover:bg-black hover:text-cyan transition-colors neo-shadow flex items-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                Join Member
              </Link>
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
                <span className="bg-black text-white px-2 py-1 text-xs font-bold uppercase border border-black">Feb 10</span>
                <span className="font-bold uppercase tracking-wide">London, UK</span>
              </div>
              <h2 className="font-display text-5xl md:text-6xl font-bold uppercase leading-none mb-6 group-hover:translate-x-2 transition-transform">
                Kindreds 2026 Annual Party
              </h2>
              <p className="text-lg font-medium mb-8 max-w-md border-l-4 border-black pl-4">
                The biggest night in independent spirits. Celebrating makers, shakers, and innovators. Music, tastings, and networking.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/events"
                  className="px-8 py-3 bg-black text-cyan border-2 border-black font-bold uppercase hover:bg-white hover:text-black transition-colors neo-shadow neo-shadow-hover"
                >
                  Get Tickets &rarr;
                </Link>
                <Link
                  href="/events"
                  className="px-8 py-3 bg-transparent text-black border-2 border-black font-bold uppercase hover:bg-white transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
            <div className="relative h-64 lg:h-auto border-t-2 lg:border-t-0 lg:border-l-2 border-black">
              <img
                src="https://images.unsplash.com/photo-1470337458703-46ad1756a187?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                alt="Party Crowd"
              />
              <div className="absolute inset-0 bg-black/10"></div>
              {/* Diagonal corner accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan border-l-2 border-b-2 border-black flex items-center justify-center">
                <Star className="w-12 h-12 animate-spin" style={{ animationDuration: '8s' }} />
              </div>
            </div>
          </div>
        </section>

        {/* BRAND PROFILES SHOWCASE */}
        <section id="brands">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <div>
              <h2 className="text-4xl font-display font-bold uppercase mb-2">Brand Profiles</h2>
              <p className="text-gray-600 font-medium">Discover 500+ independent brands pushing boundaries.</p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 border-2 border-black bg-black text-white font-bold uppercase text-xs hover:bg-cyan hover:text-black transition-colors">All</button>
              <button className="px-4 py-2 border-2 border-black bg-white text-black font-bold uppercase text-xs hover:bg-cyan transition-colors">Spirits</button>
              <button className="px-4 py-2 border-2 border-black bg-white text-black font-bold uppercase text-xs hover:bg-cyan transition-colors">No/Lo</button>
              <button className="px-4 py-2 border-2 border-black bg-white text-black font-bold uppercase text-xs hover:bg-cyan transition-colors">RTD</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayBrands.map((brand) => (
              <div key={brand.id} className="group bg-white border-2 border-black neo-shadow hover:neo-shadow-lg transition-all">
                <div className="h-48 overflow-hidden border-b-2 border-black relative">
                  {brand.badge && (
                    <div className={`absolute top-2 right-2 ${brand.badgeColor || 'bg-cyan'} px-2 py-0.5 border border-black text-xs font-bold uppercase z-10`}>
                      {brand.badge}
                    </div>
                  )}
                  <img
                    src={brand.image}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={brand.name}
                  />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-display text-2xl font-bold uppercase">{brand.name}</h3>
                      <p className="text-xs font-bold text-gray-500 uppercase">{brand.location}</p>
                    </div>
                    <div className="w-10 h-10 border-2 border-black rounded-full overflow-hidden">
                      <img src={brand.avatar} className="w-full h-full object-cover" alt={brand.name} />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {brand.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {brand.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 border border-black text-[10px] font-bold uppercase">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link
                    href="/community/brands"
                    className="block w-full py-2 bg-black text-white text-center text-xs font-bold uppercase hover:bg-cyan hover:text-black transition-colors border-2 border-black"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/community/brands"
              className="inline-flex items-center gap-2 text-sm font-bold uppercase border-b-2 border-black pb-0.5 hover:text-coral transition-colors"
            >
              Load More Brands <ArrowDown className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* MEMBER DIRECTORY */}
        <section id="members" className="bg-gray-50 p-8 border-2 border-black neo-shadow">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-display font-bold uppercase mb-1">Member Directory</h2>
              <p className="text-gray-600 text-sm font-medium">Connect with 2,400+ founders and suppliers.</p>
            </div>
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search members..."
                className="w-full pl-10 pr-4 py-2 bg-white border-2 border-black font-bold text-sm focus:outline-none focus:ring-2 focus:ring-cyan"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {members.map((member) => (
              <div key={member.id} className="bg-white border-2 border-black p-4 text-center hover:translate-y-[-4px] transition-transform">
                <img
                  src={member.image}
                  className="w-20 h-20 rounded-full border-2 border-black mx-auto mb-3 object-cover"
                  alt={member.name}
                />
                <h4 className="font-bold font-display uppercase leading-tight text-lg">{member.name}</h4>
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">{member.role}</p>
                <p className="text-xs text-gray-400 mb-4">{member.company}</p>
                <a
                  href="#"
                  className="inline-flex items-center gap-1 text-xs font-bold uppercase text-green-500 hover:underline"
                >
                  <MessageCircle className="w-3 h-3" /> Chat on WA
                </a>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/community/members"
              className="inline-flex items-center gap-2 text-sm font-bold uppercase border-b-2 border-black pb-0.5 hover:text-coral transition-colors"
            >
              View All Members &rarr;
            </Link>
          </div>
        </section>

        {/* UPCOMING EVENTS LIST */}
        <section id="events">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-4xl font-display font-bold uppercase">Upcoming Events</h2>
            <Link
              href="/events"
              className="text-sm font-bold uppercase border-b-2 border-black hover:bg-cyan hover:text-black transition-colors px-2"
            >
              View Calendar
            </Link>
          </div>

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
                  <h3 className={`font-display font-bold text-2xl uppercase mb-1 ${event.hoverColor} transition-colors`}>
                    {event.title}
                  </h3>
                  <p className="text-gray-600 text-sm font-medium">{event.description}</p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
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
                  <button className="px-4 py-2 bg-cyan text-black border-2 border-black font-bold uppercase text-xs hover:bg-black hover:text-cyan transition-colors">
                    RSVP
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Newsletter Strip */}
      <section className="py-12 bg-black text-cyan border-t-2 border-black">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Mail className="w-10 h-10 mx-auto mb-4" />
          <h2 className="font-display text-3xl md:text-4xl font-bold uppercase mb-4">Don&apos;t miss the digest</h2>
          <p className="text-white mb-6 font-medium">
            The best discussions, events, and deals of the week sent to your inbox every Friday.
          </p>
          <form className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-white text-black font-bold focus:outline-none border-2 border-transparent focus:border-cyan"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-cyan text-black font-bold uppercase hover:bg-white transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
