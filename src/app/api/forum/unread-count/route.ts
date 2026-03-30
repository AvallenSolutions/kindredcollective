import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSession } from '@/lib/auth/session'
import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response'

// GET /api/forum/unread-count?since=ISO_DATE
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated) return unauthorizedResponse()

  const { searchParams } = new URL(request.url)
  const since = searchParams.get('since')

  if (!since) {
    return successResponse({ count: 0 })
  }

  const supabase = createAdminClient()

  const { count, error } = await supabase
    .from('ForumPost')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'PUBLISHED')
    .gt('createdAt', since)

  if (error) {
    console.error('[ForumUnreadCount] Error:', error)
    return serverErrorResponse('Failed to fetch unread count')
  }

  return successResponse({ count: count || 0 })
}
