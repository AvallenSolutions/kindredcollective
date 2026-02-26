'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, SlidersHorizontal, Bot, Sparkles, ChevronDown, LayoutGrid, List, Zap } from 'lucide-react'
import { SupplierCard } from '@/components/suppliers/supplier-card'
import { SUPPLIER_CATEGORY_LABELS } from '@/types/database'
import type { SupplierCategory } from '@prisma/client'

interface Supplier {
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
  isPublic: boolean
  createdAt: string
}

interface ExploreContentProps {
  suppliers: Supplier[]
}

const ALL_CATEGORIES: SupplierCategory[] = [
  'PACKAGING', 'LOGISTICS', 'CO_PACKING', 'DESIGN', 'DISTRIBUTION',
  'MARKETING', 'INGREDIENTS', 'EQUIPMENT', 'CONSULTING', 'OTHER',
]

const LOCATIONS = ['Any Location', 'United Kingdom', 'Europe (EU)', 'France', 'Germany']

const CERTIFICATIONS = [
  { key: 'ORGANIC', label: 'Organic' },
  { key: 'B_CORP', label: 'B-Corp' },
  { key: 'FAIRTRADE', label: 'Fair Trade' },
]

type SortOption = 'recommended' | 'newest' | 'az'

export function ExploreContent({ suppliers }: ExploreContentProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [selectedLocation, setSelectedLocation] = useState('Any Location')
  const [selectedCerts, setSelectedCerts] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<SortOption>('recommended')

  // Get category counts from all suppliers (unfiltered)
  const categoryCounts: Record<string, number> = {}
  suppliers.forEach((s) => {
    categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1
  })

  const categories = ALL_CATEGORIES
    .filter(key => categoryCounts[key] > 0)
    .map(key => ({ key, count: categoryCounts[key] || 0 }))

  // Filter and sort suppliers
  const filteredSuppliers = useMemo(() => {
    let result = suppliers

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(s =>
        s.companyName.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.tagline?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.services?.some(svc => svc.toLowerCase().includes(q)) ||
        s.location?.toLowerCase().includes(q)
      )
    }

    // Category filter
    if (selectedCategories.size > 0) {
      result = result.filter(s => selectedCategories.has(s.category))
    }

    // Location filter
    if (selectedLocation !== 'Any Location') {
      result = result.filter(s => {
        const country = s.country?.toLowerCase() || ''
        const location = s.location?.toLowerCase() || ''
        const query = selectedLocation.toLowerCase()

        if (query === 'united kingdom') {
          return country.includes('uk') || country.includes('united kingdom') || location.includes('uk')
        }
        if (query === 'europe (eu)') {
          return !country.includes('uk') && !country.includes('united kingdom')
        }
        return country.includes(query) || location.includes(query)
      })
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'az':
        result = [...result].sort((a, b) => a.companyName.localeCompare(b.companyName))
        break
      default:
        // 'recommended' — keep original order (verified first)
        result = [...result].sort((a, b) => (b.isVerified ? 1 : 0) - (a.isVerified ? 1 : 0))
        break
    }

    return result
  }, [suppliers, searchQuery, selectedCategories, selectedLocation, selectedCerts, sortBy])

  function toggleCategory(key: string) {
    setSelectedCategories(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  function toggleCert(key: string) {
    setSelectedCerts(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Page Header & Search */}
      <header className="pt-32 pb-12 px-6 border-b-2 border-black bg-gray-100 relative">
        <div className="absolute inset-0 bg-grid-pattern pointer-events-none"></div>

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-8 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="w-2 h-2 bg-cyan rounded-full border border-black"></span>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Marketplace</span>
              </div>
              <h1 className="font-display text-5xl md:text-6xl font-bold uppercase tracking-tighter mb-2">Find Partners</h1>
              <p className="text-lg text-gray-600 font-medium max-w-xl">Browse {suppliers.length}+ verified suppliers, manufacturers, and logistics partners.</p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="bg-white border-2 border-black p-3 text-center neo-shadow min-w-[100px]">
                <div className="text-2xl font-bold font-display">{suppliers.length}</div>
                <div className="text-[10px] font-bold uppercase text-gray-500">Suppliers</div>
              </div>
              <div className="bg-white border-2 border-black p-3 text-center neo-shadow min-w-[100px]">
                <div className="text-2xl font-bold font-display">UK+EU</div>
                <div className="text-[10px] font-bold uppercase text-gray-500">Coverage</div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-full z-10">
            <div className="flex flex-col md:flex-row gap-0 md:gap-4">
              <div className="flex-1 bg-white border-2 border-black neo-shadow p-1 flex items-center relative">
                <Search className="w-5 h-5 ml-4 text-gray-400 absolute" />
                <input
                  type="text"
                  placeholder="Search by name, category, or capability..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-transparent border-none focus:outline-none font-medium text-lg placeholder:text-gray-400"
                />
              </div>
              <div className="flex gap-2 mt-2 md:mt-0">
                <Link
                  href="/search"
                  className="px-8 py-3 bg-cyan text-black border-2 border-black font-bold uppercase text-sm hover:bg-black hover:text-cyan transition-colors neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none flex items-center"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  AI Search
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">

        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden lg:block w-72 shrink-0 space-y-8">

          {/* Active Filters */}
          {(selectedCategories.size > 0 || selectedLocation !== 'Any Location' || selectedCerts.size > 0) && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold uppercase text-sm">Active Filters</h3>
                <button
                  onClick={() => {
                    setSelectedCategories(new Set())
                    setSelectedLocation('Any Location')
                    setSelectedCerts(new Set())
                    setSearchQuery('')
                  }}
                  className="text-xs font-bold text-coral hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}

          {/* Filter Group: Category */}
          <div>
            <h3 className="font-bold uppercase border-b-2 border-black pb-2 mb-4 flex justify-between">
              Category
              <ChevronDown className="w-4 h-4" />
            </h3>
            <div className="space-y-3">
              {categories.map((cat) => (
                <label key={cat.key} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedCategories.has(cat.key)}
                    onChange={() => toggleCategory(cat.key)}
                    className="w-5 h-5 border-2 border-black appearance-none checked:bg-black cursor-pointer"
                  />
                  <span className="text-sm font-medium group-hover:text-gray-600">{SUPPLIER_CATEGORY_LABELS[cat.key]}</span>
                  <span className="ml-auto text-xs font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 border border-black">{cat.count}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Filter Group: Location */}
          <div>
            <h3 className="font-bold uppercase border-b-2 border-black pb-2 mb-4">Location</h3>
            <div className="relative">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full appearance-none bg-white border-2 border-black px-4 py-2 pr-8 text-sm font-medium focus:outline-none cursor-pointer"
              >
                {LOCATIONS.map(loc => (
                  <option key={loc}>{loc}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Filter Group: Certifications */}
          <div>
            <h3 className="font-bold uppercase border-b-2 border-black pb-2 mb-4">Certifications</h3>
            <div className="flex flex-wrap gap-2">
              {CERTIFICATIONS.map(cert => (
                <button
                  key={cert.key}
                  onClick={() => toggleCert(cert.key)}
                  className={`px-3 py-1 text-xs font-bold border transition-colors ${
                    selectedCerts.has(cert.key)
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 hover:border-black hover:bg-black hover:text-white'
                  }`}
                >
                  {cert.label}
                </button>
              ))}
            </div>
          </div>

        </aside>

        {/* Results Grid */}
        <div className="flex-1">

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-200">
            <div className="text-sm font-medium text-gray-500">
              Showing <span className="text-black font-bold">{filteredSuppliers.length}</span> of {suppliers.length} suppliers
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase hidden sm:inline-block">Sort by:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none bg-transparent font-bold text-sm pr-6 cursor-pointer focus:outline-none"
                >
                  <option value="recommended">Recommended</option>
                  <option value="newest">Newest Added</option>
                  <option value="az">A-Z</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Grid */}
          {filteredSuppliers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSuppliers.map((supplier, index) => (
                <SupplierCard
                  key={supplier.id}
                  supplier={supplier}
                  badge={index === 0 && !searchQuery && selectedCategories.size === 0 ? 'top' : null}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-lg font-bold mb-2">No suppliers match your filters</p>
              <p className="text-gray-500 mb-4">Try adjusting your search or clearing some filters</p>
              <button
                onClick={() => {
                  setSelectedCategories(new Set())
                  setSelectedLocation('Any Location')
                  setSelectedCerts(new Set())
                  setSearchQuery('')
                }}
                className="px-6 py-2 bg-cyan text-black font-bold uppercase border-2 border-black text-sm"
              >
                Clear All Filters
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Promo Section */}
      <section className="py-12 bg-cyan border-y-2 border-black">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center shrink-0 border-2 border-black neo-shadow">
              <Zap className="w-10 h-10" />
            </div>
            <div>
              <h3 className="font-display text-3xl font-bold leading-none mb-1">Not seeing what you need?</h3>
              <p className="font-medium text-lg">Post a Request for Proposal (RFP) and let suppliers come to you.</p>
            </div>
          </div>
          <Link
            href="/signup?role=brand"
            className="whitespace-nowrap px-8 py-3 bg-white text-black font-bold uppercase border-2 border-black hover:bg-black hover:text-white transition-colors neo-shadow"
          >
            Post a Request
          </Link>
        </div>
      </section>
    </div>
  )
}
