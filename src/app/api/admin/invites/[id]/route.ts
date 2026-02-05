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

interface InviteUpdateData {
  isActive?: boolean
  expiresAt?: string | null
  maxUses?: number | null
  notes?: string
}

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
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !invite) {
    if (error && error.code !== 'PGRST116') {
      console.error('[AdminInvites] Error fetching invite:', error)
      return serverErrorResponse('Failed to fetch invite')
    }
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

  const updateData: InviteUpdateData = {}

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
    .select('*')
    .single()

  if (error) {
    console.error('[AdminInvites] Error updating invite link:', error)
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
  const { data: invite, error: fetchError } = await supabase
    .from('InviteLink')
    .select('usedCount')
    .eq('id', params.id)
    .single()

  if (fetchError || !invite) {
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[AdminInvites] Error fetching invite:', fetchError)
      return serverErrorResponse('Failed to fetch invite')
    }
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
    console.error('[AdminInvites] Error deleting invite link:', error)
    return serverErrorResponse('Failed to delete invite link')
  }

  return successResponse({ message: 'Invite link deleted successfully' })
}
