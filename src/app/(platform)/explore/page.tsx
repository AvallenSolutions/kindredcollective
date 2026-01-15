'use client'

import { useState, useMemo } from 'react'
import { Sparkles, Users } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { SupplierCard } from '@/components/suppliers/supplier-card'
import { SupplierFilters, type FilterState } from '@/components/suppliers/supplier-filters'
import { suppliers as seedSuppliers } from '../../../../prisma/seed-data'
import Link from 'next/link'

// Transform seed data to match component expectations
const suppliers = seedSuppliers.map((s, index) => ({
  id: `supplier-${index}`,
  ...s,
  logoUrl: null,
  tagline: s.tagline,
  description: s.description,
}))

export default function ExplorePage() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    categories: [],
    certifications: [],
    location: '',
    hasNoMoq: false,
  })

  // Filter suppliers based on current filters
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch =
          supplier.companyName.toLowerCase().includes(searchLower) ||
          supplier.tagline?.toLowerCase().includes(searchLower) ||
          supplier.description?.toLowerCase().includes(searchLower) ||
          supplier.services.some((s) => s.toLowerCase().includes(searchLower))

        if (!matchesSearch) return false
      }

      // Category filter
      if (filters.categories.length > 0) {
        if (!filters.categories.includes(supplier.category)) return false
      }

      // Location filter
      if (filters.location) {
        const locationMatch =
          supplier.location?.toLowerCase().includes(filters.location.toLowerCase()) ||
          supplier.country?.toLowerCase().includes(filters.location.toLowerCase()) ||
          supplier.serviceRegions?.some((r) =>
            r.toLowerCase().includes(filters.location.toLowerCase())
          )
        if (!locationMatch) return false
      }

      // Certification filter
      if (filters.certifications.length > 0) {
        const hasCert = filters.certifications.some((cert) =>
          supplier.certifications?.includes(cert)
        )
        if (!hasCert) return false
      }

      // No MOQ filter
      if (filters.hasNoMoq) {
        if (supplier.moqMin && supplier.moqMin > 0) return false
      }

      return true
    })
  }, [filters])

  // Get category counts for stats
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    suppliers.forEach((s) => {
      counts[s.category] = (counts[s.category] || 0) + 1
    })
    return counts
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-black text-white py-12 lg:py-16 border-b-4 border-cyan">
        <div className="section-container">
          <div className="max-w-3xl">
            <Badge variant="cyan" className="mb-4">
              <Users className="w-3 h-3 mr-1" />
              {suppliers.length} Verified Suppliers
            </Badge>
            <h1 className="font-display text-display-sm lg:text-display-md mb-4">
              Explore Suppliers
            </h1>
            <p className="text-lg text-gray-400 mb-6">
              Find the perfect partners for your drinks brand. From packaging to logistics,
              our verified suppliers are ready to help you grow.
            </p>
            <Link href="/search">
              <Button variant="primary" size="lg">
                <Sparkles className="w-4 h-4 mr-2" />
                Try AI Search
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-container py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <SupplierFilters
                onFilterChange={setFilters}
                initialFilters={filters}
              />
            </div>
          </aside>

          {/* Results Grid */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-600">
                Showing <span className="font-bold text-black">{filteredSuppliers.length}</span> suppliers
                {filters.search && (
                  <span> for &quot;{filters.search}&quot;</span>
                )}
              </p>

              {/* Sort dropdown - placeholder */}
              <select className="px-3 py-2 text-sm border-2 border-gray-200 bg-white focus:border-black focus:outline-none">
                <option>Most Relevant</option>
                <option>Newest First</option>
                <option>A-Z</option>
              </select>
            </div>

            {/* Supplier Grid */}
            {filteredSuppliers.length > 0 ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredSuppliers.map((supplier) => (
                  <SupplierCard key={supplier.id} supplier={supplier} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white border-3 border-black">
                <div className="w-16 h-16 bg-gray-100 border-3 border-black mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">
                  No suppliers found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters or search terms
                </p>
                <Button
                  variant="outline"
                  onClick={() =>
                    setFilters({
                      search: '',
                      categories: [],
                      certifications: [],
                      location: '',
                      hasNoMoq: false,
                    })
                  }
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-lime border-y-4 border-black py-12">
        <div className="section-container text-center">
          <h2 className="font-display text-2xl lg:text-3xl font-bold mb-4">
            Are You a Supplier?
          </h2>
          <p className="text-gray-700 mb-6 max-w-xl mx-auto">
            Join Kindred Collective and connect with hundreds of independent drinks brands
            looking for partners like you.
          </p>
          <Link href="/signup?role=supplier">
            <Button size="lg" className="bg-black text-white hover:bg-gray-800">
              Join as a Supplier
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
