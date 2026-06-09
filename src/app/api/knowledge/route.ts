import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, serverErrorResponse } from '@/lib/api/response'
import { sanitizeFilterInput } from '@/lib/api/sanitize'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { applyRateLimit } from '@/lib/api/rate-limit'

// GET /api/knowledge - List published "Ask the Collective" entries with filtering.
// Public endpoint (the knowledge base is public-facing for SEO). Mirrors the
// shape of /api/suppliers.
export async function GET(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, 60, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const { page, limit, from, to } = parsePagination(searchParams)

  const category = searchParams.get('category') // category slug
  const tag = searchParams.get('tag')
  const rawSearch = searchParams.get('search')

  let query = supabase
    .from('KnowledgeEntry')
    .select(
      `
      id,
      question,
      answer,
      slug,
      topicTags,
      sourceCount,
      viewCount,
      helpfulCount,
      createdAt,
      category:KnowledgeCategory(id, name, slug, color)
    `,
      { count: 'exact' }
    )
    .eq('isPublished', true)
    .eq('status', 'PUBLISHED')
    .order('helpfulCount', { ascending: false })
    .order('sourceCount', { ascending: false })
    .range(from, to)

  if (category) {
    // Resolve slug -> id
    const { data: cat } = await supabase
      .from('KnowledgeCategory')
      .select('id')
      .eq('slug', sanitizeFilterInput(category))
      .maybeSingle()
    if (cat) query = query.eq('categoryId', cat.id)
  }

  if (tag) {
    query = query.contains('topicTags', [sanitizeFilterInput(tag).toLowerCase()])
  }

  if (rawSearch) {
    const search = sanitizeFilterInput(rawSearch)
    query = query.or(`question.ilike.%${search}%,answer.ilike.%${search}%`)
  }

  const { data: entries, error, count } = await query

  if (error) {
    console.error('[Knowledge] Error fetching entries:', error)
    return serverErrorResponse('Failed to fetch knowledge entries')
  }

  const { data: categories } = await supabase
    .from('KnowledgeCategory')
    .select('id, name, slug, color, order')
    .order('order', { ascending: true })

  return successResponse({
    entries,
    pagination: paginationMeta(page, limit, count || 0),
    filters: { categories: categories || [] },
  })
}
