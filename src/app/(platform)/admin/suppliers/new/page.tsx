'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Store, Upload, X } from 'lucide-react'
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

export default function NewSupplierPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [heroFile, setHeroFile] = useState<File | null>(null)
  const [heroPreview, setHeroPreview] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    slug: '',
    tagline: '',
    description: '',
    category: 'PACKAGING',
    location: '',
    country: 'United Kingdom',
    websiteUrl: '',
    contactName: '',
    contactEmail: '',
    logoUrl: '',
    heroImageUrl: '',
    isPublic: true,
    isVerified: false,
  })

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  function handleHeroChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setHeroFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setHeroPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  function clearLogo() {
    setLogoFile(null)
    setLogoPreview('')
    setFormData({ ...formData, logoUrl: '' })
  }

  function clearHero() {
    setHeroFile(null)
    setHeroPreview('')
    setFormData({ ...formData, heroImageUrl: '' })
  }

  async function uploadImages() {
    const uploadedData: { logoUrl?: string; heroImageUrl?: string } = {}

    if (logoFile) {
      const logoFormData = new FormData()
      logoFormData.append('file', logoFile)

      const logoRes = await fetch('/api/upload?bucket=supplier-images&folder=logos', {
        method: 'POST',
        body: logoFormData,
      })

      if (!logoRes.ok) {
        throw new Error('Failed to upload logo')
      }

      const logoData = await logoRes.json()
      uploadedData.logoUrl = logoData.url
    }

    if (heroFile) {
      const heroFormData = new FormData()
      heroFormData.append('file', heroFile)

      const heroRes = await fetch('/api/upload?bucket=supplier-images&folder=heroes', {
        method: 'POST',
        body: heroFormData,
      })

      if (!heroRes.ok) {
        throw new Error('Failed to upload hero image')
      }

      const heroData = await heroRes.json()
      uploadedData.heroImageUrl = heroData.url
    }

    return uploadedData
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Upload images first if any
      setUploading(true)
      const uploadedUrls = await uploadImages()
      setUploading(false)

      // Create supplier with uploaded image URLs
      const res = await fetch('/api/admin/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ...uploadedUrls,
        }),
      })

      const data = await res.json()

      if (data.success) {
        router.push('/admin/suppliers')
      } else {
        setError(data.error || 'Failed to create supplier')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create supplier')
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/suppliers" className="p-2 border-2 border-black hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Add Supplier</h1>
          <p className="text-gray-600">Create a new supplier listing</p>
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
              onChange={(e) => setFormData({
                ...formData,
                companyName: e.target.value,
                slug: generateSlug(e.target.value)
              })}
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
              placeholder="Acme Packaging Ltd"
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
                placeholder="acme-packaging"
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
              placeholder="Award-winning sustainable packaging solutions"
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
              placeholder="London"
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
              placeholder="United Kingdom"
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
              placeholder="https://example.com"
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
              placeholder="John Smith"
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
              placeholder="john@example.com"
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
              placeholder="Describe the supplier's services..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Logo Image
            </label>
            {logoPreview ? (
              <div className="relative border-2 border-black p-4">
                <img src={logoPreview} alt="Logo preview" className="max-h-40 mx-auto" />
                <button
                  type="button"
                  onClick={clearLogo}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-black p-8 cursor-pointer hover:bg-gray-50">
                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                <span className="text-sm text-gray-500">Click to upload logo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Hero Image
            </label>
            {heroPreview ? (
              <div className="relative border-2 border-black p-4">
                <img src={heroPreview} alt="Hero preview" className="max-h-40 mx-auto" />
                <button
                  type="button"
                  onClick={clearHero}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-black p-8 cursor-pointer hover:bg-gray-50">
                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                <span className="text-sm text-gray-500">Click to upload hero image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleHeroChange}
                  className="hidden"
                />
              </label>
            )}
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
            disabled={loading || uploading}
            className="flex-1"
          >
            {uploading ? 'Uploading images...' : loading ? 'Creating...' : (
              <>
                <Store className="w-4 h-4 mr-2" />
                Create Supplier
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
