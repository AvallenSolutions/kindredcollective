import Link from 'next/link'
import { Users, Shield, Calendar, Tag, Sparkles, ArrowRight, Star, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getCommunityStats() {
  try {
    const supabase = createAdminClient()
    const [suppliers, brands, members, events] = await Promise.all([
      supabase.from('Supplier').select('id', { count: 'exact', head: true }).eq('isPublic', true),
      supabase.from('Brand').select('id', { count: 'exact', head: true }).eq('isPublic', true),
      supabase.from('Member').select('id', { count: 'exact', head: true }).eq('isPublic', true),
      supabase.from('Event').select('id', { count: 'exact', head: true }).eq('status', 'PUBLISHED'),
    ])
    return {
      suppliers: suppliers.count || 0,
      brands: brands.count || 0,
      members: members.count || 0,
      events: events.count || 0,
    }
  } catch {
    return { suppliers: 0, brands: 0, members: 0, events: 0 }
  }
}

const brandNames = [
  'DUPPY SHARE',
  'AVALLEN',
  'EVERLEAF',
  'LUCKY SAINT',
  'PENTIRE',
  'NICE WINE',
]

export default async function HomePage() {
  const stats = await getCommunityStats()

  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden bg-gray-100">
        <div className="absolute inset-0 bg-grid-pattern pointer-events-none"></div>
        <div className="absolute top-32 right-[10%] w-24 h-24 bg-coral rounded-full border-2 border-black neo-shadow hidden lg:block animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute bottom-20 left-[5%] w-16 h-16 bg-blue-500 rotate-12 border-2 border-black neo-shadow hidden lg:block"></div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-black neo-shadow mb-8 rotate-[-2deg] hover:rotate-0 transition-transform">
            <span className="w-3 h-3 bg-lime rounded-full border border-black animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-widest">Private Community — Invite Only</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] mb-8 tracking-tighter uppercase">
            The Home for <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral to-orange-500">
              Independent Drinks
            </span>
          </h1>

          <p className="text-lg md:text-2xl text-gray-800 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Kindred Collective connects the brands, suppliers, and people shaping the future of the drinks industry. One community, everything you need.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/join">
              <Button className="px-8 py-4 bg-cyan text-black text-lg font-bold uppercase border-3 border-black neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                Request an Invite
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="px-8 py-4 text-lg font-bold uppercase border-3 border-black hover:bg-black hover:text-white transition-all">
                Member Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Marquee Section */}
      <section className="py-6 bg-cyan border-y-2 border-black overflow-hidden">
        <div className="whitespace-nowrap flex animate-marquee">
          {[...brandNames, ...brandNames, ...brandNames].map((brand, i) => (
            <div key={i} className="flex items-center gap-12 mx-6">
              <span className="text-2xl font-display font-bold">{brand}</span>
              <Star className="w-5 h-5" />
            </div>
          ))}
        </div>
      </section>

      {/* What Members Get — Bento Grid */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-6xl font-bold mb-6 uppercase tracking-tight">Everything You Need</h2>
          <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto">One membership. Unlimited connections. The tools and community to grow your drinks brand.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
          {/* Verified Suppliers */}
          <div className="md:col-span-2 bg-white border-3 border-black neo-shadow p-8 rounded-2xl flex flex-col justify-between group hover:-translate-y-1 transition-transform">
            <div>
              <div className="w-12 h-12 bg-cyan border-2 border-black rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-3 uppercase">Verified Supplier Network</h3>
              <p className="text-gray-600 text-lg">Access a curated directory of trusted packaging, logistics, design, and production partners — all vetted by the community.</p>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <span className="px-3 py-1 bg-lime border-2 border-black text-xs font-bold uppercase">Packaging</span>
              <span className="px-3 py-1 bg-cyan border-2 border-black text-xs font-bold uppercase">Logistics</span>
              <span className="px-3 py-1 bg-coral text-white border-2 border-black text-xs font-bold uppercase">Design</span>
              <span className="px-3 py-1 bg-white border-2 border-black text-xs font-bold uppercase">+15 more</span>
            </div>
          </div>

          {/* Community */}
          <div className="bg-blue-500 border-3 border-black neo-shadow p-8 rounded-2xl text-white relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className="relative z-10">
              <Users className="w-10 h-10 mb-4" />
              <h3 className="text-2xl font-display font-bold mb-2 uppercase">The Community</h3>
              <p className="text-blue-100">Connect with fellow brand owners, swap war stories, and find collaborators who get it.</p>
            </div>
            <div className="absolute -bottom-10 -right-10 opacity-20">
              <Users className="w-32 h-32" />
            </div>
          </div>

          {/* Exclusive Events */}
          <div className="bg-white border-3 border-black neo-shadow p-8 rounded-2xl flex flex-col justify-between group hover:-translate-y-1 transition-transform">
            <div>
              <div className="w-12 h-12 bg-coral border-2 border-black text-white rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-2 uppercase">Events</h3>
              <p className="text-gray-600">Members-only meetups, trade shows, workshops, and socials throughout the year.</p>
            </div>
          </div>

          {/* Member Offers */}
          <div className="md:col-span-2 bg-black text-white border-3 border-black neo-shadow p-8 rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan rounded-full blur-[100px] opacity-20"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 h-full">
              <div className="flex-1">
                <div className="inline-block px-3 py-1 bg-lime text-black border border-black rounded-full text-xs font-bold mb-4 uppercase tracking-wider">Members Only</div>
                <h3 className="text-2xl font-display font-bold mb-2 uppercase">Exclusive Discounts</h3>
                <p className="text-gray-400">Suppliers offer Kindred members exclusive rates, free trials, and partner perks you won&apos;t find anywhere else.</p>
              </div>
              <div className="flex items-center gap-3">
                <Tag className="w-12 h-12 text-cyan" />
                <Sparkles className="w-8 h-8 text-lime" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof — Live Stats */}
      <section className="py-20 bg-gray-50 border-y-2 border-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-6xl font-bold mb-6 uppercase tracking-tight">A Growing Ecosystem</h2>
            <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto">The drinks industry&apos;s most connected community, and it&apos;s growing every week.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Verified Suppliers', value: stats.suppliers, color: 'bg-cyan' },
              { label: 'Brands', value: stats.brands, color: 'bg-coral' },
              { label: 'Members', value: stats.members, color: 'bg-lime' },
              { label: 'Events', value: stats.events, color: 'bg-blue-500' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white border-3 border-black neo-shadow p-6 text-center rounded-xl hover:-translate-y-1 transition-transform">
                <div className={`w-4 h-4 ${stat.color} border border-black rounded-full mx-auto mb-3`}></div>
                <div className="text-4xl md:text-5xl font-display font-bold mb-2">{stat.value}+</div>
                <div className="text-sm font-bold uppercase tracking-wide text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-6xl font-bold mb-6 uppercase tracking-tight">How It Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Get Invited', desc: 'Kindred Collective is invite-only. Request access or get an invite from an existing member.' },
            { step: '02', title: 'Build Your Profile', desc: 'Set up your member profile and connect your brands and suppliers. One account, all your businesses.' },
            { step: '03', title: 'Connect & Grow', desc: 'Browse suppliers, RSVP to events, claim exclusive offers, and build relationships that matter.' },
          ].map((item) => (
            <div key={item.step} className="relative">
              <div className="text-7xl font-display font-bold text-gray-100 mb-4">{item.step}</div>
              <h3 className="text-xl font-display font-bold mb-2 uppercase">{item.title}</h3>
              <p className="text-gray-600 font-medium">{item.desc}</p>
              <CheckCircle className="w-6 h-6 text-cyan mt-4" />
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-black text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan rounded-full blur-[100px] opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-coral rounded-full blur-[100px] opacity-20"></div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="font-display text-5xl md:text-7xl font-bold mb-8 uppercase tracking-tighter">
            Ready to join the <br/><span className="text-cyan">collective?</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Whether you&apos;re a brand looking for partners or a supplier looking for clients — this is your community.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/join">
              <Button className="px-8 py-4 bg-cyan text-black text-lg font-bold uppercase border-2 border-white hover:bg-white hover:text-black transition-all neo-shadow shadow-white/20">
                Request an Invite
                <ArrowRight className="w-5 h-5 ml-2 inline" />
              </Button>
            </Link>
            <Link href="/about">
              <Button className="px-8 py-4 bg-transparent text-white text-lg font-bold uppercase border-2 border-white hover:bg-white hover:text-black transition-all">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
