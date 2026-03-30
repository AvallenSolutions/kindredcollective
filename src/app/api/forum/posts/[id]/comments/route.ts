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
  const { body: commentBody, parentId, imageUrl } = body

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

  const commentId = crypto.randomUUID()
  const now = new Date().toISOString()

  // Insert the comment
  const { error: insertError } = await supabase
    .from('ForumComment')
    .insert({
      id: commentId,
      body: commentBody.trim(),
      imageUrl: imageUrl || null,
      postId,
      authorId: session.user.id,
      parentId: parentId || null,
      updatedAt: now,
    })

  if (insertError) {
    console.error('[Forum] Error creating comment:', insertError)
    return serverErrorResponse('Failed to create comment')
  }

  // Fetch the created comment with author details
  const { data: comment, error: fetchError } = await supabase
    .from('ForumComment')
    .select(`
      id, body, imageUrl, parentId, createdAt, updatedAt,
      author:User!authorId(
        id, email,
        member:Member(firstName, lastName, avatarUrl, jobTitle, company)
      )
    `)
    .eq('id', commentId)
    .single()

  if (fetchError || !comment) {
    console.error('[Forum] Error fetching created comment:', fetchError)
    return serverErrorResponse('Comment created but failed to fetch details')
  }

  return successResponse({ comment: { ...comment, voteScore: 0, userVote: 0 } }, 201)
}
