import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSession } from '@/lib/auth/session'
import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response'
import { applyRateLimit } from '@/lib/api/rate-limit'

// GET /api/resources/categories - List all resource categories
export async function GET(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, 60, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const session = await getSession()
  if (!session.isAuthenticated) return unauthorizedResponse()

  const supabase = createAdminClient()

  const { data: categories, error } = await supabase
    .from('ResourceCategory')
    .select('id, name, slug, description, color, order')
    .order('order', { ascending: true })

  if (error) {
    console.error('[Resources] Error fetching categories:', error)
    return serverErrorResponse('Failed to fetch categories')
  }

  return successResponse({ categories })
}
