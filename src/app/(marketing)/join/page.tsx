'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Mail, MessageCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui'

export default function JoinPage() {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    type: 'brand',
    message: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // For now, just show success state
    // TODO: connect to an API endpoint or email service
    setSubmitted(true)
  }

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 px-6 bg-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan border-2 border-black neo-shadow mb-8">
            <span className="text-xs font-bold uppercase tracking-widest">Invite Only</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 uppercase tracking-tighter">
            Join the <span className="text-coral">Collective</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 font-medium max-w-xl mx-auto">
            Kindred Collective is a private community for the independent drinks industry.
            To keep quality high, membership is by invitation only.
          </p>
        </div>
      </section>

      {/* Two Options */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Have an invite */}
          <div className="bg-white border-3 border-black neo-shadow p-8 rounded-xl">
            <div className="w-12 h-12 bg-lime border-2 border-black rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-3 uppercase">Have an Invite?</h2>
            <p className="text-gray-600 mb-6">
              If you&apos;ve received an invite link via email or WhatsApp, click it to create your account. Or paste your invite code below.
            </p>
            <Link href="/signup">
              <Button className="w-full py-3 bg-cyan text-black font-bold uppercase border-2 border-black neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                Sign Up with Invite
                <ArrowRight className="w-4 h-4 ml-2 inline" />
              </Button>
            </Link>
          </div>

          {/* Request access */}
          <div className="bg-white border-3 border-black neo-shadow p-8 rounded-xl">
            <div className="w-12 h-12 bg-coral border-2 border-black text-white rounded-lg flex items-center justify-center mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-3 uppercase">Need an Invite?</h2>
            <p className="text-gray-600 mb-6">
              Fill out the form below and we&apos;ll review your request. We typically respond within 48 hours.
            </p>
            <div className="flex gap-3">
              <a href="mailto:hello@kindredcollective.co.uk?subject=Membership%20Request" className="flex-1">
                <Button variant="outline" className="w-full py-3 font-bold uppercase border-2 border-black hover:bg-black hover:text-white transition-all">
                  <Mail className="w-4 h-4 mr-2 inline" />
                  Email Us
                </Button>
              </a>
              <a href="https://wa.me/447000000000?text=Hi%2C%20I%27d%20like%20to%20join%20Kindred%20Collective" target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="outline" className="w-full py-3 font-bold uppercase border-2 border-black hover:bg-lime hover:border-lime transition-all">
                  <MessageCircle className="w-4 h-4 mr-2 inline" />
                  WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Request Form */}
      <section className="py-16 px-6 bg-gray-50 border-y-2 border-black">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-display font-bold mb-8 uppercase text-center">Request Access</h2>

          {submitted ? (
            <div className="bg-white border-3 border-black neo-shadow p-8 rounded-xl text-center">
              <CheckCircle className="w-16 h-16 text-cyan mx-auto mb-4" />
              <h3 className="text-2xl font-display font-bold mb-2">Request Received</h3>
              <p className="text-gray-600">
                Thanks for your interest in Kindred Collective. We&apos;ll review your request and get back to you shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border-3 border-black neo-shadow p-8 rounded-xl space-y-6">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">Your Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border-3 border-black p-3 font-medium focus:outline-none focus:ring-2 focus:ring-cyan"
                  placeholder="Jane Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border-3 border-black p-3 font-medium focus:outline-none focus:ring-2 focus:ring-cyan"
                  placeholder="jane@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full border-3 border-black p-3 font-medium focus:outline-none focus:ring-2 focus:ring-cyan"
                  placeholder="Your company name"
                />
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">I am a...</label>
                <div className="flex gap-3">
                  {['brand', 'supplier', 'both'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, type })}
                      className={`flex-1 py-3 font-bold uppercase text-sm border-2 border-black transition-all ${
                        formData.type === type
                          ? 'bg-black text-white'
                          : 'bg-white text-black hover:bg-gray-100'
                      }`}
                    >
                      {type === 'both' ? 'Both' : type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">Tell Us About You</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={3}
                  className="w-full border-3 border-black p-3 font-medium focus:outline-none focus:ring-2 focus:ring-cyan resize-none"
                  placeholder="What do you do in the drinks industry?"
                />
              </div>

              <Button type="submit" className="w-full py-3 bg-cyan text-black font-bold uppercase border-2 border-black neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                Submit Request
              </Button>
            </form>
          )}
        </div>
      </section>
    </>
  )
}
