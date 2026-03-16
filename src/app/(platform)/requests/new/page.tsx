'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Zap, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button, Card, CardContent } from '@/components/ui'
import { SUPPLIER_CATEGORY_LABELS } from '@/types/database'
import type { SupplierCategory } from '@prisma/client'

const categories = Object.entries(SUPPLIER_CATEGORY_LABELS) as [SupplierCategory, string][]

export default function NewRequestPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasBrandOrg, setHasBrandOrg] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/organisations/my-organisation')
      .then(r => r.json())
      .then(data => {
        const orgs: any[] = data.organisations || []
        setHasBrandOrg(orgs.some(o => o.type === 'BRAND'))
      })
      .catch(() => setHasBrandOrg(false))
  }, [])

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '' as SupplierCategory | '',
    budget: '',
    deadline: '',
    location: '',
    isRemoteOk: false,
  })

  const set = (field: keyof typeof form, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.title.trim()) return setError('Please enter a title')
    if (!form.description.trim()) return setError('Please describe what you need')
    if (!form.category) return setError('Please select a category')

    setSubmitting(true)
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          budget: form.budget || null,
          deadline: form.deadline || null,
          location: form.location || null,
          isRemoteOk: form.isRemoteOk,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }

      router.push(`/requests/${data.data.rfp.id}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (hasBrandOrg === false) {
    return (
      <div className="min-h-screen">
        <section className="bg-cyan py-8 border-b-4 border-black">
          <div className="section-container">
            <Link href="/requests" className="inline-flex items-center gap-2 text-sm font-bold mb-4 hover:underline">
              <ArrowLeft className="w-4 h-4" />
              Back to Requests
            </Link>
            <h1 className="font-display text-3xl font-bold">Post a Request</h1>
          </div>
        </section>
        <div className="section-container py-10 max-w-xl">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-coral mx-auto mb-4" />
              <h2 className="font-display font-bold text-xl mb-2">Brand account required</h2>
              <p className="text-gray-600 text-sm mb-6">
                Posting a request is for brand members only. You need to register or link a drinks brand to your account first.
              </p>
              <div className="flex justify-center gap-3">
                <Link href="/onboarding">
                  <Button variant="primary">Add a Brand</Button>
                </Link>
                <Link href="/requests">
                  <Button variant="outline">Browse Requests</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-cyan py-8 border-b-4 border-black">
        <div className="section-container">
          <Link href="/requests" className="inline-flex items-center gap-2 text-sm font-bold mb-4 hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Back to Requests
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center border-2 border-black neo-shadow shrink-0">
              <Zap className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">Post a Request</h1>
              <p className="text-base font-medium mt-1">Describe what you need and let suppliers come to you.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="section-container py-10 max-w-2xl">
        <Card>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block font-display font-bold text-sm uppercase tracking-wide mb-2">
                  Request Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="e.g. Sustainable packaging supplier for 10k units"
                  className="w-full border-2 border-black px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  maxLength={120}
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{form.title.length}/120</p>
              </div>

              {/* Description */}
              <div>
                <label className="block font-display font-bold text-sm uppercase tracking-wide mb-2">
                  What do you need? <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Describe your requirements in detail. Include volumes, specifications, timelines, and any other relevant context."
                  rows={6}
                  className="w-full border-2 border-black px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block font-display font-bold text-sm uppercase tracking-wide mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                  className="w-full border-2 border-black px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                >
                  <option value="">Select a category...</option>
                  {categories.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Budget */}
                <div>
                  <label className="block font-display font-bold text-sm uppercase tracking-wide mb-2">
                    Budget (optional)
                  </label>
                  <input
                    type="text"
                    value={form.budget}
                    onChange={e => set('budget', e.target.value)}
                    placeholder="e.g. £5,000–£10,000"
                    className="w-full border-2 border-black px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                {/* Deadline */}
                <div>
                  <label className="block font-display font-bold text-sm uppercase tracking-wide mb-2">
                    Deadline (optional)
                  </label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={e => set('deadline', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border-2 border-black px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block font-display font-bold text-sm uppercase tracking-wide mb-2">
                  Location (optional)
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => set('location', e.target.value)}
                  placeholder="e.g. London, UK"
                  className="w-full border-2 border-black px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Remote OK */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isRemoteOk}
                    onChange={e => set('isRemoteOk', e.target.checked)}
                    className="w-5 h-5 border-2 border-black"
                  />
                  <div>
                    <span className="font-bold text-sm">Remote suppliers welcome</span>
                    <p className="text-xs text-gray-500">Tick this if the supplier doesn&apos;t need to be local</p>
                  </div>
                </label>
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-500 px-4 py-3 text-sm text-red-700 font-medium">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="primary" size="lg" disabled={submitting} className="flex-1">
                  {submitting ? 'Posting...' : 'Post Request'}
                </Button>
                <Link href="/requests">
                  <Button type="button" variant="outline" size="lg">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 bg-cyan/30 border-2 border-black p-5">
          <h3 className="font-display font-bold text-sm uppercase tracking-wide mb-2">How it works</h3>
          <ol className="text-sm space-y-1 text-gray-700">
            <li>1. Post your request with as much detail as possible</li>
            <li>2. Suppliers on the platform browse and respond with a short message</li>
            <li>3. Review responses and contact whoever looks like a good fit</li>
            <li>4. Close or mark your request as awarded when you&apos;re done</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
