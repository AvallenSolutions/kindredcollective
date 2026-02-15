'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Star,
  ArrowLeft,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  XCircle,
  MessageSquare,
  Shield,
  Clock,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Review {
  id: string
  reviewerName: string
  reviewerCompany: string | null
  rating: number
  title: string | null
  content: string
  wouldRecommend: boolean
  serviceRating: number | null
  valueRating: number | null
  isPublic: boolean
  isVerified: boolean
  createdAt: string
  supplier: {
    id: string
    companyName: string
    slug: string
  } | null
  brand: {
    id: string
    name: string
    slug: string
  } | null
  user: {
    email: string
  } | null
}

interface Statistics {
  total: number
  published: number
  pending: number
  verified: number
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
    </div>
  )
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [statistics, setStatistics] = useState<Statistics>({ total: 0, published: 0, pending: 0, verified: 0 })
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })
  const [filterPublic, setFilterPublic] = useState<string>('')
  const [filterVerified, setFilterVerified] = useState<string>('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchReviews()
  }, [pagination.page, filterPublic, filterVerified])

  async function fetchReviews() {
    setLoading(true)
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: '20',
    })

    if (filterPublic) params.set('isPublic', filterPublic)
    if (filterVerified) params.set('isVerified', filterVerified)

    try {
      const res = await fetch(`/api/admin/reviews?${params}`)
      const data = await res.json()

      if (data.success) {
        setReviews(data.data.reviews || [])
        setStatistics(data.data.statistics || { total: 0, published: 0, pending: 0, verified: 0 })
        setPagination((prev) => ({
          ...prev,
          total: data.data.pagination?.total || 0,
          totalPages: data.data.pagination?.totalPages || 0,
        }))
      }
    } catch {
      // Handle silently
    } finally {
      setLoading(false)
    }
  }

  async function toggleVisibility(id: string, currentlyPublic: boolean) {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: !currentlyPublic }),
    })
    if (res.ok) {
      fetchReviews()
    }
  }

  async function toggleVerified(id: string, currentlyVerified: boolean) {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isVerified: !currentlyVerified }),
    })
    if (res.ok) {
      fetchReviews()
    }
  }

  async function deleteReview(id: string) {
    const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setDeleteConfirm(null)
      fetchReviews()
    } else {
      alert('Failed to delete review')
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
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Reviews</h1>
          <p className="text-gray-600">Moderate supplier reviews</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border-2 border-black p-5 neo-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan border-2 border-black">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{statistics.total}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white border-2 border-black p-5 neo-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-lime border-2 border-black">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{statistics.published}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Published</p>
            </div>
          </div>
        </div>
        <div className="bg-white border-2 border-black p-5 neo-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-coral border-2 border-black">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{statistics.pending}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Hidden</p>
            </div>
          </div>
        </div>
        <div className="bg-white border-2 border-black p-5 neo-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 border-2 border-black">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{statistics.verified}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Verified</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={filterPublic}
          onChange={(e) => {
            setFilterPublic(e.target.value)
            setPagination((prev) => ({ ...prev, page: 1 }))
          }}
          className="px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
        >
          <option value="">All Visibility</option>
          <option value="true">Published</option>
          <option value="false">Hidden</option>
        </select>
        <select
          value={filterVerified}
          onChange={(e) => {
            setFilterVerified(e.target.value)
            setPagination((prev) => ({ ...prev, page: 1 }))
          }}
          className="px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
        >
          <option value="">All Verification</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>
      </div>

      {/* Reviews Table */}
      <div className="bg-white border-2 border-black neo-shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-black">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">
                  Reviewer
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">
                  Content
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No reviews found
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    {/* Reviewer */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-sm">{review.reviewerName}</p>
                        {review.reviewerCompany && (
                          <p className="text-xs text-gray-500">{review.reviewerCompany}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </td>

                    {/* Supplier */}
                    <td className="px-6 py-4">
                      {review.supplier ? (
                        <Link
                          href={`/admin/suppliers/${review.supplier.id}`}
                          className="text-sm font-bold hover:underline"
                        >
                          {review.supplier.companyName}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>

                    {/* Rating */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <StarDisplay rating={review.rating} />
                        <span className="text-sm font-bold">{review.rating}</span>
                      </div>
                    </td>

                    {/* Content Preview */}
                    <td className="px-6 py-4 max-w-[300px]">
                      {review.title && (
                        <p className="text-sm font-bold truncate mb-0.5">{review.title}</p>
                      )}
                      <p className="text-sm text-gray-600 line-clamp-2">{review.content}</p>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {review.isPublic ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-green-100 text-green-800 border border-green-800">
                            <Eye className="w-3 h-3" /> Public
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-gray-100 text-gray-800 border border-gray-800">
                            <EyeOff className="w-3 h-3" /> Hidden
                          </span>
                        )}
                        {review.isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-cyan text-black border border-black">
                            <CheckCircle className="w-3 h-3" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-800">
                            <XCircle className="w-3 h-3" /> Unverified
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleVisibility(review.id, review.isPublic)}
                          className="p-2 border-2 border-black hover:bg-gray-100 transition-colors"
                          title={review.isPublic ? 'Hide review' : 'Publish review'}
                        >
                          {review.isPublic ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => toggleVerified(review.id, review.isVerified)}
                          className={`p-2 border-2 border-black transition-colors ${
                            review.isVerified
                              ? 'bg-cyan hover:bg-gray-100'
                              : 'hover:bg-cyan'
                          }`}
                          title={review.isVerified ? 'Remove verification' : 'Mark as verified'}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(review.id)}
                          className="p-2 border-2 border-black hover:bg-red-500 hover:text-white transition-colors"
                          title="Delete review"
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
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-black neo-shadow max-w-md w-full">
            <div className="p-6 border-b-2 border-black">
              <h2 className="font-display text-xl font-bold uppercase">Confirm Delete</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700 mb-6">
                Are you sure you want to permanently delete this review? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => deleteReview(deleteConfirm)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
