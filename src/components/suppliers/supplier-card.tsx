import Link from 'next/link'
import { MapPin, BadgeCheck, Heart } from 'lucide-react'
import { SUPPLIER_CATEGORY_LABELS } from '@/types/database'
import type { SupplierCategory } from '@prisma/client'

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
    isVerified: boolean
  }
  badge?: 'top' | 'trending' | 'sale' | null
}

const categoryImages: Record<string, string> = {
  PACKAGING: 'https://images.unsplash.com/photo-1605733513597-a8f8341084e6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  INGREDIENTS: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  LOGISTICS: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  CO_PACKING: 'https://images.unsplash.com/photo-1621266300030-f705b768a356?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  DESIGN: 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  MARKETING: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  DISTRIBUTION: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  FINANCE: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  PR: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  PHOTOGRAPHY: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  SOFTWARE: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  SUSTAINABILITY: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  WEB_DEVELOPMENT: 'https://images.unsplash.com/photo-1547658719-da2b51169166?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  OTHER: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
}

export function SupplierCard({ supplier, badge }: SupplierCardProps) {
  const backgroundImage = categoryImages[supplier.category] || categoryImages.OTHER

  return (
    <div className="group bg-white border-2 border-black neo-shadow hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] transition-all duration-200 flex flex-col">
      <div className="h-48 relative overflow-hidden border-b-2 border-black">
        {supplier.logoUrl ? (
          <div className="w-full h-full flex items-center justify-center bg-white p-6">
            <img
              src={supplier.logoUrl}
              alt={supplier.companyName}
              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        ) : (
          <img
            src={backgroundImage}
            alt={supplier.companyName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        {badge === 'top' && (
          <div className="absolute top-3 left-3 bg-cyan border border-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">Top Match</div>
        )}
        {badge === 'trending' && (
          <div className="absolute top-3 left-3 bg-blue-500 text-white border border-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">Trending</div>
        )}
        {badge === 'sale' && (
          <div className="absolute top-3 left-3 bg-coral text-white border border-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">Offer</div>
        )}
        <button className="absolute top-3 right-3 w-8 h-8 bg-white border border-black flex items-center justify-center hover:bg-coral hover:text-white transition-colors">
          <Heart className="w-4 h-4" />
        </button>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-display text-lg font-bold leading-tight">{supplier.companyName}</h3>
          {supplier.isVerified && (
            <BadgeCheck className="text-blue-500 w-5 h-5 shrink-0" />
          )}
        </div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {supplier.location || supplier.country || 'United Kingdom'}
        </p>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {supplier.tagline || supplier.description || SUPPLIER_CATEGORY_LABELS[supplier.category]}
        </p>

        <div className="mt-auto">
          <div className="flex flex-wrap gap-1.5 mb-4">
            {supplier.services.slice(0, 2).map((service) => (
              <span key={service} className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 text-[10px] font-bold uppercase">
                {service}
              </span>
            ))}
          </div>
          <Link
            href={`/explore/${supplier.slug}`}
            className="block w-full py-2 bg-transparent border-2 border-black text-center font-bold text-sm uppercase hover:bg-black hover:text-white transition-colors"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  )
}
