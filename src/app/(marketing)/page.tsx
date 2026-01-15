import Link from 'next/link'
import { ArrowRight, Search, Users, Calendar, Tag, Sparkles, CheckCircle } from 'lucide-react'
import { Button, Badge, Card, CardContent } from '@/components/ui'

const features = [
  {
    icon: Search,
    title: 'AI-Powered Search',
    description: 'Find the perfect supplier with natural language queries like "organic agave suppliers with low MOQs"',
    color: 'bg-cyan',
  },
  {
    icon: Users,
    title: 'Brand Community',
    description: 'Connect with fellow independent drinks makers, share experiences, and grow together',
    color: 'bg-coral',
  },
  {
    icon: Calendar,
    title: 'Events & Meetups',
    description: 'Discover trade shows, networking events, and exclusive Kindred community gatherings',
    color: 'bg-lime',
  },
  {
    icon: Tag,
    title: 'Exclusive Offers',
    description: 'Access member-only discounts and deals from verified suppliers in our network',
    color: 'bg-cyan',
  },
]

const stats = [
  { value: '500+', label: 'Verified Suppliers' },
  { value: '1,200+', label: 'Brand Members' },
  { value: '50+', label: 'Annual Events' },
  { value: '£2M+', label: 'Member Savings' },
]

const categories = [
  'Packaging',
  'Ingredients',
  'Logistics',
  'Co-Packing',
  'Design',
  'Marketing',
  'Equipment',
  'Distribution',
]

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="section-container py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="lime" className="mb-6">
                The Independent Drinks Ecosystem
              </Badge>
              <h1 className="font-display text-display-md lg:text-display-lg mb-6">
                Build Your Brand.
                <br />
                <span className="text-cyan">Find Your People.</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-lg">
                The UK&apos;s leading marketplace connecting independent drinks brands with suppliers, manufacturers, and service providers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <Button size="lg">
                    Join Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/explore">
                  <Button variant="outline" size="lg">
                    Explore Suppliers
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-cyan border-3 border-black p-6 shadow-brutal">
                    <p className="font-display font-bold text-4xl">500+</p>
                    <p className="text-sm uppercase tracking-wide">Suppliers</p>
                  </div>
                  <div className="bg-lime border-3 border-black p-6 shadow-brutal">
                    <p className="font-display font-bold text-4xl">1,200+</p>
                    <p className="text-sm uppercase tracking-wide">Brands</p>
                  </div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="bg-coral border-3 border-black p-6 shadow-brutal text-white">
                    <p className="font-display font-bold text-4xl">50+</p>
                    <p className="text-sm uppercase tracking-wide">Events</p>
                  </div>
                  <div className="bg-black border-3 border-black p-6 shadow-brutal-cyan text-white">
                    <p className="font-display font-bold text-4xl">£2M+</p>
                    <p className="text-sm uppercase tracking-wide">Savings</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative border */}
        <div className="h-4 bg-black" />
      </section>

      {/* Categories Strip */}
      <section className="bg-cyan border-y-3 border-black py-4 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...categories, ...categories].map((cat, i) => (
            <span
              key={i}
              className="font-display font-bold text-lg uppercase tracking-wide mx-8"
            >
              {cat}
            </span>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16 lg:py-24">
        <div className="section-container">
          <div className="text-center mb-12">
            <Badge variant="coral" className="mb-4">
              Your Drinks Toolkit
            </Badge>
            <h2 className="font-display text-display-sm lg:text-display-md mb-4">
              Everything You Need to Grow
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From finding the right supplier to connecting with your community, we&apos;ve got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="p-6">
                  <div className={`w-12 h-12 ${feature.color} border-3 border-black flex items-center justify-center mb-4`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Search Preview */}
      <section className="bg-black text-white py-16 lg:py-24">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="cyan" className="mb-6">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered
              </Badge>
              <h2 className="font-display text-display-sm lg:text-display-md mb-6">
                Search Like You Think
              </h2>
              <p className="text-lg text-gray-400 mb-8">
                Our AI understands what you&apos;re looking for. Just describe your needs in plain English and we&apos;ll find the perfect match.
              </p>
              <div className="space-y-4">
                {[
                  '"Glass bottle suppliers with embossing in the UK"',
                  '"Organic botanicals with low minimum orders"',
                  '"Co-packers specializing in RTD cocktails"',
                ].map((query) => (
                  <div
                    key={query}
                    className="bg-white/10 border-2 border-white/20 px-4 py-3 text-sm"
                  >
                    {query}
                  </div>
                ))}
              </div>
              <Link href="/search" className="inline-block mt-8">
                <Button variant="primary" size="lg">
                  Try AI Search
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="bg-white border-3 border-cyan p-8 shadow-brutal-cyan">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-cyan rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="font-display font-bold text-black">Kindred AI</span>
                </div>
                <p className="text-black mb-4">
                  I found <strong>12 suppliers</strong> matching your criteria for organic agave suppliers with MOQs under 500 units...
                </p>
                <div className="space-y-2">
                  {['Agave Spirits Co.', 'Pure Botanicals Ltd', 'Mexican Imports UK'].map((name) => (
                    <div key={name} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-lime" />
                      {name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-lime py-16 lg:py-24 border-y-4 border-black">
        <div className="section-container text-center">
          <h2 className="font-display text-display-sm lg:text-display-md mb-6">
            Ready to Join the Collective?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Whether you&apos;re a brand looking for suppliers or a supplier looking for clients, there&apos;s a place for you here.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup?role=brand">
              <Button size="xl" className="bg-black text-white hover:bg-gray-800">
                I&apos;m a Brand
              </Button>
            </Link>
            <Link href="/signup?role=supplier">
              <Button size="xl" variant="outline">
                I&apos;m a Supplier
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
