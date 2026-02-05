'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Store, Search, Plus, Users, Loader2, Check, ArrowRight } from 'lucide-react'
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { cn } from '@/lib/utils'

type Step = 'choose' | 'member-profile' | 'brand-create' | 'supplier-search' | 'supplier-create' | 'join-org' | 'complete'

interface Supplier {
  id: string
  companyName: string
  slug: string
  category: string
  description?: string
  logoUrl?: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('choose')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<'BRAND' | 'SUPPLIER' | 'MEMBER' | null>(null)

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

  // Member profile form data
  const [memberData, setMemberData] = useState({
    company: '',
    jobTitle: '',
    bio: '',
  })

  // Supplier search
  const [searchQuery, setSearchQuery] = useState('')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [searching, setSearching] = useState(false)

  // Organisation invite
  const [orgInviteToken, setOrgInviteToken] = useState('')

  // Get user role on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          setUserRole(data.user.role)
        }
      })
      .catch(err => {
        console.error('Error fetching user:', err)
        router.push('/login')
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

      // Success - redirect to dashboard
      router.push('/dashboard?welcome=true')
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
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

      // Success - redirect to dashboard
      router.push('/dashboard?welcome=true')
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
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

      // Success - redirect to dashboard
      router.push('/dashboard?welcome=true')
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
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

      // Success - redirect to dashboard
      router.push('/dashboard?welcome=true')
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  // Update member profile (for MEMBER role)
  const handleUpdateMemberProfile = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/me/member', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: memberData.company || null,
          jobTitle: memberData.jobTitle || null,
          bio: memberData.bio || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update profile')
        setLoading(false)
        return
      }

      // Success - redirect to dashboard
      router.push('/dashboard?welcome=true')
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan" />
      </div>
    )
  }

  // Choose action step
  if (step === 'choose') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl font-bold mb-2 uppercase tracking-tight">
              Welcome to Kindred Collective!
            </h1>
            <p className="text-gray-600 text-lg">
              Let&apos;s set up your profile
            </p>
          </div>

          {userRole === 'MEMBER' && (
            <div className="max-w-2xl mx-auto">
              <Card
                className="cursor-pointer hover:shadow-brutal-lg transition-all hover:-translate-y-1"
                onClick={() => setStep('member-profile')}
              >
                <CardHeader>
                  <div className="w-12 h-12 bg-yellow border-2 border-black flex items-center justify-center mb-4">
                    <Users className="w-6 h-6" />
                  </div>
                  <CardTitle>Complete Your Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Add your company and job title to help others connect with you.
                  </p>
                  <div className="flex items-center text-sm font-bold text-yellow-600">
                    Get Started <ArrowRight className="ml-2 w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {userRole === 'BRAND' && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card
                className="cursor-pointer hover:shadow-brutal-lg transition-all hover:-translate-y-1"
                onClick={() => setStep('brand-create')}
              >
                <CardHeader>
                  <div className="w-12 h-12 bg-cyan border-2 border-black flex items-center justify-center mb-4">
                    <Plus className="w-6 h-6" />
                  </div>
                  <CardTitle>Create New Brand</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    I&apos;m the first person from my brand to join. Let&apos;s create your brand profile.
                  </p>
                  <div className="flex items-center text-sm font-bold text-cyan">
                    Get Started <ArrowRight className="ml-2 w-4 h-4" />
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-brutal-lg transition-all hover:-translate-y-1"
                onClick={() => setStep('join-org')}
              >
                <CardHeader>
                  <div className="w-12 h-12 bg-yellow border-2 border-black flex items-center justify-center mb-4">
                    <Users className="w-6 h-6" />
                  </div>
                  <CardTitle>Join My Team</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Someone from my brand already signed up. Join their organisation.
                  </p>
                  <div className="flex items-center text-sm font-bold text-yellow">
                    Enter Invite Code <ArrowRight className="ml-2 w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {userRole === 'SUPPLIER' && (
            <div className="grid md:grid-cols-3 gap-6">
              <Card
                className="cursor-pointer hover:shadow-brutal-lg transition-all hover:-translate-y-1"
                onClick={() => setStep('supplier-search')}
              >
                <CardHeader>
                  <div className="w-12 h-12 bg-magenta text-white border-2 border-black flex items-center justify-center mb-4">
                    <Search className="w-6 h-6" />
                  </div>
                  <CardTitle>Claim My Supplier</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    We&apos;re already listed. Let me claim our profile.
                  </p>
                  <div className="flex items-center text-sm font-bold text-magenta">
                    Search & Claim <ArrowRight className="ml-2 w-4 h-4" />
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-brutal-lg transition-all hover:-translate-y-1"
                onClick={() => setStep('supplier-create')}
              >
                <CardHeader>
                  <div className="w-12 h-12 bg-cyan border-2 border-black flex items-center justify-center mb-4">
                    <Plus className="w-6 h-6" />
                  </div>
                  <CardTitle>Create New Supplier</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    We&apos;re not listed yet. Let&apos;s create our profile.
                  </p>
                  <div className="flex items-center text-sm font-bold text-cyan">
                    Get Started <ArrowRight className="ml-2 w-4 h-4" />
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-brutal-lg transition-all hover:-translate-y-1"
                onClick={() => setStep('join-org')}
              >
                <CardHeader>
                  <div className="w-12 h-12 bg-yellow border-2 border-black flex items-center justify-center mb-4">
                    <Users className="w-6 h-6" />
                  </div>
                  <CardTitle>Join My Team</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    My colleague already claimed our profile. Join them.
                  </p>
                  <div className="flex items-center text-sm font-bold text-yellow">
                    Enter Invite Code <ArrowRight className="ml-2 w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Member profile step
  if (step === 'member-profile') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-brutal-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
              <button
                onClick={() => setStep('choose')}
                className="text-sm text-gray-500 hover:text-cyan"
              >
                ← Back
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-coral/10 border-2 border-coral text-coral px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="memberCompany">Company</Label>
                <Input
                  id="memberCompany"
                  placeholder="Your company name"
                  value={memberData.company}
                  onChange={(e) => setMemberData({ ...memberData, company: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="memberJobTitle">Job Title</Label>
                <Input
                  id="memberJobTitle"
                  placeholder="e.g. Marketing Manager"
                  value={memberData.jobTitle}
                  onChange={(e) => setMemberData({ ...memberData, jobTitle: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="memberBio">Bio</Label>
                <textarea
                  id="memberBio"
                  placeholder="Tell others about yourself..."
                  value={memberData.bio}
                  onChange={(e) => setMemberData({ ...memberData, bio: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan resize-none"
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    router.push('/dashboard?welcome=true')
                    router.refresh()
                  }}
                  className="flex-1"
                >
                  Skip for Now
                </Button>
                <Button
                  onClick={handleUpdateMemberProfile}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Brand creation step
  if (step === 'brand-create') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-brutal-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Create Your Brand</CardTitle>
              <button
                onClick={() => setStep('choose')}
                className="text-sm text-gray-500 hover:text-cyan"
              >
                ← Back
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-coral/10 border-2 border-coral text-coral px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="brandName">Brand Name *</Label>
                <Input
                  id="brandName"
                  placeholder="Your Brand Ltd"
                  value={brandData.name}
                  onChange={(e) => setBrandData({ ...brandData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={brandData.category}
                  onChange={(e) => setBrandData({ ...brandData, category: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
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
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  placeholder="Tell us about your brand..."
                  value={brandData.description}
                  onChange={(e) => setBrandData({ ...brandData, description: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan resize-none"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
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

  // Supplier search step
  if (step === 'supplier-search') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-brutal-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Find Your Supplier</CardTitle>
              <button
                onClick={() => setStep('choose')}
                className="text-sm text-gray-500 hover:text-cyan"
              >
                ← Back
              </button>
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
                          'p-4 border-2 border-black cursor-pointer transition-all',
                          selectedSupplier?.id === supplier.id
                            ? 'bg-cyan'
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
                    onClick={() => setStep('supplier-create')}
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

  // Supplier creation step
  if (step === 'supplier-create') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-brutal-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Create Your Supplier Profile</CardTitle>
              <button
                onClick={() => setStep('choose')}
                className="text-sm text-gray-500 hover:text-cyan"
              >
                ← Back
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-coral/10 border-2 border-coral text-coral px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  placeholder="Your Company Ltd"
                  value={supplierData.companyName}
                  onChange={(e) => setSupplierData({ ...supplierData, companyName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierCategory">Category *</Label>
                <select
                  id="supplierCategory"
                  value={supplierData.category}
                  onChange={(e) => setSupplierData({ ...supplierData, category: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
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
                <Label htmlFor="supplierDescription">Description</Label>
                <textarea
                  id="supplierDescription"
                  placeholder="Tell us about your services..."
                  value={supplierData.description}
                  onChange={(e) => setSupplierData({ ...supplierData, description: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan resize-none"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="services">Services (comma-separated)</Label>
                <Input
                  id="services"
                  placeholder="Bottle design, Label printing, Packaging"
                  value={supplierData.services}
                  onChange={(e) => setSupplierData({ ...supplierData, services: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierLogoUrl">Logo URL</Label>
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

  // Join organisation step
  if (step === 'join-org') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-brutal-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Join Your Team</CardTitle>
              <button
                onClick={() => setStep('choose')}
                className="text-sm text-gray-500 hover:text-cyan"
              >
                ← Back
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-coral/10 border-2 border-coral text-coral px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <p className="text-gray-600">
                Enter the invite code your colleague shared with you from your organisation settings.
              </p>

              <div className="space-y-2">
                <Label htmlFor="inviteToken">Organisation Invite Code *</Label>
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

  return null
}
