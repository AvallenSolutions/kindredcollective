import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  MapPin,
  Globe,
  Instagram,
  Linkedin,
  Twitter,
  Calendar,
  CheckCircle,
  ExternalLink,
} from 'lucide-react'
import { Badge, Button, Card, CardContent } from '@/components/ui'
import { brands } from '../../../../../../prisma/seed-brands'
import { DRINK_CATEGORY_LABELS } from '@/types/database'
import type { DrinkCategory } from '@prisma/client'
import { cn } from '@/lib/utils'

interface BrandProfilePageProps {
  params: Promise<{ slug: string }>
}

const categoryColors: Record<DrinkCategory, string> = {
  SPIRITS: 'bg-cyan',
  BEER: 'bg-amber-400',
  WINE: 'bg-purple-500',
  RTD: 'bg-pink-500',
  NO_LO: 'bg-lime',
  CIDER: 'bg-orange-500',
  OTHER: 'bg-gray-400',
}

export default async function BrandProfilePage({ params }: BrandProfilePageProps) {
  const { slug } = await params
  const brand = brands.find((b) => b.slug === slug)

  if (!brand) {
    notFound()
  }

  const categoryColor = categoryColors[brand.category] || 'bg-gray-400'

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className={cn(categoryColor, 'border-b-4 border-black')}>
        <div className="section-container py-8">
          {/* Back Link */}
          <Link
            href="/community/brands"
            className="inline-flex items-center text-sm font-bold mb-6 hover:underline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Brands
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Logo */}
            <div className="w-24 h-24 lg:w-32 lg:h-32 bg-white border-3 border-black flex items-center justify-center flex-shrink-0">
              <span className="font-display text-4xl lg:text-5xl font-bold">
                {brand.name.charAt(0)}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <Badge variant="outline" className="bg-white">
                  {DRINK_CATEGORY_LABELS[brand.category]}
                </Badge>
                {brand.isVerified && (
                  <Badge className="bg-blue-500 text-white border-blue-500">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>

              <h1 className="font-display text-3xl lg:text-4xl font-bold mb-2">
                {brand.name}
              </h1>

              {brand.tagline && (
                <p className="text-lg mb-4">{brand.tagline}</p>
              )}

              {/* Meta */}
              <div className="flex flex-wrap gap-4 text-sm">
                {brand.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {brand.location}, {brand.country}
                  </span>
                )}
                {brand.yearFounded && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Est. {brand.yearFounded}
                  </span>
                )}
              </div>
            </div>

            {/* Social/CTA */}
            <div className="flex flex-col gap-3">
              <Button size="lg">
                <Globe className="w-4 h-4 mr-2" />
                Visit Website
              </Button>
              <div className="flex gap-2 justify-end">
                <a
                  href="#"
                  className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-container py-8 lg:py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-display text-xl font-bold mb-4">About</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  {brand.description}
                </p>
                {brand.story && (
                  <>
                    <h3 className="font-display text-lg font-bold mb-2 mt-6">
                      Our Story
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {brand.story}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Products/Categories */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-display text-xl font-bold mb-4">
                  What We Make
                </h2>
                <div className="flex flex-wrap gap-3">
                  {brand.subcategories.map((sub) => (
                    <div
                      key={sub}
                      className={cn(
                        'px-4 py-2 border-2 border-black text-sm font-bold',
                        categoryColor
                      )}
                    >
                      {sub}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Gallery Placeholder */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-display text-xl font-bold mb-4">Gallery</h2>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="aspect-square bg-gray-100 border-2 border-gray-200 flex items-center justify-center"
                    >
                      <span className="text-gray-400 text-xs">Image {i}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-bold mb-4">
                  Quick Info
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="font-display text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">
                      Category
                    </p>
                    <p className="font-bold">{DRINK_CATEGORY_LABELS[brand.category]}</p>
                  </div>
                  <div>
                    <p className="font-display text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">
                      Location
                    </p>
                    <p className="font-bold">
                      {brand.location}, {brand.country}
                    </p>
                  </div>
                  {brand.yearFounded && (
                    <div>
                      <p className="font-display text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">
                        Founded
                      </p>
                      <p className="font-bold">{brand.yearFounded}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Connect */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-bold mb-4">
                  Connect
                </h3>
                <div className="space-y-2">
                  <a
                    href="#"
                    className="flex items-center gap-2 p-3 bg-gray-50 border-2 border-gray-200 hover:border-black transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    <span className="text-sm font-medium">Website</span>
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-2 p-3 bg-gray-50 border-2 border-gray-200 hover:border-black transition-colors"
                  >
                    <Instagram className="w-4 h-4" />
                    <span className="text-sm font-medium">Instagram</span>
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-2 p-3 bg-gray-50 border-2 border-gray-200 hover:border-black transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    <span className="text-sm font-medium">LinkedIn</span>
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Similar Brands CTA */}
      <section className="bg-gray-100 border-t-3 border-black py-12">
        <div className="section-container text-center">
          <h2 className="font-display text-2xl font-bold mb-4">
            Discover More Brands
          </h2>
          <p className="text-gray-600 mb-6">
            Explore other {DRINK_CATEGORY_LABELS[brand.category]} brands in our community
          </p>
          <Link href={`/community/brands?category=${brand.category}`}>
            <Button variant="outline" size="lg">
              View Similar Brands
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

// Generate static params
export function generateStaticParams() {
  return brands.map((brand) => ({
    slug: brand.slug,
  }))
}
