'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Store,
  Search,
  Plus,
  Users,
  Loader2,
  Check,
  ArrowRight,
  ArrowLeft,
  Wine,
  Sparkles,
  Link2,
} from 'lucide-react'
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'

type Step = 'profile' | 'brands' | 'suppliers' | 'complete'
type SubStep = null | 'brand-create' | 'supplier-search' | 'supplier-create' | 'join-org'

interface Supplier {
  id: string
  companyName: string
  slug: string
  category: string
  description?: string
  logoUrl?: string
}

interface CreatedBrand {
  id: string
  name: string
  category: string
}

interface CreatedSupplier {
  id: string
  companyName: string
  category: string
}

const STEPS: { key: Step; label: string; number: number }[] = [
  { key: 'profile', label: 'Your Profile', number: 1 },
  { key: 'brands', label: 'Brand Affiliations', number: 2 },
  { key: 'suppliers', label: 'Supplier Affiliations', number: 3 },
  { key: 'complete', label: 'Done', number: 4 },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('profile')
  const [subStep, setSubStep] = useState<SubStep>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)

  // Profile form data
  const [profileData, setProfileData] = useState({
    company: '',
    jobTitle: '',
    bio: '',
    linkedinUrl: '',
  })

  // Brand form data
  const [brandData, setBrandData] = useState({
    name: '',
    category: 'SPIRITS',
    description: '',
    logoUrl: '',
  })

  // Supplier form data
  const [supplierData, setSupplierData] = useState({
    companyName: '',
    category: 'PACKAGING',
    description: '',
    logoUrl: '',
    services: '',
  })

  // Supplier search
  const [searchQuery, setSearchQuery] = useState('')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [searching, setSearching] = useState(false)

  // Organisation invite
  const [orgInviteToken, setOrgInviteToken] = useState('')

  // Track created affiliations
  const [createdBrands, setCreatedBrands] = useState<CreatedBrand[]>([])
  const [createdSuppliers, setCreatedSuppliers] = useState<CreatedSupplier[]>([])

  // Verify user is authenticated on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.success || !data.user) {
          router.push('/login')
        }
      })
      .catch(() => {
        router.push('/login')
      })
      .finally(() => {
        setInitialLoading(false)
      })
  }, [router])

  // Search suppliers
  const handleSearchSuppliers = async () => {
    setSearching(true)
    try {
      const response = await fetch(`/api/onboarding/search-suppliers?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      if (data.success) {
        setSuppliers(data.suppliers)
      }
    } catch (err) {
      console.error('Error searching suppliers:', err)
    } finally {
      setSearching(false)
    }
  }

  // Update member profile
  const handleUpdateProfile = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/me/member', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: profileData.company || null,
          jobTitle: profileData.jobTitle || null,
          bio: profileData.bio || null,
          linkedinUrl: profileData.linkedinUrl || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update profile')
        setLoading(false)
        return
      }

      // Move to brands step
      setStep('brands')
      setError(null)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Create brand
  const handleCreateBrand = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/onboarding/brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create brand')
        setLoading(false)
        return
      }

      // Add to created brands list
      setCreatedBrands(prev => [...prev, {
        id: data.brand?.id || data.id || 'new',
        name: brandData.name,
        category: brandData.category,
      }])

      // Reset form and go back to brands overview
      setBrandData({ name: '', category: 'SPIRITS', description: '', logoUrl: '' })
      setSubStep(null)
      setError(null)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Create supplier
  const handleCreateSupplier = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/onboarding/supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...supplierData,
          services: supplierData.services.split(',').map(s => s.trim()).filter(Boolean),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create supplier')
        setLoading(false)
        return
      }

      // Add to created suppliers list
      setCreatedSuppliers(prev => [...prev, {
        id: data.supplier?.id || data.id || 'new',
        companyName: supplierData.companyName,
        category: supplierData.category,
      }])

      // Reset form and go back to suppliers overview
      setSupplierData({ companyName: '', category: 'PACKAGING', description: '', logoUrl: '', services: '' })
      setSubStep(null)
      setError(null)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Claim supplier
  const handleClaimSupplier = async () => {
    if (!selectedSupplier) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/onboarding/claim-supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId: selectedSupplier.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to claim supplier')
        setLoading(false)
        return
      }

      // Add to created suppliers list
      setCreatedSuppliers(prev => [...prev, {
        id: selectedSupplier.id,
        companyName: selectedSupplier.companyName,
        category: selectedSupplier.category,
      }])

      // Reset and go back
      setSelectedSupplier(null)
      setSearchQuery('')
      setSuppliers([])
      setSubStep(null)
      setError(null)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Join organisation
  const handleJoinOrganisation = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/onboarding/join-organisation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteToken: orgInviteToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to join organisation')
        setLoading(false)
        return
      }

      // Add to appropriate list based on org type
      if (data.organisation?.type === 'BRAND' || data.organisationType === 'BRAND') {
        setCreatedBrands(prev => [...prev, {
          id: data.organisation?.id || 'joined',
          name: data.organisation?.name || 'Joined Organisation',
          category: '',
        }])
      } else {
        setCreatedSuppliers(prev => [...prev, {
          id: data.organisation?.id || 'joined',
          companyName: data.organisation?.name || 'Joined Organisation',
          category: '',
        }])
      }

      setOrgInviteToken('')
      setSubStep(null)
      setError(null)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan" />
      </div>
    )
  }

  const currentStepIndex = STEPS.findIndex(s => s.key === step)

  // Step indicator
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex items-center">
          <div
            className={cn(
              'w-8 h-8 border-3 border-black flex items-center justify-center font-display font-bold text-sm transition-colors',
              i < currentStepIndex ? 'bg-lime' :
              i === currentStepIndex ? 'bg-cyan' :
              'bg-white'
            )}
          >
            {i < currentStepIndex ? (
              <Check className="w-4 h-4" />
            ) : (
              s.number
            )}
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                'w-8 h-[3px] mx-1',
                i < currentStepIndex ? 'bg-lime' : 'bg-gray-200'
              )}
            />
          )}
        </div>
      ))}
    </div>
  )

  // ──────────────────────────────────────
  // STEP 1: Complete Your Profile
  // ──────────────────────────────────────
  if (step === 'profile') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl font-bold mb-2 uppercase tracking-tight">
              Welcome to Kindred!
            </h1>
            <p className="text-gray-600 text-lg">
              Let&apos;s get your profile set up
            </p>
          </div>

          <StepIndicator />

          <Card className="shadow-brutal-lg border-3 border-black">
            <CardHeader>
              <div className="w-12 h-12 bg-cyan border-3 border-black flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <CardTitle className="font-display text-2xl uppercase tracking-tight">
                Complete Your Profile
              </CardTitle>
              <p className="text-gray-600 text-sm">
                Tell the community a bit about yourself.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-coral/10 border-2 border-coral text-coral px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="company" className="uppercase tracking-wide text-xs font-bold">
                  Company
                </Label>
                <Input
                  id="company"
                  placeholder="Your company name"
                  value={profileData.company}
                  onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle" className="uppercase tracking-wide text-xs font-bold">
                  Job Title
                </Label>
                <Input
                  id="jobTitle"
                  placeholder="e.g. Marketing Manager"
                  value={profileData.jobTitle}
                  onChange={(e) => setProfileData({ ...profileData, jobTitle: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="uppercase tracking-wide text-xs font-bold">
                  Bio
                </Label>
                <textarea
                  id="bio"
                  placeholder="Tell others about yourself..."
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  className="w-full px-3 py-2 border-3 border-black focus:outline-none focus:ring-2 focus:ring-cyan resize-none"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedinUrl" className="uppercase tracking-wide text-xs font-bold">
                  LinkedIn URL (optional)
                </Label>
                <Input
                  id="linkedinUrl"
                  type="url"
                  placeholder="https://linkedin.com/in/yourname"
                  value={profileData.linkedinUrl}
                  onChange={(e) => setProfileData({ ...profileData, linkedinUrl: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep('brands')}
                  className="flex-1"
                >
                  Skip for Now
                </Button>
                <Button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Saving...' : 'Save & Continue'}
                  {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ──────────────────────────────────────
  // STEP 2: Brand Affiliations
  // ──────────────────────────────────────
  if (step === 'brands') {
    // Sub-step: Create Brand
    if (subStep === 'brand-create') {
      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <StepIndicator />
            <Card className="shadow-brutal-lg border-3 border-black">
              <CardHeader>
                <button
                  onClick={() => { setSubStep(null); setError(null) }}
                  className="text-sm text-gray-500 hover:text-cyan flex items-center gap-1 mb-2"
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <div className="w-12 h-12 bg-cyan border-3 border-black flex items-center justify-center mb-4">
                  <Wine className="w-6 h-6" />
                </div>
                <CardTitle className="font-display text-2xl uppercase tracking-tight">
                  Create Your Brand
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-coral/10 border-2 border-coral text-coral px-4 py-3 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="brandName" className="uppercase tracking-wide text-xs font-bold">
                    Brand Name *
                  </Label>
                  <Input
                    id="brandName"
                    placeholder="Your Brand Ltd"
                    value={brandData.name}
                    onChange={(e) => setBrandData({ ...brandData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="uppercase tracking-wide text-xs font-bold">
                    Category *
                  </Label>
                  <select
                    id="category"
                    value={brandData.category}
                    onChange={(e) => setBrandData({ ...brandData, category: e.target.value })}
                    className="w-full px-3 py-2 border-3 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
                  >
                    <option value="SPIRITS">Spirits</option>
                    <option value="BEER">Beer</option>
                    <option value="WINE">Wine</option>
                    <option value="RTD">RTD</option>
                    <option value="NO_LO">No/Low Alcohol</option>
                    <option value="CIDER">Cider</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="uppercase tracking-wide text-xs font-bold">
                    Description
                  </Label>
                  <textarea
                    id="description"
                    placeholder="Tell us about your brand..."
                    value={brandData.description}
                    onChange={(e) => setBrandData({ ...brandData, description: e.target.value })}
                    className="w-full px-3 py-2 border-3 border-black focus:outline-none focus:ring-2 focus:ring-cyan resize-none"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logoUrl" className="uppercase tracking-wide text-xs font-bold">
                    Logo URL
                  </Label>
                  <Input
                    id="logoUrl"
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={brandData.logoUrl}
                    onChange={(e) => setBrandData({ ...brandData, logoUrl: e.target.value })}
                  />
                </div>

                <Button
                  onClick={handleCreateBrand}
                  disabled={loading || !brandData.name || !brandData.category}
                  className="w-full"
                >
                  {loading ? 'Creating...' : 'Create Brand'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    // Main brands step
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold mb-2 uppercase tracking-tight">
              Brand Affiliations
            </h1>
            <p className="text-gray-600">
              Are you associated with any drinks brands?
            </p>
          </div>

          <StepIndicator />

          {/* Created brands list */}
          {createdBrands.length > 0 && (
            <div className="mb-6 space-y-3">
              <p className="text-sm font-bold uppercase tracking-wide text-gray-500">Your Brands</p>
              {createdBrands.map((brand) => (
                <Card key={brand.id} className="border-3 border-black bg-cyan/10">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan border-2 border-black flex items-center justify-center shrink-0">
                      <Wine className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm">{brand.name}</h3>
                      {brand.category && (
                        <p className="text-xs text-gray-500">{brand.category}</p>
                      )}
                    </div>
                    <Check className="w-5 h-5 text-lime-600 ml-auto" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <Card
              className="cursor-pointer hover:shadow-brutal-lg transition-all hover:-translate-y-1 border-3 border-black"
              onClick={() => { setSubStep('brand-create'); setError(null) }}
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-cyan border-3 border-black flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold mb-2">Create New Brand</h3>
                <p className="text-sm text-gray-600">
                  Register your drinks brand on Kindred
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-brutal-lg transition-all hover:-translate-y-1 border-3 border-black"
              onClick={() => setStep('suppliers')}
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gray-100 border-3 border-black flex items-center justify-center mx-auto mb-4">
                  <ArrowRight className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold mb-2">Skip</h3>
                <p className="text-sm text-gray-600">
                  I&apos;m not associated with a brand
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={() => setStep('profile')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button onClick={() => setStep('suppliers')}>
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ──────────────────────────────────────
  // STEP 3: Supplier Affiliations
  // ──────────────────────────────────────
  if (step === 'suppliers') {
    // Sub-step: Search & Claim
    if (subStep === 'supplier-search') {
      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <StepIndicator />
            <Card className="shadow-brutal-lg border-3 border-black">
              <CardHeader>
                <button
                  onClick={() => { setSubStep(null); setError(null) }}
                  className="text-sm text-gray-500 hover:text-cyan flex items-center gap-1 mb-2"
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <div className="w-12 h-12 bg-coral border-3 border-black flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="font-display text-2xl uppercase tracking-tight">
                  Find Your Supplier
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-coral/10 border-2 border-coral text-coral px-4 py-3 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    placeholder="Search for your company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchSuppliers()}
                  />
                  <Button onClick={handleSearchSuppliers} disabled={searching}>
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>

                {suppliers.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Found {suppliers.length} suppliers</p>
                    <div className="grid gap-3">
                      {suppliers.map((supplier) => (
                        <div
                          key={supplier.id}
                          onClick={() => setSelectedSupplier(supplier)}
                          className={cn(
                            'p-4 border-3 border-black cursor-pointer transition-all',
                            selectedSupplier?.id === supplier.id
                              ? 'bg-cyan shadow-brutal'
                              : 'bg-white hover:bg-gray-50'
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold">{supplier.companyName}</h3>
                              <p className="text-sm text-gray-600">{supplier.category}</p>
                              {supplier.description && (
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                  {supplier.description}
                                </p>
                              )}
                            </div>
                            {selectedSupplier?.id === supplier.id && (
                              <Check className="w-5 h-5" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {suppliers.length === 0 && searchQuery && !searching && (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">No suppliers found. Is your company not listed?</p>
                    <Button
                      variant="outline"
                      onClick={() => { setSubStep('supplier-create'); setError(null) }}
                    >
                      Create New Supplier Profile
                    </Button>
                  </div>
                )}

                {selectedSupplier && (
                  <Button
                    onClick={handleClaimSupplier}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? 'Claiming...' : 'Claim This Supplier'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    // Sub-step: Create Supplier
    if (subStep === 'supplier-create') {
      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <StepIndicator />
            <Card className="shadow-brutal-lg border-3 border-black">
              <CardHeader>
                <button
                  onClick={() => { setSubStep(null); setError(null) }}
                  className="text-sm text-gray-500 hover:text-cyan flex items-center gap-1 mb-2"
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <div className="w-12 h-12 bg-coral border-3 border-black flex items-center justify-center mb-4">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="font-display text-2xl uppercase tracking-tight">
                  Create Your Supplier Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-coral/10 border-2 border-coral text-coral px-4 py-3 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="companyName" className="uppercase tracking-wide text-xs font-bold">
                    Company Name *
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="Your Company Ltd"
                    value={supplierData.companyName}
                    onChange={(e) => setSupplierData({ ...supplierData, companyName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplierCategory" className="uppercase tracking-wide text-xs font-bold">
                    Category *
                  </Label>
                  <select
                    id="supplierCategory"
                    value={supplierData.category}
                    onChange={(e) => setSupplierData({ ...supplierData, category: e.target.value })}
                    className="w-full px-3 py-2 border-3 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
                  >
                    <option value="PACKAGING">Packaging</option>
                    <option value="INGREDIENTS">Ingredients</option>
                    <option value="LOGISTICS">Logistics</option>
                    <option value="CO_PACKING">Co-Packing</option>
                    <option value="DESIGN">Design</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="EQUIPMENT">Equipment</option>
                    <option value="CONSULTING">Consulting</option>
                    <option value="LEGAL">Legal</option>
                    <option value="FINANCE">Finance</option>
                    <option value="DISTRIBUTION">Distribution</option>
                    <option value="RECRUITMENT">Recruitment</option>
                    <option value="SOFTWARE">Software</option>
                    <option value="SUSTAINABILITY">Sustainability</option>
                    <option value="PR">PR</option>
                    <option value="PHOTOGRAPHY">Photography</option>
                    <option value="WEB_DEVELOPMENT">Web Development</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplierDescription" className="uppercase tracking-wide text-xs font-bold">
                    Description
                  </Label>
                  <textarea
                    id="supplierDescription"
                    placeholder="Tell us about your services..."
                    value={supplierData.description}
                    onChange={(e) => setSupplierData({ ...supplierData, description: e.target.value })}
                    className="w-full px-3 py-2 border-3 border-black focus:outline-none focus:ring-2 focus:ring-cyan resize-none"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="services" className="uppercase tracking-wide text-xs font-bold">
                    Services (comma-separated)
                  </Label>
                  <Input
                    id="services"
                    placeholder="Bottle design, Label printing, Packaging"
                    value={supplierData.services}
                    onChange={(e) => setSupplierData({ ...supplierData, services: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplierLogoUrl" className="uppercase tracking-wide text-xs font-bold">
                    Logo URL
                  </Label>
                  <Input
                    id="supplierLogoUrl"
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={supplierData.logoUrl}
                    onChange={(e) => setSupplierData({ ...supplierData, logoUrl: e.target.value })}
                  />
                </div>

                <Button
                  onClick={handleCreateSupplier}
                  disabled={loading || !supplierData.companyName || !supplierData.category}
                  className="w-full"
                >
                  {loading ? 'Creating...' : 'Create Supplier'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    // Sub-step: Join via invite
    if (subStep === 'join-org') {
      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <StepIndicator />
            <Card className="shadow-brutal-lg border-3 border-black">
              <CardHeader>
                <button
                  onClick={() => { setSubStep(null); setError(null) }}
                  className="text-sm text-gray-500 hover:text-cyan flex items-center gap-1 mb-2"
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <div className="w-12 h-12 bg-lime border-3 border-black flex items-center justify-center mb-4">
                  <Link2 className="w-6 h-6" />
                </div>
                <CardTitle className="font-display text-2xl uppercase tracking-tight">
                  Join Your Team
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-coral/10 border-2 border-coral text-coral px-4 py-3 text-sm">
                    {error}
                  </div>
                )}

                <p className="text-gray-600">
                  Enter the invite code your colleague shared with you from their organisation settings.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="inviteToken" className="uppercase tracking-wide text-xs font-bold">
                    Organisation Invite Code *
                  </Label>
                  <Input
                    id="inviteToken"
                    placeholder="Enter invite code..."
                    value={orgInviteToken}
                    onChange={(e) => setOrgInviteToken(e.target.value)}
                    required
                  />
                </div>

                <Button
                  onClick={handleJoinOrganisation}
                  disabled={loading || !orgInviteToken}
                  className="w-full"
                >
                  {loading ? 'Joining...' : 'Join Organisation'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    // Main suppliers step
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold mb-2 uppercase tracking-tight">
              Supplier Affiliations
            </h1>
            <p className="text-gray-600">
              Are you associated with any suppliers?
            </p>
          </div>

          <StepIndicator />

          {/* Created suppliers list */}
          {createdSuppliers.length > 0 && (
            <div className="mb-6 space-y-3">
              <p className="text-sm font-bold uppercase tracking-wide text-gray-500">Your Suppliers</p>
              {createdSuppliers.map((supplier) => (
                <Card key={supplier.id} className="border-3 border-black bg-coral/10">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-coral border-2 border-black flex items-center justify-center shrink-0">
                      <Store className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm">{supplier.companyName}</h3>
                      {supplier.category && (
                        <p className="text-xs text-gray-500">{supplier.category}</p>
                      )}
                    </div>
                    <Check className="w-5 h-5 text-lime-600 ml-auto" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <Card
              className="cursor-pointer hover:shadow-brutal-lg transition-all hover:-translate-y-1 border-3 border-black"
              onClick={() => { setSubStep('supplier-search'); setError(null) }}
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-coral border-3 border-black flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display font-bold mb-2">Search & Claim</h3>
                <p className="text-sm text-gray-600">
                  We&apos;re already listed, let me claim our profile
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-brutal-lg transition-all hover:-translate-y-1 border-3 border-black"
              onClick={() => { setSubStep('supplier-create'); setError(null) }}
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-cyan border-3 border-black flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold mb-2">Create New Supplier</h3>
                <p className="text-sm text-gray-600">
                  We&apos;re not listed yet, let&apos;s create a profile
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-brutal-lg transition-all hover:-translate-y-1 border-3 border-black"
              onClick={() => { setSubStep('join-org'); setError(null) }}
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-lime border-3 border-black flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold mb-2">Join Team via Invite</h3>
                <p className="text-sm text-gray-600">
                  My colleague has an invite code for me
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-brutal-lg transition-all hover:-translate-y-1 border-3 border-black"
              onClick={() => setStep('complete')}
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gray-100 border-3 border-black flex items-center justify-center mx-auto mb-4">
                  <ArrowRight className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold mb-2">Skip</h3>
                <p className="text-sm text-gray-600">
                  I&apos;m not associated with a supplier
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={() => setStep('brands')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button onClick={() => setStep('complete')}>
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ──────────────────────────────────────
  // STEP 4: Complete
  // ──────────────────────────────────────
  if (step === 'complete') {
    const totalAffiliations = createdBrands.length + createdSuppliers.length

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <StepIndicator />

          <Card className="shadow-brutal-lg border-3 border-black text-center">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-lime border-3 border-black flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8" />
              </div>
              <h1 className="font-display text-3xl font-bold mb-4 uppercase tracking-tight">
                You&apos;re All Set!
              </h1>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Welcome to Kindred Collective. Your profile is ready
                {totalAffiliations > 0 && (
                  <> and you&apos;ve linked {totalAffiliations} organisation{totalAffiliations !== 1 ? 's' : ''}</>
                )}.
              </p>

              {/* Summary */}
              {totalAffiliations > 0 && (
                <div className="mb-8 space-y-3 text-left max-w-sm mx-auto">
                  <p className="text-sm font-bold uppercase tracking-wide text-gray-500 text-center">
                    Your Organisations
                  </p>
                  {createdBrands.map((brand) => (
                    <div key={brand.id} className="flex items-center gap-3 p-3 bg-cyan/10 border-2 border-black">
                      <Badge variant="cyan" className="text-xs">Brand</Badge>
                      <span className="font-bold text-sm">{brand.name}</span>
                    </div>
                  ))}
                  {createdSuppliers.map((supplier) => (
                    <div key={supplier.id} className="flex items-center gap-3 p-3 bg-coral/10 border-2 border-black">
                      <Badge variant="coral" className="text-xs">Supplier</Badge>
                      <span className="font-bold text-sm">{supplier.companyName}</span>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={() => {
                  router.push('/dashboard?welcome=true')
                  router.refresh()
                }}
                className="min-w-[200px]"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}
