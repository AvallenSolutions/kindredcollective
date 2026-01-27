'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Wine, Shield, CreditCard, Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button, Input, Label, Card, CardContent, Badge } from '@/components/ui'
import { DRINK_CATEGORY_LABELS } from '@/types/database'
import type { DrinkCategory } from '@prisma/client'
import { cn } from '@/lib/utils'

type SettingsTab = 'profile' | 'brand' | 'privacy' | 'billing'

interface SettingsContentProps {
  user: {
    id: string
    email: string
    role: string
    isBrand: boolean
  }
  member: {
    id: string
    firstName: string
    lastName: string
    jobTitle: string | null
    bio: string | null
    avatarUrl: string | null
    linkedinUrl: string | null
    phone: string | null
    isPublic: boolean
  } | null
  brand: {
    id: string
    name: string
    slug: string
    tagline: string | null
    description: string | null
    story: string | null
    category: string
    subcategories: string[]
    yearFounded: number | null
    location: string | null
    country: string | null
    websiteUrl: string | null
    instagramUrl: string | null
    linkedinUrl: string | null
    twitterUrl: string | null
    logoUrl: string | null
    isPublic: boolean
  } | null
}

const drinkCategories = Object.entries(DRINK_CATEGORY_LABELS) as [DrinkCategory, string][]

export function SettingsContent({ user, member, brand }: SettingsContentProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: member?.firstName || '',
    lastName: member?.lastName || '',
    jobTitle: member?.jobTitle || '',
    bio: member?.bio || '',
    linkedinUrl: member?.linkedinUrl || '',
    phone: member?.phone || '',
    isPublic: member?.isPublic ?? true,
  })

  // Brand form state
  const [brandData, setBrandData] = useState({
    name: brand?.name || '',
    tagline: brand?.tagline || '',
    description: brand?.description || '',
    story: brand?.story || '',
    category: brand?.category || 'SPIRITS',
    subcategories: brand?.subcategories?.join(', ') || '',
    yearFounded: brand?.yearFounded?.toString() || '',
    location: brand?.location || '',
    country: brand?.country || '',
    websiteUrl: brand?.websiteUrl || '',
    instagramUrl: brand?.instagramUrl || '',
    linkedinUrl: brand?.linkedinUrl || '',
    twitterUrl: brand?.twitterUrl || '',
    isPublic: brand?.isPublic ?? true,
  })

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const endpoint = member ? '/api/me/member' : '/api/me/member'
      const method = member ? 'PATCH' : 'POST'

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          jobTitle: profileData.jobTitle || null,
          bio: profileData.bio || null,
          linkedinUrl: profileData.linkedinUrl || null,
          phone: profileData.phone || null,
          isPublic: profileData.isPublic,
        }),
      })

      if (res.ok) {
        showMessage('success', 'Profile saved successfully')
        router.refresh()
      } else {
        const data = await res.json()
        showMessage('error', data.error || 'Failed to save profile')
      }
    } catch {
      showMessage('error', 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const slug = brandData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const payload = {
        name: brandData.name,
        slug: brand?.slug || slug,
        tagline: brandData.tagline || null,
        description: brandData.description || null,
        story: brandData.story || null,
        category: brandData.category,
        subcategories: brandData.subcategories
          ? brandData.subcategories.split(',').map((s: string) => s.trim()).filter(Boolean)
          : [],
        yearFounded: brandData.yearFounded ? parseInt(brandData.yearFounded) : null,
        location: brandData.location || null,
        country: brandData.country || null,
        websiteUrl: brandData.websiteUrl || null,
        instagramUrl: brandData.instagramUrl || null,
        linkedinUrl: brandData.linkedinUrl || null,
        twitterUrl: brandData.twitterUrl || null,
        isPublic: brandData.isPublic,
      }

      const res = await fetch('/api/me/brand', {
        method: brand ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        showMessage('success', brand ? 'Brand updated successfully' : 'Brand profile created successfully')
        router.refresh()
      } else {
        const data = await res.json()
        showMessage('error', data.error || 'Failed to save brand')
      }
    } catch {
      showMessage('error', 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'profile' as const, label: 'Personal Profile', icon: User },
    ...(user.isBrand ? [{ id: 'brand' as const, label: 'Brand Profile', icon: Wine }] : []),
    { id: 'privacy' as const, label: 'Privacy', icon: Shield },
    { id: 'billing' as const, label: 'Billing', icon: CreditCard },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b-3 border-black">
        <div className="section-container py-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm font-bold mb-4 hover:text-cyan"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="font-display text-2xl font-bold">Account Settings</h1>
        </div>
      </section>

      {/* Content */}
      <section className="section-container py-8">
        {/* Status message */}
        {message && (
          <div
            className={cn(
              'mb-6 p-4 border-2 flex items-center gap-2',
              message.type === 'success'
                ? 'bg-lime/20 border-lime text-green-800'
                : 'bg-red-50 border-red-300 text-red-800'
            )}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            {message.text}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left font-bold text-sm border-2 transition-colors',
                    activeTab === tab.id
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-gray-200 hover:border-black'
                  )}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-display text-xl font-bold mb-6">
                    Personal Profile
                  </h2>
                  <p className="text-sm text-gray-600 mb-6">
                    This information will appear on your member profile in the community directory.
                  </p>
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-20 h-20 bg-cyan border-3 border-black flex items-center justify-center">
                        {member?.avatarUrl ? (
                          <img src={member.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-display text-3xl font-bold">
                            {profileData.firstName.charAt(0)}{profileData.lastName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mt-1">
                          Profile photo coming soon
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          required
                          value={profileData.firstName}
                          onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          required
                          value={profileData.lastName}
                          onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user.email}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500">Email cannot be changed here</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="jobTitle">Job Title</Label>
                        <Input
                          id="jobTitle"
                          value={profileData.jobTitle}
                          onChange={(e) => setProfileData({ ...profileData, jobTitle: e.target.value })}
                          placeholder="e.g. Founder, Head of Marketing"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          placeholder="e.g. +44 7700 900000"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        placeholder="Tell us about yourself..."
                        rows={4}
                        className="w-full px-3 py-2 border-2 border-gray-200 focus:border-black focus:outline-none text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                      <Input
                        id="linkedinUrl"
                        value={profileData.linkedinUrl}
                        onChange={(e) => setProfileData({ ...profileData, linkedinUrl: e.target.value })}
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 border-2 border-gray-200">
                      <div>
                        <p className="font-bold">Public profile</p>
                        <p className="text-sm text-gray-600">
                          Show your profile in the member directory
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={profileData.isPublic}
                          onChange={(e) => setProfileData({ ...profileData, isPublic: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-checked:bg-cyan border-2 border-black peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-2 after:border-black after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>

                    <div className="pt-4">
                      <Button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : member ? 'Save Changes' : 'Create Profile'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Brand Tab */}
            {activeTab === 'brand' && user.isBrand && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-display text-xl font-bold mb-6">
                    {brand ? 'Edit Brand Profile' : 'Create Brand Profile'}
                  </h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Your brand will be listed in the Brand Directory for the community to discover.
                  </p>
                  <form onSubmit={handleSaveBrand} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="brandName">Brand Name *</Label>
                        <Input
                          id="brandName"
                          required
                          value={brandData.name}
                          onChange={(e) => setBrandData({ ...brandData, name: e.target.value })}
                          placeholder="e.g. Kindred Spirits"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <select
                          id="category"
                          value={brandData.category}
                          onChange={(e) => setBrandData({ ...brandData, category: e.target.value })}
                          className="w-full px-3 py-2 border-2 border-gray-200 focus:border-black focus:outline-none text-sm bg-white"
                        >
                          {drinkCategories.map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tagline">Tagline</Label>
                      <Input
                        id="tagline"
                        value={brandData.tagline}
                        onChange={(e) => setBrandData({ ...brandData, tagline: e.target.value })}
                        placeholder="A short description of your brand"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <textarea
                        id="description"
                        value={brandData.description}
                        onChange={(e) => setBrandData({ ...brandData, description: e.target.value })}
                        placeholder="Tell people about your brand..."
                        rows={4}
                        className="w-full px-3 py-2 border-2 border-gray-200 focus:border-black focus:outline-none text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="story">Our Story</Label>
                      <textarea
                        id="story"
                        value={brandData.story}
                        onChange={(e) => setBrandData({ ...brandData, story: e.target.value })}
                        placeholder="Share the story behind your brand..."
                        rows={4}
                        className="w-full px-3 py-2 border-2 border-gray-200 focus:border-black focus:outline-none text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subcategories">Products (comma-separated)</Label>
                      <Input
                        id="subcategories"
                        value={brandData.subcategories}
                        onChange={(e) => setBrandData({ ...brandData, subcategories: e.target.value })}
                        placeholder="e.g. Gin, Vodka, Rum"
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="yearFounded">Year Founded</Label>
                        <Input
                          id="yearFounded"
                          type="number"
                          value={brandData.yearFounded}
                          onChange={(e) => setBrandData({ ...brandData, yearFounded: e.target.value })}
                          placeholder="e.g. 2020"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="brandLocation">Location</Label>
                        <Input
                          id="brandLocation"
                          value={brandData.location}
                          onChange={(e) => setBrandData({ ...brandData, location: e.target.value })}
                          placeholder="e.g. London"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={brandData.country}
                          onChange={(e) => setBrandData({ ...brandData, country: e.target.value })}
                          placeholder="e.g. United Kingdom"
                        />
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="font-display font-bold mb-4">Social & Contact</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="websiteUrl">Website</Label>
                          <Input
                            id="websiteUrl"
                            value={brandData.websiteUrl}
                            onChange={(e) => setBrandData({ ...brandData, websiteUrl: e.target.value })}
                            placeholder="https://..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="brandInstagram">Instagram</Label>
                          <Input
                            id="brandInstagram"
                            value={brandData.instagramUrl}
                            onChange={(e) => setBrandData({ ...brandData, instagramUrl: e.target.value })}
                            placeholder="https://instagram.com/..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="brandLinkedin">LinkedIn</Label>
                          <Input
                            id="brandLinkedin"
                            value={brandData.linkedinUrl}
                            onChange={(e) => setBrandData({ ...brandData, linkedinUrl: e.target.value })}
                            placeholder="https://linkedin.com/company/..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="brandTwitter">Twitter</Label>
                          <Input
                            id="brandTwitter"
                            value={brandData.twitterUrl}
                            onChange={(e) => setBrandData({ ...brandData, twitterUrl: e.target.value })}
                            placeholder="https://twitter.com/..."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 border-2 border-gray-200">
                      <div>
                        <p className="font-bold">Public listing</p>
                        <p className="text-sm text-gray-600">
                          Show your brand in the Brand Directory
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={brandData.isPublic}
                          onChange={(e) => setBrandData({ ...brandData, isPublic: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-checked:bg-cyan border-2 border-black peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-2 after:border-black after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>

                    <div className="pt-4">
                      <Button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : brand ? 'Save Brand' : 'Create Brand Profile'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-display text-xl font-bold mb-6">
                    Privacy Settings
                  </h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 border-2 border-gray-200">
                      <div>
                        <p className="font-bold">Public profile</p>
                        <p className="text-sm text-gray-600">
                          Allow others to see your profile in the member directory
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked={member?.isPublic ?? true} />
                        <div className="w-11 h-6 bg-gray-300 peer-checked:bg-cyan border-2 border-black peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-2 after:border-black after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 border-2 border-gray-200">
                      <div>
                        <p className="font-bold">Show on event attendee lists</p>
                        <p className="text-sm text-gray-600">
                          Display your name when RSVPing to events
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-300 peer-checked:bg-cyan border-2 border-black peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-2 after:border-black after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>

                    <div className="pt-6 border-t border-gray-200">
                      <h3 className="font-display font-bold text-coral mb-4">
                        Danger Zone
                      </h3>
                      <Button variant="outline" className="border-coral text-coral hover:bg-coral hover:text-white">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-display text-xl font-bold mb-6">
                    Billing & Subscription
                  </h2>
                  <div className="p-6 bg-lime/20 border-3 border-lime mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-display font-bold">Current Plan</span>
                      <Badge variant="lime">Free</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      You&apos;re on the free plan. Upgrade to access premium features.
                    </p>
                  </div>
                  <Button size="lg" className="w-full">
                    Upgrade to Pro
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
