import type { Metadata } from 'next'
import Link from 'next/link'
import { MessageSquare, Calendar, Newspaper, LogIn } from 'lucide-react'
import { RequestAccessForm } from '@/components/join/request-access-form'

export const metadata: Metadata = {
  title: 'Community | Kindred Collective',
  description:
    'A private forum, events calendar and curated news feed for independent UK drinks businesses — real conversations, no noise.',
}

const features = [
  {
    Icon: MessageSquare,
    title: 'Forum',
    color: 'bg-cyan',
    description:
      'Ask anything, answer what you know. A private forum where independent drinks founders share real experience — from HMRC headaches to distributor recommendations.',
  },
  {
    Icon: Calendar,
    title: 'Events',
    color: 'bg-lime',
    description:
      "Industry meetups, tastings, trade shows and Kindred-organised events. Stay across what's happening and connect face to face with the people in your feed.",
  },
  {
    Icon: Newspaper,
    title: 'News',
    color: 'bg-coral',
    description:
      'Curated industry news filtered for what actually matters to independent drinks businesses — duty changes, packaging regulation, trade developments.',
  },
]

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Hero */}
      <section className="pt-32 pb-16 px-6 bg-gray-100 border-b-2 border-black relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-lime border-2 border-black neo-shadow mb-6 text-xs font-bold uppercase tracking-widest">
            Members Only
          </div>
          <h1 className="font-display text-6xl md:text-8xl font-bold uppercase tracking-tighter leading-none mb-6">
            The community<br />
            <span className="text-coral">that gets it</span>
          </h1>
          <p className="text-xl text-gray-600 font-medium max-w-2xl mb-8">
            A private space for independent drinks founders and suppliers to talk openly, share
            knowledge, and support each other — without the noise of public social media.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide underline decoration-2 underline-offset-4 hover:text-coral transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Already a member? Log in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 border-b-2 border-black">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight mb-10 text-center">
            What&apos;s inside
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
              Membership is by invitation. Tell us about yourself and we&apos;ll be in touch within 48 hours.
            </p>
          </div>
          <RequestAccessForm />
        </div>
      </section>
    </div>
  )
}
