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
import { deleteImage } from '@/lib/storage/upload'
import { isSupportedVideoUrl } from '@/lib/resources/video-embed'

function normaliseTags(input: unknown): string[] {
  if (!input) return []
  const list = Array.isArray(input)
    ? input
    : String(input).split(',')
  return Array.from(
    new Set(
      list
        .map(t => String(t).trim().toLowerCase())
        .filter(t => t.length > 0 && t.length <= 30)
    )
  ).slice(0, 10)
}

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

// GET /api/resources/[id] - Get a single resource
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

  const { data: resource, error } = await supabase
    .from('Resource')
    .select(`
      id, title, description, type, status, fileUrl, filePath, fileName, fileSize, fileMime,
      url, tags, viewCount, downloadCount, createdAt, updatedAt, authorId,
      category:ResourceCategory(id, name, slug, color),
      author:User!authorId(
        id, email,
        member:Member(firstName, lastName, avatarUrl, jobTitle, company)
      )
    `)
    .eq('id', id)
    .eq('status', 'PUBLISHED')
    .single()

  if (error || !resource) return notFoundResponse('Resource not found')

  // Increment view count (fire and forget)
  supabase
    .from('Resource')
    .update({ viewCount: ((resource as { viewCount?: number }).viewCount || 0) + 1 })
    .eq('id', id)
    .then(() => {})

  return successResponse({ resource })
}

// PATCH /api/resources/[id] - Edit a resource (author or admin)
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

  const { data: existing } = await supabase
    .from('Resource')
    .select('authorId, type')
    .eq('id', id)
    .single()

  if (!existing) return notFoundResponse('Resource not found')
  if (existing.authorId !== session.user.id && session.user.role !== 'ADMIN') {
    return errorResponse('You can only edit your own resources', 403)
  }

  const body = await request.json()
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() }

  if (body.title?.trim()) updates.title = body.title.trim()
  if (body.description?.trim()) updates.description = body.description.trim()
  if (body.categoryId) updates.categoryId = body.categoryId
  if (body.tags !== undefined) updates.tags = normaliseTags(body.tags)

  // Only URL-type resources can have their url edited
  if (typeof body.url === 'string' && existing.type !== 'FILE') {
    if (!isValidUrl(body.url)) return errorResponse('A valid http(s) URL is required')
    if (existing.type === 'VIDEO' && !isSupportedVideoUrl(body.url)) {
      return errorResponse('Video URL must be a YouTube or Vimeo link')
    }
    updates.url = body.url
  }

  if (session.user.role === 'ADMIN') {
    if (body.status && (body.status === 'PUBLISHED' || body.status === 'REMOVED')) {
      updates.status = body.status
    }
  }

  const { error } = await supabase
    .from('Resource')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('[Resources] Error updating resource:', error)
    return serverErrorResponse('Failed to update resource')
  }

  return successResponse({ updated: true })
}

// DELETE /api/resources/[id] - Delete a resource (author hard-deletes own; admin soft-deletes others)
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
    .from('Resource')
    .select('authorId, filePath')
    .eq('id', id)
    .single()

  if (!existing) return notFoundResponse('Resource not found')

  if (existing.authorId !== session.user.id && session.user.role !== 'ADMIN') {
    return errorResponse('You can only delete your own resources', 403)
  }

  if (session.user.role === 'ADMIN' && existing.authorId !== session.user.id) {
    await supabase
      .from('Resource')
      .update({ status: 'REMOVED', updatedAt: new Date().toISOString() })
      .eq('id', id)
  } else {
    if (existing.filePath) {
      try {
        await deleteImage('resource-files', existing.filePath)
      } catch (err) {
        console.error('[Resources] Failed to remove file from storage:', err)
      }
    }
    await supabase.from('Resource').delete().eq('id', id)
  }

  return successResponse({ deleted: true })
}
