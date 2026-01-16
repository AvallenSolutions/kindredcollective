'use client'

import { useState, useMemo } from 'react'
import { Tag, Percent, Gift, Sparkles } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { OfferCard } from '@/components/offers'
import { offers } from '../../../../prisma/seed-offers'
import { suppliers } from '../../../../prisma/seed-data'
import { OFFER_TYPE_LABELS, SUPPLIER_CATEGORY_LABELS } from '@/types/database'
import type { OfferType, SupplierCategory } from '@prisma/client'
import { cn } from '@/lib/utils'

// Transform seed data - link offers to suppliers
const offerData = offers.map((offer, index) => {
  const supplier = suppliers.find((s) => s.slug === offer.supplierSlug)
  return {
    id: `offer-${index}`,
    ...offer,
    supplierName: supplier?.companyName || 'Unknown Supplier',
    supplierCategory: supplier?.category,
  }
})

const offerTypes = Object.entries(OFFER_TYPE_LABELS) as [OfferType, string][]

export default function OffersPage() {
  const [selectedType, setSelectedType] = useState<OfferType | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<SupplierCategory | null>(null)

  const filteredOffers = useMemo(() => {
    return offerData.filter((offer) => {
      if (selectedType && offer.type !== selectedType) return false
      if (selectedCategory && offer.supplierCategory !== selectedCategory) return false
      return true
    })
  }, [selectedType, selectedCategory])

  // Get unique categories from offers
  const availableCategories = useMemo(() => {
    const cats = new Set<SupplierCategory>()
    offerData.forEach((offer) => {
      if (offer.supplierCategory) cats.add(offer.supplierCategory)
    })
    return Array.from(cats)
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-lime py-12 border-b-4 border-black">
        <div className="section-container">
          <Badge className="mb-4 bg-black text-lime border-black">
            <Tag className="w-3 h-3 mr-1" />
            {offerData.length} Active Offers
          </Badge>
          <h1 className="font-display text-display-sm lg:text-display-md mb-4">
            Exclusive Offers
          </h1>
          <p className="text-lg max-w-2xl">
            Member-only discounts and deals from our verified supplier network.
            Save on everything from packaging to marketing.
          </p>
        </div>
      </section>

      {/* Offer Type Highlights */}
      <section className="bg-white border-b-3 border-black py-6">
        <div className="section-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => setSelectedType(selectedType === 'PERCENTAGE_DISCOUNT' ? null : 'PERCENTAGE_DISCOUNT')}
              className={cn(
                'p-4 border-3 border-black flex items-center gap-3 transition-all',
                selectedType === 'PERCENTAGE_DISCOUNT'
                  ? 'bg-cyan shadow-brutal'
                  : 'bg-white hover:shadow-brutal'
              )}
            >
              <Percent className="w-8 h-8" />
              <div className="text-left">
                <p className="font-display font-bold">% Off</p>
                <p className="text-xs text-gray-600">Percentage discounts</p>
              </div>
            </button>
            <button
              onClick={() => setSelectedType(selectedType === 'FIXED_DISCOUNT' ? null : 'FIXED_DISCOUNT')}
              className={cn(
                'p-4 border-3 border-black flex items-center gap-3 transition-all',
                selectedType === 'FIXED_DISCOUNT'
                  ? 'bg-lime shadow-brutal'
                  : 'bg-white hover:shadow-brutal'
              )}
            >
              <Tag className="w-8 h-8" />
              <div className="text-left">
                <p className="font-display font-bold">£ Off</p>
                <p className="text-xs text-gray-600">Fixed savings</p>
              </div>
            </button>
            <button
              onClick={() => setSelectedType(selectedType === 'FREE_TRIAL' ? null : 'FREE_TRIAL')}
              className={cn(
                'p-4 border-3 border-black flex items-center gap-3 transition-all',
                selectedType === 'FREE_TRIAL'
                  ? 'bg-coral text-white shadow-brutal'
                  : 'bg-white hover:shadow-brutal'
              )}
            >
              <Gift className="w-8 h-8" />
              <div className="text-left">
                <p className="font-display font-bold">Free Trials</p>
                <p className={cn('text-xs', selectedType === 'FREE_TRIAL' ? 'text-white/70' : 'text-gray-600')}>
                  Try before you buy
                </p>
              </div>
            </button>
            <button
              onClick={() => setSelectedType(selectedType === 'BUNDLE' ? null : 'BUNDLE')}
              className={cn(
                'p-4 border-3 border-black flex items-center gap-3 transition-all',
                selectedType === 'BUNDLE'
                  ? 'bg-purple-500 text-white shadow-brutal'
                  : 'bg-white hover:shadow-brutal'
              )}
            >
              <Sparkles className="w-8 h-8" />
              <div className="text-left">
                <p className="font-display font-bold">Bundles</p>
                <p className={cn('text-xs', selectedType === 'BUNDLE' ? 'text-white/70' : 'text-gray-600')}>
                  Special packages
                </p>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="bg-gray-50 border-b-3 border-black py-4">
        <div className="section-container">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'px-4 py-2 text-sm font-bold border-2 transition-colors',
                !selectedCategory
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-gray-200 hover:border-black'
              )}
            >
              All Categories
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-4 py-2 text-sm font-bold border-2 transition-colors',
                  selectedCategory === cat
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-gray-200 hover:border-black'
                )}
              >
                {SUPPLIER_CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Offers Grid */}
      <section className="section-container py-8 lg:py-12">
        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-600">
            Showing <span className="font-bold text-black">{filteredOffers.length}</span> offers
          </p>
          {(selectedType || selectedCategory) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedType(null)
                setSelectedCategory(null)
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        {filteredOffers.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white border-3 border-black">
            <div className="w-16 h-16 bg-gray-100 border-3 border-black mx-auto mb-4 flex items-center justify-center">
              <Tag className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-display text-xl font-bold mb-2">No offers found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedType(null)
                setSelectedCategory(null)
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </section>

      {/* Supplier CTA */}
      <section className="bg-black text-white py-12">
        <div className="section-container text-center">
          <h2 className="font-display text-2xl lg:text-3xl font-bold mb-4">
            Are You a Supplier?
          </h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            Create exclusive offers for Kindred members and attract new customers to your business.
          </p>
          <Button size="lg">
            Create an Offer
          </Button>
        </div>
      </section>
    </div>
  )
}
