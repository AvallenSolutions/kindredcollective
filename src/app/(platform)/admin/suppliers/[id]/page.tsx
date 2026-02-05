'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui'

const CATEGORIES = [
  'PACKAGING',
  'INGREDIENTS',
  'LOGISTICS',
  'CO_PACKING',
  'DESIGN',
  'MARKETING',
  'EQUIPMENT',
  'CONSULTING',
  'LEGAL',
  'FINANCE',
  'DISTRIBUTION',
  'RECRUITMENT',
  'SOFTWARE',
  'SUSTAINABILITY',
  'PR',
  'PHOTOGRAPHY',
  'WEB_DEVELOPMENT',
  'OTHER',
]

export default function EditSupplierPage() {
  const router = useRouter()
  const params = useParams()
  const supplierId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    companyName: '',
    slug: '',
    tagline: '',
    description: '',
    category: 'PACKAGING',
    location: '',
    country: '',
    websiteUrl: '',
    contactName: '',
    contactEmail: '',
    isPublic: true,
    isVerified: false,
  })

  useEffect(() => {
    fetchSupplier()
  }, [supplierId])

  async function fetchSupplier() {
    const res = await fetch(`/api/admin/suppliers/${supplierId}`)
    const data = await res.json()

    if (data.success) {
      const s = data.data
      setFormData({
        companyName: s.companyName || '',
        slug: s.slug || '',
        tagline: s.tagline || '',
        description: s.description || '',
        category: s.category || 'PACKAGING',
        location: s.location || '',
        country: s.country || '',
        websiteUrl: s.websiteUrl || '',
        contactName: s.contactName || '',
        contactEmail: s.contactEmail || '',
        isPublic: s.isPublic ?? true,
        isVerified: s.isVerified ?? false,
      })
    } else {
      setError('Failed to load supplier')
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch(`/api/admin/suppliers/${supplierId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    const data = await res.json()

    if (data.success) {
      router.push('/admin/suppliers')
    } else {
      setError(data.error || 'Failed to update supplier')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/suppliers" className="p-2 border-2 border-black hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Edit Supplier</h1>
          <p className="text-gray-600">{formData.companyName}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white border-2 border-black neo-shadow p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-100 border-2 border-red-500 text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Company Name *
            </label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              URL Slug *
            </label>
            <div className="flex items-center">
              <span className="px-3 py-2 bg-gray-100 border-2 border-r-0 border-black text-gray-500">
                /explore/
              </span>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="flex-1 px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Tagline
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Category *
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Country
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Website URL
            </label>
            <input
              type="url"
              value={formData.websiteUrl}
              onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Contact Name
            </label>
            <input
              type="text"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Contact Email
            </label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="w-5 h-5 border-2 border-black"
              />
              <span className="text-sm font-bold uppercase">Public</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isVerified}
                onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                className="w-5 h-5 border-2 border-black"
              />
              <span className="text-sm font-bold uppercase">Verified</span>
            </label>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
            className="flex-1"
          >
            {saving ? 'Saving...' : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
          <Link href="/admin/suppliers">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
