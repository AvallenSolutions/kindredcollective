import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/search - Unified search across suppliers, brands, events, offers
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const session = await getSession()
  const { searchParams } = new URL(request.url)

  const query = searchParams.get('q')
  const types = searchParams.getAll('type')
  const limit = parseInt(searchParams.get('limit') || '10')

  if (!query || query.length < 2) {
    return errorResponse('Search query must be at least 2 characters')
  }

  const startTime = Date.now()
  const searchTypes = types.length > 0 ? types : ['suppliers', 'brands', 'events', 'offers']
  const results: Record<string, unknown[]> = {}

  // Search suppliers
  if (searchTypes.includes('suppliers')) {
    const { data: suppliers } = await supabase
      .from('Supplier')
      .select('id, companyName, slug, tagline, category, logoUrl, isVerified, location')
      .eq('isPublic', true)
      .or(`companyName.ilike.%${query}%,description.ilike.%${query}%,tagline.ilike.%${query}%`)
      .limit(limit)

    results.suppliers = (suppliers || []).map(s => ({
      ...s,
      type: 'supplier',
      title: s.companyName,
      url: `/explore/${s.slug}`,
    }))
  }

  // Search brands
  if (searchTypes.includes('brands')) {
    const { data: brands } = await supabase
      .from('Brand')
      .select('id, name, slug, tagline, category, logoUrl, isVerified, location')
      .eq('isPublic', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,tagline.ilike.%${query}%`)
      .limit(limit)

    results.brands = (brands || []).map(b => ({
      ...b,
      type: 'brand',
      title: b.name,
      url: `/community/brands/${b.slug}`,
    }))
  }

  // Search events
  if (searchTypes.includes('events')) {
    const { data: events } = await supabase
      .from('Event')
      .select('id, title, slug, type, startDate, city, country, imageUrl, isVirtual')
      .eq('status', 'PUBLISHED')
      .gte('startDate', new Date().toISOString())
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('startDate', { ascending: true })
      .limit(limit)

    results.events = (events || []).map(e => ({
      ...e,
      type: 'event',
      url: `/community/events/${e.slug}`,
    }))
  }

  // Search offers
  if (searchTypes.includes('offers')) {
    const now = new Date().toISOString()

    let offersQuery = supabase
      .from('Offer')
      .select('id, title, description, type, discountValue, imageUrl, supplier:Supplier(companyName, slug)')
      .eq('status', 'ACTIVE')
      .or(`endDate.is.null,endDate.gte.${now}`)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit)

    // Filter out brand-only offers for non-brand users
    if (!session.isBrand) {
      offersQuery = offersQuery.eq('forBrandsOnly', false)
    }

    const { data: offers } = await offersQuery

    results.offers = (offers || []).map(o => ({
      ...o,
      type: 'offer',
      url: '/offers',
    }))
  }

  const processingMs = Date.now() - startTime

  // Log the search query for analytics
  try {
    await supabase.from('SearchQuery').insert({
      query,
      userId: session.user?.id || null,
      resultCount: Object.values(results).flat().length,
      processingMs,
      usedAI: false,
      createdAt: new Date().toISOString(),
    })
  } catch (e) {
    console.error('Failed to log search query:', e)
  }

  // Calculate total results
  const totalResults = Object.values(results).flat().length

  return successResponse({
    query,
    results,
    totalResults,
    processingMs,
  })
}
