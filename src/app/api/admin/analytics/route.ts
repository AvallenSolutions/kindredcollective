import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// Helper to get date ranges
function getDateRanges() {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const ninetyDaysAgo = new Date(today)
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const previousThirtyDays = new Date(thirtyDaysAgo)
  previousThirtyDays.setDate(previousThirtyDays.getDate() - 30)

  return { today, sevenDaysAgo, thirtyDaysAgo, ninetyDaysAgo, previousThirtyDays }
}

// Helper to calculate growth percentage
function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

// GET /api/admin/analytics - Get comprehensive dashboard analytics
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const supabase = await createClient()

  try {
    // Get counts in parallel
    const [
      usersResult,
      suppliersResult,
      brandsResult,
      eventsResult,
      offersResult,
      reviewsResult,
      searchQueriesResult,
      rsvpsResult,
      offerClaimsResult,
      savedSuppliersResult,
      savedBrandsResult,
    ] = await Promise.all([
      supabase.from('User').select('id, role, createdAt', { count: 'exact' }),
      supabase.from('Supplier').select('id, category, isPublic, isVerified, claimStatus, viewCount, createdAt', { count: 'exact' }),
      supabase.from('Brand').select('id, category, isPublic, isVerified, createdAt', { count: 'exact' }),
      supabase.from('Event').select('id, status, type, startDate, capacity, createdAt', { count: 'exact' }),
      supabase.from('Offer').select('id, status, type, claimCount, viewCount, createdAt, endDate', { count: 'exact' }),
      supabase.from('SupplierReview').select('id, rating, isPublic, isVerified, createdAt', { count: 'exact' }),
      supabase.from('SearchQuery').select('id, usedAI, createdAt', { count: 'exact' }),
      supabase.from('EventRsvp').select('id, status, createdAt', { count: 'exact' }),
      supabase.from('OfferClaim').select('id, claimedAt', { count: 'exact' }),
      supabase.from('SavedSupplier').select('id, createdAt', { count: 'exact' }),
      supabase.from('SavedBrand').select('id, createdAt', { count: 'exact' }),
    ])

    // Calculate stats
    const users = usersResult.data || []
    const suppliers = suppliersResult.data || []
    const brands = brandsResult.data || []
    const events = eventsResult.data || []
    const offers = offersResult.data || []
    const reviews = reviewsResult.data || []
    const searchQueries = searchQueriesResult.data || []
    const rsvps = rsvpsResult.data || []
    const offerClaims = offerClaimsResult.data || []
    const savedSuppliers = savedSuppliersResult.data || []
    const savedBrands = savedBrandsResult.data || []

    // Get date ranges
    const { sevenDaysAgo, thirtyDaysAgo, ninetyDaysAgo, previousThirtyDays } = getDateRanges()
    const now = new Date()

    // Users by role
    const usersByRole = {
      ADMIN: users.filter(u => u.role === 'ADMIN').length,
      BRAND: users.filter(u => u.role === 'BRAND').length,
      SUPPLIER: users.filter(u => u.role === 'SUPPLIER').length,
    }

    // User growth
    const usersLast30 = users.filter(u => new Date(u.createdAt) > thirtyDaysAgo).length
    const usersPrevious30 = users.filter(u => {
      const d = new Date(u.createdAt)
      return d > previousThirtyDays && d <= thirtyDaysAgo
    }).length
    const userGrowth = calculateGrowth(usersLast30, usersPrevious30)

    // Suppliers by category (top 5)
    const categoryCount: Record<string, number> = {}
    suppliers.forEach(s => {
      categoryCount[s.category] = (categoryCount[s.category] || 0) + 1
    })
    const topCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }))

    // Claimed vs unclaimed suppliers
    const suppliersByClaimStatus = {
      claimed: suppliers.filter(s => s.claimStatus === 'CLAIMED').length,
      pending: suppliers.filter(s => s.claimStatus === 'PENDING').length,
      unclaimed: suppliers.filter(s => s.claimStatus === 'UNCLAIMED').length,
    }

    // Total supplier views
    const totalSupplierViews = suppliers.reduce((sum, s) => sum + (s.viewCount || 0), 0)

    // Brands by category
    const brandCategoryCount: Record<string, number> = {}
    brands.forEach(b => {
      brandCategoryCount[b.category] = (brandCategoryCount[b.category] || 0) + 1
    })
    const topBrandCategories = Object.entries(brandCategoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }))

    // Offers statistics
    const activeOffers = offers.filter(o => o.status === 'ACTIVE').length
    const expiredOffers = offers.filter(o => o.status === 'EXPIRED' || (o.endDate && new Date(o.endDate) < now)).length
    const totalOfferClaims = offers.reduce((sum, o) => sum + (o.claimCount || 0), 0)
    const totalOfferViews = offers.reduce((sum, o) => sum + (o.viewCount || 0), 0)
    const offerClaimRate = totalOfferViews > 0 ? Math.round((totalOfferClaims / totalOfferViews) * 100) : 0

    // Offer types breakdown
    const offerTypeCount: Record<string, number> = {}
    offers.forEach(o => {
      offerTypeCount[o.type] = (offerTypeCount[o.type] || 0) + 1
    })

    // Events statistics
    const upcomingEvents = events.filter(e => new Date(e.startDate) > now && e.status === 'PUBLISHED').length
    const pastEvents = events.filter(e => new Date(e.startDate) <= now).length

    // Event types breakdown
    const eventTypeCount: Record<string, number> = {}
    events.forEach(e => {
      eventTypeCount[e.type] = (eventTypeCount[e.type] || 0) + 1
    })
    const topEventTypes = Object.entries(eventTypeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }))

    // RSVP statistics
    const rsvpsByStatus = {
      going: rsvps.filter(r => r.status === 'GOING').length,
      interested: rsvps.filter(r => r.status === 'INTERESTED').length,
      notGoing: rsvps.filter(r => r.status === 'NOT_GOING').length,
    }
    const recentRsvps = rsvps.filter(r => new Date(r.createdAt) > sevenDaysAgo).length

    // Review statistics
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0
    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    }
    const pendingReviews = reviews.filter(r => !r.isPublic).length

    // Engagement metrics
    const recentSavedSuppliers = savedSuppliers.filter(s => new Date(s.createdAt) > thirtyDaysAgo).length
    const recentSavedBrands = savedBrands.filter(s => new Date(s.createdAt) > thirtyDaysAgo).length
    const recentOfferClaims = offerClaims.filter(c => new Date(c.claimedAt) > thirtyDaysAgo).length

    // Recent activity
    const recentUsers = users.filter(u => new Date(u.createdAt) > thirtyDaysAgo).length
    const recentSuppliers = suppliers.filter(s => new Date(s.createdAt) > thirtyDaysAgo).length
    const recentBrands = brands.filter(b => new Date(b.createdAt) > thirtyDaysAgo).length
    const recentSearches = searchQueries.filter(q => new Date(q.createdAt) > thirtyDaysAgo).length

    return successResponse({
      overview: {
        totalUsers: users.length,
        totalSuppliers: suppliers.length,
        totalBrands: brands.length,
        totalEvents: events.length,
        totalOffers: offers.length,
        totalReviews: reviews.length,
        totalSearches: searchQueries.length,
      },
      users: {
        byRole: usersByRole,
        recentSignups: recentUsers,
        growth: {
          last30Days: usersLast30,
          percentChange: userGrowth,
        },
      },
      suppliers: {
        topCategories,
        byClaimStatus: suppliersByClaimStatus,
        totalViews: totalSupplierViews,
        recentAdditions: recentSuppliers,
        publicCount: suppliers.filter(s => s.isPublic).length,
        verifiedCount: suppliers.filter(s => s.isVerified).length,
        savedCount: savedSuppliers.length,
        recentSaves: recentSavedSuppliers,
      },
      brands: {
        topCategories: topBrandCategories,
        recentAdditions: recentBrands,
        publicCount: brands.filter(b => b.isPublic).length,
        verifiedCount: brands.filter(b => b.isVerified).length,
        savedCount: savedBrands.length,
        recentSaves: recentSavedBrands,
      },
      events: {
        upcomingCount: upcomingEvents,
        pastCount: pastEvents,
        publishedCount: events.filter(e => e.status === 'PUBLISHED').length,
        draftCount: events.filter(e => e.status === 'DRAFT').length,
        topTypes: topEventTypes,
        rsvps: {
          ...rsvpsByStatus,
          total: rsvps.length,
          recentCount: recentRsvps,
        },
      },
      offers: {
        activeCount: activeOffers,
        expiredCount: expiredOffers,
        draftCount: offers.filter(o => o.status === 'DRAFT').length,
        totalClaims: totalOfferClaims,
        totalViews: totalOfferViews,
        claimRate: offerClaimRate,
        recentClaims: recentOfferClaims,
        byType: offerTypeCount,
      },
      reviews: {
        averageRating: Math.round(avgRating * 10) / 10,
        totalCount: reviews.length,
        pendingCount: pendingReviews,
        verifiedCount: reviews.filter(r => r.isVerified).length,
        ratingDistribution,
      },
      search: {
        totalQueries: searchQueries.length,
        recentQueries: recentSearches,
        aiSearches: searchQueries.filter(q => q.usedAI).length,
      },
      engagement: {
        totalSavedSuppliers: savedSuppliers.length,
        totalSavedBrands: savedBrands.length,
        totalOfferClaims: offerClaims.length,
        totalRsvps: rsvps.length,
      },
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return serverErrorResponse('Failed to fetch analytics')
  }
}
