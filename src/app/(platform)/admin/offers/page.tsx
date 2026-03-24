'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Gift, Plus, Pencil, Trash2, Search, ArrowLeft, Eye, Tag } from 'lucide-react'
import { Button } from '@/components/ui'

interface Offer {
  id: string
  title: string
  type: string
  status: string
  discountValue: number | null
  code: string | null
  forBrandsOnly: boolean
  startDate: string | null
  endDate: string | null
  viewCount: number
  claimCount: number
  createdAt: string
  supplier: {
    id: string
    companyName: string
    slug: string
  } | null
}

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })

  useEffect(() => {
    fetchOffers()
  }, [search, statusFilter, pagination.page])

  async function fetchOffers() {
    setLoading(true)
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: '20',
    })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)

    const res = await fetch(`/api/admin/offers?${params}`)
    const data = await res.json()

    if (data.success) {
      setOffers(data.data.offers || [])
      setPagination(prev => ({
        ...prev,
        total: data.data.pagination.total,
        totalPages: data.data.pagination.totalPages,
      }))
    }
    setLoading(false)
  }

  async function deleteOffer(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return

    const res = await fetch(`/api/admin/offers/${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchOffers()
    } else {
      alert('Failed to delete offer')
    }
  }

  function statusColor(status: string) {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-800'
      case 'DRAFT': return 'bg-gray-100 text-gray-800 border-gray-800'
      case 'PAUSED': return 'bg-yellow-100 text-yellow-800 border-yellow-800'
      case 'EXPIRED': return 'bg-red-100 text-red-800 border-red-800'
      default: return 'bg-gray-100 text-gray-800 border-gray-800'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="p-2 border-2 border-black hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Offers</h1>
          <p className="text-gray-600">Manage platform offers and deals</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search offers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="PAUSED">Paused</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      {/* Offers Table */}
      <div className="bg-white border-2 border-black neo-shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-black">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">Offer</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">Type</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">Claims</th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : offers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No offers found
                  </td>
                </tr>
              ) : (
                offers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold">{offer.title}</p>
                        {offer.code && (
                          <p className="text-sm text-gray-500 font-mono">{offer.code}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {offer.supplier?.companyName || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-cyan text-black border border-black">
                        <Tag className="w-3 h-3" /> {offer.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-bold border ${statusColor(offer.status)}`}>
                        {offer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <p>{offer.claimCount} claims</p>
                        <p className="text-gray-500">{offer.viewCount} views</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/offers/${offer.id}`}
                          className="p-2 border-2 border-black hover:bg-cyan transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => deleteOffer(offer.id, offer.title)}
                          className="p-2 border-2 border-black hover:bg-red-500 hover:text-white transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t-2 border-black flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
