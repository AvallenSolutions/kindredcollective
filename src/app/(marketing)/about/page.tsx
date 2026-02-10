import Link from 'next/link'
import { ArrowRight, Heart, Lightbulb, Handshake } from 'lucide-react'
import { Button } from '@/components/ui'

export const metadata = {
  title: 'About | Kindred Collective',
  description: 'Kindred Collective is the private community for independent drinks brands and their suppliers.',
}

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 px-6 bg-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 uppercase tracking-tighter">
            About <span className="text-cyan">Kindred</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Born from Kindred Spirits — a private WhatsApp group of independent drinks brand founders — Kindred Collective is where the industry comes together.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <div className="prose prose-lg max-w-none">
          <div className="bg-white border-3 border-black neo-shadow p-8 md:p-12 rounded-xl mb-12">
            <h2 className="font-display text-3xl font-bold mb-6 uppercase">The Story</h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              The independent drinks industry is full of incredible people — founders building brands from scratch, suppliers powering production, and creators pushing boundaries. But too often, they&apos;re working in isolation.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              Kindred Spirits started as a WhatsApp group where a handful of brand owners could share supplier recommendations, swap production tips, and support each other. It grew organically because the need was real.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              Kindred Collective is the next evolution — a dedicated platform where that community can thrive. A verified supplier directory, exclusive member events, partner discounts, and a member network all in one place.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6 bg-gray-50 border-y-2 border-black">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-4xl font-bold mb-12 uppercase text-center">What We Believe</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: 'Community First',
                desc: 'We keep it invite-only to maintain quality and trust. Every member adds value to the network.',
                color: 'bg-coral text-white',
              },
              {
                icon: Lightbulb,
                title: 'Knowledge Sharing',
                desc: 'The best insights come from people who\'ve been there. We make it easy to learn from each other.',
                color: 'bg-cyan',
              },
              {
                icon: Handshake,
                title: 'Fair Partnerships',
                desc: 'Suppliers and brands both benefit. Transparent reviews, verified relationships, and real connections.',
                color: 'bg-lime',
              },
            ].map((value) => (
              <div key={value.title} className="bg-white border-3 border-black neo-shadow p-8 rounded-xl hover:-translate-y-1 transition-transform">
                <div className={`w-12 h-12 ${value.color} border-2 border-black rounded-lg flex items-center justify-center mb-4`}>
                  <value.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-display font-bold mb-2 uppercase">{value.title}</h3>
                <p className="text-gray-600">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <h2 className="font-display text-4xl font-bold mb-12 uppercase text-center">Who Is Kindred For?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border-3 border-black neo-shadow p-8 rounded-xl">
            <h3 className="text-2xl font-display font-bold mb-4 uppercase">Brands</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-cyan rounded-full mt-2 flex-shrink-0"></span>
                Independent spirits, beer, wine, RTD, and non-alcoholic brands
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-cyan rounded-full mt-2 flex-shrink-0"></span>
                Find verified suppliers for packaging, production, logistics, and more
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-cyan rounded-full mt-2 flex-shrink-0"></span>
                Access exclusive member discounts and community events
              </li>
            </ul>
          </div>
          <div className="bg-white border-3 border-black neo-shadow p-8 rounded-xl">
            <h3 className="text-2xl font-display font-bold mb-4 uppercase">Suppliers</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-coral rounded-full mt-2 flex-shrink-0"></span>
                Service providers to the drinks industry — packaging, design, logistics, marketing, etc.
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-coral rounded-full mt-2 flex-shrink-0"></span>
                Get discovered by brands actively looking for your services
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-coral rounded-full mt-2 flex-shrink-0"></span>
                Build your reputation with verified reviews and work relationships
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-black text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 uppercase tracking-tighter">
            Sound like your <span className="text-cyan">people?</span>
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Request an invite and join the community.
          </p>
          <Link href="/join">
            <Button className="px-8 py-4 bg-cyan text-black text-lg font-bold uppercase border-2 border-white hover:bg-white hover:text-black transition-all">
              Request an Invite
              <ArrowRight className="w-5 h-5 ml-2 inline" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  )
}
