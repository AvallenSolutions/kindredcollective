import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSession } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from '@/lib/api/response'
import { applyRateLimit } from '@/lib/api/rate-limit'

// POST /api/resources/[id]/download - Track a download and return the file URL
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, 30, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const session = await getSession()
  if (!session.isAuthenticated) return unauthorizedResponse()

  const { id } = await params
  const supabase = createAdminClient()

  const { data: resource } = await supabase
    .from('Resource')
    .select('id, type, fileUrl, fileName, downloadCount, status')
    .eq('id', id)
    .single()

  if (!resource || resource.status !== 'PUBLISHED') {
    return notFoundResponse('Resource not found')
  }

  if (resource.type !== 'FILE' || !resource.fileUrl) {
    return errorResponse('This resource is not a downloadable file')
  }

  await supabase
    .from('Resource')
    .update({ downloadCount: (resource.downloadCount || 0) + 1 })
    .eq('id', id)

  return successResponse({
    url: resource.fileUrl,
    fileName: resource.fileName,
  })
}
