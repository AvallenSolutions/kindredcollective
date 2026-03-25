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

// POST /api/forum/comments/[id]/vote - Vote on a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, 30, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const session = await getSession()
  if (!session.isAuthenticated || !session.user) return unauthorizedResponse()

  const { id: commentId } = await params
  const supabase = createAdminClient()

  // Verify comment exists
  const { data: comment } = await supabase
    .from('ForumComment')
    .select('id')
    .eq('id', commentId)
    .single()

  if (!comment) return notFoundResponse('Comment not found')

  const body = await request.json()
  const { value } = body

  if (value !== 1 && value !== -1 && value !== 0) {
    return errorResponse('Value must be 1 (upvote), -1 (downvote), or 0 (remove)')
  }

  const userId = session.user.id

  if (value === 0) {
    await supabase
      .from('ForumVote')
      .delete()
      .eq('userId', userId)
      .eq('commentId', commentId)

    return successResponse({ vote: null })
  }

  const { data: existing } = await supabase
    .from('ForumVote')
    .select('id')
    .eq('userId', userId)
    .eq('commentId', commentId)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('ForumVote')
      .update({ value })
      .eq('id', existing.id)

    if (error) {
      console.error('[Forum] Error updating comment vote:', error)
      return serverErrorResponse('Failed to update vote')
    }
  } else {
    const { error } = await supabase
      .from('ForumVote')
      .insert({
        id: crypto.randomUUID(),
        value,
        userId,
        postId: null,
        commentId,
      })

    if (error) {
      console.error('[Forum] Error creating comment vote:', error)
      return serverErrorResponse('Failed to create vote')
    }
  }

  return successResponse({ vote: value })
}
