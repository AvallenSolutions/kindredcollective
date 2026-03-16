'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Zap, Plus, MapPin, Calendar, DollarSign, Wifi, ChevronDown } from 'lucide-react'
import { Badge, Button, Card, CardContent } from '@/components/ui'
import { SUPPLIER_CATEGORY_LABELS } from '@/types/database'
import type { SupplierCategory } from '@prisma/client'
import { cn } from '@/lib/utils'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

interface RFPBrand {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  category: string
  isVerified: boolean
}

interface RFP {
  id: string
  title: string
  description: string
  category: SupplierCategory
  subcategories: string[]
  budget: string | null
  deadline: string | null
  location: string | null
  isRemoteOk: boolean
  status: string
  createdAt: string
  brand: RFPBrand
  responses: { count: number }[]
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-lime border-lime-700 text-lime-900',
  CLOSED: 'bg-gray-100 border-gray-300 text-gray-600',
  AWARDED: 'bg-cyan border-cyan-700 text-cyan-900',
}

export default function RequestsPage() {
  const [rfps, setRfps] = useState<RFP[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<SupplierCategory | null>(null)
  const [remoteOnly, setRemoteOnly] = useState(false)

  useEffect(() => {
    fetch('/api/requests?limit=50&status=OPEN')
      .then(r => r.json())
      .then(data => setRfps(data.data?.rfps || []))
      .catch(() => setRfps([]))
      .finally(() => setLoading(false))
  }, [])

  const categories = useMemo(() => {
    const cats = new Set<SupplierCategory>()
    rfps.forEach(r => cats.add(r.category))
    return Array.from(cats)
  }, [rfps])

  const filtered = useMemo(() => {
    return rfps.filter(r => {
      if (selectedCategory && r.category !== selectedCategory) return false
      if (remoteOnly && !r.isRemoteOk) return false
      return true
    })
  }, [rfps, selectedCategory, remoteOnly])

  const responseCount = (rfp: RFP) => {
    const first = rfp.responses?.[0]
    if (!first) return 0
    return typeof first === 'object' && 'count' in first ? (first as any).count : 0
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-cyan py-12 border-b-4 border-black">
        <div className="section-container">
          <Badge className="mb-4 bg-black text-cyan border-black">
            <Zap className="w-3 h-3 mr-1" />
            {loading ? '...' : `${rfps.length} Open Request${rfps.length !== 1 ? 's' : ''}`}
          </Badge>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="font-display text-display-sm lg:text-display-md mb-3">
                Requests for Proposal
              </h1>
              <p className="text-lg max-w-2xl">
                Brands looking for suppliers. Browse open briefs and submit your expression of interest.
              </p>
            </div>
            <Link href="/requests/new">
              <Button variant="primary" size="lg" className="shrink-0">
                <Plus className="w-5 h-5 mr-2" />
                Post a Request
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="section-container py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters sidebar */}
          <aside className="lg:w-56 shrink-0">
            <div className="sticky top-24 space-y-6">
              <div>
                <h3 className="font-display font-bold text-sm uppercase tracking-wide mb-3">Category</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm font-medium border-2 transition-colors',
                      !selectedCategory
                        ? 'bg-black text-white border-black'
                        : 'border-transparent hover:border-black'
                    )}
                  >
                    All Categories
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm font-medium border-2 transition-colors',
                        selectedCategory === cat
                          ? 'bg-black text-white border-black'
                          : 'border-transparent hover:border-black'
                      )}
                    >
                      {SUPPLIER_CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-display font-bold text-sm uppercase tracking-wide mb-3">Location</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remoteOnly}
                    onChange={e => setRemoteOnly(e.target.checked)}
                    className="w-4 h-4 border-2 border-black"
                  />
                  <span className="text-sm font-medium">Remote OK</span>
                </label>
              </div>
            </div>
          </aside>

          {/* RFP list */}
          <div className="flex-1">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-40 bg-gray-200 animate-pulse border-2 border-black" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-300">
                <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="font-display font-bold text-lg mb-2">No requests found</h3>
                <p className="text-gray-500 mb-6">
                  {rfps.length === 0
                    ? 'No open requests yet. Be the first to post one!'
                    : 'Try adjusting your filters.'}
                </p>
                <Link href="/requests/new">
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Post a Request
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map(rfp => (
                  <Link key={rfp.id} href={`/requests/${rfp.id}`}>
                    <Card className="hover:shadow-brutal-lg hover:-translate-y-0.5 transition-all cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          {/* Brand logo */}
                          <div className="w-14 h-14 border-2 border-black bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                            {rfp.brand.logoUrl ? (
                              <Image
                                src={rfp.brand.logoUrl}
                                alt={rfp.brand.name}
                                width={56}
                                height={56}
                                className="object-contain w-full h-full"
                              />
                            ) : (
                              <span className="font-display font-bold text-lg">
                                {rfp.brand.name[0]}
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-start gap-2 mb-1">
                              <h2 className="font-display font-bold text-lg leading-tight">{rfp.title}</h2>
                              <span className={cn(
                                'text-xs font-bold uppercase px-2 py-0.5 border',
                                STATUS_COLORS[rfp.status] || STATUS_COLORS.OPEN
                              )}>
                                {rfp.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {rfp.brand.name}
                              {rfp.brand.isVerified && (
                                <span className="ml-1 text-xs bg-cyan px-1 border border-black">Verified</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-700 line-clamp-2 mb-3">{rfp.description}</p>

                            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                              <Badge variant="outline" className="text-xs">
                                {SUPPLIER_CATEGORY_LABELS[rfp.category]}
                              </Badge>
                              {rfp.budget && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  {rfp.budget}
                                </span>
                              )}
                              {rfp.deadline && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(rfp.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              )}
                              {rfp.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {rfp.location}
                                </span>
                              )}
                              {rfp.isRemoteOk && (
                                <span className="flex items-center gap-1">
                                  <Wifi className="w-3 h-3" />
                                  Remote OK
                                </span>
                              )}
                              <span className="ml-auto text-gray-400">
                                {responseCount(rfp)} response{responseCount(rfp) !== 1 ? 's' : ''} ·{' '}
                                {timeAgo(rfp.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
