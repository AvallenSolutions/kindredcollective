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

// PATCH /api/admin/requests/[id] - Admin: update status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session.isAuthenticated) return unauthorizedResponse()
  if (!session.isAdmin) return forbiddenResponse()

  const { id } = params
  const body = await request.json()
  const supabase = createAdminClient()

  const { data: rfp, error } = await supabase
    .from('RFP')
    .update({ status: body.status, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .select('id, status')
    .single()

  if (error || !rfp) {
    return notFoundResponse('Request not found')
  }

  return successResponse({ rfp })
}

// DELETE /api/admin/requests/[id] - Admin: delete any RFP
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session.isAuthenticated) return unauthorizedResponse()
  if (!session.isAdmin) return forbiddenResponse()

  const { id } = params
  const supabase = createAdminClient()

  const { error } = await supabase.from('RFP').delete().eq('id', id)

  if (error) {
    console.error('[Admin/Requests] Error deleting RFP:', error)
    return serverErrorResponse('Failed to delete request')
  }

  return successResponse({ deleted: true })
}
