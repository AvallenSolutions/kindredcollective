import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/invites/validate?token=xxx - Validate an invite token (public endpoint)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return errorResponse('Invite token is required')
  }

  const supabase = createAdminClient()

  const { data: invite, error } = await supabase
    .from('InviteLink')
    .select('id, token, isActive, expiresAt, maxUses, usedCount, targetRole')
    .eq('token', token)
    .single()

  if (error || !invite) {
    return errorResponse('Invalid invite token', 404)
  }

  // Check if invite is active
  if (!invite.isActive) {
    return errorResponse('This invite link has been deactivated', 403)
  }

  // Check if expired
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return errorResponse('This invite link has expired', 403)
  }

  // Check if max uses reached
  if (invite.maxUses && invite.usedCount >= invite.maxUses) {
    return errorResponse('This invite link has reached its maximum usage limit', 403)
  }

  return successResponse({
    valid: true,
    token: invite.token,
    targetRole: invite.targetRole || null,
  })
}
