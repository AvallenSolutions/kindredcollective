import { requireAdmin } from '@/lib/auth/session'
import { syncAllFeeds } from '@/lib/rss/fetcher'
import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response'

// POST /api/news/refresh — admin only, triggers an immediate RSS sync
export async function POST() {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse()
  }

  try {
    const result = await syncAllFeeds()
    return successResponse(result)
  } catch (err) {
    console.error('[news/refresh] Failed to sync feeds:', err)
    return serverErrorResponse('Failed to sync news feeds')
  }
}
