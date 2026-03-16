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

// GET /api/requests/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session.isAuthenticated) return unauthorizedResponse()

  const { id } = await params
  const supabase = createAdminClient()

  const { data: rfp, error } = await supabase
    .from('RFP')
    .select(`
      id, title, description, category, subcategories,
      budget, deadline, location, isRemoteOk, status, createdAt, updatedAt,
      brand:Brand(id, name, slug, logoUrl, category, location, isVerified),
      responses:RFPResponse(
        id, message, status, createdAt,
        supplier:Supplier(id, companyName, slug, logoUrl, category, tagline, isVerified),
        respondedBy:User(id, member:Member(firstName, lastName, avatarUrl))
      )
    `)
    .eq('id', id)
    .single()

  if (error || !rfp) return notFoundResponse('Request not found')

  // Hide full response details from non-owners (they only see the count)
  const brandOrg = session.organisations.find(o => o.organisationType === 'BRAND' && o.brandId === (rfp.brand as any)?.id)
  const isOwner = !!brandOrg || session.isAdmin

  const sanitized = isOwner
    ? rfp
    : { ...rfp, responses: (rfp.responses as any[]).length }

  return successResponse({ rfp: sanitized, isOwner })
}

// PATCH /api/requests/[id] - Update status or details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session.isAuthenticated || !session.user) return unauthorizedResponse()

  const { id } = await params
  const supabase = createAdminClient()

  // Fetch the RFP to verify ownership
  const { data: existing } = await supabase
    .from('RFP')
    .select('id, brandId, brand:Brand(id)')
    .eq('id', id)
    .single()

  if (!existing) return notFoundResponse('Request not found')

  const brandOrg = session.organisations.find(
    o => o.organisationType === 'BRAND' && o.brandId === (existing.brand as any)?.id
  )
  if (!brandOrg && !session.isAdmin) {
    return errorResponse('You do not have permission to edit this request', 403)
  }

  const body = await request.json()
  const { title, description, category, subcategories, budget, deadline, location, isRemoteOk, status } = body

  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() }
  if (title !== undefined) updates.title = title.trim()
  if (description !== undefined) updates.description = description.trim()
  if (category !== undefined) updates.category = category
  if (subcategories !== undefined) updates.subcategories = subcategories
  if (budget !== undefined) updates.budget = budget?.trim() || null
  if (deadline !== undefined) updates.deadline = deadline || null
  if (location !== undefined) updates.location = location?.trim() || null
  if (isRemoteOk !== undefined) updates.isRemoteOk = isRemoteOk
  if (status !== undefined) updates.status = status

  const { data: rfp, error } = await supabase
    .from('RFP')
    .update(updates)
    .eq('id', id)
    .select('id, status')
    .single()

  if (error) {
    console.error('[Requests] Error updating RFP:', error)
    return serverErrorResponse('Failed to update request')
  }

  return successResponse({ rfp })
}

// DELETE /api/requests/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session.isAuthenticated || !session.user) return unauthorizedResponse()

  const { id } = await params
  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('RFP')
    .select('id, brand:Brand(id)')
    .eq('id', id)
    .single()

  if (!existing) return notFoundResponse('Request not found')

  const brandOrg = session.organisations.find(
    o => o.organisationType === 'BRAND' && o.brandId === (existing.brand as any)?.id
  )
  if (!brandOrg && !session.isAdmin) {
    return errorResponse('You do not have permission to delete this request', 403)
  }

  const { error } = await supabase.from('RFP').delete().eq('id', id)

  if (error) {
    console.error('[Requests] Error deleting RFP:', error)
    return serverErrorResponse('Failed to delete request')
  }

  return successResponse({ deleted: true })
}
