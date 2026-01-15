'use client'

import { useState, useMemo } from 'react'
import { Search, Wine, X } from 'lucide-react'
import { Badge, Button, Input } from '@/components/ui'
import { BrandCard } from '@/components/brands'
import { brands } from '../../../../../prisma/seed-brands'
import { DRINK_CATEGORY_LABELS } from '@/types/database'
import type { DrinkCategory } from '@prisma/client'
import { cn } from '@/lib/utils'

// Transform seed data
const brandData = brands.map((b, index) => ({
  id: `brand-${index}`,
  ...b,
  logoUrl: null,
  heroImageUrl: null,
}))

const categories = Object.entries(DRINK_CATEGORY_LABELS) as [DrinkCategory, string][]

export default function BrandsPage() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<DrinkCategory | null>(null)

  const filteredBrands = useMemo(() => {
    return brandData.filter((brand) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesSearch =
          brand.name.toLowerCase().includes(searchLower) ||
          brand.tagline?.toLowerCase().includes(searchLower) ||
          brand.description?.toLowerCase().includes(searchLower) ||
          brand.subcategories.some((s) => s.toLowerCase().includes(searchLower))

        if (!matchesSearch) return false
      }

      // Category filter
      if (selectedCategory && brand.category !== selectedCategory) {
        return false
      }

      return true
    })
  }, [search, selectedCategory])

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-purple-500 text-white py-12 border-b-4 border-black">
        <div className="section-container">
          <Badge className="mb-4 bg-white text-purple-500 border-white">
            <Wine className="w-3 h-3 mr-1" />
            {brandData.length} Brands
          </Badge>
          <h1 className="font-display text-display-sm lg:text-display-md mb-4">
            Brand Directory
          </h1>
          <p className="text-lg text-white/80 max-w-2xl">
            Discover independent drinks brands from across the UK and beyond.
            From craft gin to alcohol-free alternatives.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b-3 border-black sticky top-16 lg:top-20 z-40">
        <div className="section-container py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search brands..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-black" />
                </button>
              )}
            </div>

            {/* Category Filter */}
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
                All
              </button>
              {categories.map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setSelectedCategory(value)}
                  className={cn(
                    'px-4 py-2 text-sm font-bold border-2 transition-colors',
                    selectedCategory === value
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-gray-200 hover:border-black'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="section-container py-8 lg:py-12">
        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            Showing <span className="font-bold text-black">{filteredBrands.length}</span> brands
            {search && <span> for &quot;{search}&quot;</span>}
            {selectedCategory && (
              <span> in {DRINK_CATEGORY_LABELS[selectedCategory]}</span>
            )}
          </p>
        </div>

        {/* Brand Grid */}
        {filteredBrands.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBrands.map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white border-3 border-black">
            <div className="w-16 h-16 bg-gray-100 border-3 border-black mx-auto mb-4 flex items-center justify-center">
              <Wine className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-display text-xl font-bold mb-2">
              No brands found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filters
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearch('')
                setSelectedCategory(null)
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </section>

      {/* Join CTA */}
      <section className="bg-lime border-y-4 border-black py-12">
        <div className="section-container text-center">
          <h2 className="font-display text-2xl lg:text-3xl font-bold mb-4">
            Want to Be Listed?
          </h2>
          <p className="text-gray-700 mb-6 max-w-xl mx-auto">
            Join Kindred Collective and showcase your brand to suppliers and fellow drinks makers.
          </p>
          <Button size="lg" className="bg-black text-white hover:bg-gray-800">
            Join as a Brand
          </Button>
        </div>
      </section>
    </div>
  )
}
