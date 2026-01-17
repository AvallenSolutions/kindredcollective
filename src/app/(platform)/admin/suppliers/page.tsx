'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Store, Plus, Pencil, Trash2, Search, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui'

interface Supplier {
  id: string
  companyName: string
  slug: string
  category: string
  location: string
  isPublic: boolean
  isVerified: boolean
  claimStatus: string
  createdAt: string
}

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })

  useEffect(() => {
    fetchSuppliers()
  }, [search, pagination.page])

  async function fetchSuppliers() {
    setLoading(true)
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: '20',
    })
    if (search) params.set('search', search)

    const res = await fetch(`/api/admin/suppliers?${params}`)
    const data = await res.json()

    if (data.success) {
      setSuppliers(data.data.suppliers || [])
      setPagination(prev => ({
        ...prev,
        total: data.data.pagination.total,
        totalPages: data.data.pagination.totalPages,
      }))
    }
    setLoading(false)
  }

  async function deleteSupplier(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return

    const res = await fetch(`/api/admin/suppliers/${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchSuppliers()
    } else {
      alert('Failed to delete supplier')
    }
  }

  async function toggleVisibility(id: string, currentlyPublic: boolean) {
    const res = await fetch(`/api/admin/suppliers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: !currentlyPublic }),
    })
    if (res.ok) {
      fetchSuppliers()
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
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Suppliers</h1>
          <p className="text-gray-600">Manage platform suppliers</p>
        </div>
        <Link
          href="/admin/suppliers/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-magenta text-white border-2 border-black font-bold uppercase text-sm neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
        >
          <Plus className="w-4 h-4" /> Add Supplier
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
            />
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white border-2 border-black neo-shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-black">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">Company</th>
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
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No suppliers found
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold">{supplier.companyName}</p>
                        <p className="text-sm text-gray-500">/{supplier.slug}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{supplier.category}</td>
                    <td className="px-6 py-4 text-sm">{supplier.location || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {supplier.isPublic ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-green-100 text-green-800 border border-green-800">
                            <Eye className="w-3 h-3" /> Public
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-gray-100 text-gray-800 border border-gray-800">
                            <EyeOff className="w-3 h-3" /> Hidden
                          </span>
                        )}
                        {supplier.isVerified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-cyan text-black border border-black">
                            <CheckCircle className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleVisibility(supplier.id, supplier.isPublic)}
                          className="p-2 border-2 border-black hover:bg-gray-100 transition-colors"
                          title={supplier.isPublic ? 'Hide' : 'Show'}
                        >
                          {supplier.isPublic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <Link
                          href={`/admin/suppliers/${supplier.id}`}
                          className="p-2 border-2 border-black hover:bg-cyan transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => deleteSupplier(supplier.id, supplier.companyName)}
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
