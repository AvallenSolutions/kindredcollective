import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { successResponse, serverErrorResponse, notFoundResponse } from '@/lib/api/response'
import { applyRateLimit } from '@/lib/api/rate-limit'

// POST /api/knowledge/[slug]/helpful - increment the "was this helpful" counter.
export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  const rateLimitResponse = applyRateLimit(request, 20, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const supabase = createAdminClient()

  const { data: entry, error: findError } = await supabase
    .from('KnowledgeEntry')
    .select('id, helpfulCount')
    .eq('slug', params.slug)
    .eq('isPublished', true)
    .maybeSingle()

  if (findError) {
    console.error('[Knowledge] helpful lookup error:', findError)
    return serverErrorResponse('Failed to record feedback')
  }
  if (!entry) return notFoundResponse('Entry not found')

  const { error: updateError } = await supabase
    .from('KnowledgeEntry')
    .update({ helpfulCount: (entry.helpfulCount ?? 0) + 1 })
    .eq('id', entry.id)

  if (updateError) {
    console.error('[Knowledge] helpful update error:', updateError)
    return serverErrorResponse('Failed to record feedback')
  }

  return successResponse({ helpfulCount: (entry.helpfulCount ?? 0) + 1 })
}
