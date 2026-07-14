'use client'

import { useState } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'

export function RequestAccessForm() {
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    type: 'brand',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
      } else {
        setSubmitted(true)
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-white border-3 border-black neo-shadow p-8 text-center">
        <CheckCircle className="w-16 h-16 text-cyan mx-auto mb-4" />
        <h3 className="font-display text-2xl font-bold uppercase mb-2">Request Received</h3>
        <p className="text-gray-600">
          Thanks for your interest in Kindred Collective. We'll review your request and get back to you within 48 hours.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border-3 border-black neo-shadow p-8 space-y-6">
      {error && (
        <div className="bg-coral/10 border-2 border-coral text-coral px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-6">
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
                formData.type === type ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
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

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 bg-cyan text-black font-bold uppercase border-2 border-black neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />}
        {isSubmitting ? 'Submitting…' : 'Request Access'}
      </Button>
    </form>
  )
}
