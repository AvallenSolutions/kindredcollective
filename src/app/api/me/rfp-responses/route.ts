import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSession } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/me/rfp-responses - Supplier's submitted responses
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated || !session.user) return unauthorizedResponse()

  const supplierOrg = session.organisations.find(o => o.organisationType === 'SUPPLIER')
  if (!supplierOrg?.supplierId) {
    return errorResponse('No supplier affiliation found', 403)
  }

  const supabase = createAdminClient()

  const { data: responses, error } = await supabase
    .from('RFPResponse')
    .select(`
      id, message, status, createdAt,
      rfp:RFP(
        id, title, category, budget, deadline, status,
        brand:Brand(id, name, slug, logoUrl)
      )
    `)
    .eq('supplierId', supplierOrg.supplierId)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('[Me/RFPResponses] Error fetching responses:', error)
    return serverErrorResponse('Failed to fetch responses')
  }

  return successResponse({ responses })
}
