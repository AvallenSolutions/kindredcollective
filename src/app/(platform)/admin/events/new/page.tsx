'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui'

const EVENT_TYPES = [
  'TRADE_SHOW',
  'MEETUP',
  'WORKSHOP',
  'WEBINAR',
  'NETWORKING',
  'LAUNCH',
  'PARTY',
  'OTHER',
]

export default function NewEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    type: 'NETWORKING',
    status: 'DRAFT',
    startDate: '',
    endDate: '',
    isVirtual: false,
    venueName: '',
    address: '',
    city: '',
    country: 'United Kingdom',
    virtualUrl: '',
    imageUrl: '',
    capacity: '',
    isFree: true,
    price: '',
    registrationUrl: '',
    isFeatured: false,
  })

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview('')
    setFormData({ ...formData, imageUrl: '' })
  }

  async function uploadImage() {
    if (!imageFile) return null

    const formData = new FormData()
    formData.append('file', imageFile)

    const res = await fetch('/api/upload?bucket=event-images&folder=events', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      throw new Error('Failed to upload image')
    }

    const data = await res.json()
    return data.url
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Upload image first if any
      let imageUrl = formData.imageUrl
      if (imageFile) {
        setUploading(true)
        imageUrl = await uploadImage()
        setUploading(false)
      }

      const payload = {
        ...formData,
        imageUrl,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : formData.startDate,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        price: formData.price ? parseFloat(formData.price) : null,
      }

      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (data.success) {
        router.push('/admin/events')
      } else {
        setError(data.error || 'Failed to create event')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create event')
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/events" className="p-2 border-2 border-black hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Add Event</h1>
          <p className="text-gray-600">Create a new event</p>
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
              Event Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({
                ...formData,
                title: e.target.value,
                slug: generateSlug(e.target.value)
              })}
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
              placeholder="Drinks Industry Summit 2026"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              URL Slug *
            </label>
            <div className="flex items-center">
              <span className="px-3 py-2 bg-gray-100 border-2 border-r-0 border-black text-gray-500">
                /events/
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

          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Event Type *
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
            >
              {EVENT_TYPES.map(type => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              End Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isVirtual}
                onChange={(e) => setFormData({ ...formData, isVirtual: e.target.checked })}
                className="w-5 h-5 border-2 border-black"
              />
              <span className="text-sm font-bold uppercase">Virtual Event</span>
            </label>
          </div>

          {formData.isVirtual ? (
            <div className="md:col-span-2">
              <label className="block text-sm font-bold uppercase tracking-wide mb-2">
                Virtual Event URL
              </label>
              <input
                type="url"
                value={formData.virtualUrl}
                onChange={(e) => setFormData({ ...formData, virtualUrl: e.target.value })}
                className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
                placeholder="https://zoom.us/j/..."
              />
            </div>
          ) : (
            <>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">
                  Venue Name
                </label>
                <input
                  type="text"
                  value={formData.venueName}
                  onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
                  placeholder="The Drinks Emporium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
                  placeholder="123 High Street"
                />
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
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
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Capacity
            </label>
            <input
              type="number"
              min="0"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
              placeholder="100"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Registration URL
            </label>
            <input
              type="url"
              value={formData.registrationUrl}
              onChange={(e) => setFormData({ ...formData, registrationUrl: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
              placeholder="https://eventbrite.com/..."
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFree}
                onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                className="w-5 h-5 border-2 border-black"
              />
              <span className="text-sm font-bold uppercase">Free Event</span>
            </label>

            {!formData.isFree && (
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
                  placeholder="Price (£)"
                />
              </div>
            )}
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
              placeholder="Describe the event..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Event Image
            </label>
            {imagePreview ? (
              <div className="relative border-2 border-black">
                <img src={imagePreview} alt="Event preview" className="w-full h-64 object-cover" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-black p-12 cursor-pointer hover:bg-gray-50">
                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                <span className="text-sm text-gray-500">Click to upload event image</span>
                <span className="text-xs text-gray-400 mt-1">Recommended: 1200x630px</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-5 h-5 border-2 border-black"
              />
              <span className="text-sm font-bold uppercase">Featured Event</span>
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
            {uploading ? 'Uploading image...' : loading ? 'Creating...' : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Create Event
              </>
            )}
          </Button>
          <Link href="/admin/events">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
