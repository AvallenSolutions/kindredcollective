'use client'

import { useState, useMemo } from 'react'
import { Sparkles, Search, ArrowRight, Loader2, Zap, MessageSquare } from 'lucide-react'
import { Badge, Button, Input, Card, CardContent } from '@/components/ui'
import { SupplierCard } from '@/components/suppliers'
import { BrandCard } from '@/components/brands'
import { suppliers } from '../../../../prisma/seed-data'
import { brands } from '../../../../prisma/seed-brands'
import { cn } from '@/lib/utils'

// Transform data
const supplierData = suppliers.map((s, index) => ({
  id: `supplier-${index}`,
  ...s,
  logoUrl: null,
}))

const brandData = brands.map((b, index) => ({
  id: `brand-${index}`,
  ...b,
  logoUrl: null,
  heroImageUrl: null,
}))

// Sample queries for inspiration
const sampleQueries = [
  'Glass bottle suppliers with embossing capabilities in the UK',
  'Organic ingredient suppliers with low minimum orders',
  'PR agencies specializing in spirits launches',
  'Contract distillers that offer recipe development',
  'Sustainable packaging options for gin brands',
  'Design agencies with experience in craft beer',
]

// Simulated AI search function
function simulateAISearch(query: string) {
  const queryLower = query.toLowerCase()

  // Simple keyword matching for demo
  const matchingSuppliers = supplierData.filter((s) => {
    const text = `${s.companyName} ${s.tagline} ${s.description} ${s.services.join(' ')} ${s.category}`.toLowerCase()
    const words = queryLower.split(' ').filter(w => w.length > 2)
    return words.some(word => text.includes(word))
  }).slice(0, 6)

  const matchingBrands = brandData.filter((b) => {
    const text = `${b.name} ${b.tagline} ${b.description} ${b.category} ${b.subcategories.join(' ')}`.toLowerCase()
    const words = queryLower.split(' ').filter(w => w.length > 2)
    return words.some(word => text.includes(word))
  }).slice(0, 3)

  return { suppliers: matchingSuppliers, brands: matchingBrands }
}

export default function AISearchPage() {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [results, setResults] = useState<{ suppliers: typeof supplierData; brands: typeof brandData }>({
    suppliers: [],
    brands: [],
  })

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query
    if (!q.trim()) return

    setIsSearching(true)
    setQuery(q)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const searchResults = simulateAISearch(q)
    setResults(searchResults)
    setHasSearched(true)
    setIsSearching(false)
  }

  const handleSampleQuery = (sampleQuery: string) => {
    setQuery(sampleQuery)
    handleSearch(sampleQuery)
  }

  const totalResults = results.suppliers.length + results.brands.length

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-black text-white py-16 lg:py-24 border-b-4 border-cyan">
        <div className="section-container">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="cyan" className="mb-6">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered Search
            </Badge>
            <h1 className="font-display text-display-sm lg:text-display-md mb-6">
              Search Like You Think
            </h1>
            <p className="text-lg text-gray-400 mb-8">
              Describe what you&apos;re looking for in plain English. Our AI will find
              the perfect suppliers and brands for your needs.
            </p>

            {/* Search Input */}
            <div className="relative">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="e.g., Organic botanicals suppliers with low MOQs..."
                    className="w-full h-14 pl-12 pr-4 text-lg bg-white text-black border-3 border-cyan placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan focus:ring-offset-2 focus:ring-offset-black"
                  />
                </div>
                <Button
                  size="lg"
                  className="h-14 px-8"
                  onClick={() => handleSearch()}
                  disabled={isSearching || !query.trim()}
                >
                  {isSearching ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Search
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Sample Queries */}
            {!hasSearched && (
              <div className="mt-8">
                <p className="text-sm text-gray-500 mb-3">Try these examples:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {sampleQueries.slice(0, 3).map((sample) => (
                    <button
                      key={sample}
                      onClick={() => handleSampleQuery(sample)}
                      className="px-3 py-1.5 text-sm bg-white/10 border border-white/20 text-white/80 hover:bg-cyan hover:text-black hover:border-cyan transition-colors"
                    >
                      {sample.length > 40 ? sample.slice(0, 40) + '...' : sample}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results or Empty State */}
      {hasSearched ? (
        <section className="section-container py-8 lg:py-12">
          {/* AI Response Header */}
          <Card className="mb-8 border-cyan">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-cyan border-2 border-black flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-display font-bold mb-1">Kindred AI</p>
                  {totalResults > 0 ? (
                    <p className="text-gray-600">
                      I found <strong>{results.suppliers.length} suppliers</strong>
                      {results.brands.length > 0 && (
                        <> and <strong>{results.brands.length} brands</strong></>
                      )}{' '}
                      matching your search for &quot;{query}&quot;.
                      {results.suppliers.length > 0 && (
                        <> Here are the most relevant results based on your criteria.</>
                      )}
                    </p>
                  ) : (
                    <p className="text-gray-600">
                      I couldn&apos;t find exact matches for &quot;{query}&quot;. Try rephrasing
                      your search or browse our{' '}
                      <a href="/explore" className="text-cyan hover:underline">
                        full supplier directory
                      </a>
                      .
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supplier Results */}
          {results.suppliers.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-bold">
                  Matching Suppliers ({results.suppliers.length})
                </h2>
                <a
                  href="/explore"
                  className="text-sm font-bold text-cyan hover:underline"
                >
                  View All Suppliers →
                </a>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.suppliers.map((supplier) => (
                  <SupplierCard key={supplier.id} supplier={supplier} />
                ))}
              </div>
            </div>
          )}

          {/* Brand Results */}
          {results.brands.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-bold">
                  Related Brands ({results.brands.length})
                </h2>
                <a
                  href="/community/brands"
                  className="text-sm font-bold text-cyan hover:underline"
                >
                  View All Brands →
                </a>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.brands.map((brand) => (
                  <BrandCard key={brand.id} brand={brand} />
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {totalResults === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                Try a different search or explore our directories:
              </p>
              <div className="flex gap-4 justify-center">
                <a href="/explore">
                  <Button variant="outline">Browse Suppliers</Button>
                </a>
                <a href="/community/brands">
                  <Button variant="outline">Browse Brands</Button>
                </a>
              </div>
            </div>
          )}

          {/* Refine Search */}
          <Card className="bg-gray-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                <span className="font-display font-bold">Refine Your Search</span>
              </div>
              <div className="flex gap-3">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Add more details to your search..."
                  className="flex-1"
                />
                <Button onClick={() => handleSearch()} disabled={isSearching}>
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Search Again'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : (
        /* Initial State - How It Works */
        <section className="section-container py-12 lg:py-16">
          <h2 className="font-display text-2xl font-bold text-center mb-12">
            How AI Search Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-cyan border-3 border-black mx-auto mb-4 flex items-center justify-center">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="font-display text-lg font-bold mb-2">
                  1. Describe Your Needs
                </h3>
                <p className="text-sm text-gray-600">
                  Type what you&apos;re looking for in natural language, just like you&apos;d
                  explain it to a colleague.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-lime border-3 border-black mx-auto mb-4 flex items-center justify-center">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="font-display text-lg font-bold mb-2">
                  2. AI Understands Context
                </h3>
                <p className="text-sm text-gray-600">
                  Our AI interprets your query and understands the nuances of what
                  you&apos;re actually looking for.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-coral border-3 border-black mx-auto mb-4 flex items-center justify-center text-white">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="font-display text-lg font-bold mb-2">
                  3. Get Matched Results
                </h3>
                <p className="text-sm text-gray-600">
                  Receive a curated list of suppliers and brands that best match
                  your specific requirements.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* More Sample Queries */}
          <div className="mt-16">
            <h3 className="font-display text-lg font-bold text-center mb-6">
              Example Searches
            </h3>
            <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {sampleQueries.map((sample) => (
                <button
                  key={sample}
                  onClick={() => handleSampleQuery(sample)}
                  className="p-4 text-left bg-white border-3 border-black shadow-brutal hover:shadow-brutal-lg hover:-translate-y-1 transition-all"
                >
                  <span className="text-sm text-gray-600">&quot;{sample}&quot;</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
