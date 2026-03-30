'use client'

import { Suspense, useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Upload,
  X,
  Loader2,
  Check,
  AlertCircle,
  ImageIcon,
  Globe,
  Instagram,
  Linkedin,
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
} from '@/components/ui'
import { IMAGE_GUIDELINES } from '@/lib/storage/upload'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DrinkCategory = 'SPIRITS' | 'BEER' | 'WINE' | 'RTD' | 'NO_LO' | 'CIDER' | 'OTHER'

interface BrandImage {
  id: string
  url: string
  alt: string | null
  order: number
}

interface Brand {
  id: string
  name: string
  slug: string
  tagline: string | null
  description: string | null
  story: string | null
  logoUrl: string | null
  heroImageUrl: string | null
  websiteUrl: string | null
  instagramUrl: string | null
  linkedinUrl: string | null
  category: DrinkCategory
  subcategories: string[]
  yearFounded: number | null
  location: string | null
  country: string | null
  images: BrandImage[]
}

interface FormData {
  name: string
  tagline: string
  description: string
  story: string
  category: DrinkCategory
  categories: DrinkCategory[]
  subcategories: string
  yearFounded: string
  location: string
  country: string
  websiteUrl: string
  instagramUrl: string
  linkedinUrl: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DRINK_CATEGORIES: { value: DrinkCategory; label: string }[] = [
  { value: 'SPIRITS', label: 'Spirits' },
  { value: 'BEER', label: 'Beer' },
  { value: 'WINE', label: 'Wine' },
  { value: 'RTD', label: 'RTD (Ready to Drink)' },
  { value: 'NO_LO', label: 'No/Low Alcohol' },
  { value: 'CIDER', label: 'Cider' },
  { value: 'OTHER', label: 'Other' },
]

// ---------------------------------------------------------------------------
// ImageUploader component
// ---------------------------------------------------------------------------

function ImageUploader({
  label,
  hint,
  currentUrl,
  onUploaded,
  uploading,
  onUpload,
}: {
  label: string
  hint?: string
  currentUrl: string | null
  onUploaded: (url: string) => void
  uploading: boolean
  onUpload: (file: File) => Promise<string | null>
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await onUpload(file)
    if (url) onUploaded(url)
    // reset so same file can be re-uploaded
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-start gap-4">
        <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50 flex-shrink-0 overflow-hidden">
          {currentUrl ? (
            <Image src={currentUrl} alt={label} width={96} height={96} className="object-cover w-full h-full" unoptimized />
          ) : (
            <ImageIcon className="w-8 h-8 text-gray-300" />
          )}
        </div>
        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleChange}
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading…</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" />{currentUrl ? 'Replace' : 'Upload'}</>
            )}
          </Button>
          <p className="text-xs text-gray-500">{hint || 'JPG, PNG or WebP · max 5MB'}</p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// GalleryUploader
// ---------------------------------------------------------------------------

function GalleryUploader({
  orgId,
  images,
  onImagesChange,
}: {
  orgId: string
  images: BrandImage[]
  onImagesChange: (images: BrandImage[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await fetch(`/api/me/brand/images?orgId=${orgId}`, { method: 'POST', body: fd })
        if (res.ok) {
          const { data } = await res.json()
          onImagesChange([...images, data])
        }
      } catch {
        // continue with next file
      }
    }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleDelete(imageId: string) {
    setDeleting(imageId)
    try {
      await fetch(`/api/me/brand/images/${imageId}?orgId=${orgId}`, { method: 'DELETE' })
      onImagesChange(images.filter(img => img.id !== imageId))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-3">
      <Label>Gallery Images</Label>
      <p className="text-xs text-gray-500">{IMAGE_GUIDELINES.gallery.hint}</p>
      <div className="grid grid-cols-4 gap-3">
        {images.map(img => (
          <div key={img.id} className="relative group aspect-square border-2 border-black rounded overflow-hidden bg-gray-100">
            <Image src={img.url} alt={img.alt || ''} fill className="object-cover" unoptimized />
            <button
              type="button"
              onClick={() => handleDelete(img.id)}
              disabled={deleting === img.id}
              className="absolute top-1 right-1 bg-black bg-opacity-70 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {deleting === img.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="aspect-square border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
          <span className="text-xs">Add photo</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleUpload}
        disabled={uploading}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page content
// ---------------------------------------------------------------------------

function BrandEditContent() {
  const searchParams = useSearchParams()
  const orgId = searchParams.get('orgId')

  const [brand, setBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)

  const [logoUploading, setLogoUploading] = useState(false)
  const [heroUploading, setHeroUploading] = useState(false)

  const [form, setForm] = useState<FormData>({
    name: '',
    tagline: '',
    description: '',
    story: '',
    category: 'SPIRITS',
    categories: ['SPIRITS'],
    subcategories: '',
    yearFounded: '',
    location: '',
    country: '',
    websiteUrl: '',
    instagramUrl: '',
    linkedinUrl: '',
  })

  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null)
  const [galleryImages, setGalleryImages] = useState<BrandImage[]>([])

  // Load brand data
  useEffect(() => {
    if (!orgId) {
      setAccessDenied(true)
      setLoading(false)
      return
    }

    fetch(`/api/me/brand?orgId=${orgId}`)
      .then(async res => {
        if (res.status === 401 || res.status === 403 || res.status === 404) {
          setAccessDenied(true)
          return
        }
        const { data } = await res.json()
        setBrand(data)
        setLogoUrl(data.logoUrl)
        setHeroImageUrl(data.heroImageUrl)
        setGalleryImages(data.images || [])
        const cats = data.categories && data.categories.length > 0
          ? data.categories
          : data.category ? [data.category] : ['SPIRITS']
        setForm({
          name: data.name || '',
          tagline: data.tagline || '',
          description: data.description || '',
          story: data.story || '',
          category: data.category || 'SPIRITS',
          categories: cats,
          subcategories: (data.subcategories || []).join(', '),
          yearFounded: data.yearFounded ? String(data.yearFounded) : '',
          location: data.location || '',
          country: data.country || '',
          websiteUrl: data.websiteUrl || '',
          instagramUrl: data.instagramUrl || '',
          linkedinUrl: data.linkedinUrl || '',
        })
      })
      .catch(() => setAccessDenied(true))
      .finally(() => setLoading(false))
  }, [orgId])

  function field(key: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  // Upload logo or hero → returns url or null
  async function uploadSingleImage(
    file: File,
    setUploading: (v: boolean) => void,
    fieldKey: 'logoUrl' | 'heroImageUrl',
  ): Promise<string | null> {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const folder = fieldKey === 'logoUrl' ? 'logos' : 'hero'
      const res = await fetch(`/api/upload?bucket=brand-images&folder=${folder}`, { method: 'POST', body: fd })
      if (!res.ok) return null
      const result = await res.json()
      if (!result.url) return null
      // Immediately persist logoUrl / heroImageUrl to the brand
      await fetch(`/api/me/brand?orgId=${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [fieldKey]: result.url }),
      })
      return result.url
    } finally {
      setUploading(false)
    }
  }

  const handleSave = useCallback(async () => {
    if (!orgId) return
    setSaving(true)
    setSaveStatus('idle')
    setSaveError(null)

    const subcats = form.subcategories
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    const payload = {
      name: form.name,
      tagline: form.tagline || null,
      description: form.description || null,
      story: form.story || null,
      category: form.categories[0] || form.category,
      categories: form.categories,
      subcategories: subcats,
      yearFounded: form.yearFounded ? parseInt(form.yearFounded, 10) : null,
      location: form.location || null,
      country: form.country || null,
      websiteUrl: form.websiteUrl || null,
      instagramUrl: form.instagramUrl || null,
      linkedinUrl: form.linkedinUrl || null,
      logoUrl,
      heroImageUrl,
    }

    try {
      const res = await fetch(`/api/me/brand?orgId=${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setSaveStatus('success')
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        const { error } = await res.json()
        setSaveStatus('error')
        setSaveError(error || 'Failed to save changes')
      }
    } catch {
      setSaveStatus('error')
      setSaveError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }, [orgId, form, logoUrl, heroImageUrl])

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

  if (accessDenied || !orgId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-coral mx-auto mb-4" />
        <h1 className="font-display text-2xl font-black mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">You don&apos;t have permission to edit this brand.</p>
        <Link href="/dashboard">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Dashboard</Button>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-black uppercase tracking-tight">Edit Brand Profile</h1>
          {brand && <p className="text-sm text-gray-500">{brand.name}</p>}
        </div>
      </div>

      {/* Save status banner */}
      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 bg-lime-50 border-2 border-lime-400 text-lime-800 rounded px-4 py-3 text-sm font-bold">
          <Check className="w-4 h-4" />Changes saved successfully
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="flex items-center gap-2 bg-red-50 border-2 border-red-400 text-red-800 rounded px-4 py-3 text-sm font-bold">
          <AlertCircle className="w-4 h-4" />{saveError}
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Brand Name *</Label>
            <Input id="name" value={form.name} onChange={field('name')} placeholder="Your brand name" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" value={form.tagline} onChange={field('tagline')} placeholder="A short punchy line" />
          </div>
          <div className="space-y-1">
            <Label>Categories *</Label>
            <p className="text-xs text-gray-500 mb-2">Select all that apply</p>
            <div className="grid grid-cols-2 gap-2">
              {DRINK_CATEGORIES.map(c => {
                const checked = form.categories.includes(c.value)
                return (
                  <label
                    key={c.value}
                    className={`flex items-center gap-2 px-3 py-2 border-2 cursor-pointer transition-colors ${
                      checked ? 'border-black bg-cyan/20 font-bold' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setForm(f => {
                          const cats = checked
                            ? f.categories.filter(v => v !== c.value)
                            : [...f.categories, c.value]
                          if (cats.length === 0) return f
                          return { ...f, categories: cats, category: cats[0] }
                        })
                      }}
                      className="w-4 h-4 border-2 border-black accent-black"
                    />
                    <span className="text-sm">{c.label}</span>
                  </label>
                )
              })}
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={field('description')}
              rows={4}
              placeholder="Tell the Kindred community about your brand…"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="story">Brand Story</Label>
            <Textarea
              id="story"
              value={form.story}
              onChange={field('story')}
              rows={5}
              placeholder="The origin, the people, the mission…"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="yearFounded">Year Founded</Label>
              <Input id="yearFounded" type="number" value={form.yearFounded} onChange={field('yearFounded')} placeholder="2019" min={1800} max={2100} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={form.location} onChange={field('location')} placeholder="London, UK" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="country">Country</Label>
            <Input id="country" value={form.country} onChange={field('country')} placeholder="United Kingdom" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="subcategories">Subcategories</Label>
            <Input
              id="subcategories"
              value={form.subcategories}
              onChange={field('subcategories')}
              placeholder="Rum, Caribbean, Dark Rum (comma-separated)"
            />
            <p className="text-xs text-gray-500">Separate with commas</p>
          </div>
        </CardContent>
      </Card>

      {/* Online Presence */}
      <Card>
        <CardHeader><CardTitle>Online Presence</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="websiteUrl" className="flex items-center gap-1"><Globe className="w-3 h-3" />Website</Label>
            <Input id="websiteUrl" type="url" value={form.websiteUrl} onChange={field('websiteUrl')} placeholder="https://yourband.com" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="instagramUrl" className="flex items-center gap-1"><Instagram className="w-3 h-3" />Instagram</Label>
            <Input id="instagramUrl" type="url" value={form.instagramUrl} onChange={field('instagramUrl')} placeholder="https://instagram.com/yourbrand" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="linkedinUrl" className="flex items-center gap-1"><Linkedin className="w-3 h-3" />LinkedIn</Label>
            <Input id="linkedinUrl" type="url" value={form.linkedinUrl} onChange={field('linkedinUrl')} placeholder="https://linkedin.com/company/yourbrand" />
          </div>

        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader><CardTitle>Images</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <ImageUploader
            label="Logo"
            hint={IMAGE_GUIDELINES.logo.hint}
            currentUrl={logoUrl}
            uploading={logoUploading}
            onUpload={file => uploadSingleImage(file, setLogoUploading, 'logoUrl')}
            onUploaded={url => setLogoUrl(url)}
          />
          <ImageUploader
            label="Hero / Cover Image"
            hint={IMAGE_GUIDELINES.hero.hint}
            currentUrl={heroImageUrl}
            uploading={heroUploading}
            onUpload={file => uploadSingleImage(file, setHeroUploading, 'heroImageUrl')}
            onUploaded={url => setHeroImageUrl(url)}
          />
          <GalleryUploader
            orgId={orgId}
            images={galleryImages}
            onImagesChange={setGalleryImages}
          />
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center justify-between pb-8">
        <Link href="/dashboard">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Cancel</Button>
        </Link>
        <Button onClick={handleSave} disabled={saving || !form.name}>
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}

export default function BrandEditPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    }>
      <BrandEditContent />
    </Suspense>
  )
}
