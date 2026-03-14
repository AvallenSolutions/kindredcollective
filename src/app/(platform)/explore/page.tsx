'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, Bot, Sparkles, ChevronDown, LayoutGrid, List, Zap, Loader2 } from 'lucide-react'
import { SupplierCard } from '@/components/suppliers/supplier-card'
import { SUPPLIER_CATEGORY_LABELS } from '@/types/database'
import type { SupplierCategory } from '@prisma/client'

const CATEGORIES: SupplierCategory[] = [
  'PACKAGING', 'LOGISTICS', 'CO_PACKING', 'DESIGN', 'DISTRIBUTION',
  'INGREDIENTS', 'MARKETING', 'EQUIPMENT', 'CONSULTING', 'SUSTAINABILITY',
]

const CERTIFICATIONS: { label: string; value: string }[] = [
  { label: 'Organic', value: 'ORGANIC' },
  { label: 'B-Corp', value: 'B_CORP' },
  { label: 'Fair Trade', value: 'FAIRTRADE' },
  { label: 'Vegan', value: 'VEGAN' },
  { label: 'Carbon Neutral', value: 'CARBON_NEUTRAL' },
]

const LOCATIONS = ['United Kingdom', 'Europe (EU)', 'France', 'Germany', 'Spain', 'Italy']

const PAGE_SIZE = 12

type Supplier = {
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

export default function ExplorePage() {
  const router = useRouter()

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const [searchInput, setSearchInput] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedCerts, setSelectedCerts] = useState<string[]>([])
  const [aiQuery, setAiQuery] = useState('')

  // Track current filter params to use in "load more"
  const filterRef = useRef({ search: '', categories: [] as string[], location: '', certs: [] as string[] })

  const buildParams = (filters: typeof filterRef.current, pg: number) => {
    const params = new URLSearchParams()
    params.set('limit', String(PAGE_SIZE))
    params.set('page', String(pg))
    if (filters.search) params.set('search', filters.search)
    filters.categories.forEach((c) => params.append('category', c))
    if (filters.location) params.set('location', filters.location)
    filters.certs.forEach((c) => params.append('certification', c))
    return params.toString()
  }

  const fetchPage = useCallback(async (filters: typeof filterRef.current, pg: number, append: boolean) => {
    if (append) setLoadingMore(true)
    else setLoading(true)

    try {
      const res = await fetch(`/api/suppliers?${buildParams(filters, pg)}`)
      const data = await res.json()
      if (data.success) {
        const items: Supplier[] = data.data.suppliers || []
        setTotal(data.data.pagination?.total ?? 0)
        setSuppliers((prev) => (append ? [...prev, ...items] : items))
        setPage(pg)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  // Re-fetch from page 1 when filters change
  useEffect(() => {
    const filters = {
      search: activeSearch,
      categories: selectedCategories,
      location: selectedLocation,
      certs: selectedCerts,
    }
    filterRef.current = filters
    fetchPage(filters, 1, false)
  }, [activeSearch, selectedCategories, selectedLocation, selectedCerts, fetchPage])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setActiveSearch(searchInput.trim())
  }

  const handleAiSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (aiQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(aiQuery.trim())}`)
    }
  }

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const toggleCert = (cert: string) => {
    setSelectedCerts((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    )
  }

  const loadMore = () => {
    fetchPage(filterRef.current, page + 1, true)
  }

  const hasMore = suppliers.length < total

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
              <p className="text-lg text-gray-600 font-medium max-w-xl">
                Browse {total > 0 ? `${total}+` : ''} verified suppliers, manufacturers, and logistics partners.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="bg-white border-2 border-black p-3 text-center neo-shadow min-w-[100px]">
                <div className="text-2xl font-bold font-display">{loading ? '—' : total}</div>
                <div className="text-[10px] font-bold uppercase text-gray-500">Suppliers</div>
              </div>
              <div className="bg-white border-2 border-black p-3 text-center neo-shadow min-w-[100px]">
                <div className="text-2xl font-bold font-display">UK+EU</div>
                <div className="text-[10px] font-bold uppercase text-gray-500">Coverage</div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative max-w-full z-10">
            <div className="flex flex-col md:flex-row gap-0 md:gap-4">
              <div className="flex-1 bg-white border-2 border-black neo-shadow p-1 flex items-center relative">
                <Search className="w-5 h-5 ml-4 text-gray-400 absolute" />
                <input
                  type="text"
                  placeholder="Search by name, category, or capability..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-transparent border-none focus:outline-none font-medium text-lg placeholder:text-gray-400"
                />
              </div>
              <div className="flex gap-2 mt-2 md:mt-0">
                <button
                  type="submit"
                  className="px-8 py-3 bg-cyan text-black border-2 border-black font-bold uppercase text-sm hover:bg-black hover:text-cyan transition-colors neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                >
                  Search
                </button>
                {activeSearch && (
                  <button
                    type="button"
                    onClick={() => { setSearchInput(''); setActiveSearch('') }}
                    className="px-4 py-3 bg-white border-2 border-black font-bold text-sm hover:bg-gray-50 neo-shadow"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">

        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden lg:block w-72 shrink-0 space-y-8">

          {/* AI Filter Widget */}
          <div className="bg-black text-white p-6 border-2 border-black neo-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-20">
              <Sparkles className="w-16 h-16 rotate-12" />
            </div>
            <div className="relative z-10">
              <h3 className="font-display text-xl font-bold uppercase mb-2 flex items-center gap-2">
                <Bot className="w-5 h-5" />
                AI Assistant
              </h3>
              <p className="text-xs text-gray-300 mb-4 font-medium">Describe your project needs and let our AI match you with the perfect partner.</p>
              <form onSubmit={handleAiSearch}>
                <textarea
                  className="w-full bg-white/10 border border-white/30 rounded p-2 text-sm text-white placeholder:text-gray-500 mb-3 focus:outline-none focus:border-cyan transition-colors resize-none"
                  rows={3}
                  placeholder="e.g. I need 5000 glass bottles with custom embossing delivered to Bristol by Sept..."
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="block w-full bg-cyan text-black text-xs font-bold uppercase py-2 text-center hover:bg-white transition-colors border border-transparent hover:border-black"
                >
                  Find Matches
                </button>
              </form>
            </div>
          </div>

          {/* Filter Group: Category */}
          <div>
            <h3 className="font-bold uppercase border-b-2 border-black pb-2 mb-4 flex justify-between">
              Category
              <ChevronDown className="w-4 h-4" />
            </h3>
            <div className="space-y-3">
              {CATEGORIES.map((cat) => (
                <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                    className="w-5 h-5 border-2 border-black accent-black"
                  />
                  <span className="text-sm font-medium group-hover:text-gray-600">
                    {SUPPLIER_CATEGORY_LABELS[cat]}
                  </span>
                </label>
              ))}
              {selectedCategories.length > 0 && (
                <button
                  onClick={() => setSelectedCategories([])}
                  className="text-xs font-bold text-gray-500 underline mt-1"
                >
                  Clear categories
                </button>
              )}
            </div>
          </div>

          {/* Filter Group: Location */}
          <div>
            <h3 className="font-bold uppercase border-b-2 border-black pb-2 mb-4">Location</h3>
            <div className="relative">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full appearance-none bg-white border-2 border-black px-4 py-2 pr-8 text-sm font-medium focus:outline-none"
              >
                <option value="">Any Location</option>
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
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
              {CERTIFICATIONS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => toggleCert(value)}
                  className={`px-3 py-1 text-xs font-bold border transition-colors ${
                    selectedCerts.includes(value)
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 hover:border-black hover:bg-black hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Active filters indicator */}
          {(selectedCategories.length > 0 || selectedLocation || selectedCerts.length > 0 || activeSearch) && (
            <button
              onClick={() => {
                setSelectedCategories([])
                setSelectedLocation('')
                setSelectedCerts([])
                setSearchInput('')
                setActiveSearch('')
              }}
              className="w-full py-2 border-2 border-black font-bold text-sm uppercase hover:bg-black hover:text-white transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </aside>

        {/* Results Grid */}
        <div className="flex-1">

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-200">
            <div className="text-sm font-medium text-gray-500">
              {loading ? (
                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</span>
              ) : (
                <>Showing <span className="text-black font-bold">{suppliers.length}</span> of <span className="text-black font-bold">{total}</span> suppliers</>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-[1px] bg-gray-300 mx-2"></div>
              <div className="flex gap-1">
                <button className="w-8 h-8 flex items-center justify-center border-2 border-black bg-black text-white">
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 flex items-center justify-center border-2 border-transparent hover:border-gray-200">
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
            </div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-24 bg-gray-50 border-2 border-black">
              <SlidersHorizontal className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="font-display text-2xl font-bold uppercase mb-2">No suppliers found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your filters or search terms.</p>
              <button
                onClick={() => {
                  setSelectedCategories([])
                  setSelectedLocation('')
                  setSelectedCerts([])
                  setSearchInput('')
                  setActiveSearch('')
                }}
                className="px-6 py-2 bg-black text-white font-bold uppercase text-sm hover:bg-gray-800"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suppliers.map((supplier, index) => (
                <SupplierCard
                  key={supplier.id}
                  supplier={supplier}
                  badge={index === 0 && page === 1 ? 'top' : index === 1 && page === 1 ? 'trending' : null}
                />
              ))}
            </div>
          )}

          {/* Load More */}
          {hasMore && !loading && (
            <div className="mt-12 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-12 py-4 bg-white border-2 border-black font-bold uppercase tracking-widest text-sm hover:bg-black hover:text-white transition-all neo-shadow active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60 flex items-center gap-3"
              >
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                {loadingMore ? 'Loading...' : 'Load More Suppliers'}
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
