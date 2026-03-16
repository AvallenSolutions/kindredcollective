import { NextRequest } from 'next/server'
import { fetchAllFeedsLive } from '@/lib/rss/fetcher'
import { successResponse, serverErrorResponse } from '@/lib/api/response'
import { applyRateLimit } from '@/lib/api/rate-limit'

// GET /api/news — returns articles fetched live from RSS feeds (1-hour in-memory cache)
export async function GET(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, 60, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100)
  const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10), 1)

  try {
    let articles = await fetchAllFeedsLive()

    if (category) {
      articles = articles.filter((a) => a.category === category)
    }

    // Pagination
    const total = articles.length
    const from = (page - 1) * limit
    const paginated = articles.slice(from, from + limit)

    const categories = Array.from(new Set(
      (await fetchAllFeedsLive()).map((a) => a.category).filter(Boolean)
    )).sort()

    return successResponse({
      articles: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: from + limit < total,
        hasPrevPage: page > 1,
      },
      filters: { categories },
    })
  } catch (err) {
    console.error('[News] Failed to fetch RSS feeds:', err)
    return serverErrorResponse('Failed to fetch news articles')
  }
}
