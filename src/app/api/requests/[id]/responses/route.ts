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

// POST /api/requests/[id]/responses - Supplier submits expression of interest
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimitResponse = applyRateLimit(request, 10, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const session = await getSession()
  if (!session.isAuthenticated || !session.user) return unauthorizedResponse()

  const supplierOrg = session.organisations.find(o => o.organisationType === 'SUPPLIER')
  if (!supplierOrg?.supplierId) {
    return errorResponse('Only supplier members can respond to requests', 403)
  }

  const { id } = params
  const supabase = createAdminClient()

  // Check the RFP exists and is open
  const { data: rfp } = await supabase
    .from('RFP')
    .select('id, status, brandId')
    .eq('id', id)
    .single()

  if (!rfp) return notFoundResponse('Request not found')
  if (rfp.status !== 'OPEN') return errorResponse('This request is no longer accepting responses')

  const body = await request.json()
  const { message } = body

  if (!message?.trim()) return errorResponse('Message is required')

  const { data: response, error } = await supabase
    .from('RFPResponse')
    .insert({
      id: crypto.randomUUID(),
      rfpId: id,
      supplierId: supplierOrg.supplierId,
      respondedByUserId: session.user.id,
      message: message.trim(),
      status: 'PENDING',
      updatedAt: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      return errorResponse('You have already responded to this request')
    }
    console.error('[Requests] Error creating response:', error)
    return serverErrorResponse('Failed to submit response')
  }

  return successResponse({ response }, 201)
}
