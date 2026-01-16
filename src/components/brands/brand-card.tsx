import Link from 'next/link'
import { MapPin, Calendar, ArrowRight, CheckCircle } from 'lucide-react'
import { Badge, Card, CardContent } from '@/components/ui'
import { cn } from '@/lib/utils'
import { DRINK_CATEGORY_LABELS } from '@/types/database'
import type { DrinkCategory } from '@prisma/client'

interface BrandCardProps {
  brand: {
    id: string
    name: string
    slug: string
    tagline: string | null
    logoUrl: string | null
    heroImageUrl: string | null
    category: DrinkCategory
    subcategories: string[]
    location: string | null
    country: string | null
    yearFounded: number | null
    isVerified: boolean
  }
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

export function BrandCard({ brand }: BrandCardProps) {
  const categoryColor = categoryColors[brand.category] || 'bg-gray-400'

  return (
    <Link href={`/community/brands/${brand.slug}`}>
      <Card className="h-full group cursor-pointer overflow-hidden">
        <CardContent className="p-0">
          {/* Header Image/Color */}
          <div
            className={cn(
              'h-40 flex items-center justify-center border-b-3 border-black relative overflow-hidden',
              categoryColor
            )}
          >
            {brand.heroImageUrl ? (
              <img
                src={brand.heroImageUrl}
                alt={brand.name}
                className="w-full h-full object-cover"
              />
            ) : brand.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="h-20 w-20 object-contain"
              />
            ) : (
              <span className="font-display text-5xl font-bold text-black/30">
                {brand.name.charAt(0)}
              </span>
            )}

            {/* Category Badge Overlay */}
            <div className="absolute top-3 left-3">
              <Badge variant="outline" className="bg-white/90 backdrop-blur-sm">
                {DRINK_CATEGORY_LABELS[brand.category]}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Brand Name */}
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-display text-lg font-bold group-hover:text-cyan transition-colors">
                {brand.name}
              </h3>
              {brand.isVerified && (
                <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
              )}
            </div>

            {/* Tagline */}
            {brand.tagline && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {brand.tagline}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
              {brand.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {brand.location}
                </span>
              )}
              {brand.yearFounded && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Est. {brand.yearFounded}
                </span>
              )}
            </div>

            {/* Subcategories */}
            <div className="flex flex-wrap gap-1 mb-4">
              {brand.subcategories.slice(0, 3).map((sub) => (
                <span
                  key={sub}
                  className="px-2 py-0.5 bg-gray-100 text-xs text-gray-600 border border-gray-200"
                >
                  {sub}
                </span>
              ))}
            </div>

            {/* View Profile */}
            <div className="pt-3 border-t border-gray-200">
              <span className="inline-flex items-center text-xs font-display font-bold uppercase tracking-wide text-black group-hover:text-cyan transition-colors">
                View Brand
                <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
