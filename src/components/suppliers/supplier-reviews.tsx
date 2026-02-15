'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Star,
  ThumbsUp,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Send,
  MessageSquarePlus,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

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
  isVerified: boolean
  createdAt: string
  brand: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
  } | null
}

interface ReviewStats {
  totalReviews: number
  averageRating: number | null
  averageServiceRating: number | null
  averageValueRating: number | null
  recommendPercentage: number | null
}

interface SupplierReviewsProps {
  supplierSlug: string
  supplierName: string
}

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : star <= Math.ceil(rating) && rating % 1 !== 0
                ? 'fill-yellow-400/50 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
    </div>
  )
}

function StarInput({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (val: number) => void
  label: string
}) {
  const [hovered, setHovered] = useState(0)

  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            className="p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                star <= (hovered || value)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-gray-200 text-gray-300'
              }`}
            />
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 text-sm font-bold text-gray-600">{value}/5</span>
        )}
      </div>
    </div>
  )
}

export function SupplierReviews({ supplierSlug, supplierName }: SupplierReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })

  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    content: '',
    wouldRecommend: true,
    serviceRating: 0,
    valueRating: 0,
  })

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '10',
      })

      const res = await fetch(`/api/suppliers/${supplierSlug}/reviews?${params}`)
      const data = await res.json()

      if (data.success) {
        setReviews(data.data.reviews || [])
        setStats(data.data.stats || null)
        setPagination((prev) => ({
          ...prev,
          total: data.data.pagination?.total || 0,
          totalPages: data.data.pagination?.totalPages || 0,
        }))
      }
    } catch {
      // Silently handle fetch error
    } finally {
      setLoading(false)
    }
  }, [supplierSlug, pagination.page])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError('')

    if (formData.rating < 1) {
      setSubmitError('Please select an overall rating')
      return
    }

    if (!formData.content || formData.content.length < 10) {
      setSubmitError('Review content must be at least 10 characters')
      return
    }

    setSubmitting(true)

    try {
      const body: Record<string, unknown> = {
        rating: formData.rating,
        content: formData.content,
        wouldRecommend: formData.wouldRecommend,
      }

      if (formData.title.trim()) body.title = formData.title.trim()
      if (formData.serviceRating > 0) body.serviceRating = formData.serviceRating
      if (formData.valueRating > 0) body.valueRating = formData.valueRating

      const res = await fetch(`/api/suppliers/${supplierSlug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (data.success) {
        setSubmitSuccess(true)
        setFormData({
          rating: 0,
          title: '',
          content: '',
          wouldRecommend: true,
          serviceRating: 0,
          valueRating: 0,
        })
        setTimeout(() => {
          setShowForm(false)
          setSubmitSuccess(false)
          fetchReviews()
        }, 2000)
      } else {
        setSubmitError(data.error || 'Failed to submit review')
      }
    } catch {
      setSubmitError('Failed to submit review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* Section Heading */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold uppercase tracking-tight">
          Reviews
          {stats && stats.totalReviews > 0 && (
            <span className="ml-2 text-gray-400">({stats.totalReviews})</span>
          )}
        </h2>
        <Button
          variant={showForm ? 'outline' : 'primary'}
          size="sm"
          onClick={() => {
            setShowForm(!showForm)
            setSubmitError('')
            setSubmitSuccess(false)
          }}
        >
          {showForm ? (
            <>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <MessageSquarePlus className="w-4 h-4 mr-2" />
              Write a Review
            </>
          )}
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && stats.totalReviews > 0 && (
        <div className="bg-white border-3 border-black p-6 mb-6 shadow-brutal">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Overall Rating */}
            <div className="text-center">
              <p className="font-display text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">
                Overall Rating
              </p>
              <div className="flex items-center justify-center gap-3">
                <span className="font-display text-4xl font-bold">
                  {stats.averageRating?.toFixed(1) || '--'}
                </span>
                <div>
                  <StarRating rating={stats.averageRating || 0} size="md" />
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Recommend */}
            {stats.recommendPercentage !== null && (
              <div className="text-center">
                <p className="font-display text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">
                  Recommend
                </p>
                <div className="flex items-center justify-center gap-2">
                  <ThumbsUp className="w-6 h-6 text-lime-600" />
                  <span className="font-display text-4xl font-bold">{stats.recommendPercentage}%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">would recommend</p>
              </div>
            )}

            {/* Service Rating */}
            {stats.averageServiceRating !== null && (
              <div className="text-center">
                <p className="font-display text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">
                  Service
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-display text-4xl font-bold">
                    {stats.averageServiceRating?.toFixed(1)}
                  </span>
                  <StarRating rating={stats.averageServiceRating || 0} size="sm" />
                </div>
              </div>
            )}

            {/* Value Rating */}
            {stats.averageValueRating !== null && (
              <div className="text-center">
                <p className="font-display text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">
                  Value
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-display text-4xl font-bold">
                    {stats.averageValueRating?.toFixed(1)}
                  </span>
                  <StarRating rating={stats.averageValueRating || 0} size="sm" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Submission Form */}
      {showForm && (
        <Card className="mb-6 hover:translate-y-0 hover:shadow-brutal">
          <CardContent className="p-6">
            <h3 className="font-display text-lg font-bold uppercase tracking-wide mb-4">
              Review {supplierName}
            </h3>

            {submitError && (
              <div className="p-4 mb-4 bg-red-100 border-2 border-red-500 text-red-700 text-sm">
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div className="p-4 mb-4 bg-green-100 border-2 border-green-500 text-green-700 text-sm">
                Review submitted successfully! It is now public.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Overall Rating */}
              <StarInput
                value={formData.rating}
                onChange={(val) => setFormData({ ...formData, rating: val })}
                label="Overall Rating *"
              />

              {/* Title */}
              <div>
                <Label htmlFor="review-title" className="mb-2 block">
                  Review Title
                </Label>
                <Input
                  id="review-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Summarise your experience"
                  maxLength={120}
                />
              </div>

              {/* Content */}
              <div>
                <Label htmlFor="review-content" className="mb-2 block">
                  Your Review *
                </Label>
                <Textarea
                  id="review-content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Share your experience working with this supplier (minimum 10 characters)..."
                  rows={5}
                  error={formData.content.length > 0 && formData.content.length < 10}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.content.length} / 10 characters minimum
                </p>
              </div>

              {/* Service & Value Ratings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <StarInput
                  value={formData.serviceRating}
                  onChange={(val) => setFormData({ ...formData, serviceRating: val })}
                  label="Service Rating"
                />
                <StarInput
                  value={formData.valueRating}
                  onChange={(val) => setFormData({ ...formData, valueRating: val })}
                  label="Value Rating"
                />
              </div>

              {/* Would Recommend */}
              <div>
                <Label className="mb-2 block">Would you recommend this supplier?</Label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, wouldRecommend: true })}
                    className={`flex items-center gap-2 px-4 py-2 border-2 border-black font-bold text-sm uppercase transition-colors ${
                      formData.wouldRecommend
                        ? 'bg-lime text-black'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, wouldRecommend: false })}
                    className={`flex items-center gap-2 px-4 py-2 border-2 border-black font-bold text-sm uppercase transition-colors ${
                      !formData.wouldRecommend
                        ? 'bg-coral text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4 rotate-180" />
                    No
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting || submitSuccess}
                  className="flex-1"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitting ? 'Submitting...' : submitSuccess ? 'Submitted!' : 'Submit Review'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setSubmitError('')
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 border-3 border-dashed border-gray-300 bg-gray-50">
          <Star className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-display text-lg font-bold text-gray-400 uppercase">No reviews yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Be the first to review {supplierName}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white border-2 border-black p-5 shadow-brutal-sm hover:shadow-brutal transition-shadow"
            >
              {/* Review Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display font-bold text-base">{review.reviewerName}</span>
                    {review.isVerified && (
                      <Badge variant="cyan" className="text-[10px]">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  {review.reviewerCompany && (
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">
                      {review.reviewerCompany}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <StarRating rating={review.rating} size="sm" />
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(review.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Title */}
              {review.title && (
                <h4 className="font-display font-bold text-base mb-2">{review.title}</h4>
              )}

              {/* Content */}
              <p className="text-sm text-gray-700 leading-relaxed mb-3">{review.content}</p>

              {/* Supplementary Ratings & Recommend */}
              <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-gray-200">
                {review.serviceRating && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                      Service:
                    </span>
                    <StarRating rating={review.serviceRating} size="sm" />
                  </div>
                )}
                {review.valueRating && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                      Value:
                    </span>
                    <StarRating rating={review.valueRating} size="sm" />
                  </div>
                )}
                {review.wouldRecommend && (
                  <div className="flex items-center gap-1 ml-auto">
                    <ThumbsUp className="w-3.5 h-3.5 text-lime-600" />
                    <span className="text-xs font-bold text-lime-700">Recommends</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t-2 border-gray-200">
          <p className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              <ChevronUp className="w-4 h-4 mr-1 -rotate-90" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
              <ChevronDown className="w-4 h-4 ml-1 -rotate-90" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
