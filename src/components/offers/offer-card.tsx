'use client'

import { useState } from 'react'
import { Tag, Copy, Check, Clock, ArrowRight } from 'lucide-react'
import { Badge, Button, Card, CardContent } from '@/components/ui'
import { cn, formatDate } from '@/lib/utils'
import { OFFER_TYPE_LABELS } from '@/types/database'
import type { OfferType } from '@prisma/client'

interface OfferCardProps {
  offer: {
    id: string
    title: string
    description: string | null
    type: OfferType
    discountValue: number | null
    code: string | null
    supplierName: string
    supplierSlug: string
    endDate: Date | null
    forBrandsOnly: boolean
  }
}

const typeColors: Record<OfferType, string> = {
  PERCENTAGE_DISCOUNT: 'bg-cyan',
  FIXED_DISCOUNT: 'bg-lime',
  FREE_TRIAL: 'bg-coral',
  BUNDLE: 'bg-purple-500',
  OTHER: 'bg-gray-400',
}

export function OfferCard({ offer }: OfferCardProps) {
  const [copied, setCopied] = useState(false)
  const typeColor = typeColors[offer.type] || 'bg-gray-400'

  const handleCopyCode = () => {
    if (offer.code) {
      navigator.clipboard.writeText(offer.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getDiscountDisplay = () => {
    switch (offer.type) {
      case 'PERCENTAGE_DISCOUNT':
        return `${offer.discountValue}% OFF`
      case 'FIXED_DISCOUNT':
        return `£${offer.discountValue} OFF`
      case 'FREE_TRIAL':
        return 'FREE TRIAL'
      case 'BUNDLE':
        return 'BUNDLE DEAL'
      default:
        return 'SPECIAL OFFER'
    }
  }

  return (
    <Card className="h-full">
      <CardContent className="p-0">
        {/* Discount Header */}
        <div className={cn('p-4 border-b-3 border-black', typeColor)}>
          <div className="flex items-center justify-between">
            <span className="font-display text-2xl font-bold">
              {getDiscountDisplay()}
            </span>
            <Tag className="w-6 h-6" />
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline" className="text-xs">
              {OFFER_TYPE_LABELS[offer.type]}
            </Badge>
            {offer.forBrandsOnly && (
              <Badge variant="cyan" className="text-xs">
                Brands Only
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="font-display text-lg font-bold mb-2">
            {offer.title}
          </h3>

          {/* Supplier */}
          <p className="text-sm text-gray-500 mb-3">
            from <span className="font-bold text-black">{offer.supplierName}</span>
          </p>

          {/* Description */}
          {offer.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {offer.description}
            </p>
          )}

          {/* Code */}
          {offer.code && (
            <div className="mb-4">
              <button
                onClick={handleCopyCode}
                className="w-full flex items-center justify-between p-3 bg-gray-100 border-2 border-dashed border-gray-300 hover:border-black transition-colors"
              >
                <span className="font-mono font-bold tracking-wider">
                  {offer.code}
                </span>
                {copied ? (
                  <Check className="w-4 h-4 text-lime-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <p className="text-xs text-gray-500 mt-1 text-center">
                {copied ? 'Copied!' : 'Click to copy code'}
              </p>
            </div>
          )}

          {/* Expiry */}
          {offer.endDate && (
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
              <Clock className="w-3 h-3" />
              <span>Expires {formatDate(offer.endDate)}</span>
            </div>
          )}

          {/* CTA */}
          <div className="pt-3 border-t border-gray-200">
            <a
              href={`/explore/${offer.supplierSlug}`}
              className="inline-flex items-center text-xs font-display font-bold uppercase tracking-wide text-black hover:text-cyan transition-colors"
            >
              View Supplier
              <ArrowRight className="w-3 h-3 ml-1" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
