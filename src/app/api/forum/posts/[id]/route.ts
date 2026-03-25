import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSession } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'
import { applyRateLimit } from '@/lib/api/rate-limit'

// GET /api/forum/posts/[id] - Get a single forum post with comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, 60, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const session = await getSession()
  if (!session.isAuthenticated) return unauthorizedResponse()

  const { id } = await params
  const supabase = createAdminClient()

  const { data: post, error } = await supabase
    .from('ForumPost')
    .select(`
      id, title, body, imageUrl, type, status, isPinned, viewCount, createdAt, updatedAt,
      category:ForumCategory(id, name, slug, color),
      author:User!authorId(
        id, email,
        member:Member(firstName, lastName, avatarUrl, jobTitle, company)
      ),
      votes:ForumVote(value, userId)
    `)
    .eq('id', id)
    .eq('status', 'PUBLISHED')
    .single()

  if (error || !post) return notFoundResponse('Post not found')

  // Increment view count (fire and forget)
  supabase
    .from('ForumPost')
    .update({ viewCount: (post.viewCount || 0) + 1 })
    .eq('id', id)
    .then(() => {})

  // Fetch comments separately for better structure
  const { data: comments } = await supabase
    .from('ForumComment')
    .select(`
      id, body, parentId, createdAt, updatedAt,
      author:User!authorId(
        id, email,
        member:Member(firstName, lastName, avatarUrl, jobTitle, company)
      ),
      votes:ForumVote(value, userId)
    `)
    .eq('postId', id)
    .order('createdAt', { ascending: true })

  const voteScore = (post.votes || []).reduce((sum: number, v: any) => sum + v.value, 0)
  const userVote = session.user
    ? (post.votes || []).find((v: any) => v.userId === session.user!.id)?.value || 0
    : 0

  // Calculate vote scores for comments
  const commentsWithScores = (comments || []).map((c: any) => {
    const commentVoteScore = (c.votes || []).reduce((sum: number, v: any) => sum + v.value, 0)
    const commentUserVote = session.user
      ? (c.votes || []).find((v: any) => v.userId === session.user!.id)?.value || 0
      : 0
    return {
      ...c,
      voteScore: commentVoteScore,
      userVote: commentUserVote,
      votes: undefined,
    }
  })

  return successResponse({
    post: {
      ...post,
      voteScore,
      userVote,
      votes: undefined,
    },
    comments: commentsWithScores,
  })
}

// PATCH /api/forum/posts/[id] - Edit a post (author or admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, 20, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const session = await getSession()
  if (!session.isAuthenticated || !session.user) return unauthorizedResponse()

  const { id } = await params
  const supabase = createAdminClient()

  // Check ownership
  const { data: existing } = await supabase
    .from('ForumPost')
    .select('authorId')
    .eq('id', id)
    .single()

  if (!existing) return notFoundResponse('Post not found')
  if (existing.authorId !== session.user.id && session.user.role !== 'ADMIN') {
    return errorResponse('You can only edit your own posts', 403)
  }

  const body = await request.json()
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() }

  if (body.title?.trim()) updates.title = body.title.trim()
  if (body.body?.trim()) updates.body = body.body.trim()
  if (body.type) updates.type = body.type
  if (body.categoryId) updates.categoryId = body.categoryId
  if (typeof body.imageUrl === 'string') updates.imageUrl = body.imageUrl || null

  // Admin-only fields
  if (session.user.role === 'ADMIN') {
    if (typeof body.isPinned === 'boolean') updates.isPinned = body.isPinned
    if (body.status) updates.status = body.status
  }

  const { error } = await supabase
    .from('ForumPost')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('[Forum] Error updating post:', error)
    return serverErrorResponse('Failed to update post')
  }

  return successResponse({ updated: true })
}

// DELETE /api/forum/posts/[id] - Delete a post (author or admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, 10, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const session = await getSession()
  if (!session.isAuthenticated || !session.user) return unauthorizedResponse()

  const { id } = await params
  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('ForumPost')
    .select('authorId')
    .eq('id', id)
    .single()

  if (!existing) return notFoundResponse('Post not found')

  if (existing.authorId !== session.user.id && session.user.role !== 'ADMIN') {
    return errorResponse('You can only delete your own posts', 403)
  }

  // Admin soft-deletes, authors can hard-delete their own
  if (session.user.role === 'ADMIN' && existing.authorId !== session.user.id) {
    await supabase
      .from('ForumPost')
      .update({ status: 'REMOVED', updatedAt: new Date().toISOString() })
      .eq('id', id)
  } else {
    await supabase.from('ForumPost').delete().eq('id', id)
  }

  return successResponse({ deleted: true })
}
