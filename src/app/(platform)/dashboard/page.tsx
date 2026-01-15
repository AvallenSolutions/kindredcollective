'use client'

import { useState } from 'react'
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
  Users,
  ArrowRight,
  Settings,
  Plus,
} from 'lucide-react'
import { Badge, Button, Card, CardContent } from '@/components/ui'
import { SupplierCard } from '@/components/suppliers'
import { EventCard } from '@/components/events'
import { OfferCard } from '@/components/offers'
import { suppliers } from '../../../../prisma/seed-data'
import { events } from '../../../../prisma/seed-events'
import { offers } from '../../../../prisma/seed-offers'
import { cn } from '@/lib/utils'

// Sample data - in real app this would come from database
const savedSuppliers = suppliers.slice(0, 3).map((s, i) => ({
  id: `supplier-${i}`,
  ...s,
  logoUrl: null,
}))

const upcomingEvents = events.slice(0, 2).map((e, i) => ({
  id: `event-${i}`,
  ...e,
  attendeeCount: Math.floor(Math.random() * 30) + 10,
}))

const claimedOffers = offers.slice(0, 2).map((o, i) => {
  const supplier = suppliers.find((s) => s.slug === o.supplierSlug)
  return {
    id: `offer-${i}`,
    ...o,
    supplierName: supplier?.companyName || 'Unknown',
  }
})

// Demo user type toggle
type UserType = 'brand' | 'supplier'

export default function DashboardPage() {
  const [userType, setUserType] = useState<UserType>('brand')

  // Demo stats
  const brandStats = {
    savedSuppliers: 12,
    eventsAttending: 3,
    offersClaimed: 8,
    profileViews: 156,
  }

  const supplierStats = {
    profileViews: 1247,
    activeOffers: 4,
    offerClaims: 89,
    enquiries: 23,
  }

  const stats = userType === 'brand' ? brandStats : supplierStats

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b-3 border-black">
        <div className="section-container py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 bg-cyan border-3 border-black flex items-center justify-center">
                <span className="font-display text-2xl font-bold">JD</span>
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold">
                  Welcome back, John
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={userType === 'brand' ? 'cyan' : 'coral'}>
                    {userType === 'brand' ? (
                      <>
                        <Wine className="w-3 h-3 mr-1" />
                        Brand Account
                      </>
                    ) : (
                      <>
                        <Building2 className="w-3 h-3 mr-1" />
                        Supplier Account
                      </>
                    )}
                  </Badge>
                  <span className="text-sm text-gray-500">Demo Drinks Co.</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              {/* Demo toggle - in real app this wouldn't exist */}
              <div className="flex border-2 border-gray-200">
                <button
                  onClick={() => setUserType('brand')}
                  className={cn(
                    'px-3 py-1 text-xs font-bold',
                    userType === 'brand' ? 'bg-cyan' : 'bg-white'
                  )}
                >
                  Brand View
                </button>
                <button
                  onClick={() => setUserType('supplier')}
                  className={cn(
                    'px-3 py-1 text-xs font-bold',
                    userType === 'supplier' ? 'bg-coral text-white' : 'bg-white'
                  )}
                >
                  Supplier View
                </button>
              </div>
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
          {userType === 'brand' ? (
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
          ) : (
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
                      <Users className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-display font-bold">
                        {stats.enquiries}
                      </p>
                      <p className="text-xs text-gray-500">Enquiries</p>
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
        {userType === 'brand' ? (
          /* Brand Dashboard Content */
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Saved Suppliers */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-bold">Saved Suppliers</h2>
                <Link
                  href="/dashboard/saved"
                  className="text-sm font-bold text-cyan hover:underline"
                >
                  View All →
                </Link>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {savedSuppliers.slice(0, 2).map((supplier) => (
                  <SupplierCard key={supplier.id} supplier={supplier} />
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-bold">Your Events</h2>
                <Link
                  href="/community/events"
                  className="text-sm font-bold text-cyan hover:underline"
                >
                  Browse →
                </Link>
              </div>
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
                        {event.city}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Supplier Dashboard Content */
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Offers Management */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-bold">Your Offers</h2>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  New Offer
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {claimedOffers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="font-display text-lg font-bold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link href="/dashboard/profile">
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
                <Link href="/dashboard/offers">
                  <Card className="hover:shadow-brutal-lg hover:-translate-y-1 cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Tag className="w-5 h-5 text-lime-600" />
                        <span className="font-bold text-sm">Manage Offers</span>
                      </div>
                      <ArrowRight className="w-4 h-4" />
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/dashboard/analytics">
                  <Card className="hover:shadow-brutal-lg hover:-translate-y-1 cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-coral" />
                        <span className="font-bold text-sm">View Analytics</span>
                      </div>
                      <ArrowRight className="w-4 h-4" />
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
