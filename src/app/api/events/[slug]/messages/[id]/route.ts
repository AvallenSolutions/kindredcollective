import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSession } from '@/lib/auth/session'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'
import { applyRateLimit } from '@/lib/api/rate-limit'

// DELETE /api/events/[slug]/messages/[id] - Delete a message (author or admin); replies go with it
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, 20, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const session = await getSession()
  if (!session.isAuthenticated || !session.user) return unauthorizedResponse()

  const { slug, id } = await params
  const supabase = createAdminClient()

  const { data: event } = await supabase
    .from('Event')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!event) return notFoundResponse('Event not found')

  const { data: message } = await supabase
    .from('EventMessage')
    .select('id, authorId')
    .eq('id', id)
    .eq('eventId', event.id)
    .single()

  if (!message) return notFoundResponse('Message not found')
  if (message.authorId !== session.user.id && !session.isAdmin) return forbiddenResponse()

  const { error } = await supabase.from('EventMessage').delete().eq('id', id)

  if (error) {
    console.error('[EventMessages] Error deleting message:', error)
    return serverErrorResponse('Failed to delete message')
  }

  return successResponse({ deleted: true })
}
