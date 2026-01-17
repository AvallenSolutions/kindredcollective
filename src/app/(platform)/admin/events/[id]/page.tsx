'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Save, Eye, Users } from 'lucide-react'
import { Button } from '@/components/ui'

const EVENT_TYPES = [
  'CONFERENCE',
  'WORKSHOP',
  'NETWORKING',
  'TRADE_SHOW',
  'WEBINAR',
  'MEETUP',
  'OTHER',
]

interface EventData {
  id: string
  title: string
  slug: string
  description: string | null
  type: string
  status: string
  startDate: string
  endDate: string | null
  timezone: string
  isVirtual: boolean
  venueName: string | null
  address: string | null
  city: string | null
  country: string | null
  virtualUrl: string | null
  imageUrl: string | null
  capacity: number | null
  isFree: boolean
  price: number | null
  registrationUrl: string | null
  showAttendees: boolean
  isFeatured: boolean
  rsvpCounts?: {
    going: number
    interested: number
    notGoing: number
  }
}

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
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
    showAttendees: true,
    isFeatured: false,
  })
  const [rsvpCounts, setRsvpCounts] = useState({ going: 0, interested: 0, notGoing: 0 })

  useEffect(() => {
    fetchEvent()
  }, [eventId])

  async function fetchEvent() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/events/${eventId}`)
      const data = await res.json()

      if (data.success && data.data) {
        const event: EventData = data.data

        // Format dates for datetime-local input
        const formatDateForInput = (dateStr: string | null) => {
          if (!dateStr) return ''
          const date = new Date(dateStr)
          return date.toISOString().slice(0, 16)
        }

        setFormData({
          title: event.title || '',
          slug: event.slug || '',
          description: event.description || '',
          type: event.type || 'NETWORKING',
          status: event.status || 'DRAFT',
          startDate: formatDateForInput(event.startDate),
          endDate: formatDateForInput(event.endDate),
          isVirtual: event.isVirtual || false,
          venueName: event.venueName || '',
          address: event.address || '',
          city: event.city || '',
          country: event.country || 'United Kingdom',
          virtualUrl: event.virtualUrl || '',
          imageUrl: event.imageUrl || '',
          capacity: event.capacity?.toString() || '',
          isFree: event.isFree ?? true,
          price: event.price?.toString() || '',
          registrationUrl: event.registrationUrl || '',
          showAttendees: event.showAttendees ?? true,
          isFeatured: event.isFeatured || false,
        })

        if (event.rsvpCounts) {
          setRsvpCounts(event.rsvpCounts)
        }
      } else {
        setError('Event not found')
      }
    } catch (err) {
      setError('Failed to load event')
    }
    setLoading(false)
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      ...formData,
      capacity: formData.capacity ? parseInt(formData.capacity) : null,
      price: formData.price ? parseFloat(formData.price) : null,
      endDate: formData.endDate || null,
      imageUrl: formData.imageUrl || null,
      virtualUrl: formData.virtualUrl || null,
      venueName: formData.venueName || null,
      address: formData.address || null,
      city: formData.city || null,
      registrationUrl: formData.registrationUrl || null,
    }

    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (data.success) {
        router.push('/admin/events')
      } else {
        setError(data.error || 'Failed to update event')
      }
    } catch (err) {
      setError('Failed to update event')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="bg-white border-2 border-gray-200 p-6 space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/events" className="p-2 border-2 border-black hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Edit Event</h1>
          <p className="text-gray-600">{formData.title || 'Loading...'}</p>
        </div>
        {formData.slug && (
          <Link
            href={`/events/${formData.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black hover:bg-gray-100"
          >
            <Eye className="w-4 h-4" /> Preview
          </Link>
        )}
      </div>

      {/* RSVP Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-green-100 border-2 border-black p-4 text-center">
          <p className="text-2xl font-display font-bold">{rsvpCounts.going}</p>
          <p className="text-sm font-bold uppercase text-green-800">Going</p>
        </div>
        <div className="bg-yellow-100 border-2 border-black p-4 text-center">
          <p className="text-2xl font-display font-bold">{rsvpCounts.interested}</p>
          <p className="text-sm font-bold uppercase text-yellow-800">Interested</p>
        </div>
        <div className="bg-gray-100 border-2 border-black p-4 text-center">
          <p className="text-2xl font-display font-bold">{rsvpCounts.notGoing}</p>
          <p className="text-sm font-bold uppercase text-gray-600">Not Going</p>
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
          {/* Title */}
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
              })}
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
              placeholder="Drinks Industry Summit 2026"
            />
          </div>

          {/* Slug */}
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

          {/* Type & Status */}
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

          {/* Dates */}
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

          {/* Virtual Event Toggle */}
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

          {/* Location Fields */}
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

          {/* Image URL */}
          <div className="md:col-span-2">
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Event Image URL
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
              placeholder="https://example.com/event-image.jpg"
            />
            {formData.imageUrl && (
              <div className="mt-2">
                <img
                  src={formData.imageUrl}
                  alt="Event preview"
                  className="w-full max-w-xs h-32 object-cover border-2 border-black"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>

          {/* Capacity & Registration */}
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
              Registration / Ticket URL
            </label>
            <input
              type="url"
              value={formData.registrationUrl}
              onChange={(e) => setFormData({ ...formData, registrationUrl: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
              placeholder="https://eventbrite.com/..."
            />
          </div>

          {/* Pricing */}
          <div className="md:col-span-2 flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFree}
                onChange={(e) => setFormData({ ...formData, isFree: e.target.checked, price: '' })}
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

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Description
            </label>
            <textarea
              rows={6}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
              placeholder="Describe the event, what attendees can expect, speakers, etc..."
            />
          </div>

          {/* Options */}
          <div className="md:col-span-2 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showAttendees}
                onChange={(e) => setFormData({ ...formData, showAttendees: e.target.checked })}
                className="w-5 h-5 border-2 border-black"
              />
              <span className="text-sm font-bold uppercase">Show Attendee List</span>
            </label>

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

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t-2 border-gray-200">
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
