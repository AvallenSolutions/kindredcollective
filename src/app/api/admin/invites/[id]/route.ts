import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
  notFoundResponse,
} from '@/lib/api/response'

// GET /api/admin/invites/[id] - Get a specific invite link
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const supabase = createAdminClient()

  const { data: invite, error } = await supabase
    .from('InviteLink')
    .select('*, admin:User!InviteLink_createdBy_fkey(email, member:Member(firstName, lastName)), signups:User!User_inviteLinkToken_fkey(id, email, role, createdAt, member:Member(firstName, lastName))')
    .eq('id', params.id)
    .single()

  if (error || !invite) {
    return notFoundResponse('Invite link not found')
  }

  return successResponse(invite)
}

// PATCH /api/admin/invites/[id] - Update an invite link
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const supabase = createAdminClient()
  const body = await request.json()

  const { isActive, expiresAt, maxUses, notes } = body

  const updateData: any = {}

  if (typeof isActive === 'boolean') {
    updateData.isActive = isActive
  }

  if (expiresAt !== undefined) {
    updateData.expiresAt = expiresAt ? new Date(expiresAt).toISOString() : null
  }

  if (maxUses !== undefined) {
    updateData.maxUses = maxUses > 0 ? maxUses : null
  }

  if (notes !== undefined) {
    updateData.notes = notes
  }

  const { data: invite, error } = await supabase
    .from('InviteLink')
    .update(updateData)
    .eq('id', params.id)
    .select('*, admin:User!InviteLink_createdBy_fkey(email, member:Member(firstName, lastName))')
    .single()

  if (error) {
    console.error('Error updating invite link:', error)
    return serverErrorResponse('Failed to update invite link')
  }

  if (!invite) {
    return notFoundResponse('Invite link not found')
  }

  return successResponse(invite)
}

// DELETE /api/admin/invites/[id] - Delete an invite link
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const supabase = createAdminClient()

  // Check if invite has been used
  const { data: invite } = await supabase
    .from('InviteLink')
    .select('usedCount')
    .eq('id', params.id)
    .single()

  if (!invite) {
    return notFoundResponse('Invite link not found')
  }

  if (invite.usedCount > 0) {
    return errorResponse('Cannot delete invite link that has been used. Deactivate it instead.')
  }

  const { error } = await supabase
    .from('InviteLink')
    .delete()
    .eq('id', params.id)

  if (error) {
    console.error('Error deleting invite link:', error)
    return serverErrorResponse('Failed to delete invite link')
  }

  return successResponse({ message: 'Invite link deleted successfully' })
}
