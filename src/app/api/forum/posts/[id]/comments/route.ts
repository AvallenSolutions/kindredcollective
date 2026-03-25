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

// POST /api/forum/posts/[id]/comments - Add a comment to a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, 20, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const session = await getSession()
  if (!session.isAuthenticated || !session.user) return unauthorizedResponse()

  const { id: postId } = await params
  const supabase = createAdminClient()

  // Verify post exists and is published
  const { data: post } = await supabase
    .from('ForumPost')
    .select('id')
    .eq('id', postId)
    .eq('status', 'PUBLISHED')
    .single()

  if (!post) return notFoundResponse('Post not found')

  const body = await request.json()
  const { body: commentBody, parentId } = body

  if (!commentBody?.trim()) return errorResponse('Comment body is required')

  // If replying to a comment, verify parent exists and belongs to same post
  if (parentId) {
    const { data: parent } = await supabase
      .from('ForumComment')
      .select('id')
      .eq('id', parentId)
      .eq('postId', postId)
      .single()

    if (!parent) return errorResponse('Parent comment not found')
  }

  const { data: comment, error } = await supabase
    .from('ForumComment')
    .insert({
      id: crypto.randomUUID(),
      body: commentBody.trim(),
      postId,
      authorId: session.user.id,
      parentId: parentId || null,
      updatedAt: new Date().toISOString(),
    })
    .select(`
      id, body, parentId, createdAt, updatedAt,
      author:User!authorId(
        id, email,
        member:Member(firstName, lastName, avatarUrl, jobTitle, company)
      )
    `)
    .single()

  if (error) {
    console.error('[Forum] Error creating comment:', error)
    return serverErrorResponse('Failed to create comment')
  }

  return successResponse({ comment: { ...comment, voteScore: 0, userVote: 0 } }, 201)
}
