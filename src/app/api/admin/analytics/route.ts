import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/admin/analytics - Get dashboard analytics
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
    ] = await Promise.all([
      supabase.from('User').select('id, role, createdAt', { count: 'exact' }),
      supabase.from('Supplier').select('id, category, isPublic, isVerified, claimStatus, viewCount, createdAt', { count: 'exact' }),
      supabase.from('Brand').select('id, category, isPublic, createdAt', { count: 'exact' }),
      supabase.from('Event').select('id, status, type, startDate, createdAt', { count: 'exact' }),
      supabase.from('Offer').select('id, status, claimCount, viewCount, createdAt', { count: 'exact' }),
      supabase.from('SupplierReview').select('id, rating, createdAt', { count: 'exact' }),
      supabase.from('SearchQuery').select('id, usedAI, createdAt', { count: 'exact' }),
    ])

    // Calculate stats
    const users = usersResult.data || []
    const suppliers = suppliersResult.data || []
    const brands = brandsResult.data || []
    const events = eventsResult.data || []
    const offers = offersResult.data || []
    const reviews = reviewsResult.data || []
    const searchQueries = searchQueriesResult.data || []

    // Users by role
    const usersByRole = {
      ADMIN: users.filter(u => u.role === 'ADMIN').length,
      BRAND: users.filter(u => u.role === 'BRAND').length,
      SUPPLIER: users.filter(u => u.role === 'SUPPLIER').length,
    }

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

    // Active offers
    const activeOffers = offers.filter(o => o.status === 'ACTIVE').length
    const totalOfferClaims = offers.reduce((sum, o) => sum + (o.claimCount || 0), 0)

    // Upcoming events
    const now = new Date()
    const upcomingEvents = events.filter(e => new Date(e.startDate) > now).length

    // Average review rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentUsers = users.filter(u => new Date(u.createdAt) > thirtyDaysAgo).length
    const recentSuppliers = suppliers.filter(s => new Date(s.createdAt) > thirtyDaysAgo).length
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
      },
      suppliers: {
        topCategories,
        byClaimStatus: suppliersByClaimStatus,
        totalViews: totalSupplierViews,
        recentAdditions: recentSuppliers,
        publicCount: suppliers.filter(s => s.isPublic).length,
        verifiedCount: suppliers.filter(s => s.isVerified).length,
      },
      events: {
        upcomingCount: upcomingEvents,
        publishedCount: events.filter(e => e.status === 'PUBLISHED').length,
      },
      offers: {
        activeCount: activeOffers,
        totalClaims: totalOfferClaims,
      },
      reviews: {
        averageRating: Math.round(avgRating * 10) / 10,
        totalCount: reviews.length,
      },
      search: {
        totalQueries: searchQueries.length,
        recentQueries: recentSearches,
        aiSearches: searchQueries.filter(q => q.usedAI).length,
      },
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return serverErrorResponse('Failed to fetch analytics')
  }
}
