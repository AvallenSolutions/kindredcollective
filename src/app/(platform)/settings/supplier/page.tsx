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
  Briefcase,
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SupplierCategory =
  | 'PACKAGING' | 'INGREDIENTS' | 'LOGISTICS' | 'CO_PACKING' | 'DESIGN'
  | 'MARKETING' | 'EQUIPMENT' | 'CONSULTING' | 'LEGAL' | 'FINANCE'
  | 'DISTRIBUTION' | 'RECRUITMENT' | 'SOFTWARE' | 'SUSTAINABILITY'
  | 'PR' | 'PHOTOGRAPHY' | 'WEB_DEVELOPMENT' | 'OTHER'

type Certification =
  | 'ORGANIC' | 'B_CORP' | 'FAIRTRADE' | 'VEGAN' | 'GLUTEN_FREE'
  | 'PLASTIC_FREE' | 'CARBON_NEUTRAL' | 'OTHER'

interface SupplierImage {
  id: string
  url: string
  alt: string | null
  order: number
}

interface Supplier {
  id: string
  companyName: string
  slug: string
  tagline: string | null
  description: string | null
  logoUrl: string | null
  heroImageUrl: string | null
  websiteUrl: string | null
  instagramUrl: string | null
  linkedinUrl: string | null
  portfolioUrl: string | null
  category: SupplierCategory
  subcategories: string[]
  services: string[]
  certifications: Certification[]
  moqMin: number | null
  moqMax: number | null
  leadTimeDays: number | null
  location: string | null
  country: string | null
  serviceRegions: string[]
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  images: SupplierImage[]
}

interface FormData {
  companyName: string
  tagline: string
  description: string
  category: SupplierCategory
  subcategories: string
  services: string
  moqMin: string
  moqMax: string
  leadTimeDays: string
  location: string
  country: string
  serviceRegions: string
  contactName: string
  contactEmail: string
  contactPhone: string
  websiteUrl: string
  instagramUrl: string
  linkedinUrl: string
  portfolioUrl: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUPPLIER_CATEGORIES: { value: SupplierCategory; label: string }[] = [
  { value: 'PACKAGING', label: 'Packaging' },
  { value: 'INGREDIENTS', label: 'Ingredients' },
  { value: 'LOGISTICS', label: 'Logistics' },
  { value: 'CO_PACKING', label: 'Co-Packing' },
  { value: 'DESIGN', label: 'Design' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'CONSULTING', label: 'Consulting' },
  { value: 'LEGAL', label: 'Legal' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'DISTRIBUTION', label: 'Distribution' },
  { value: 'RECRUITMENT', label: 'Recruitment' },
  { value: 'SOFTWARE', label: 'Software' },
  { value: 'SUSTAINABILITY', label: 'Sustainability' },
  { value: 'PR', label: 'PR' },
  { value: 'PHOTOGRAPHY', label: 'Photography' },
  { value: 'WEB_DEVELOPMENT', label: 'Web Development' },
  { value: 'OTHER', label: 'Other' },
]

const ALL_CERTIFICATIONS: { value: Certification; label: string }[] = [
  { value: 'ORGANIC', label: 'Organic' },
  { value: 'B_CORP', label: 'B Corp' },
  { value: 'FAIRTRADE', label: 'Fairtrade' },
  { value: 'VEGAN', label: 'Vegan' },
  { value: 'GLUTEN_FREE', label: 'Gluten Free' },
  { value: 'PLASTIC_FREE', label: 'Plastic Free' },
  { value: 'CARBON_NEUTRAL', label: 'Carbon Neutral' },
  { value: 'OTHER', label: 'Other' },
]

// ---------------------------------------------------------------------------
// ImageUploader
// ---------------------------------------------------------------------------

function ImageUploader({
  label,
  currentUrl,
  onUploaded,
  uploading,
  onUpload,
}: {
  label: string
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
          <p className="text-xs text-gray-500">JPG, PNG or WebP · max 5MB</p>
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
  images: SupplierImage[]
  onImagesChange: (images: SupplierImage[]) => void
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
        const res = await fetch(`/api/me/supplier/images?orgId=${orgId}`, { method: 'POST', body: fd })
        if (res.ok) {
          const { data } = await res.json()
          onImagesChange([...images, data])
        }
      } catch {
        // continue
      }
    }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleDelete(imageId: string) {
    setDeleting(imageId)
    try {
      await fetch(`/api/me/supplier/images/${imageId}?orgId=${orgId}`, { method: 'DELETE' })
      onImagesChange(images.filter(img => img.id !== imageId))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-3">
      <Label>Portfolio / Gallery Images</Label>
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
// Main content
// ---------------------------------------------------------------------------

function SupplierEditContent() {
  const searchParams = useSearchParams()
  const orgId = searchParams.get('orgId')

  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)

  const [logoUploading, setLogoUploading] = useState(false)
  const [heroUploading, setHeroUploading] = useState(false)

  const [form, setForm] = useState<FormData>({
    companyName: '',
    tagline: '',
    description: '',
    category: 'CONSULTING',
    subcategories: '',
    services: '',
    moqMin: '',
    moqMax: '',
    leadTimeDays: '',
    location: '',
    country: '',
    serviceRegions: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    websiteUrl: '',
    instagramUrl: '',
    linkedinUrl: '',
    portfolioUrl: '',
  })

  const [certifications, setCertifications] = useState<Certification[]>([])
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null)
  const [galleryImages, setGalleryImages] = useState<SupplierImage[]>([])

  useEffect(() => {
    if (!orgId) {
      setAccessDenied(true)
      setLoading(false)
      return
    }

    fetch(`/api/me/supplier?orgId=${orgId}`)
      .then(async res => {
        if (res.status === 401 || res.status === 403 || res.status === 404) {
          setAccessDenied(true)
          return
        }
        const { data } = await res.json()
        setSupplier(data)
        setLogoUrl(data.logoUrl)
        setHeroImageUrl(data.heroImageUrl)
        setGalleryImages(data.images || [])
        setCertifications(data.certifications || [])
        setForm({
          companyName: data.companyName || '',
          tagline: data.tagline || '',
          description: data.description || '',
          category: data.category || 'CONSULTING',
          subcategories: (data.subcategories || []).join(', '),
          services: (data.services || []).join(', '),
          moqMin: data.moqMin != null ? String(data.moqMin) : '',
          moqMax: data.moqMax != null ? String(data.moqMax) : '',
          leadTimeDays: data.leadTimeDays != null ? String(data.leadTimeDays) : '',
          location: data.location || '',
          country: data.country || '',
          serviceRegions: (data.serviceRegions || []).join(', '),
          contactName: data.contactName || '',
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || '',
          websiteUrl: data.websiteUrl || '',
          instagramUrl: data.instagramUrl || '',
          linkedinUrl: data.linkedinUrl || '',
          portfolioUrl: data.portfolioUrl || '',
        })
      })
      .catch(() => setAccessDenied(true))
      .finally(() => setLoading(false))
  }, [orgId])

  function field(key: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  function toggleCertification(cert: Certification) {
    setCertifications(prev =>
      prev.includes(cert) ? prev.filter(c => c !== cert) : [...prev, cert]
    )
  }

  async function uploadSingleImage(
    file: File,
    setUploading: (v: boolean) => void,
    fieldKey: 'logoUrl' | 'heroImageUrl',
  ): Promise<string | null> {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/me/supplier/images?orgId=${orgId}`, { method: 'POST', body: fd })
      if (!res.ok) return null
      const { data } = await res.json()
      await fetch(`/api/me/supplier?orgId=${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [fieldKey]: data.url }),
      })
      return data.url
    } finally {
      setUploading(false)
    }
  }

  const handleSave = useCallback(async () => {
    if (!orgId) return
    setSaving(true)
    setSaveStatus('idle')
    setSaveError(null)

    function splitList(val: string) {
      return val.split(',').map(s => s.trim()).filter(Boolean)
    }

    const payload = {
      companyName: form.companyName,
      tagline: form.tagline || null,
      description: form.description || null,
      category: form.category,
      subcategories: splitList(form.subcategories),
      services: splitList(form.services),
      certifications,
      moqMin: form.moqMin ? parseInt(form.moqMin, 10) : null,
      moqMax: form.moqMax ? parseInt(form.moqMax, 10) : null,
      leadTimeDays: form.leadTimeDays ? parseInt(form.leadTimeDays, 10) : null,
      location: form.location || null,
      country: form.country || null,
      serviceRegions: splitList(form.serviceRegions),
      contactName: form.contactName || null,
      contactEmail: form.contactEmail || null,
      contactPhone: form.contactPhone || null,
      websiteUrl: form.websiteUrl || null,
      instagramUrl: form.instagramUrl || null,
      linkedinUrl: form.linkedinUrl || null,
      portfolioUrl: form.portfolioUrl || null,
      logoUrl,
      heroImageUrl,
    }

    try {
      const res = await fetch(`/api/me/supplier?orgId=${orgId}`, {
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
  }, [orgId, form, certifications, logoUrl, heroImageUrl])

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
        <p className="text-gray-600 mb-6">You don&apos;t have permission to edit this supplier.</p>
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
          <h1 className="font-display text-2xl font-black uppercase tracking-tight">Edit Supplier Profile</h1>
          {supplier && <p className="text-sm text-gray-500">{supplier.companyName}</p>}
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
            <Label htmlFor="companyName">Company Name *</Label>
            <Input id="companyName" value={form.companyName} onChange={field('companyName')} placeholder="Your company name" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" value={form.tagline} onChange={field('tagline')} placeholder="A short punchy line" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="category">Category *</Label>
            <Select id="category" value={form.category} onChange={field('category')}>
              {SUPPLIER_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={field('description')}
              rows={4}
              placeholder="What does your company do? Who do you serve?"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="subcategories">Subcategories</Label>
            <Input
              id="subcategories"
              value={form.subcategories}
              onChange={field('subcategories')}
              placeholder="Glass Bottles, Cans, Labels (comma-separated)"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="services">Services Offered</Label>
            <Input
              id="services"
              value={form.services}
              onChange={field('services')}
              placeholder="Brand Strategy, Label Design, Market Research (comma-separated)"
            />
          </div>
          <div className="space-y-1">
            <Label>Certifications</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_CERTIFICATIONS.map(cert => (
                <button
                  key={cert.value}
                  type="button"
                  onClick={() => toggleCertification(cert.value)}
                  className={`px-3 py-1 text-sm font-bold rounded border-2 transition-colors ${
                    certifications.includes(cert.value)
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
                  }`}
                >
                  {cert.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operations */}
      <Card>
        <CardHeader><CardTitle>Operations</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="moqMin">MOQ Min</Label>
              <Input id="moqMin" type="number" value={form.moqMin} onChange={field('moqMin')} placeholder="e.g. 500" min={0} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="moqMax">MOQ Max</Label>
              <Input id="moqMax" type="number" value={form.moqMax} onChange={field('moqMax')} placeholder="e.g. 10000" min={0} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="leadTimeDays">Lead Time (days)</Label>
            <Input id="leadTimeDays" type="number" value={form.leadTimeDays} onChange={field('leadTimeDays')} placeholder="e.g. 21" min={0} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={form.location} onChange={field('location')} placeholder="London, UK" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="country">Country</Label>
              <Input id="country" value={form.country} onChange={field('country')} placeholder="United Kingdom" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="serviceRegions">Service Regions</Label>
            <Input
              id="serviceRegions"
              value={form.serviceRegions}
              onChange={field('serviceRegions')}
              placeholder="UK, Europe, Global (comma-separated)"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader><CardTitle>Contact Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="contactName">Contact Name</Label>
            <Input id="contactName" value={form.contactName} onChange={field('contactName')} placeholder="Jane Smith" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input id="contactEmail" type="email" value={form.contactEmail} onChange={field('contactEmail')} placeholder="hello@yourcompany.com" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="contactPhone">Contact Phone</Label>
            <Input id="contactPhone" type="tel" value={form.contactPhone} onChange={field('contactPhone')} placeholder="+44 20 7946 0958" />
          </div>
        </CardContent>
      </Card>

      {/* Online Presence */}
      <Card>
        <CardHeader><CardTitle>Online Presence</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="websiteUrl" className="flex items-center gap-1"><Globe className="w-3 h-3" />Website</Label>
            <Input id="websiteUrl" type="url" value={form.websiteUrl} onChange={field('websiteUrl')} placeholder="https://yourcompany.com" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="instagramUrl" className="flex items-center gap-1"><Instagram className="w-3 h-3" />Instagram</Label>
            <Input id="instagramUrl" type="url" value={form.instagramUrl} onChange={field('instagramUrl')} placeholder="https://instagram.com/yourcompany" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="linkedinUrl" className="flex items-center gap-1"><Linkedin className="w-3 h-3" />LinkedIn</Label>
            <Input id="linkedinUrl" type="url" value={form.linkedinUrl} onChange={field('linkedinUrl')} placeholder="https://linkedin.com/company/yourcompany" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="portfolioUrl" className="flex items-center gap-1"><Briefcase className="w-3 h-3" />Portfolio</Label>
            <Input id="portfolioUrl" type="url" value={form.portfolioUrl} onChange={field('portfolioUrl')} placeholder="https://portfolio.yourcompany.com" />
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader><CardTitle>Images</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <ImageUploader
            label="Logo"
            currentUrl={logoUrl}
            uploading={logoUploading}
            onUpload={file => uploadSingleImage(file, setLogoUploading, 'logoUrl')}
            onUploaded={url => setLogoUrl(url)}
          />
          <ImageUploader
            label="Hero / Cover Image"
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
        <Button onClick={handleSave} disabled={saving || !form.companyName}>
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}

export default function SupplierEditPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    }>
      <SupplierEditContent />
    </Suspense>
  )
}
