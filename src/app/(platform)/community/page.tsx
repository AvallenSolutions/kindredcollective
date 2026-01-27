import Link from 'next/link'
import { PlusCircle, UserPlus, Star, MapPin, Video, ArrowDown, Mail, Calendar } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { DRINK_CATEGORY_LABELS } from '@/types/database'
import type { DrinkCategory } from '@prisma/client'
import { getInitials } from '@/lib/utils'

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function ensureMemberRecords() {
  try {
    const supabase = createAdminClient()
    const { data: users } = await supabase.from('User').select('id, email, role')
    if (!users || users.length === 0) return
    const { data: existingMembers } = await supabase.from('Member').select('userId')
    const existingUserIds = new Set(existingMembers?.map((m) => m.userId) || [])
    const usersWithoutMembers = users.filter((u) => !existingUserIds.has(u.id))
    for (const user of usersWithoutMembers) {
      const emailName = user.email.split('@')[0]
      const parts = emailName.split(/[._-]/)
      const firstName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'User'
      const lastName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : ''
      await supabase.from('Member').insert({
        userId: user.id,
        firstName,
        lastName,
        jobTitle: user.role === 'ADMIN' ? 'Admin' : null,
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
  } catch (err) {
    console.error('Error ensuring member records:', err)
  }
}

async function getCommunityData() {
  const supabase = createAdminClient()

  // Auto-create Member records for any users missing them
  await ensureMemberRecords()

  // Fetch brands
  const { data: brands } = await supabase
    .from('Brand')
    .select('id, name, slug, tagline, description, logoUrl, category, subcategories, location, country, isVerified')
    .eq('isPublic', true)
    .order('isVerified', { ascending: false })
    .order('createdAt', { ascending: false })
    .limit(3)

  // Fetch members with associated user/brand/supplier data
  const { data: members } = await supabase
    .from('Member')
    .select('id, firstName, lastName, jobTitle, avatarUrl, userId')
    .eq('isPublic', true)
    .order('createdAt', { ascending: false })
    .limit(4)

  let memberData: Array<{
    id: string
    name: string
    role: string | null
    company: string
    avatarUrl: string | null
  }> = []

  if (members && members.length > 0) {
    const userIds = members.map((m) => m.userId)
    const { data: memberBrands } = await supabase
      .from('Brand')
      .select('userId, name')
      .in('userId', userIds)
    const { data: memberSuppliers } = await supabase
      .from('Supplier')
      .select('userId, companyName')
      .in('userId', userIds)

    const brandMap = new Map(memberBrands?.map((b) => [b.userId, b.name]) || [])
    const supplierMap = new Map(memberSuppliers?.map((s) => [s.userId, s.companyName]) || [])

    memberData = members.map((m) => ({
      id: m.id,
      name: `${m.firstName} ${m.lastName}`,
      role: m.jobTitle,
      company: brandMap.get(m.userId) || supplierMap.get(m.userId) || '',
      avatarUrl: m.avatarUrl,
    }))
  }

  // Fetch upcoming events
  const { data: events } = await supabase
    .from('Event')
    .select('id, title, slug, description, startDate, city, country, isVirtual, type')
    .eq('status', 'PUBLISHED')
    .gte('startDate', new Date().toISOString())
    .order('startDate', { ascending: true })
    .limit(3)

  // Fetch a featured event
  const { data: featuredEvents } = await supabase
    .from('Event')
    .select('id, title, slug, description, startDate, city, country, isVirtual, isFeatured')
    .eq('status', 'PUBLISHED')
    .eq('isFeatured', true)
    .gte('startDate', new Date().toISOString())
    .order('startDate', { ascending: true })
    .limit(1)

  return {
    brands: brands || [],
    members: memberData,
    events: events || [],
    featuredEvent: featuredEvents?.[0] || null,
  }
}

export default async function CommunityPage() {
  const { brands, members, events, featuredEvent } = await getCommunityData()

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
        {featuredEvent && (
          <section className="relative">
            <div className="absolute -top-6 -left-2 bg-black text-cyan px-3 py-1 font-bold font-display uppercase text-lg border-2 border-black transform -rotate-2 z-20">
              Featured Event
            </div>
            <div className="bg-coral border-2 border-black p-0 neo-shadow-lg grid grid-cols-1 lg:grid-cols-2 overflow-hidden group">
              <div className="p-8 md:p-12 flex flex-col justify-center relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-black text-white px-2 py-1 text-xs font-bold uppercase border border-black">
                    {new Date(featuredEvent.startDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="font-bold uppercase tracking-wide">
                    {featuredEvent.isVirtual ? 'Online' : [featuredEvent.city, featuredEvent.country].filter(Boolean).join(', ')}
                  </span>
                </div>
                <h2 className="font-display text-5xl md:text-6xl font-bold uppercase leading-none mb-6 group-hover:translate-x-2 transition-transform">
                  {featuredEvent.title}
                </h2>
                <p className="text-lg font-medium mb-8 max-w-md border-l-4 border-black pl-4">
                  {featuredEvent.description}
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href={`/community/events/${featuredEvent.slug}`}
                    className="px-8 py-3 bg-black text-cyan border-2 border-black font-bold uppercase hover:bg-white hover:text-black transition-colors neo-shadow neo-shadow-hover"
                  >
                    Get Tickets &rarr;
                  </Link>
                  <Link
                    href={`/community/events/${featuredEvent.slug}`}
                    className="px-8 py-3 bg-transparent text-black border-2 border-black font-bold uppercase hover:bg-white transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
              <div className="relative h-64 lg:h-auto border-t-2 lg:border-t-0 lg:border-l-2 border-black bg-coral/50">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Star className="w-24 h-24 text-black/10" />
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan border-l-2 border-b-2 border-black flex items-center justify-center">
                  <Star className="w-12 h-12 animate-spin" style={{ animationDuration: '8s' }} />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* BRAND PROFILES SHOWCASE */}
        <section id="brands">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <div>
              <h2 className="text-4xl font-display font-bold uppercase mb-2">Brand Profiles</h2>
              <p className="text-gray-600 font-medium">Discover independent brands pushing boundaries.</p>
            </div>
            <Link
              href="/community/brands"
              className="px-4 py-2 border-2 border-black bg-black text-white font-bold uppercase text-xs hover:bg-cyan hover:text-black transition-colors"
            >
              View All Brands
            </Link>
          </div>

          {brands.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {brands.map((brand) => (
                <Link key={brand.id} href={`/community/brands/${brand.slug}`}>
                  <div className="group bg-white border-2 border-black neo-shadow hover:neo-shadow-lg transition-all h-full">
                    <div className="h-48 overflow-hidden border-b-2 border-black relative bg-gray-50 flex items-center justify-center">
                      {brand.logoUrl ? (
                        <img
                          src={brand.logoUrl}
                          className="max-w-full max-h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500"
                          alt={brand.name}
                        />
                      ) : (
                        <span className="font-display text-6xl font-bold text-gray-200">
                          {brand.name.charAt(0)}
                        </span>
                      )}
                      {brand.isVerified && (
                        <div className="absolute top-2 right-2 bg-cyan px-2 py-0.5 border border-black text-xs font-bold uppercase z-10">
                          Verified
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-display text-2xl font-bold uppercase">{brand.name}</h3>
                          <p className="text-xs font-bold text-gray-500 uppercase">
                            {[brand.location, brand.country].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {brand.tagline || brand.description || DRINK_CATEGORY_LABELS[brand.category as DrinkCategory]}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(brand.subcategories as string[] || []).slice(0, 2).map((sub: string) => (
                          <span key={sub} className="px-2 py-1 bg-gray-100 border border-black text-[10px] font-bold uppercase">
                            {sub}
                          </span>
                        ))}
                      </div>
                      <div className="block w-full py-2 bg-black text-white text-center text-xs font-bold uppercase group-hover:bg-cyan group-hover:text-black transition-colors border-2 border-black">
                        View Profile
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 border-2 border-black">
              <p className="text-gray-500 font-medium">No brands listed yet. Be the first!</p>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/community/brands"
              className="inline-flex items-center gap-2 text-sm font-bold uppercase border-b-2 border-black pb-0.5 hover:text-coral transition-colors"
            >
              View All Brands <ArrowDown className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* MEMBER DIRECTORY */}
        <section id="members" className="bg-gray-50 p-8 border-2 border-black neo-shadow">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-display font-bold uppercase mb-1">Member Directory</h2>
              <p className="text-gray-600 text-sm font-medium">
                Connect with founders and industry professionals.
              </p>
            </div>
            <Link
              href="/community/members"
              className="px-4 py-2 border-2 border-black bg-black text-white font-bold uppercase text-xs hover:bg-cyan hover:text-black transition-colors"
            >
              View All
            </Link>
          </div>

          {members.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {members.map((member) => (
                <div key={member.id} className="bg-white border-2 border-black p-4 text-center hover:translate-y-[-4px] transition-transform">
                  <div className="w-20 h-20 rounded-full border-2 border-black mx-auto mb-3 bg-cyan flex items-center justify-center overflow-hidden">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        className="w-full h-full object-cover"
                        alt={member.name}
                      />
                    ) : (
                      <span className="font-display text-2xl font-bold">
                        {getInitials(member.name)}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold font-display uppercase leading-tight text-lg">{member.name}</h4>
                  {member.role && (
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">{member.role}</p>
                  )}
                  {member.company && (
                    <p className="text-xs text-gray-400 mb-4">{member.company}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 font-medium">No members yet. Be the first to join!</p>
            </div>
          )}

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
              href="/community/events"
              className="text-sm font-bold uppercase border-b-2 border-black hover:bg-cyan hover:text-black transition-colors px-2"
            >
              View Calendar
            </Link>
          </div>

          {events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event) => {
                const eventDate = new Date(event.startDate)
                return (
                  <Link key={event.id} href={`/community/events/${event.slug}`}>
                    <div className="group bg-white border-2 border-black p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-6 hover:bg-gray-50 transition-colors neo-shadow-hover cursor-pointer mb-4">
                      <div className="shrink-0 flex flex-row md:flex-col items-center border-2 border-black">
                        <span className="px-4 py-1 bg-black text-white text-xs font-bold uppercase w-full text-center">
                          {eventDate.toLocaleDateString('en-GB', { month: 'short' })}
                        </span>
                        <span className="px-4 py-2 bg-white text-xl font-display font-bold">
                          {eventDate.getDate()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display font-bold text-2xl uppercase mb-1 group-hover:text-cyan transition-colors">
                          {event.title}
                        </h3>
                        <p className="text-gray-600 text-sm font-medium line-clamp-1">{event.description}</p>
                      </div>
                      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        <span className="flex items-center gap-1 text-xs font-bold uppercase bg-gray-100 px-2 py-1 border border-black">
                          {event.isVirtual ? (
                            <>
                              <Video className="w-3 h-3" /> Online
                            </>
                          ) : (
                            <>
                              <MapPin className="w-3 h-3" /> {event.city || event.country}
                            </>
                          )}
                        </span>
                        <span className="px-4 py-2 bg-cyan text-black border-2 border-black font-bold uppercase text-xs group-hover:bg-black group-hover:text-cyan transition-colors">
                          View
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 border-2 border-black">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No upcoming events. Check back soon!</p>
            </div>
          )}
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
