'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

type Step = 'profile' | 'company' | 'complete'
type SubStep = null | 'brand-create' | 'supplier-create' | 'join-org'

interface Company {
  id: string
  name: string
  slug: string
  category: string
  description?: string
  logoUrl?: string
  type: 'BRAND' | 'SUPPLIER'
  hasOwner: boolean
}

interface ConnectedCompany {
  id: string
  name: string
  type: 'BRAND' | 'SUPPLIER'
  category: string
  role: 'OWNER' | 'MEMBER'
}

const STEPS: { key: Step; label: string; number: number }[] = [
  { key: 'profile', label: 'Your Profile', number: 1 },
  { key: 'company', label: 'Your Company', number: 2 },
  { key: 'complete', label: 'Done', number: 3 },
]

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const startAtCompany = searchParams.get('step') === 'company'
  const [step, setStep] = useState<Step>(startAtCompany ? 'company' : 'profile')
  const [subStep, setSubStep] = useState<SubStep>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)

  // Profile form data
  const [profileData, setProfileData] = useState({
    jobTitle: '',
    bio: '',
    linkedinUrl: '',
  })

  // Brand form data
  const [brandData, setBrandData] = useState({
    name: '',
    category: 'SPIRITS',
    categories: ['SPIRITS'] as string[],
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

  // Company search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Company[]>([])
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Organisation invite
  const [orgInviteToken, setOrgInviteToken] = useState('')

  // Track connected companies
  const [connectedCompanies, setConnectedCompanies] = useState<ConnectedCompany[]>([])

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

  // Live search with debounce
  const handleSearchCompanies = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      setHasSearched(false)
      return
    }

    setSearching(true)
    setHasSearched(true)
    try {
      const response = await fetch(`/api/onboarding/search-companies?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      if (data.success) {
        setSearchResults(data.companies)
      }
    } catch (err) {
      console.error('Error searching companies:', err)
    } finally {
      setSearching(false)
    }
  }, [])

  // Debounced search on input change
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearchCompanies(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, handleSearchCompanies])

  // Connect to existing company
  const handleConnectCompany = async (company: Company) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/onboarding/connect-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company.id, companyType: company.type }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to connect to company')
        setLoading(false)
        return
      }

      setConnectedCompanies(prev => [...prev, {
        id: company.id,
        name: company.name,
        type: company.type,
        category: company.category,
        role: data.role || 'MEMBER',
      }])

      setSearchQuery('')
      setSearchResults([])
      setHasSearched(false)
      setError(null)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
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

      setStep('company')
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

      setConnectedCompanies(prev => [...prev, {
        id: data.brand?.id || data.id || 'new',
        name: brandData.name,
        type: 'BRAND',
        category: brandData.category,
        role: 'OWNER',
      }])

      setBrandData({ name: '', category: 'SPIRITS', categories: ['SPIRITS'], description: '', logoUrl: '' })
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

      setConnectedCompanies(prev => [...prev, {
        id: data.supplier?.id || data.id || 'new',
        name: supplierData.companyName,
        type: 'SUPPLIER',
        category: supplierData.category,
        role: 'OWNER',
      }])

      setSupplierData({ companyName: '', category: 'PACKAGING', description: '', logoUrl: '', services: '' })
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

      const orgType = data.organisation?.type || data.organisationType || 'SUPPLIER'
      setConnectedCompanies(prev => [...prev, {
        id: data.organisation?.id || 'joined',
        name: data.organisation?.name || 'Joined Organisation',
        type: orgType,
        category: '',
        role: 'MEMBER',
      }])

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
                  onClick={() => setStep('company')}
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
  // STEP 2: Find Your Company
  // ──────────────────────────────────────
  if (step === 'company') {
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
                  <Label className="uppercase tracking-wide text-xs font-bold">
                    Categories *
                  </Label>
                  <p className="text-xs text-gray-500">Select all that apply</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'SPIRITS', label: 'Spirits' },
                      { value: 'BEER', label: 'Beer' },
                      { value: 'WINE', label: 'Wine' },
                      { value: 'RTD', label: 'RTD' },
                      { value: 'NO_LO', label: 'No/Low Alcohol' },
                      { value: 'CIDER', label: 'Cider' },
                      { value: 'OTHER', label: 'Other' },
                    ].map(c => {
                      const checked = brandData.categories.includes(c.value)
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
                              setBrandData(prev => {
                                const cats = checked
                                  ? prev.categories.filter(v => v !== c.value)
                                  : [...prev.categories, c.value]
                                if (cats.length === 0) return prev
                                return { ...prev, categories: cats, category: cats[0] }
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
                  disabled={loading || !brandData.name || brandData.categories.length === 0}
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

    // ── Main company step: search-first approach ──
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold mb-2 uppercase tracking-tight">
              Find Your Company
            </h1>
            <p className="text-gray-600">
              Search to see if your company is already on Kindred, or create a new listing.
            </p>
          </div>

          <StepIndicator />

          {/* Explainer card — shown until the user connects to a company */}
          {connectedCompanies.length === 0 && (
            <Card className="mb-6 border-3 border-black bg-gradient-to-br from-cyan/5 to-lime/5">
              <CardContent className="p-6">
                <h3 className="font-display font-bold text-lg mb-3 uppercase tracking-tight">
                  How does this work?
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-cyan border-2 border-black flex items-center justify-center shrink-0">
                      <Search className="w-4 h-4" />
                    </div>
                    <p>
                      <strong>Search first</strong> &mdash; type your company name below. Many brands and suppliers are already listed on Kindred.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-lime border-2 border-black flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <p>
                      <strong>Claim ownership</strong> &mdash; if your company is listed but nobody has claimed it yet, you can claim it as the owner and manage the profile.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-coral border-2 border-black flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <p>
                      <strong>Join your team</strong> &mdash; if a colleague has already claimed your company, you can join as a team member.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center shrink-0">
                      <Plus className="w-4 h-4" />
                    </div>
                    <p>
                      <strong>Not listed?</strong> &mdash; no problem, you can create a new brand or supplier profile from scratch.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Connected companies list */}
          {connectedCompanies.length > 0 && (
            <div className="mb-6 space-y-3">
              <p className="text-sm font-bold uppercase tracking-wide text-gray-500">Your Companies</p>
              {connectedCompanies.map((company) => (
                <Card key={company.id} className={cn(
                  'border-3 border-black',
                  company.type === 'BRAND' ? 'bg-cyan/10' : 'bg-coral/10'
                )}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 border-2 border-black flex items-center justify-center shrink-0',
                      company.type === 'BRAND' ? 'bg-cyan' : 'bg-coral'
                    )}>
                      {company.type === 'BRAND' ? (
                        <Wine className="w-5 h-5" />
                      ) : (
                        <Store className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm">{company.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant={company.type === 'BRAND' ? 'cyan' : 'coral'} className="text-xs">
                          {company.type === 'BRAND' ? 'Brand' : 'Supplier'}
                        </Badge>
                        <Badge variant={company.role === 'OWNER' ? 'lime' : 'default'} className="text-xs">
                          {company.role === 'OWNER' ? 'Owner' : 'Member'}
                        </Badge>
                        {company.category && (
                          <span className="text-xs text-gray-500">{company.category}</span>
                        )}
                      </div>
                    </div>
                    <Check className="w-5 h-5 text-lime-600 ml-auto" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Search box */}
          <Card className="shadow-brutal-lg border-3 border-black mb-6">
            <CardHeader>
              <div className="w-12 h-12 bg-cyan border-3 border-black flex items-center justify-center mb-4">
                <Search className="w-6 h-6" />
              </div>
              <CardTitle className="font-display text-2xl uppercase tracking-tight">
                Search Companies
              </CardTitle>
              <p className="text-gray-600 text-sm">
                Type your company name to see if it&apos;s already listed.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-coral/10 border-2 border-coral text-coral px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <div className="relative">
                <Input
                  placeholder="Search for your company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Found {searchResults.length} {searchResults.length === 1 ? 'company' : 'companies'}
                  </p>
                  <div className="grid gap-3 max-h-[400px] overflow-y-auto">
                    {searchResults.map((company) => {
                      const alreadyConnected = connectedCompanies.some(c => c.id === company.id)
                      return (
                        <div
                          key={`${company.type}-${company.id}`}
                          className={cn(
                            'p-4 border-3 border-black transition-all',
                            alreadyConnected
                              ? 'bg-lime/10 opacity-75'
                              : 'bg-white hover:bg-gray-50'
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold truncate">{company.name}</h3>
                                <Badge
                                  variant={company.type === 'BRAND' ? 'cyan' : 'coral'}
                                  className="text-xs shrink-0"
                                >
                                  {company.type === 'BRAND' ? 'Brand' : 'Supplier'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{company.category}</p>
                              {company.description && (
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                  {company.description}
                                </p>
                              )}
                            </div>
                            {alreadyConnected ? (
                              <div className="flex items-center gap-1 text-sm text-lime-600 font-bold shrink-0">
                                <Check className="w-4 h-4" />
                                Connected
                              </div>
                            ) : (
                              <Button
                                onClick={() => handleConnectCompany(company)}
                                disabled={loading}
                                className="shrink-0"
                                size="sm"
                              >
                                {loading ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : company.hasOwner ? (
                                  'Join Team'
                                ) : (
                                  'Claim Ownership'
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* No results */}
              {searchResults.length === 0 && hasSearched && !searching && searchQuery.length >= 2 && (
                <div className="text-center py-6 border-t-2 border-gray-100">
                  <p className="text-gray-600 mb-2">
                    No companies found matching &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p className="text-sm text-gray-500">
                    You can create a new listing below.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create / Join options */}
          <div className="mb-6">
            <p className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">
              Or add your company manually
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <Card
                className="cursor-pointer hover:shadow-brutal-lg transition-all hover:-translate-y-1 border-3 border-black"
                onClick={() => { setSubStep('brand-create'); setError(null) }}
              >
                <CardContent className="p-5 text-center">
                  <div className="w-10 h-10 bg-cyan border-3 border-black flex items-center justify-center mx-auto mb-3">
                    <Wine className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-bold text-sm mb-1">Create Brand</h3>
                  <p className="text-xs text-gray-600">Register a drinks brand</p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-brutal-lg transition-all hover:-translate-y-1 border-3 border-black"
                onClick={() => { setSubStep('supplier-create'); setError(null) }}
              >
                <CardContent className="p-5 text-center">
                  <div className="w-10 h-10 bg-coral border-3 border-black flex items-center justify-center mx-auto mb-3">
                    <Store className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-display font-bold text-sm mb-1">Create Supplier</h3>
                  <p className="text-xs text-gray-600">List your services</p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-brutal-lg transition-all hover:-translate-y-1 border-3 border-black"
                onClick={() => { setSubStep('join-org'); setError(null) }}
              >
                <CardContent className="p-5 text-center">
                  <div className="w-10 h-10 bg-lime border-3 border-black flex items-center justify-center mx-auto mb-3">
                    <Link2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-bold text-sm mb-1">Join via Invite</h3>
                  <p className="text-xs text-gray-600">Use a colleague&apos;s code</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (startAtCompany) {
                  router.push('/dashboard')
                } else {
                  setStep('profile')
                }
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {startAtCompany ? 'Back to Dashboard' : 'Back'}
            </Button>
            <Button onClick={() => setStep('complete')}>
              {connectedCompanies.length > 0 ? 'Continue' : 'Skip for Now'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ──────────────────────────────────────
  // STEP 3: Complete
  // ──────────────────────────────────────
  if (step === 'complete') {
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
                {connectedCompanies.length > 0 && (
                  <> and you&apos;ve linked {connectedCompanies.length} organisation{connectedCompanies.length !== 1 ? 's' : ''}</>
                )}.
              </p>

              {/* Summary */}
              {connectedCompanies.length > 0 && (
                <div className="mb-8 space-y-3 text-left max-w-sm mx-auto">
                  <p className="text-sm font-bold uppercase tracking-wide text-gray-500 text-center">
                    Your Organisations
                  </p>
                  {connectedCompanies.map((company) => (
                    <div
                      key={company.id}
                      className={cn(
                        'flex items-center gap-3 p-3 border-2 border-black',
                        company.type === 'BRAND' ? 'bg-cyan/10' : 'bg-coral/10'
                      )}
                    >
                      <Badge variant={company.type === 'BRAND' ? 'cyan' : 'coral'} className="text-xs">
                        {company.type === 'BRAND' ? 'Brand' : 'Supplier'}
                      </Badge>
                      <span className="font-bold text-sm">{company.name}</span>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={() => {
                  router.push(startAtCompany ? '/dashboard' : '/dashboard?welcome=true')
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
