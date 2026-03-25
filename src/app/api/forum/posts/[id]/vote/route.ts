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

// POST /api/forum/posts/[id]/vote - Vote on a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, 30, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const session = await getSession()
  if (!session.isAuthenticated || !session.user) return unauthorizedResponse()

  const { id: postId } = await params
  const supabase = createAdminClient()

  // Verify post exists
  const { data: post } = await supabase
    .from('ForumPost')
    .select('id')
    .eq('id', postId)
    .eq('status', 'PUBLISHED')
    .single()

  if (!post) return notFoundResponse('Post not found')

  const body = await request.json()
  const { value } = body

  if (value !== 1 && value !== -1 && value !== 0) {
    return errorResponse('Value must be 1 (upvote), -1 (downvote), or 0 (remove)')
  }

  const userId = session.user.id

  if (value === 0) {
    // Remove vote
    await supabase
      .from('ForumVote')
      .delete()
      .eq('userId', userId)
      .eq('postId', postId)

    return successResponse({ vote: null })
  }

  // Upsert vote - check if exists first
  const { data: existing } = await supabase
    .from('ForumVote')
    .select('id')
    .eq('userId', userId)
    .eq('postId', postId)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('ForumVote')
      .update({ value })
      .eq('id', existing.id)

    if (error) {
      console.error('[Forum] Error updating vote:', error)
      return serverErrorResponse('Failed to update vote')
    }
  } else {
    const { error } = await supabase
      .from('ForumVote')
      .insert({
        id: crypto.randomUUID(),
        value,
        userId,
        postId,
        commentId: null,
      })

    if (error) {
      console.error('[Forum] Error creating vote:', error)
      return serverErrorResponse('Failed to create vote')
    }
  }

  return successResponse({ vote: value })
}
