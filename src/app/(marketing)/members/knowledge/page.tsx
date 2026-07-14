import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, HelpCircle, LogIn } from 'lucide-react'
import { RequestAccessForm } from '@/components/join/request-access-form'

export const metadata: Metadata = {
  title: 'Knowledge | Kindred Collective',
  description:
    'Seven years of drinks-industry knowledge — duty rates, packaging rules, supplier intelligence and compliance guidance — maintained as a living wiki for members.',
}

const features = [
  {
    Icon: BookOpen,
    title: 'Wiki',
    color: 'bg-lime',
    description:
      'A living knowledge base maintained from 7 years of community discussion, gov.uk guidance and industry intelligence. Duty rates, EPR obligations, DRS rules, supplier recommendations — all in one place, always up to date.',
  },
  {
    Icon: HelpCircle,
    title: 'Ask the Collective',
    color: 'bg-cyan',
    description:
      'The questions independent drinks founders ask most, answered. Distilled from years of community Q&A so the hard-won knowledge is searchable — not buried in a chat thread from 2021.',
  },
]

const stats = [
  { value: '7', label: 'Years of community knowledge' },
  { value: '30+', label: 'Knowledge pages' },
  { value: '43k+', label: 'Community messages digested' },
]

export default function KnowledgePage() {
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
            Industry knowledge<br />
            <span className="text-coral">that compounds</span>
          </h1>
          <p className="text-xl text-gray-600 font-medium max-w-2xl mb-8">
            Everything the Kindred community has learned about running an independent drinks
            business in the UK — distilled, organised, and kept current for members.
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

      {/* Stats bar */}
      <section className="border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-3 divide-x-2 divide-black">
          {stats.map(({ value, label }) => (
            <div key={label} className="px-6 first:pl-0 last:pr-0 text-center">
              <div className="font-display text-4xl font-bold uppercase">{value}</div>
              <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 border-b-2 border-black">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight mb-10 text-center">
            What&apos;s inside
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map(({ Icon, title, color, description }) => (
              <div key={title} className="bg-white border-2 border-black neo-shadow p-8">
                <div className={`w-10 h-10 ${color} border-2 border-black flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-xl font-bold uppercase mb-3">{title}</h3>
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
