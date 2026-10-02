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
import {
  EVENT_MESSAGE_SELECT,
  parseEventMessageInput,
  toEventMessage,
} from '@/lib/events/messages'

// POST /api/events/[slug]/messages - Post a message (or reply) on an event's message board
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, 20, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const session = await getSession()
  if (!session.isAuthenticated || !session.user) return unauthorizedResponse()

  const { slug } = await params
  const supabase = createAdminClient()

  const { data: event } = await supabase
    .from('Event')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'PUBLISHED')
    .single()

  if (!event) return notFoundResponse('Event not found')

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return errorResponse('Invalid request body')
  }

  const parsed = parseEventMessageInput(json)
  if ('error' in parsed) return errorResponse(parsed.error)
  const { body, standNumber, attendingDates, parentId } = parsed.data

  // Replies must target a top-level message on the same event
  if (parentId) {
    const { data: parent } = await supabase
      .from('EventMessage')
      .select('id, parentId')
      .eq('id', parentId)
      .eq('eventId', event.id)
      .single()

    if (!parent || parent.parentId) return errorResponse('Message to reply to not found')
  }

  const messageId = crypto.randomUUID()

  const { error: insertError } = await supabase
    .from('EventMessage')
    .insert({
      id: messageId,
      eventId: event.id,
      authorId: session.user.id,
      body,
      standNumber,
      attendingDates,
      parentId,
      updatedAt: new Date().toISOString(),
    })

  if (insertError) {
    console.error('[EventMessages] Error creating message:', insertError)
    return serverErrorResponse('Failed to post message')
  }

  const { data: message, error: fetchError } = await supabase
    .from('EventMessage')
    .select(EVENT_MESSAGE_SELECT)
    .eq('id', messageId)
    .single()

  if (fetchError || !message) {
    console.error('[EventMessages] Error fetching created message:', fetchError)
    return serverErrorResponse('Message posted but failed to load it')
  }

  return successResponse({ message: toEventMessage(message) }, 201)
}
