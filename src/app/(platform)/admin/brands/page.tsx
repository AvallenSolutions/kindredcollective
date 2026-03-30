'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Building2, Plus, Pencil, Trash2, Search, ArrowLeft, Eye, EyeOff, CheckCircle, ShieldCheck, ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Brand {
  id: string
  name: string
  slug: string
  category: string
  categories: string[]
  location: string | null
  isPublic: boolean
  isVerified: boolean
  createdAt: string
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })

  useEffect(() => {
    fetchBrands()
  }, [search, pagination.page])

  async function fetchBrands() {
    setLoading(true)
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: '20',
    })
    if (search) params.set('search', search)

    const res = await fetch(`/api/admin/brands?${params}`)
    const data = await res.json()

    if (data.success) {
      setBrands(data.data.brands || [])
      setPagination(prev => ({
        ...prev,
        total: data.data.pagination.total,
        totalPages: data.data.pagination.totalPages,
      }))
    }
    setLoading(false)
  }

  async function deleteBrand(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return

    const res = await fetch(`/api/admin/brands/${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchBrands()
    } else {
      alert('Failed to delete brand')
    }
  }

  async function toggleVisibility(id: string, currentlyPublic: boolean) {
    const res = await fetch(`/api/admin/brands/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: !currentlyPublic }),
    })
    if (res.ok) {
      fetchBrands()
    }
  }

  async function toggleVerified(id: string, currentlyVerified: boolean) {
    const res = await fetch(`/api/admin/brands/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isVerified: !currentlyVerified }),
    })
    if (res.ok) {
      fetchBrands()
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
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Brands</h1>
          <p className="text-gray-600">Manage platform brands</p>
        </div>
        <Link
          href="/admin/brands/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-yellow border-2 border-black font-bold uppercase text-sm neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
        >
          <Plus className="w-4 h-4" /> Add Brand
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
            />
          </div>
        </div>
      </div>

      {/* Brands Table */}
      <div className="bg-white border-2 border-black neo-shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-black">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">Brand</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">Category</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">Location</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : brands.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No brands found
                  </td>
                </tr>
              ) : (
                brands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold">{brand.name}</p>
                        <p className="text-sm text-gray-500">/{brand.slug}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {(brand.categories && brand.categories.length > 0 ? brand.categories : [brand.category]).join(', ')}
                    </td>
                    <td className="px-6 py-4 text-sm">{brand.location || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {brand.isPublic ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-green-100 text-green-800 border border-green-800">
                            <Eye className="w-3 h-3" /> Public
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-gray-100 text-gray-800 border border-gray-800">
                            <EyeOff className="w-3 h-3" /> Hidden
                          </span>
                        )}
                        {brand.isVerified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-cyan text-black border border-black">
                            <CheckCircle className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleVerified(brand.id, brand.isVerified)}
                          className={cn(
                            'p-2 border-2 border-black transition-colors',
                            brand.isVerified ? 'bg-cyan hover:bg-gray-100' : 'hover:bg-cyan'
                          )}
                          title={brand.isVerified ? 'Remove verification' : 'Verify brand'}
                        >
                          {brand.isVerified ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => toggleVisibility(brand.id, brand.isPublic)}
                          className="p-2 border-2 border-black hover:bg-gray-100 transition-colors"
                          title={brand.isPublic ? 'Hide' : 'Show'}
                        >
                          {brand.isPublic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <Link
                          href={`/admin/brands/${brand.id}`}
                          className="p-2 border-2 border-black hover:bg-cyan transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => deleteBrand(brand.id, brand.name)}
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
