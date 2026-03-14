import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  successResponse,
  serverErrorResponse,
} from '@/lib/api/response'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { applyRateLimit } from '@/lib/api/rate-limit'

// GET /api/news - List news articles from database
export async function GET(request: NextRequest) {
  // Rate limit: 60 requests per minute per IP
  const rateLimitResponse = applyRateLimit(request, 60, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)

  const { page, limit, from, to } = parsePagination(searchParams)
  const category = searchParams.get('category')

  let query = supabase
    .from('NewsArticle')
    .select(`
      id,
      title,
      url,
      description,
      imageUrl,
      publishedAt,
      category,
      source:NewsSource(name, siteUrl)
    `, { count: 'exact' })
    .order('publishedAt', { ascending: false })
    .range(from, to)

  if (category) {
    query = query.eq('category', category)
  }

  const { data: articles, error, count } = await query

  if (error) {
    console.error('[News] Error fetching articles:', error)
    return serverErrorResponse('Failed to fetch news articles')
  }

  // Get unique categories for filter options
  const { data: categoriesData } = await supabase
    .from('NewsArticle')
    .select('category')
    .not('category', 'is', null)

  const categories = Array.from(new Set(categoriesData?.map((a) => a.category).filter(Boolean) || []))

  return successResponse({
    articles: articles || [],
    pagination: paginationMeta(page, limit, count || 0),
    filters: { categories },
  })
}
