import Link from 'next/link'
import { PlusCircle, MapPin, Video, ArrowDown, Mail, Calendar, PawPrint, FolderOpen } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { DRINK_CATEGORY_LABELS } from '@/types/database'
import type { DrinkCategory } from '@prisma/client'
import { getInitials } from '@/lib/utils'
import { NewsletterForm } from '@/components/newsletter-form'
import { BrandLogo } from '@/components/brands/brand-logo'

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

  // Fetch public pet photos for photoboard teaser (max 8)
  const { data: pets } = await supabase
    .from('Member')
    .select('id, firstName, petName, petType, petPhotoUrl')
    .eq('isPublic', true)
    .eq('petPhotoPublic', true)
    .not('petPhotoUrl', 'is', null)
    .order('updatedAt', { ascending: false })
    .limit(8)

  // Fetch upcoming events
  const { data: events } = await supabase
    .from('Event')
    .select('id, title, slug, description, startDate, city, country, isVirtual, type')
    .eq('status', 'PUBLISHED')
    .gte('startDate', new Date().toISOString())
    .order('startDate', { ascending: true })
    .limit(3)

  return {
    brands: brands || [],
    members: memberData,
    events: events || [],
    pets: (pets || []).filter(p => !!p.petPhotoUrl),
  }
}

export default async function CommunityPage() {
  const { brands, members, events, pets } = await getCommunityData()

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
            <div className="flex flex-wrap gap-3">
              <Link
                href="/community/brands"
                className="px-4 sm:px-6 py-3 bg-white border-2 border-black font-bold uppercase text-sm sm:text-base hover:bg-black hover:text-white transition-colors neo-shadow flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                List Brand
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-20">

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
                      <BrandLogo
                        src={brand.logoUrl}
                        alt={brand.name}
                        fallbackLetter={brand.name.charAt(0)}
                        className="max-w-full max-h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500"
                        fallbackClassName="text-6xl"
                      />
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

        {/* PET PHOTOBOARD TEASER */}
        {pets.length > 0 && (
          <section className="relative">
            <div className="absolute -top-6 -left-2 bg-amber-400 text-black px-3 py-1 font-bold font-display uppercase text-lg border-2 border-black transform rotate-1 z-20">
              Pet Photoboard
            </div>
            <div className="bg-amber-50 border-2 border-black neo-shadow p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <PawPrint className="w-6 h-6" />
                  <p className="text-gray-600 text-sm font-medium">
                    Meet our community&apos;s most important members
                  </p>
                </div>
                <Link
                  href="/community/pets"
                  className="px-4 py-2 border-2 border-black bg-black text-white font-bold uppercase text-xs hover:bg-cyan hover:text-black transition-colors whitespace-nowrap"
                >
                  View the board →
                </Link>
              </div>

              {/* Mini polaroid row */}
              <div className="flex flex-wrap gap-6 justify-center">
                {pets.map((pet, index) => {
                  const rotations = ['-rotate-3','rotate-2','-rotate-1','rotate-3','-rotate-2','rotate-1','-rotate-4','rotate-4']
                  const r = rotations[index % rotations.length]
                  return (
                    <div key={pet.id} className={`relative transform ${r} hover:rotate-0 hover:scale-105 transition-all duration-200`}>
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-coral border-2 border-black z-10" />
                      <div className="bg-white border-2 border-black p-2 pb-6 shadow-brutal w-24">
                        <div className="w-full aspect-square overflow-hidden border border-black bg-gray-100">
                          <img
                            src={pet.petPhotoUrl!}
                            alt={pet.petName || `${pet.firstName}'s pet`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="mt-2 text-center text-xs font-bold leading-tight truncate">
                          {pet.petName || '?'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* RESOURCES TEASER */}
        <section className="relative">
          <div className="absolute -top-6 -left-2 bg-cyan px-3 py-1 font-bold font-display uppercase text-lg border-2 border-black transform -rotate-1 z-20">
            Member Resources
          </div>
          <div className="bg-white border-2 border-black neo-shadow p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-6 h-6" />
                <p className="text-gray-600 text-sm font-medium">
                  Documents, videos, and useful links shared by members.
                </p>
              </div>
              <Link
                href="/community/resources"
                className="px-4 py-2 border-2 border-black bg-cyan font-bold uppercase text-xs hover:bg-black hover:text-cyan transition-colors whitespace-nowrap neo-shadow"
              >
                Browse Resources &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                { label: 'Files', desc: 'PDFs, decks, templates', href: '/community/resources?type=FILE' },
                { label: 'Videos', desc: 'Talks and walkthroughs', href: '/community/resources?type=VIDEO' },
                { label: 'Links', desc: 'Articles and tools', href: '/community/resources?type=LINK' },
                { label: 'Add Yours', desc: 'Share a useful resource', href: '/community/resources/new' },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="p-4 border-2 border-black hover:bg-cyan/20 transition-colors group"
                >
                  <p className="font-display font-bold uppercase text-sm group-hover:text-coral transition-colors">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* UPCOMING EVENTS LIST */}
        <section id="events">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h2 className="text-3xl sm:text-4xl font-display font-bold uppercase">Upcoming Events</h2>
            <Link
              href="/community/events"
              className="text-sm font-bold uppercase border-b-2 border-black hover:bg-cyan hover:text-black transition-colors px-2 whitespace-nowrap"
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
          <NewsletterForm
            source="community"
            inputClassName="flex-1 px-4 py-3 bg-white text-black font-bold focus:outline-none border-2 border-transparent focus:border-cyan"
            buttonClassName="px-6 py-3 bg-cyan text-black font-bold uppercase hover:bg-white transition-colors"
            successClassName="flex items-center justify-center gap-2 font-bold text-cyan py-3"
          />
        </div>
      </section>
    </div>
  )
}
