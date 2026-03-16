'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Loader2, ArrowRight } from 'lucide-react'
import { Badge, Button, Card, CardContent } from '@/components/ui'
import { SupplierCard } from '@/components/suppliers'
import { BrandCard } from '@/components/brands'

interface SearchSupplier {
  id: string
  companyName: string
  slug: string
  tagline: string | null
  category: string
  logoUrl: string | null
  isVerified: boolean
  location: string | null
}

interface SearchBrand {
  id: string
  name: string
  slug: string
  tagline: string | null
  category: string
  logoUrl: string | null
  isVerified: boolean
  location: string | null
}

function SearchPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQ = searchParams.get('q') || ''

  const [input, setInput] = useState(initialQ)
  const [query, setQuery] = useState(initialQ)
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [results, setResults] = useState<{ suppliers: SearchSupplier[]; brands: SearchBrand[] }>({
    suppliers: [],
    brands: [],
  })

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) return
    setIsSearching(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=suppliers&type=brands`)
      const data = await res.json()
      setResults({
        suppliers: data.data?.results?.suppliers || [],
        brands: data.data?.results?.brands || [],
      })
    } catch {
      setResults({ suppliers: [], brands: [] })
    }
    setHasSearched(true)
    setIsSearching(false)
  }, [])

  // Run search when the page loads with a ?q= param
  useEffect(() => {
    if (initialQ) {
      runSearch(initialQ)
    }
  }, [initialQ, runSearch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = input.trim()
    if (!q) return
    setQuery(q)
    router.replace(`/search?q=${encodeURIComponent(q)}`)
    runSearch(q)
  }

  const totalResults = results.suppliers.length + results.brands.length

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-white border-b-4 border-black py-10">
        <div className="section-container max-w-3xl">
          <Badge className="mb-4 bg-black text-white border-black">
            <Search className="w-3 h-3 mr-1" />
            Search
          </Badge>
          <h1 className="font-display text-display-sm font-bold mb-6">Search the Directory</h1>
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search suppliers, brands, services..."
                autoFocus
                className="w-full h-14 pl-12 pr-4 text-base border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="h-14 px-8"
              disabled={isSearching || !input.trim()}
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Search <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </form>
        </div>
      </section>

      {/* Results */}
      <div className="section-container py-8">
        {isSearching ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : hasSearched ? (
          <>
            <p className="text-sm text-gray-500 mb-6">
              {totalResults > 0
                ? <>Found <strong className="text-black">{totalResults} result{totalResults !== 1 ? 's' : ''}</strong> for &ldquo;{query}&rdquo;</>
                : <>No results for &ldquo;{query}&rdquo;</>
              }
            </p>

            {results.suppliers.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-lg uppercase tracking-wide">
                    Suppliers ({results.suppliers.length})
                  </h2>
                  <Link href="/explore" className="text-sm font-bold text-cyan hover:underline">
                    Browse All →
                  </Link>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.suppliers.map((s) => (
                    <SupplierCard
                      key={s.id}
                      supplier={{
                        id: s.id,
                        companyName: s.companyName,
                        slug: s.slug,
                        tagline: s.tagline,
                        description: null,
                        logoUrl: s.logoUrl,
                        category: s.category as import('@prisma/client').SupplierCategory,
                        services: [],
                        location: s.location,
                        country: null,
                        isVerified: s.isVerified,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {results.brands.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-lg uppercase tracking-wide">
                    Brands ({results.brands.length})
                  </h2>
                  <Link href="/community/brands" className="text-sm font-bold text-cyan hover:underline">
                    Browse All →
                  </Link>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.brands.map((b) => (
                    <BrandCard
                      key={b.id}
                      brand={{
                        id: b.id,
                        name: b.name,
                        slug: b.slug,
                        tagline: b.tagline,
                        logoUrl: b.logoUrl,
                        heroImageUrl: null,
                        category: b.category as import('@prisma/client').DrinkCategory,
                        subcategories: [],
                        location: b.location,
                        country: null,
                        yearFounded: null,
                        isVerified: b.isVerified,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {totalResults === 0 && (
              <Card>
                <CardContent className="p-10 text-center">
                  <Search className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-display font-bold text-lg mb-2">No results found</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    Try different keywords, or browse the full directory.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Link href="/explore">
                      <Button variant="outline">Browse Suppliers</Button>
                    </Link>
                    <Link href="/community/brands">
                      <Button variant="outline">Browse Brands</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          /* Pre-search state */
          <div className="text-center py-16 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm">Enter a search term above to find suppliers and brands.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageInner />
    </Suspense>
  )
}
