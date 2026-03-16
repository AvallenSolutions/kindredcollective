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

// PATCH /api/requests/[id]/responses/[responseId] - Brand shortlists or rejects a response
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; responseId: string }> }
) {
  const session = await getSession()
  if (!session.isAuthenticated || !session.user) return unauthorizedResponse()

  const { id, responseId } = await params
  const supabase = createAdminClient()

  // Verify the RFP belongs to this brand user
  const { data: rfp } = await supabase
    .from('RFP')
    .select('id, brand:Brand(id)')
    .eq('id', id)
    .single()

  if (!rfp) return notFoundResponse('Request not found')

  const brandOrg = session.organisations.find(
    o => o.organisationType === 'BRAND' && o.brandId === (rfp.brand as any)?.id
  )
  if (!brandOrg && !session.isAdmin) {
    return errorResponse('You do not have permission to manage responses for this request', 403)
  }

  const body = await request.json()
  const { status } = body

  if (!['PENDING', 'SHORTLISTED', 'REJECTED'].includes(status)) {
    return errorResponse('Invalid status')
  }

  const { data: response, error } = await supabase
    .from('RFPResponse')
    .update({ status, updatedAt: new Date().toISOString() })
    .eq('id', responseId)
    .eq('rfpId', id)
    .select(`
      id, status,
      supplier:Supplier(id, companyName, slug, contactEmail, contactName)
    `)
    .single()

  if (error || !response) {
    console.error('[Requests] Error updating response:', error)
    return serverErrorResponse('Failed to update response')
  }

  return successResponse({ response })
}
