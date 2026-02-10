'use client'

import Link from 'next/link'
import {
  User,
  Building2,
  Wine,
  Heart,
  Calendar,
  Tag,
  ArrowRight,
  Settings,
  Plus,
  Shield,
  Store,
} from 'lucide-react'
import { Badge, Button, Card, CardContent } from '@/components/ui'
import { SupplierCard } from '@/components/suppliers'
import type { SupplierCategory } from '@prisma/client'

interface DashboardContentProps {
  user: {
    id: string
    email: string
    role: string
    firstName: string | null
    lastName: string | null
    isAdmin: boolean
  }
  organisations: Array<{
    organisationId: string
    organisationName: string
    organisationType: 'BRAND' | 'SUPPLIER'
    memberRole: string
    brandId?: string
    brandName?: string
    supplierId?: string
    supplierName?: string
    supplierSlug?: string
  }>
  stats: {
    savedSuppliers: number
    eventsAttending: number
    offersClaimed: number
  }
  savedSuppliers: Array<{
    id: string
    companyName: string
    slug: string
    tagline: string | null
    description: string | null
    category: SupplierCategory
    services: string[]
    location: string | null
    country: string | null
    logoUrl: string | null
    isVerified: boolean
  }>
  upcomingEvents: Array<{
    id: string
    title: string
    slug: string
    startDate: string
    city?: string | null
    isVirtual: boolean
  }>
  recentOfferClaims: Array<{
    id: string
    offer: {
      title: string
      discountType: string
      discountValue: number
      supplier: {
        companyName: string
        slug: string
      }
    }
  }>
  brands: Array<any>
  suppliers: Array<any>
}

export function DashboardContent({
  user,
  organisations,
  stats,
  savedSuppliers,
  upcomingEvents,
  recentOfferClaims,
  brands,
  suppliers,
}: DashboardContentProps) {
  const displayName = user.firstName || user.email.split('@')[0]
  const initials = user.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] || ''}`
    : user.email[0].toUpperCase()

  const brandOrgs = organisations.filter(o => o.organisationType === 'BRAND')
  const supplierOrgs = organisations.filter(o => o.organisationType === 'SUPPLIER')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b-3 border-black">
        <div className="section-container py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 bg-cyan border-3 border-black flex items-center justify-center">
                <span className="font-display text-2xl font-bold uppercase">{initials}</span>
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold">
                  Welcome back, {displayName}
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {user.isAdmin && (
                    <Badge variant="coral">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  {brandOrgs.map((org) => (
                    <Badge key={org.organisationId} variant="cyan">
                      <Wine className="w-3 h-3 mr-1" />
                      {org.brandName || org.organisationName}
                    </Badge>
                  ))}
                  {supplierOrgs.map((org) => (
                    <Badge key={org.organisationId} variant="coral">
                      <Building2 className="w-3 h-3 mr-1" />
                      {org.supplierName || org.organisationName}
                    </Badge>
                  ))}
                  {organisations.length === 0 && (
                    <span className="text-sm text-gray-500">Member</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              {user.isAdmin && (
                <Link href="/admin">
                  <Button variant="outline" size="sm">
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Panel
                  </Button>
                </Link>
              )}
              <Link href="/dashboard/settings">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section-container py-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan/20 border-2 border-cyan flex items-center justify-center">
                  <Heart className="w-5 h-5 text-cyan" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">
                    {stats.savedSuppliers}
                  </p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Saved Suppliers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-lime/20 border-2 border-lime flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-lime-700" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">
                    {stats.eventsAttending}
                  </p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Events Attending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-coral/20 border-2 border-coral flex items-center justify-center">
                  <Tag className="w-5 h-5 text-coral" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">
                    {stats.offersClaimed}
                  </p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Offers Claimed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* My Organisations */}
      {organisations.length > 0 && (
        <section className="section-container pb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide">My Organisations</h2>
            <Link href="/onboarding">
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Organisation
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brandOrgs.map((org) => (
              <Card key={org.organisationId} className="hover:shadow-brutal-lg hover:-translate-y-1 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-cyan border-2 border-black flex items-center justify-center shrink-0">
                      <Wine className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-bold text-sm truncate">
                        {org.brandName || org.organisationName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="cyan" className="text-xs">Brand</Badge>
                        <span className="text-xs text-gray-500 capitalize">{org.memberRole.toLowerCase()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {supplierOrgs.map((org) => (
              <Link
                key={org.organisationId}
                href={org.supplierSlug ? `/explore/${org.supplierSlug}` : '#'}
              >
                <Card className="hover:shadow-brutal-lg hover:-translate-y-1 transition-all cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-coral border-2 border-black flex items-center justify-center shrink-0">
                        <Store className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-sm truncate">
                          {org.supplierName || org.organisationName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="coral" className="text-xs">Supplier</Badge>
                          <span className="text-xs text-gray-500 capitalize">{org.memberRole.toLowerCase()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* No organisations CTA */}
      {organisations.length === 0 && (
        <section className="section-container pb-8">
          <Card className="bg-gradient-to-r from-cyan/10 to-lime/10 border-3 border-black">
            <CardContent className="p-6 text-center">
              <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-400" />
              <h3 className="font-display font-bold text-lg mb-2">Join or Create an Organisation</h3>
              <p className="text-sm text-gray-600 mb-4">
                Link your profile to a brand or supplier to unlock more features.
              </p>
              <div className="flex justify-center gap-3">
                <Link href="/onboarding">
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Brand
                  </Button>
                </Link>
                <Link href="/onboarding">
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Supplier
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Main Content */}
      <section className="section-container pb-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Saved Suppliers */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold uppercase tracking-wide">Saved Suppliers</h2>
              <Link
                href="/explore"
                className="text-sm font-bold text-cyan hover:underline"
              >
                Explore More →
              </Link>
            </div>
            {savedSuppliers.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {savedSuppliers.slice(0, 4).map((supplier) => (
                  <SupplierCard key={supplier.id} supplier={supplier} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No saved suppliers yet</p>
                  <Link href="/explore" className="text-sm text-cyan font-bold hover:underline">
                    Explore suppliers
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Recent Offer Claims */}
            {recentOfferClaims.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-bold uppercase tracking-wide">Recent Offers Claimed</h2>
                  <Link
                    href="/offers"
                    className="text-sm font-bold text-cyan hover:underline"
                  >
                    View All →
                  </Link>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {recentOfferClaims.map((claim) => (
                    <Card key={claim.id}>
                      <CardContent className="p-4">
                        <h3 className="font-bold text-sm mb-1">{claim.offer.title}</h3>
                        <p className="text-xs text-gray-500">
                          {claim.offer.supplier.companyName}
                          {' - '}
                          {claim.offer.discountType === 'PERCENTAGE'
                            ? `${claim.offer.discountValue}% off`
                            : `$${claim.offer.discountValue} off`}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Events + Quick Actions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold uppercase tracking-wide">Your Events</h2>
              <Link
                href="/events"
                className="text-sm font-bold text-cyan hover:underline"
              >
                Browse →
              </Link>
            </div>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="p-4">
                      <Badge variant="lime" className="mb-2 text-xs">
                        Going
                      </Badge>
                      <h3 className="font-display font-bold text-sm mb-1">
                        {event.title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {new Date(event.startDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        })}
                        {' \u2022 '}
                        {event.isVirtual ? 'Virtual' : event.city || 'TBC'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No upcoming events</p>
                  <Link href="/events" className="text-sm text-cyan font-bold hover:underline">
                    Browse events
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <h2 className="font-display text-lg font-bold mt-8 mb-4 uppercase tracking-wide">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/dashboard/settings">
                <Card className="hover:shadow-brutal-lg hover:-translate-y-1 cursor-pointer transition-all">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-cyan" />
                      <span className="font-bold text-sm">Edit Profile</span>
                    </div>
                    <ArrowRight className="w-4 h-4" />
                  </CardContent>
                </Card>
              </Link>
              <Link href="/explore">
                <Card className="hover:shadow-brutal-lg hover:-translate-y-1 cursor-pointer transition-all">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-coral" />
                      <span className="font-bold text-sm">Find Suppliers</span>
                    </div>
                    <ArrowRight className="w-4 h-4" />
                  </CardContent>
                </Card>
              </Link>
              <Link href="/events">
                <Card className="hover:shadow-brutal-lg hover:-translate-y-1 cursor-pointer transition-all">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-lime-600" />
                      <span className="font-bold text-sm">Browse Events</span>
                    </div>
                    <ArrowRight className="w-4 h-4" />
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
