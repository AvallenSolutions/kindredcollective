import Link from 'next/link'
import { Search, SlidersHorizontal, Bot, Sparkles, ChevronDown, LayoutGrid, List, Zap } from 'lucide-react'
import { SupplierCard } from '@/components/suppliers/supplier-card'
import { createAdminClient } from '@/lib/supabase/admin'
import { SUPPLIER_CATEGORY_LABELS } from '@/types/database'
import type { SupplierCategory } from '@prisma/client'

// Force dynamic rendering to always fetch fresh data from Supabase
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getSuppliers() {
  try {
    // Use admin client to bypass RLS for public read operations
    const supabase = createAdminClient()

    // Query all public suppliers from database
    const { data: suppliers, error } = await supabase
      .from('Supplier')
      .select('id, companyName, slug, tagline, description, logoUrl, category, services, location, country, isVerified, isPublic, createdAt')
      .eq('isPublic', true)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching suppliers:', error)
      return []
    }

    if (!suppliers || suppliers.length === 0) {
      console.log('No suppliers found in database')
      return []
    }

    console.log(`Found ${suppliers.length} public suppliers in database`)
    return suppliers
  } catch (err) {
    console.error('Failed to connect to Supabase:', err)
    return []
  }
}

export default async function ExplorePage() {
  const suppliers = await getSuppliers()

  // Get category counts
  const categoryCounts: Record<string, number> = {}
  suppliers.forEach((s) => {
    categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1
  })

  const categories: { key: SupplierCategory; count: number }[] = [
    { key: 'PACKAGING', count: categoryCounts['PACKAGING'] || 0 },
    { key: 'LOGISTICS', count: categoryCounts['LOGISTICS'] || 0 },
    { key: 'CO_PACKING', count: categoryCounts['CO_PACKING'] || 0 },
    { key: 'DESIGN', count: categoryCounts['DESIGN'] || 0 },
    { key: 'DISTRIBUTION', count: categoryCounts['DISTRIBUTION'] || 0 },
  ]

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
                  className="w-full pl-12 pr-4 py-3 bg-transparent border-none focus:outline-none font-medium text-lg placeholder:text-gray-400"
                />
              </div>
              <div className="flex gap-2 mt-2 md:mt-0">
                <button className="px-6 py-3 bg-white border-2 border-black font-bold uppercase text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 whitespace-nowrap neo-shadow">
                  <SlidersHorizontal className="w-4 h-4" /> Filters
                </button>
                <Link
                  href="/search"
                  className="px-8 py-3 bg-cyan text-black border-2 border-black font-bold uppercase text-sm hover:bg-black hover:text-cyan transition-colors neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                >
                  Search
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
              <textarea
                className="w-full bg-white/10 border border-white/30 rounded p-2 text-sm text-white placeholder:text-gray-500 mb-3 focus:outline-none focus:border-cyan transition-colors resize-none"
                rows={3}
                placeholder="e.g. I need 5000 glass bottles with custom embossing delivered to Bristol by Sept..."
              ></textarea>
              <Link
                href="/search"
                className="block w-full bg-cyan text-black text-xs font-bold uppercase py-2 text-center hover:bg-white transition-colors border border-transparent hover:border-black"
              >
                Find Matches
              </Link>
            </div>
          </div>

          {/* Filter Group: Category */}
          <div>
            <h3 className="font-bold uppercase border-b-2 border-black pb-2 mb-4 flex justify-between">
              Category
              <ChevronDown className="w-4 h-4" />
            </h3>
            <div className="space-y-3">
              {categories.map((cat) => (
                <label key={cat.key} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-5 h-5 border-2 border-black appearance-none checked:bg-black" />
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
              <select className="w-full appearance-none bg-white border-2 border-black px-4 py-2 pr-8 text-sm font-medium focus:outline-none">
                <option>Any Location</option>
                <option>United Kingdom</option>
                <option>Europe (EU)</option>
                <option>France</option>
                <option>Germany</option>
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
              <button className="px-3 py-1 text-xs font-bold border border-gray-300 hover:border-black hover:bg-black hover:text-white transition-colors">Organic</button>
              <button className="px-3 py-1 text-xs font-bold border border-gray-300 hover:border-black hover:bg-black hover:text-white transition-colors">B-Corp</button>
              <button className="px-3 py-1 text-xs font-bold border border-gray-300 hover:border-black hover:bg-black hover:text-white transition-colors">Fair Trade</button>
            </div>
          </div>

        </aside>

        {/* Results Grid */}
        <div className="flex-1">

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-200">
            <div className="text-sm font-medium text-gray-500">
              Showing <span className="text-black font-bold">{suppliers.length}</span> suppliers
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase hidden sm:inline-block">Sort by:</span>
              <div className="relative">
                <select className="appearance-none bg-transparent font-bold text-sm pr-6 cursor-pointer focus:outline-none">
                  <option>Recommended</option>
                  <option>Newest Added</option>
                  <option>A-Z</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((supplier, index) => (
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                badge={index === 0 ? 'top' : index === 1 ? 'trending' : null}
              />
            ))}
          </div>

          {/* Pagination */}
          {suppliers.length > 12 && (
            <div className="mt-12 flex justify-center">
              <button className="px-12 py-4 bg-white border-2 border-black font-bold uppercase tracking-widest text-sm hover:bg-black hover:text-white transition-all neo-shadow active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
                Load More Suppliers
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
