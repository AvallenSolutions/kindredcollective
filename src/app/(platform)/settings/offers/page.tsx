'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Tag,
  Calendar,
  Hash,
  DollarSign,
  Percent,
  Gift,
  Package,
  Sparkles,
  X,
  Play,
  Pause,
  Eye,
  Users,
} from 'lucide-react'
import {
  Button,
  Input,
  Label,
  Textarea,
  Select,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '@/components/ui'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OfferType =
  | 'PERCENTAGE_DISCOUNT'
  | 'FIXED_DISCOUNT'
  | 'FREE_TRIAL'
  | 'BUNDLE'
  | 'OTHER'

type OfferStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'PAUSED'

interface Offer {
  id: string
  title: string
  description: string | null
  type: OfferType
  discountValue: number | null
  code: string | null
  termsConditions: string | null
  startDate: string | null
  endDate: string | null
  forBrandsOnly: boolean
  minOrderValue: number | null
  imageUrl: string | null
  status: OfferStatus
  claimCount?: number
  createdAt: string
  updatedAt: string
}

interface OfferFormData {
  title: string
  description: string
  type: OfferType
  discountValue: string
  code: string
  termsConditions: string
  startDate: string
  endDate: string
  forBrandsOnly: boolean
  minOrderValue: string
  imageUrl: string
}

const EMPTY_FORM: OfferFormData = {
  title: '',
  description: '',
  type: 'PERCENTAGE_DISCOUNT',
  discountValue: '',
  code: '',
  termsConditions: '',
  startDate: '',
  endDate: '',
  forBrandsOnly: false,
  minOrderValue: '',
  imageUrl: '',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<OfferType, string> = {
  PERCENTAGE_DISCOUNT: 'Percentage Discount',
  FIXED_DISCOUNT: 'Fixed Discount',
  FREE_TRIAL: 'Free Trial',
  BUNDLE: 'Bundle',
  OTHER: 'Other',
}

const TYPE_ICONS: Record<OfferType, React.ReactNode> = {
  PERCENTAGE_DISCOUNT: <Percent className="w-3 h-3" />,
  FIXED_DISCOUNT: <DollarSign className="w-3 h-3" />,
  FREE_TRIAL: <Gift className="w-3 h-3" />,
  BUNDLE: <Package className="w-3 h-3" />,
  OTHER: <Sparkles className="w-3 h-3" />,
}

function getStatusBadge(status: OfferStatus) {
  switch (status) {
    case 'DRAFT':
      return <Badge variant="outline">Draft</Badge>
    case 'ACTIVE':
      return <Badge variant="lime">Active</Badge>
    case 'PAUSED':
      return <Badge variant="coral">Paused</Badge>
    case 'EXPIRED':
      return <Badge className="bg-gray-300 text-gray-700">Expired</Badge>
    default:
      return null
  }
}

function getTypeBadge(type: OfferType) {
  return (
    <Badge variant="cyan" className="gap-1">
      {TYPE_ICONS[type]}
      {TYPE_LABELS[type]}
    </Badge>
  )
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDiscountValue(offer: Offer) {
  if (offer.discountValue == null) return null
  if (offer.type === 'PERCENTAGE_DISCOUNT') return `${offer.discountValue}%`
  if (offer.type === 'FIXED_DISCOUNT') return `$${offer.discountValue}`
  return String(offer.discountValue)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function OffersManagementContent() {
  const searchParams = useSearchParams()
  const queryOrgId = searchParams.get('orgId')

  // Organisation / auth state
  const [orgId, setOrgId] = useState<string | null>(null)
  const [orgName, setOrgName] = useState<string>('')
  const [userRole, setUserRole] = useState<string | null>(null)

  // Offers state
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Filter
  const [statusFilter, setStatusFilter] = useState<'ALL' | OfferStatus>('ALL')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null)
  const [formData, setFormData] = useState<OfferFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ------------------------------------------------------------------
  // Fetch organisation
  // ------------------------------------------------------------------

  useEffect(() => {
    fetchOrganisation()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryOrgId])

  const fetchOrganisation = async () => {
    try {
      const response = await fetch('/api/organisations/my-organisation')
      const data = await response.json()

      if (data.success && data.organisations?.length > 0) {
        // Find supplier org matching the query param, or pick the first supplier org
        const supplierOrgs = data.organisations.filter(
          (org: { type: string }) => org.type === 'SUPPLIER'
        )

        let targetOrg = null
        if (queryOrgId) {
          targetOrg = data.organisations.find(
            (org: { id: string }) => org.id === queryOrgId
          )
        }
        if (!targetOrg && supplierOrgs.length > 0) {
          targetOrg = supplierOrgs[0]
        }

        if (targetOrg) {
          setOrgId(targetOrg.id)
          setOrgName(targetOrg.name)
          setUserRole(targetOrg.userRole)
        } else {
          setError('No supplier organisation found. Please link a supplier to your profile first.')
          setLoading(false)
        }
      } else {
        setError('No organisation found. Please complete onboarding first.')
        setLoading(false)
      }
    } catch (err) {
      console.error('Error fetching organisation:', err)
      setError('Failed to load organisation')
      setLoading(false)
    }
  }

  // ------------------------------------------------------------------
  // Fetch offers (triggered when orgId becomes available)
  // ------------------------------------------------------------------

  const fetchOffers = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    try {
      const response = await fetch(`/api/me/offers?orgId=${orgId}`)
      const data = await response.json()

      if (data.data?.offers) {
        setOffers(data.data.offers)
      } else {
        setOffers([])
      }
    } catch (err) {
      console.error('Error fetching offers:', err)
      setError('Failed to load offers')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    if (orgId) {
      fetchOffers()
    }
  }, [orgId, fetchOffers])

  // ------------------------------------------------------------------
  // Auto-dismiss success messages
  // ------------------------------------------------------------------

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // ------------------------------------------------------------------
  // Create / Update offer
  // ------------------------------------------------------------------

  const openCreateModal = () => {
    setEditingOffer(null)
    setFormData(EMPTY_FORM)
    setError(null)
    setShowModal(true)
  }

  const openEditModal = (offer: Offer) => {
    setEditingOffer(offer)
    setFormData({
      title: offer.title,
      description: offer.description || '',
      type: offer.type,
      discountValue: offer.discountValue != null ? String(offer.discountValue) : '',
      code: offer.code || '',
      termsConditions: offer.termsConditions || '',
      startDate: offer.startDate ? offer.startDate.split('T')[0] : '',
      endDate: offer.endDate ? offer.endDate.split('T')[0] : '',
      forBrandsOnly: offer.forBrandsOnly,
      minOrderValue: offer.minOrderValue != null ? String(offer.minOrderValue) : '',
      imageUrl: offer.imageUrl || '',
    })
    setError(null)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!orgId) return
    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }

    setSaving(true)
    setError(null)

    const body: Record<string, unknown> = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      type: formData.type,
      discountValue: formData.discountValue ? Number(formData.discountValue) : null,
      code: formData.code.trim() || null,
      termsConditions: formData.termsConditions.trim() || null,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      forBrandsOnly: formData.forBrandsOnly,
      minOrderValue: formData.minOrderValue ? Number(formData.minOrderValue) : null,
      imageUrl: formData.imageUrl.trim() || null,
    }

    try {
      let response: Response

      if (editingOffer) {
        // Update
        response = await fetch(`/api/me/offers/${editingOffer.id}?orgId=${orgId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        // Create
        response = await fetch(`/api/me/offers?orgId=${orgId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || data.message || 'Something went wrong')
        return
      }

      setShowModal(false)
      setEditingOffer(null)
      setFormData(EMPTY_FORM)
      setSuccessMessage(editingOffer ? 'Offer updated successfully' : 'Offer created successfully')
      fetchOffers()
    } catch (err) {
      console.error('Error saving offer:', err)
      setError('An error occurred while saving the offer')
    } finally {
      setSaving(false)
    }
  }

  // ------------------------------------------------------------------
  // Delete offer
  // ------------------------------------------------------------------

  const handleDelete = async (offerId: string) => {
    if (!orgId) return
    setDeleting(true)

    try {
      const response = await fetch(`/api/me/offers/${offerId}?orgId=${orgId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to delete offer')
        return
      }

      setDeletingId(null)
      setSuccessMessage('Offer deleted successfully')
      fetchOffers()
    } catch (err) {
      console.error('Error deleting offer:', err)
      setError('An error occurred while deleting the offer')
    } finally {
      setDeleting(false)
    }
  }

  // ------------------------------------------------------------------
  // Change status
  // ------------------------------------------------------------------

  const handleStatusChange = async (offer: Offer, newStatus: OfferStatus) => {
    if (!orgId) return

    try {
      const response = await fetch(`/api/me/offers/${offer.id}?orgId=${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to update status')
        return
      }

      setSuccessMessage(`Offer status changed to ${newStatus.toLowerCase()}`)
      fetchOffers()
    } catch (err) {
      console.error('Error updating status:', err)
      setError('An error occurred while updating the status')
    }
  }

  // ------------------------------------------------------------------
  // Filter logic
  // ------------------------------------------------------------------

  const filteredOffers =
    statusFilter === 'ALL'
      ? offers
      : offers.filter((o) => o.status === statusFilter)

  const statusCounts = {
    ALL: offers.length,
    DRAFT: offers.filter((o) => o.status === 'DRAFT').length,
    ACTIVE: offers.filter((o) => o.status === 'ACTIVE').length,
    PAUSED: offers.filter((o) => o.status === 'PAUSED').length,
    EXPIRED: offers.filter((o) => o.status === 'EXPIRED').length,
  }

  // ------------------------------------------------------------------
  // Form field change helper
  // ------------------------------------------------------------------

  const updateField = <K extends keyof OfferFormData>(
    field: K,
    value: OfferFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  if (loading && !orgId) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <p>Loading offers...</p>
      </div>
    )
  }

  if (error && !orgId) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Card className="shadow-brutal-lg">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">{error}</p>
            <p className="text-center text-sm text-gray-500 mt-2">
              Complete your onboarding to create or join an organisation.
            </p>
            <div className="flex justify-center mt-4">
              <Link
                href="/onboarding"
                className="px-4 py-2 bg-cyan border-2 border-black font-bold uppercase text-sm neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                Go to Onboarding
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canManage = userRole === 'OWNER' || userRole === 'ADMIN'

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* ---------------------------------------------------------------- */}
      {/* Header                                                           */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/settings"
            className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-tight">
              Manage Offers
            </h1>
            <p className="text-gray-600">{orgName}</p>
          </div>
        </div>

        {canManage && (
          <Button onClick={openCreateModal} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Create Offer
          </Button>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Messages                                                         */}
      {/* ---------------------------------------------------------------- */}
      {error && orgId && (
        <div className="bg-coral/10 border-2 border-coral text-coral px-4 py-3 text-sm mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="bg-lime/20 border-2 border-lime text-green-800 px-4 py-3 text-sm mb-6 flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Stats                                                            */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{statusCounts.ALL}</p>
            <p className="text-xs text-gray-600 uppercase tracking-wide">
              Total Offers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{statusCounts.ACTIVE}</p>
            <p className="text-xs text-gray-600 uppercase tracking-wide">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{statusCounts.DRAFT}</p>
            <p className="text-xs text-gray-600 uppercase tracking-wide">Drafts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{statusCounts.PAUSED}</p>
            <p className="text-xs text-gray-600 uppercase tracking-wide">Paused</p>
          </CardContent>
        </Card>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Status Filter Tabs                                               */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['ALL', 'DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED'] as const).map(
          (status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-4 py-2 border-2 border-black font-bold uppercase text-xs tracking-wide transition-all',
                statusFilter === status
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-gray-100'
              )}
            >
              {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}{' '}
              ({statusCounts[status] ?? 0})
            </button>
          )
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Offers List                                                      */}
      {/* ---------------------------------------------------------------- */}
      {loading ? (
        <p className="text-gray-500 py-8 text-center">Loading offers...</p>
      ) : filteredOffers.length === 0 ? (
        <Card className="shadow-brutal-lg">
          <CardContent className="py-16 text-center">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-bold mb-1">
              {statusFilter === 'ALL'
                ? 'No offers yet'
                : `No ${statusFilter.toLowerCase()} offers`}
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Create your first offer to attract more brands.
            </p>
            {canManage && (
              <Button onClick={openCreateModal} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Offer
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOffers.map((offer) => (
            <Card key={offer.id} className="flex flex-col">
              <CardHeader className="border-b-2 border-black pb-4">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-tight line-clamp-2">
                    {offer.title}
                  </CardTitle>
                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditModal(offer)}
                        className="p-1.5 bg-white border-2 border-black neo-shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                        title="Edit offer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(offer.id)}
                        className="p-1.5 bg-white border-2 border-black neo-shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                        title="Delete offer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-coral" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {getTypeBadge(offer.type)}
                  {getStatusBadge(offer.status)}
                </div>
              </CardHeader>

              <CardContent className="pt-4 flex-1 flex flex-col">
                {offer.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {offer.description}
                  </p>
                )}

                <div className="space-y-2 text-sm flex-1">
                  {/* Discount value */}
                  {formatDiscountValue(offer) && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <DollarSign className="w-4 h-4 shrink-0 text-cyan" />
                      <span>
                        <span className="font-bold">{formatDiscountValue(offer)}</span>{' '}
                        off
                      </span>
                    </div>
                  )}

                  {/* Code */}
                  {offer.code && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Hash className="w-4 h-4 shrink-0 text-cyan" />
                      <span>
                        Code:{' '}
                        <span className="font-mono font-bold bg-gray-100 px-1.5 py-0.5 border border-black">
                          {offer.code}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Dates */}
                  {(offer.startDate || offer.endDate) && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4 shrink-0 text-cyan" />
                      <span>
                        {formatDate(offer.startDate)} &mdash;{' '}
                        {formatDate(offer.endDate)}
                      </span>
                    </div>
                  )}

                  {/* Claim count */}
                  {offer.claimCount != null && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Users className="w-4 h-4 shrink-0 text-cyan" />
                      <span>
                        <span className="font-bold">{offer.claimCount}</span>{' '}
                        {offer.claimCount === 1 ? 'claim' : 'claims'}
                      </span>
                    </div>
                  )}

                  {/* Brands only */}
                  {offer.forBrandsOnly && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Eye className="w-4 h-4 shrink-0 text-coral" />
                      <span className="text-xs font-bold uppercase text-coral">
                        Brands Only
                      </span>
                    </div>
                  )}

                  {/* Min order value */}
                  {offer.minOrderValue != null && offer.minOrderValue > 0 && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <DollarSign className="w-4 h-4 shrink-0 text-cyan" />
                      <span>
                        Min. order: <span className="font-bold">${offer.minOrderValue}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Status action buttons */}
                {canManage && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t-2 border-black">
                    {offer.status === 'DRAFT' && (
                      <button
                        onClick={() => handleStatusChange(offer, 'ACTIVE')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-lime border-2 border-black text-xs font-bold uppercase hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                      >
                        <Play className="w-3 h-3" /> Activate
                      </button>
                    )}
                    {offer.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleStatusChange(offer, 'PAUSED')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-300 border-2 border-black text-xs font-bold uppercase hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                      >
                        <Pause className="w-3 h-3" /> Pause
                      </button>
                    )}
                    {offer.status === 'PAUSED' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(offer, 'ACTIVE')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-lime border-2 border-black text-xs font-bold uppercase hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                        >
                          <Play className="w-3 h-3" /> Reactivate
                        </button>
                        <button
                          onClick={() => handleStatusChange(offer, 'DRAFT')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border-2 border-black text-xs font-bold uppercase hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                        >
                          Move to Draft
                        </button>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Create / Edit Modal                                              */}
      {/* ---------------------------------------------------------------- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <Card className="max-w-2xl w-full my-8">
            <CardHeader className="border-b-2 border-black">
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingOffer ? 'Edit Offer' : 'Create New Offer'}
                </CardTitle>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingOffer(null)
                    setFormData(EMPTY_FORM)
                    setError(null)
                  }}
                  className="p-1 hover:bg-gray-100 border-2 border-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="offerTitle">Title *</Label>
                <Input
                  id="offerTitle"
                  placeholder="e.g. 20% off your first order"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="offerDescription">Description</Label>
                <Textarea
                  id="offerDescription"
                  placeholder="Describe what this offer includes..."
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                />
              </div>

              {/* Type & Discount Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="offerType">Type</Label>
                  <Select
                    id="offerType"
                    value={formData.type}
                    onChange={(e) =>
                      updateField('type', e.target.value as OfferType)
                    }
                  >
                    <option value="PERCENTAGE_DISCOUNT">Percentage Discount</option>
                    <option value="FIXED_DISCOUNT">Fixed Discount</option>
                    <option value="FREE_TRIAL">Free Trial</option>
                    <option value="BUNDLE">Bundle</option>
                    <option value="OTHER">Other</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offerDiscountValue">
                    Discount Value
                    {formData.type === 'PERCENTAGE_DISCOUNT' && ' (%)'}
                    {formData.type === 'FIXED_DISCOUNT' && ' ($)'}
                  </Label>
                  <Input
                    id="offerDiscountValue"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={
                      formData.type === 'PERCENTAGE_DISCOUNT'
                        ? 'e.g. 20'
                        : 'e.g. 50'
                    }
                    value={formData.discountValue}
                    onChange={(e) =>
                      updateField('discountValue', e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Code */}
              <div className="space-y-2">
                <Label htmlFor="offerCode">Offer Code</Label>
                <Input
                  id="offerCode"
                  placeholder="e.g. WELCOME20"
                  value={formData.code}
                  onChange={(e) =>
                    updateField('code', e.target.value.toUpperCase())
                  }
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="offerStartDate">Start Date</Label>
                  <Input
                    id="offerStartDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => updateField('startDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="offerEndDate">End Date</Label>
                  <Input
                    id="offerEndDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => updateField('endDate', e.target.value)}
                  />
                </div>
              </div>

              {/* Min Order Value */}
              <div className="space-y-2">
                <Label htmlFor="offerMinOrder">Minimum Order Value ($)</Label>
                <Input
                  id="offerMinOrder"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 100"
                  value={formData.minOrderValue}
                  onChange={(e) =>
                    updateField('minOrderValue', e.target.value)
                  }
                />
              </div>

              {/* Image URL */}
              <div className="space-y-2">
                <Label htmlFor="offerImageUrl">Image URL</Label>
                <Input
                  id="offerImageUrl"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.imageUrl}
                  onChange={(e) => updateField('imageUrl', e.target.value)}
                />
              </div>

              {/* Terms & Conditions */}
              <div className="space-y-2">
                <Label htmlFor="offerTerms">Terms &amp; Conditions</Label>
                <Textarea
                  id="offerTerms"
                  placeholder="Any terms or conditions that apply..."
                  value={formData.termsConditions}
                  onChange={(e) =>
                    updateField('termsConditions', e.target.value)
                  }
                />
              </div>

              {/* For Brands Only toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.forBrandsOnly}
                  onClick={() =>
                    updateField('forBrandsOnly', !formData.forBrandsOnly)
                  }
                  className={cn(
                    'w-12 h-7 border-2 border-black relative transition-colors',
                    formData.forBrandsOnly ? 'bg-cyan' : 'bg-gray-200'
                  )}
                >
                  <span
                    className={cn(
                      'block w-5 h-5 bg-white border-2 border-black absolute top-0 transition-transform',
                      formData.forBrandsOnly
                        ? 'translate-x-5'
                        : 'translate-x-0'
                    )}
                  />
                </button>
                <Label className="cursor-pointer" onClick={() => updateField('forBrandsOnly', !formData.forBrandsOnly)}>
                  For Brands Only
                </Label>
              </div>

              {/* Error inside modal */}
              {error && (
                <div className="bg-coral/10 border-2 border-coral text-coral px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModal(false)
                    setEditingOffer(null)
                    setFormData(EMPTY_FORM)
                    setError(null)
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !formData.title.trim()}
                  className="flex-1"
                >
                  {saving
                    ? 'Saving...'
                    : editingOffer
                    ? 'Update Offer'
                    : 'Create Offer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Delete Confirmation Modal                                        */}
      {/* ---------------------------------------------------------------- */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="border-b-2 border-black">
              <CardTitle className="text-coral">Delete Offer</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="bg-coral/10 border-2 border-coral text-coral px-4 py-3 text-sm">
                Are you sure you want to delete this offer? This action cannot
                be undone.
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeletingId(null)}
                  disabled={deleting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleDelete(deletingId)}
                  disabled={deleting}
                  className="flex-1"
                >
                  {deleting ? 'Deleting...' : 'Delete Offer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default function OffersManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-cyan" />
        </div>
      }
    >
      <OffersManagementContent />
    </Suspense>
  )
}
