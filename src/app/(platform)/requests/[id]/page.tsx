'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, MapPin, Calendar, DollarSign, Wifi, CheckCircle,
  XCircle, ChevronDown, Loader2, ExternalLink, Mail
} from 'lucide-react'
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

interface RFPSupplierResponse {
  id: string
  message: string
  status: 'PENDING' | 'SHORTLISTED' | 'REJECTED'
  createdAt: string
  supplier: {
    id: string
    companyName: string
    slug: string
    logoUrl: string | null
    category: SupplierCategory
    tagline: string | null
    isVerified: boolean
    contactEmail?: string | null
    contactName?: string | null
  }
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
  status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'AWARDED'
  createdAt: string
  brand: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    location: string | null
    isVerified: boolean
  }
  responses: RFPSupplierResponse[] | number
}

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-lime border-black text-black',
  CLOSED: 'bg-gray-200 border-gray-400 text-gray-700',
  AWARDED: 'bg-cyan border-black text-black',
  DRAFT: 'bg-yellow-100 border-yellow-500 text-yellow-800',
}

const RESPONSE_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-white border-gray-300 text-gray-600',
  SHORTLISTED: 'bg-lime border-lime-700 text-lime-900',
  REJECTED: 'bg-red-50 border-red-300 text-red-700',
}

export default function RFPDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [rfp, setRfp] = useState<RFP | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const [statusUpdating, setStatusUpdating] = useState(false)

  useEffect(() => {
    fetch(`/api/requests/${id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null }
        return r.json()
      })
      .then(data => {
        if (!data) return
        setRfp(data.data.rfp)
        setIsOwner(data.data.isOwner)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  async function submitResponse(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    if (!message.trim()) return setSubmitError('Please enter a message')
    setSubmitting(true)
    try {
      const res = await fetch(`/api/requests/${id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const data = await res.json()
      if (!res.ok) return setSubmitError(data.error || 'Something went wrong')
      setSubmitted(true)
      setMessage('')
    } catch {
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function updateResponseStatus(responseId: string, status: string) {
    const res = await fetch(`/api/requests/${id}/responses/${responseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) return
    const data = await res.json()
    setRfp(prev => {
      if (!prev || typeof prev.responses === 'number') return prev
      return {
        ...prev,
        responses: prev.responses.map(r =>
          r.id === responseId ? { ...r, status: data.data.response.status } : r
        ),
      }
    })
  }

  async function updateRFPStatus(status: string) {
    setStatusUpdating(true)
    const res = await fetch(`/api/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setRfp(prev => prev ? { ...prev, status: status as RFP['status'] } : prev)
    }
    setStatusUpdating(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  )

  if (notFound || !rfp) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="font-display text-2xl font-bold">Request not found</h1>
      <Link href="/requests"><Button variant="outline">Back to Requests</Button></Link>
    </div>
  )

  const responses = Array.isArray(rfp.responses) ? rfp.responses : []
  const responseCount = typeof rfp.responses === 'number' ? rfp.responses : responses.length
  const isOpen = rfp.status === 'OPEN'

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-white border-b-4 border-black py-8">
        <div className="section-container">
          <Link href="/requests" className="inline-flex items-center gap-2 text-sm font-bold mb-5 hover:underline">
            <ArrowLeft className="w-4 h-4" />
            All Requests
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={cn('text-xs font-bold uppercase px-2 py-0.5 border-2', STATUS_STYLES[rfp.status])}>
                  {rfp.status}
                </span>
                <Badge variant="outline">{SUPPLIER_CATEGORY_LABELS[rfp.category]}</Badge>
              </div>
              <h1 className="font-display text-display-sm font-bold mb-2">{rfp.title}</h1>
              <div className="flex items-center gap-2">
                {rfp.brand.logoUrl && (
                  <div className="w-6 h-6 border border-black overflow-hidden">
                    <Image src={rfp.brand.logoUrl} alt={rfp.brand.name} width={24} height={24} className="object-contain" />
                  </div>
                )}
                <span className="text-sm font-medium">{rfp.brand.name}</span>
                {rfp.brand.isVerified && <span className="text-xs bg-cyan px-1 border border-black">Verified</span>}
                <span className="text-sm text-gray-400">·</span>
                <span className="text-sm text-gray-500">
                  Posted {timeAgo(rfp.createdAt)}
                </span>
              </div>
            </div>

            {/* Owner controls */}
            {isOwner && isOpen && (
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateRFPStatus('AWARDED')}
                  disabled={statusUpdating}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Mark Awarded
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateRFPStatus('CLOSED')}
                  disabled={statusUpdating}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Close Request
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="section-container py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className="flex-1 space-y-6">
            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-display font-bold text-lg mb-3">The Brief</h2>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{rfp.description}</p>
              </CardContent>
            </Card>

            {/* Supplier: submit expression of interest */}
            {!isOwner && (
              <Card>
                <CardContent className="p-6">
                  {submitted ? (
                    <div className="text-center py-6">
                      <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
                      <h3 className="font-display font-bold text-lg mb-1">Response submitted!</h3>
                      <p className="text-sm text-gray-600">
                        The brand will review your message and get in touch if they&apos;re interested.
                      </p>
                    </div>
                  ) : !isOpen ? (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm font-medium">This request is no longer accepting responses.</p>
                    </div>
                  ) : (
                    <form onSubmit={submitResponse}>
                      <h2 className="font-display font-bold text-lg mb-1">Submit Expression of Interest</h2>
                      <p className="text-sm text-gray-600 mb-4">
                        Tell the brand why you&apos;re a great fit. Keep it concise — they&apos;ll follow up if interested.
                      </p>
                      <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Briefly describe your experience, relevant capabilities, and why you'd be a good fit for this request..."
                        rows={5}
                        className="w-full border-2 border-black px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none mb-3"
                      />
                      {submitError && (
                        <p className="text-sm text-red-600 mb-3">{submitError}</p>
                      )}
                      <Button type="submit" variant="primary" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Response'}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Owner: view responses */}
            {isOwner && (
              <div>
                <h2 className="font-display font-bold text-lg uppercase tracking-wide mb-3">
                  Responses ({responseCount})
                </h2>
                {responses.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                      <p className="text-sm">No responses yet. Share your request to reach more suppliers.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {responses.map(response => (
                      <Card key={response.id}>
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 border-2 border-black bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                              {response.supplier.logoUrl ? (
                                <Image
                                  src={response.supplier.logoUrl}
                                  alt={response.supplier.companyName}
                                  width={48}
                                  height={48}
                                  className="object-contain w-full h-full"
                                />
                              ) : (
                                <span className="font-display font-bold">
                                  {response.supplier.companyName[0]}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="font-display font-bold">{response.supplier.companyName}</h3>
                                {response.supplier.isVerified && (
                                  <span className="text-xs bg-cyan px-1 border border-black">Verified</span>
                                )}
                                <span className={cn(
                                  'text-xs font-bold px-2 py-0.5 border',
                                  RESPONSE_STATUS_STYLES[response.status]
                                )}>
                                  {response.status}
                                </span>
                                <span className="text-xs text-gray-400 ml-auto">
                                  {timeAgo(response.createdAt)}
                                </span>
                              </div>
                              {response.supplier.tagline && (
                                <p className="text-xs text-gray-500 mb-2">{response.supplier.tagline}</p>
                              )}
                              <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3">{response.message}</p>

                              <div className="flex flex-wrap gap-2">
                                <Link href={`/explore/${response.supplier.slug}`} target="_blank">
                                  <Button variant="outline" size="sm">
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    View Profile
                                  </Button>
                                </Link>
                                {response.status === 'SHORTLISTED' && response.supplier.contactEmail && (
                                  <a href={`mailto:${response.supplier.contactEmail}`}>
                                    <Button variant="primary" size="sm">
                                      <Mail className="w-3 h-3 mr-1" />
                                      Contact
                                    </Button>
                                  </a>
                                )}
                                {response.status !== 'SHORTLISTED' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateResponseStatus(response.id, 'SHORTLISTED')}
                                    className="border-lime-500 text-lime-700 hover:bg-lime"
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Shortlist
                                  </Button>
                                )}
                                {response.status !== 'REJECTED' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateResponseStatus(response.id, 'REJECTED')}
                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                  >
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Reject
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:w-72 shrink-0 space-y-4">
            {/* Details */}
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="font-display font-bold text-sm uppercase tracking-wide">Details</h3>
                <div className="space-y-2 text-sm">
                  {rfp.budget && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">Budget</p>
                        <p className="font-medium">{rfp.budget}</p>
                      </div>
                    </div>
                  )}
                  {rfp.deadline && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">Deadline</p>
                        <p className="font-medium">
                          {new Date(rfp.deadline).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                  {rfp.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">Location</p>
                        <p className="font-medium">{rfp.location}</p>
                      </div>
                    </div>
                  )}
                  {rfp.isRemoteOk && (
                    <div className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-gray-400 shrink-0" />
                      <p className="font-medium">Remote suppliers welcome</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Posted by */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-display font-bold text-sm uppercase tracking-wide mb-3">Posted by</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border-2 border-black bg-gray-100 flex items-center justify-center overflow-hidden">
                    {rfp.brand.logoUrl ? (
                      <Image
                        src={rfp.brand.logoUrl}
                        alt={rfp.brand.name}
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    ) : (
                      <span className="font-display font-bold">{rfp.brand.name[0]}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{rfp.brand.name}</p>
                    {rfp.brand.location && (
                      <p className="text-xs text-gray-500">{rfp.brand.location}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}
