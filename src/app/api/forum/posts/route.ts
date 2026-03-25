import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSession } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { applyRateLimit } from '@/lib/api/rate-limit'

// GET /api/forum/posts - List forum posts
export async function GET(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, 60, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const session = await getSession()
  if (!session.isAuthenticated) return unauthorizedResponse()

  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const { page, limit, from, to } = parsePagination(searchParams)

  const category = searchParams.get('category')
  const type = searchParams.get('type')
  const sort = searchParams.get('sort') || 'newest'

  let query = supabase
    .from('ForumPost')
    .select(`
      id, title, body, type, status, isPinned, viewCount, createdAt, updatedAt,
      category:ForumCategory(id, name, slug, color),
      author:User!authorId(
        id, email,
        member:Member(firstName, lastName, avatarUrl, jobTitle, company)
      ),
      comments:ForumComment(count),
      votes:ForumVote(value)
    `, { count: 'exact' })
    .eq('status', 'PUBLISHED')

  if (category) query = query.eq('category.slug', category)
  if (type) query = query.eq('type', type)

  // Pinned posts first, then sort
  query = query.order('isPinned', { ascending: false })

  if (sort === 'oldest') {
    query = query.order('createdAt', { ascending: true })
  } else {
    // Default: newest first
    query = query.order('createdAt', { ascending: false })
  }

  query = query.range(from, to)

  const { data: posts, error, count } = await query

  if (error) {
    console.error('[Forum] Error fetching posts:', error)
    return serverErrorResponse('Failed to fetch posts')
  }

  // Calculate vote scores
  const postsWithScores = (posts || []).map((post: any) => {
    const voteScore = (post.votes || []).reduce((sum: number, v: any) => sum + v.value, 0)
    const commentCount = post.comments?.[0]?.count || 0
    return {
      ...post,
      voteScore,
      commentCount,
      votes: undefined, // Don't expose individual votes
      comments: undefined,
    }
  })

  return successResponse({
    posts: postsWithScores,
    pagination: paginationMeta(page, limit, count || 0),
  })
}

// POST /api/forum/posts - Create a new forum post
export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, 10, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const session = await getSession()
  if (!session.isAuthenticated || !session.user) return unauthorizedResponse()

  const body = await request.json()
  const { title, body: postBody, type, categoryId } = body

  if (!title?.trim()) return errorResponse('Title is required')
  if (!postBody?.trim()) return errorResponse('Post body is required')
  if (!categoryId) return errorResponse('Category is required')

  const validTypes = ['DISCUSSION', 'QUESTION', 'NEWS', 'SHOWCASE']
  const postType = validTypes.includes(type) ? type : 'DISCUSSION'

  const supabase = createAdminClient()

  // Verify category exists
  const { data: cat, error: catError } = await supabase
    .from('ForumCategory')
    .select('id')
    .eq('id', categoryId)
    .single()

  if (catError || !cat) return errorResponse('Invalid category')

  const { data: post, error } = await supabase
    .from('ForumPost')
    .insert({
      id: crypto.randomUUID(),
      title: title.trim(),
      body: postBody.trim(),
      type: postType,
      categoryId,
      authorId: session.user.id,
      updatedAt: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    console.error('[Forum] Error creating post:', error)
    return serverErrorResponse('Failed to create post')
  }

  return successResponse({ post }, 201)
}
