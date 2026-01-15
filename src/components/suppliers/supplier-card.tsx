import Link from 'next/link'
import { MapPin, CheckCircle, ArrowRight } from 'lucide-react'
import { Badge, Card, CardContent } from '@/components/ui'
import { cn } from '@/lib/utils'
import { SUPPLIER_CATEGORY_LABELS, CERTIFICATION_LABELS } from '@/types/database'
import type { Supplier, SupplierCategory, Certification } from '@prisma/client'

interface SupplierCardProps {
  supplier: {
    id: string
    companyName: string
    slug: string
    tagline: string | null
    description: string | null
    logoUrl: string | null
    category: SupplierCategory
    services: string[]
    location: string | null
    country: string | null
    certifications?: Certification[]
    isVerified: boolean
    moqMin?: number | null
  }
}

const categoryColors: Record<SupplierCategory, string> = {
  PACKAGING: 'bg-cyan',
  INGREDIENTS: 'bg-lime',
  LOGISTICS: 'bg-blue-500',
  CO_PACKING: 'bg-coral',
  DESIGN: 'bg-purple-500',
  MARKETING: 'bg-pink-500',
  EQUIPMENT: 'bg-orange-500',
  CONSULTING: 'bg-teal-500',
  LEGAL: 'bg-gray-500',
  FINANCE: 'bg-green-500',
  DISTRIBUTION: 'bg-indigo-500',
  RECRUITMENT: 'bg-amber-500',
  SOFTWARE: 'bg-sky-500',
  SUSTAINABILITY: 'bg-emerald-500',
  PR: 'bg-rose-500',
  PHOTOGRAPHY: 'bg-violet-500',
  WEB_DEVELOPMENT: 'bg-fuchsia-500',
  OTHER: 'bg-gray-400',
}

export function SupplierCard({ supplier }: SupplierCardProps) {
  const categoryColor = categoryColors[supplier.category] || 'bg-gray-400'

  return (
    <Link href={`/explore/${supplier.slug}`}>
      <Card className="h-full group cursor-pointer">
        <CardContent className="p-0">
          {/* Header with Logo/Initial */}
          <div className={cn('h-32 flex items-center justify-center border-b-3 border-black', categoryColor)}>
            {supplier.logoUrl ? (
              <img
                src={supplier.logoUrl}
                alt={supplier.companyName}
                className="h-16 w-16 object-contain"
              />
            ) : (
              <span className="font-display text-4xl font-bold text-black/80">
                {supplier.companyName.charAt(0)}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Category Badge */}
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="text-xs">
                {SUPPLIER_CATEGORY_LABELS[supplier.category]}
              </Badge>
              {supplier.isVerified && (
                <CheckCircle className="w-4 h-4 text-blue-500" />
              )}
            </div>

            {/* Company Name */}
            <h3 className="font-display text-lg font-bold mb-1 group-hover:text-cyan transition-colors">
              {supplier.companyName}
            </h3>

            {/* Tagline */}
            {supplier.tagline && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {supplier.tagline}
              </p>
            )}

            {/* Location */}
            {supplier.location && (
              <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                <MapPin className="w-3 h-3" />
                <span>{supplier.location}, {supplier.country}</span>
              </div>
            )}

            {/* Services Tags */}
            <div className="flex flex-wrap gap-1 mb-4">
              {supplier.services.slice(0, 3).map((service) => (
                <span
                  key={service}
                  className="px-2 py-0.5 bg-gray-100 text-xs text-gray-600 border border-gray-200"
                >
                  {service}
                </span>
              ))}
              {supplier.services.length > 3 && (
                <span className="px-2 py-0.5 bg-gray-100 text-xs text-gray-600 border border-gray-200">
                  +{supplier.services.length - 3}
                </span>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              {/* MOQ if available */}
              {supplier.moqMin ? (
                <span className="text-xs text-gray-500">
                  MOQ: {supplier.moqMin.toLocaleString()}+
                </span>
              ) : (
                <span className="text-xs text-gray-500">No minimum</span>
              )}

              {/* View Profile CTA */}
              <span className="inline-flex items-center text-xs font-display font-bold uppercase tracking-wide text-black group-hover:text-cyan transition-colors">
                View
                <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>

            {/* Certifications */}
            {supplier.certifications && supplier.certifications.length > 0 && (
              <div className="flex gap-1 mt-3">
                {supplier.certifications.map((cert) => (
                  <Badge key={cert} variant="lime" className="text-[10px]">
                    {CERTIFICATION_LABELS[cert]}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
