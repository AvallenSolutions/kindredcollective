'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Calendar,
  Pencil,
  Trash2,
  Loader2,
  X,
  Check,
  AlertCircle,
  Globe,
  MapPin,
  ExternalLink,
  Upload,
  ImageIcon,
} from 'lucide-react'
import {
  Button,
  Input,
  Label,
  Textarea,
  Select,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '@/components/ui'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EventType = 'TRADE_SHOW' | 'MEETUP' | 'WORKSHOP' | 'WEBINAR' | 'NETWORKING' | 'LAUNCH' | 'PARTY' | 'OTHER'
type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED'

interface Event {
  id: string
  title: string
  slug: string
  description: string | null
  type: EventType
  status: EventStatus
  startDate: string
  endDate: string | null
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
}

interface FormData {
  title: string
  slug: string
  description: string
  type: EventType
  status: EventStatus
  startDate: string
  endDate: string
  isVirtual: boolean
  venueName: string
  address: string
  city: string
  country: string
  virtualUrl: string
  imageUrl: string
  capacity: string
  isFree: boolean
  price: string
  registrationUrl: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'TRADE_SHOW', label: 'Trade Show' },
  { value: 'MEETUP', label: 'Meetup' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'WEBINAR', label: 'Webinar' },
  { value: 'NETWORKING', label: 'Networking' },
  { value: 'LAUNCH', label: 'Launch' },
  { value: 'PARTY', label: 'Party' },
  { value: 'OTHER', label: 'Other' },
]

const EVENT_STATUSES: { value: EventStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'COMPLETED', label: 'Completed' },
]

const STATUS_VARIANTS: Record<EventStatus, 'outline' | 'cyan' | 'coral' | 'default'> = {
  DRAFT: 'outline',
  PUBLISHED: 'cyan',
  CANCELLED: 'coral',
  COMPLETED: 'default',
}

const EMPTY_FORM: FormData = {
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
  country: '',
  virtualUrl: '',
  imageUrl: '',
  capacity: '',
  isFree: true,
  price: '',
  registrationUrl: '',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function toLocalDatetimeValue(iso: string) {
  // Convert ISO string to datetime-local input value (YYYY-MM-DDTHH:MM)
  if (!iso) return ''
  return iso.slice(0, 16)
}

// ---------------------------------------------------------------------------
// Event Form Modal
// ---------------------------------------------------------------------------

function EventFormModal({
  event,
  onClose,
  onSaved,
}: {
  event: Event | null
  onClose: () => void
  onSaved: (event: Event) => void
}) {
  const isEdit = !!event

  const [form, setForm] = useState<FormData>(() => {
    if (!event) return EMPTY_FORM
    return {
      title: event.title,
      slug: event.slug,
      description: event.description || '',
      type: event.type,
      status: event.status,
      startDate: toLocalDatetimeValue(event.startDate),
      endDate: event.endDate ? toLocalDatetimeValue(event.endDate) : '',
      isVirtual: event.isVirtual,
      venueName: event.venueName || '',
      address: event.address || '',
      city: event.city || '',
      country: event.country || '',
      virtualUrl: event.virtualUrl || '',
      imageUrl: event.imageUrl || '',
      capacity: event.capacity != null ? String(event.capacity) : '',
      isFree: event.isFree,
      price: event.price != null ? String(event.price) : '',
      registrationUrl: event.registrationUrl || '',
    }
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(event?.imageUrl || '')

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview('')
    setForm(f => ({ ...f, imageUrl: '' }))
  }

  async function uploadImage(): Promise<string | null> {
    if (!imageFile) return null
    const data = new FormData()
    data.append('file', imageFile)
    const res = await fetch('/api/upload?bucket=event-images&folder=events', {
      method: 'POST',
      body: data,
    })
    if (!res.ok) throw new Error('Failed to upload image')
    const json = await res.json()
    return json.url
  }

  function field(key: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
      setForm(f => {
        const next = { ...f, [key]: val }
        // Auto-generate slug from title when creating
        if (key === 'title' && !isEdit) {
          next.slug = generateSlug(val as string)
        }
        return next
      })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.slug || !form.startDate) {
      setError('Title, slug, and start date are required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Upload image first if a new file was selected
      let imageUrl: string | null = form.imageUrl || null
      if (imageFile) {
        imageUrl = await uploadImage()
      }

      const payload = {
        title: form.title,
        slug: form.slug,
        description: form.description || null,
        type: form.type,
        status: form.status,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        isVirtual: form.isVirtual,
        venueName: form.isVirtual ? null : (form.venueName || null),
        address: form.isVirtual ? null : (form.address || null),
        city: form.isVirtual ? null : (form.city || null),
        country: form.isVirtual ? null : (form.country || null),
        virtualUrl: form.isVirtual ? (form.virtualUrl || null) : null,
        imageUrl,
        capacity: form.capacity ? parseInt(form.capacity, 10) : null,
        isFree: form.isFree,
        price: form.isFree ? null : (form.price ? parseFloat(form.price) : null),
        registrationUrl: form.registrationUrl || null,
      }

      const url = isEdit ? `/api/me/events/${event.id}` : '/api/me/events'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (res.ok) {
        onSaved(json.data)
      } else {
        setError(json.error || 'Failed to save event')
      }
    } catch {
      setError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white border-2 border-black w-full max-w-2xl my-8">
        {/* Header */}
        <div className="p-6 border-b-2 border-black flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold uppercase">
            {isEdit ? 'Edit Event' : 'Create Event'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 border-2 border-black">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border-2 border-red-400 text-red-800 rounded px-4 py-3 text-sm font-bold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          {/* Basic */}
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={form.title} onChange={field('title')} placeholder="Kindred Collective Meetup — April" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="slug">URL Slug *</Label>
              <Input id="slug" value={form.slug} onChange={field('slug')} placeholder="kindred-meetup-april" required />
              <p className="text-xs text-gray-500">Auto-generated from title · must be unique</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="type">Type *</Label>
                <Select id="type" value={form.type} onChange={field('type')}>
                  {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="status">Status</Label>
                <Select id="status" value={form.status} onChange={field('status')}>
                  {EVENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={field('description')} rows={4} placeholder="What's this event about?" />
            </div>

            {/* Event Image */}
            <div className="space-y-2">
              <Label>Event Image</Label>
              {imagePreview ? (
                <div className="relative">
                  <div className="relative w-full h-40 border-2 border-black overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Event preview" className="w-full h-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-2 right-2 bg-white border-2 border-black p-1 hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 cursor-pointer hover:border-black hover:bg-gray-50 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500 font-medium">Click to upload event image</span>
                  <span className="text-xs text-gray-400 mt-1">Recommended: 1200 x 630px (JPG, PNG, WebP)</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="startDate">Start Date & Time *</Label>
              <Input id="startDate" type="datetime-local" value={form.startDate} onChange={field('startDate')} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="endDate">End Date & Time</Label>
              <Input id="endDate" type="datetime-local" value={form.endDate} onChange={field('endDate')} />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isVirtual"
                checked={form.isVirtual}
                onChange={field('isVirtual')}
                className="w-4 h-4 border-2 border-black"
              />
              <Label htmlFor="isVirtual" className="cursor-pointer flex items-center gap-2">
                <Globe className="w-4 h-4" />Virtual / Online Event
              </Label>
            </div>

            {form.isVirtual ? (
              <div className="space-y-1">
                <Label htmlFor="virtualUrl">Join URL</Label>
                <Input id="virtualUrl" type="url" value={form.virtualUrl} onChange={field('virtualUrl')} placeholder="https://zoom.us/j/..." />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="venueName" className="flex items-center gap-1"><MapPin className="w-3 h-3" />Venue Name</Label>
                  <Input id="venueName" value={form.venueName} onChange={field('venueName')} placeholder="The Hoxton, London" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={form.address} onChange={field('address')} placeholder="81 Great Eastern St" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={form.city} onChange={field('city')} placeholder="London" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" value={form.country} onChange={field('country')} placeholder="United Kingdom" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Capacity & Pricing */}
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="capacity">Capacity (optional)</Label>
              <Input id="capacity" type="number" value={form.capacity} onChange={field('capacity')} placeholder="Leave blank for unlimited" min={1} />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isFree"
                checked={form.isFree}
                onChange={field('isFree')}
                className="w-4 h-4 border-2 border-black"
              />
              <Label htmlFor="isFree" className="cursor-pointer">Free Event</Label>
            </div>
            {!form.isFree && (
              <div className="space-y-1">
                <Label htmlFor="price">Price (£)</Label>
                <Input id="price" type="number" value={form.price} onChange={field('price')} placeholder="25.00" min={0} step={0.01} />
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="registrationUrl" className="flex items-center gap-1"><ExternalLink className="w-3 h-3" />External Registration URL (optional)</Label>
              <Input id="registrationUrl" type="url" value={form.registrationUrl} onChange={field('registrationUrl')} placeholder="https://eventbrite.com/..." />
              <p className="text-xs text-gray-500">If set, the RSVP button will link here instead of using the built-in RSVP system</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : (isEdit ? 'Save Changes' : 'Create Event')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

function EventsContent() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const loadEvents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/me/events')
      if (res.status === 401 || res.status === 403) {
        setAccessDenied(true)
        return
      }
      const { data } = await res.json()
      setEvents(data?.events || [])
    } catch {
      setAccessDenied(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadEvents() }, [loadEvents])

  function handleSaved(saved: Event) {
    setEvents(prev => {
      const exists = prev.find(e => e.id === saved.id)
      if (exists) return prev.map(e => e.id === saved.id ? saved : e)
      return [saved, ...prev]
    })
    setShowForm(false)
    setEditingEvent(null)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await fetch(`/api/me/events/${id}`, { method: 'DELETE' })
      setEvents(prev => prev.filter(e => e.id !== id))
    } finally {
      setDeletingId(null)
      setDeleteConfirmId(null)
    }
  }

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-coral mx-auto mb-4" />
        <h1 className="font-display text-2xl font-black mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">You need a brand or supplier affiliation to manage events.</p>
        <Link href="/dashboard">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Dashboard</Button>
          </Link>
          <h1 className="font-display text-2xl font-black uppercase tracking-tight">My Events</h1>
        </div>
        <Button onClick={() => { setEditingEvent(null); setShowForm(true) }}>
          <Plus className="w-4 h-4 mr-2" />Create Event
        </Button>
      </div>

      {/* Info note */}
      <div className="bg-cyan/10 border-2 border-cyan rounded px-4 py-3 text-sm text-gray-700">
        Events you create start as <strong>Draft</strong> and must be set to <strong>Published</strong> to appear publicly. Admins can also feature your event on the homepage.
      </div>

      {/* Event list */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold mb-2">No events yet</h2>
            <p className="text-gray-500 mb-6 text-sm">Create your first event to get started.</p>
            <Button onClick={() => { setEditingEvent(null); setShowForm(true) }}>
              <Plus className="w-4 h-4 mr-2" />Create Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <Card key={event.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Date box */}
                  <div className="w-14 h-14 bg-black text-white flex flex-col items-center justify-center flex-shrink-0">
                    <span className="font-display text-xl font-bold leading-none">
                      {new Date(event.startDate).getDate()}
                    </span>
                    <span className="text-xs font-bold uppercase">
                      {new Date(event.startDate).toLocaleDateString('en-GB', { month: 'short' })}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-sm truncate">{event.title}</h3>
                      <Badge variant={STATUS_VARIANTS[event.status]} className="text-xs flex-shrink-0">
                        {event.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        {event.isVirtual ? <Globe className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                        {event.isVirtual ? 'Virtual' : [event.city, event.country].filter(Boolean).join(', ') || 'Location TBC'}
                      </span>
                      <span>{event.isFree ? 'Free' : `£${event.price}`}</span>
                      <span className="capitalize">{event.type.replace('_', ' ').toLowerCase()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {event.status === 'PUBLISHED' && (
                      <Link href={`/community/events/${event.slug}`} target="_blank">
                        <Button size="sm" variant="ghost" title="View live event">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setEditingEvent(event); setShowForm(true) }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {deleteConfirmId === event.id ? (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-400 hover:bg-red-50"
                          onClick={() => handleDelete(event.id)}
                          disabled={deletingId === event.id}
                        >
                          {deletingId === event.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-red-500"
                        onClick={() => setDeleteConfirmId(event.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <EventFormModal
          event={editingEvent}
          onClose={() => { setShowForm(false); setEditingEvent(null) }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

export default function EventsSettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    }>
      <EventsContent />
    </Suspense>
  )
}
