'use client'

import Link from 'next/link'
import {
  User,
  Building2,
  Wine,
  Heart,
  Calendar,
  Tag,
  TrendingUp,
  Eye,
  ArrowRight,
  Settings,
  Plus,
  Shield,
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
    isSupplier: boolean
    isBrand: boolean
  }
  stats: {
    savedSuppliers: number
    eventsAttending: number
    offersClaimed: number
    profileViews: number
    activeOffers: number
    offerClaims: number
    enquiries: number
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
  supplier: {
    id: string
    companyName: string
    slug: string
    viewCount: number
  } | null
  brand: {
    id: string
    companyName: string
  } | null
}

export function DashboardContent({
  user,
  stats,
  savedSuppliers,
  upcomingEvents,
  recentOfferClaims,
  supplier,
  brand,
}: DashboardContentProps) {
  const displayName = user.firstName || user.email.split('@')[0]
  const initials = user.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] || ''}`
    : user.email[0].toUpperCase()

  const isSupplierView = user.isSupplier && supplier

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
                <div className="flex items-center gap-2 mt-1">
                  {user.isAdmin && (
                    <Badge variant="coral">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  {user.isSupplier && supplier && (
                    <Badge variant="coral">
                      <Building2 className="w-3 h-3 mr-1" />
                      Supplier
                    </Badge>
                  )}
                  {user.isBrand && (
                    <Badge variant="cyan">
                      <Wine className="w-3 h-3 mr-1" />
                      Brand
                    </Badge>
                  )}
                  {(brand?.companyName || supplier?.companyName) && (
                    <span className="text-sm text-gray-500">
                      {brand?.companyName || supplier?.companyName}
                    </span>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isSupplierView ? (
            <>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan/20 border-2 border-cyan flex items-center justify-center">
                      <Eye className="w-5 h-5 text-cyan" />
                    </div>
                    <div>
                      <p className="text-2xl font-display font-bold">
                        {stats.profileViews.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">Profile Views</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-lime/20 border-2 border-lime flex items-center justify-center">
                      <Tag className="w-5 h-5 text-lime-700" />
                    </div>
                    <div>
                      <p className="text-2xl font-display font-bold">
                        {stats.activeOffers}
                      </p>
                      <p className="text-xs text-gray-500">Active Offers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-coral/20 border-2 border-coral flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-coral" />
                    </div>
                    <div>
                      <p className="text-2xl font-display font-bold">
                        {stats.offerClaims}
                      </p>
                      <p className="text-xs text-gray-500">Offer Claims</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-display font-bold">
                        {stats.eventsAttending}
                      </p>
                      <p className="text-xs text-gray-500">Events</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
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
                      <p className="text-xs text-gray-500">Saved Suppliers</p>
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
                      <p className="text-xs text-gray-500">Events Attending</p>
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
                      <p className="text-xs text-gray-500">Offers Claimed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center">
                      <Eye className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-display font-bold">
                        {stats.profileViews}
                      </p>
                      <p className="text-xs text-gray-500">Profile Views</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="section-container pb-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Saved Suppliers / Your Offers */}
          <div className="lg:col-span-2">
            {isSupplierView ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-bold">Your Offers</h2>
                  <Link href="/dashboard/offers">
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      New Offer
                    </Button>
                  </Link>
                </div>
                {recentOfferClaims.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {recentOfferClaims.map((claim) => (
                      <Card key={claim.id}>
                        <CardContent className="p-4">
                          <h3 className="font-bold text-sm mb-1">{claim.offer.title}</h3>
                          <p className="text-xs text-gray-500">
                            {claim.offer.discountType === 'PERCENTAGE'
                              ? `${claim.offer.discountValue}% off`
                              : `£${claim.offer.discountValue} off`}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No offers yet</p>
                      <Link href="/dashboard/offers" className="text-sm text-cyan font-bold hover:underline">
                        Create your first offer
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-bold">Saved Suppliers</h2>
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
              </>
            )}
          </div>

          {/* Upcoming Events / Quick Actions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold">Your Events</h2>
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
                        {' • '}
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
            <h2 className="font-display text-lg font-bold mt-8 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/dashboard/settings">
                <Card className="hover:shadow-brutal-lg hover:-translate-y-1 cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-cyan" />
                      <span className="font-bold text-sm">Edit Profile</span>
                    </div>
                    <ArrowRight className="w-4 h-4" />
                  </CardContent>
                </Card>
              </Link>
              {isSupplierView && (
                <Link href={`/explore/${supplier.slug}`}>
                  <Card className="hover:shadow-brutal-lg hover:-translate-y-1 cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Eye className="w-5 h-5 text-lime-600" />
                        <span className="font-bold text-sm">View Public Profile</span>
                      </div>
                      <ArrowRight className="w-4 h-4" />
                    </CardContent>
                  </Card>
                </Link>
              )}
              <Link href="/explore">
                <Card className="hover:shadow-brutal-lg hover:-translate-y-1 cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-coral" />
                      <span className="font-bold text-sm">Find Suppliers</span>
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
