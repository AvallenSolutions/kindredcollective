import type { Metadata } from 'next'
import Link from 'next/link'
import { Search, ArrowLeftRight, Tag, LogIn } from 'lucide-react'
import { RequestAccessForm } from '@/components/join/request-access-form'

export const metadata: Metadata = {
  title: 'Marketplace | Kindred Collective',
  description:
    'A members-only marketplace connecting independent UK drinks brands and suppliers — browse members, post requests, and share what you can offer.',
}

const features = [
  {
    Icon: Search,
    title: 'Explore',
    color: 'bg-cyan',
    description:
      'Browse verified independent drinks brands and suppliers. Find the right partners quickly — filtered by what they do, where they are, and what they offer.',
  },
  {
    Icon: ArrowLeftRight,
    title: 'Requests',
    color: 'bg-lime',
    description:
      'Post what your business needs and let the right people come to you. From co-packers and distributors to label printers and compliance advisors.',
  },
  {
    Icon: Tag,
    title: 'Offers',
    color: 'bg-coral',
    description:
      'Share capacity, expertise or services with the community. Whether you have spare warehouse space or excess raw materials, someone here needs it.',
  },
]

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Hero */}
      <section className="pt-32 pb-16 px-6 bg-gray-100 border-b-2 border-black relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan border-2 border-black neo-shadow mb-6 text-xs font-bold uppercase tracking-widest">
            Members Only
          </div>
          <h1 className="font-display text-6xl md:text-8xl font-bold uppercase tracking-tighter leading-none mb-6">
            The indie drinks<br />
            <span className="text-coral">marketplace</span>
          </h1>
          <p className="text-xl text-gray-600 font-medium max-w-2xl mb-8">
            Find the partners your business actually needs. A curated, members-only directory of
            independent UK drinks brands and the suppliers who work with them.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide underline decoration-2 underline-offset-4 hover:text-coral transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Already a member? Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 border-b-2 border-black">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight mb-10 text-center">
            What's inside
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map(({ Icon, title, color, description }) => (
              <div key={title} className="bg-white border-2 border-black neo-shadow p-6">
                <div className={`w-10 h-10 ${color} border-2 border-black flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-bold uppercase mb-2">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-16 px-6 bg-gray-50 border-b-2 border-black">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-display text-4xl font-bold uppercase tracking-tighter mb-3">
              Request Access
            </h2>
            <p className="text-gray-600">
              Membership is by invitation. Tell us about yourself and we'll be in touch within 48 hours.
            </p>
          </div>
          <RequestAccessForm />
        </div>
      </section>
    </div>
  )
}
