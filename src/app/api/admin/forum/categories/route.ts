import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSession } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'
import { applyRateLimit } from '@/lib/api/rate-limit'
import { slugify } from '@/lib/utils'

// POST /api/admin/forum/categories - Create a forum category (admin only)
export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, 10, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const session = await getSession()
  if (!session.isAuthenticated || !session.user) return unauthorizedResponse()
  if (session.user.role !== 'ADMIN') return errorResponse('Admin access required', 403)

  const body = await request.json()
  const { name, description, color, order } = body

  if (!name?.trim()) return errorResponse('Category name is required')

  const slug = slugify(name.trim())
  const supabase = createAdminClient()

  const { data: category, error } = await supabase
    .from('ForumCategory')
    .insert({
      id: crypto.randomUUID(),
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      color: color || '#00D9FF',
      order: order || 0,
      createdAt: new Date().toISOString(),
    })
    .select('id, name, slug')
    .single()

  if (error) {
    console.error('[Admin Forum] Error creating category:', error)
    if (error.code === '23505') return errorResponse('A category with that name already exists')
    return serverErrorResponse('Failed to create category')
  }

  return successResponse({ category }, 201)
}

// DELETE /api/admin/forum/categories - Delete a forum category (admin only)
export async function DELETE(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, 10, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const session = await getSession()
  if (!session.isAuthenticated || !session.user) return unauthorizedResponse()
  if (session.user.role !== 'ADMIN') return errorResponse('Admin access required', 403)

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return errorResponse('Category ID is required')

  const supabase = createAdminClient()

  // Check if category has posts
  const { count } = await supabase
    .from('ForumPost')
    .select('*', { count: 'exact', head: true })
    .eq('categoryId', id)

  if (count && count > 0) {
    return errorResponse(`Cannot delete category with ${count} post${count === 1 ? '' : 's'}. Move or delete posts first.`)
  }

  const { error } = await supabase
    .from('ForumCategory')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[Admin Forum] Error deleting category:', error)
    return serverErrorResponse('Failed to delete category')
  }

  return successResponse({ deleted: true })
}
