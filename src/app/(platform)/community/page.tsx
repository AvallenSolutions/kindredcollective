import Link from 'next/link'
import { Users, Wine, Calendar, ArrowRight } from 'lucide-react'
import { Badge, Button, Card, CardContent } from '@/components/ui'
import { BrandCard } from '@/components/brands'
import { brands } from '../../../../prisma/seed-brands'

// Transform seed data
const brandData = brands.map((b, index) => ({
  id: `brand-${index}`,
  ...b,
  logoUrl: null,
  heroImageUrl: null,
}))

// Sample upcoming events
const upcomingEvents = [
  {
    id: '1',
    title: 'Kindred Summer Party 2026',
    date: 'July 15, 2026',
    location: 'London',
    type: 'Networking',
    isFeatured: true,
  },
  {
    id: '2',
    title: 'Imbibe Live',
    date: 'July 1-2, 2026',
    location: 'Olympia, London',
    type: 'Trade Show',
    isFeatured: false,
  },
  {
    id: '3',
    title: 'Craft Drinks Summit',
    date: 'August 10, 2026',
    location: 'Manchester',
    type: 'Conference',
    isFeatured: false,
  },
]

export default function CommunityPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-coral text-white py-12 lg:py-16 border-b-4 border-black">
        <div className="section-container">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-white text-coral border-white">
              <Users className="w-3 h-3 mr-1" />
              Community
            </Badge>
            <h1 className="font-display text-display-sm lg:text-display-md mb-4">
              Your People. Your Industry.
            </h1>
            <p className="text-lg text-white/80 mb-6">
              Connect with fellow independent drinks makers, discover inspiring brands,
              and join events that matter.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="bg-white border-b-3 border-black">
        <div className="section-container py-6">
          <div className="flex flex-wrap gap-4">
            <Link href="/community/brands">
              <Button variant="outline">
                <Wine className="w-4 h-4 mr-2" />
                Brand Directory
              </Button>
            </Link>
            <Link href="/community/events">
              <Button variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Events
              </Button>
            </Link>
            <Link href="/community/members">
              <Button variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Members
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Brands */}
      <section className="section-container py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl font-bold mb-2">
              Featured Brands
            </h2>
            <p className="text-gray-600">
              Discover inspiring independent drinks brands in our community
            </p>
          </div>
          <Link href="/community/brands">
            <Button variant="outline">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {brandData.slice(0, 4).map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="bg-gray-50 border-y-3 border-black py-12">
        <div className="section-container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl font-bold mb-2">
                Upcoming Events
              </h2>
              <p className="text-gray-600">
                Trade shows, meetups, and networking opportunities
              </p>
            </div>
            <Link href="/community/events">
              <Button variant="outline">
                View Calendar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <Card key={event.id}>
                <CardContent className="p-6">
                  {event.isFeatured && (
                    <Badge variant="coral" className="mb-3">
                      Featured
                    </Badge>
                  )}
                  <p className="text-sm text-gray-500 mb-2">{event.date}</p>
                  <h3 className="font-display text-lg font-bold mb-2">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>{event.location}</span>
                    <span>•</span>
                    <span>{event.type}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section className="bg-black text-white py-16">
        <div className="section-container text-center">
          <h2 className="font-display text-3xl font-bold mb-4">
            Join the Collective
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Whether you&apos;re a brand looking for community or a supplier looking for clients,
            there&apos;s a place for you here.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup?role=brand">
              <Button size="lg">
                Join as a Brand
              </Button>
            </Link>
            <Link href="/signup?role=supplier">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-black">
                Join as a Supplier
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
