import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSession } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/me/requests - Brand's own posted RFPs
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated || !session.user) return unauthorizedResponse()

  const brandOrg = session.organisations.find(o => o.organisationType === 'BRAND')
  if (!brandOrg?.brandId) {
    return errorResponse('No brand affiliation found', 403)
  }

  const supabase = createAdminClient()

  const { data: rfps, error } = await supabase
    .from('RFP')
    .select(`
      id, title, category, budget, deadline, status, createdAt,
      responses:RFPResponse(count)
    `)
    .eq('brandId', brandOrg.brandId)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('[Me/Requests] Error fetching RFPs:', error)
    return serverErrorResponse('Failed to fetch requests')
  }

  return successResponse({ rfps })
}
