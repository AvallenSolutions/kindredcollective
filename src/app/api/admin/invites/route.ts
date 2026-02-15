import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { generateSecureToken } from '@/lib/api/token'
import { sendInviteEmail } from '@/lib/email'

// GET /api/admin/invites - List all invite links
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)

  const { page, limit, from, to } = parsePagination(searchParams)
  const isActive = searchParams.get('isActive')
  const targetRole = searchParams.get('targetRole')

  let query = supabase
    .from('InviteLink')
    .select('*', { count: 'exact' })
    .order('createdAt', { ascending: false })
    .range(from, to)

  if (isActive !== null && isActive !== undefined) {
    query = query.eq('isActive', isActive === 'true')
  }

  if (targetRole) {
    query = query.eq('targetRole', targetRole)
  }

  const { data: invites, error, count } = await query

  if (error) {
    console.error('[AdminInvites] Error fetching invite links:', error)
    return serverErrorResponse('Failed to fetch invite links')
  }

  // Calculate statistics
  const statsQuery = await supabase
    .from('InviteLink')
    .select('isActive, usedCount')

  const stats = {
    total: count || 0,
    active: invites?.filter((inv) => inv.isActive).length || 0,
    inactive: invites?.filter((inv) => !inv.isActive).length || 0,
    totalSignups: statsQuery.data?.reduce((sum, inv) => sum + (inv.usedCount || 0), 0) || 0,
  }

  return successResponse({
    invites,
    stats,
    pagination: paginationMeta(page, limit, count || 0),
  })
}

// POST /api/admin/invites - Create a new invite link
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()

    const supabase = createAdminClient()
    const body = await request.json()

    const { expiresAt, maxUses, notes, targetRole, email, phone } = body

    // targetRole is a legacy/informational field — store any value for admin reference
    // All new signups are MEMBER regardless of targetRole

    // Generate a secure random token using standardized utility
    const token = generateSecureToken(24)

    // Prepare invite data
    const inviteData: Record<string, string | number | boolean | null> = {
      token,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      isActive: true,
      usedCount: 0,
    }

    if (expiresAt) {
      inviteData.expiresAt = new Date(expiresAt).toISOString()
    }

    if (maxUses && maxUses > 0) {
      inviteData.maxUses = maxUses
    }

    if (notes) {
      inviteData.notes = notes
    }

    if (targetRole) {
      inviteData.targetRole = targetRole
    }

    if (email) {
      inviteData.email = email
    }

    if (phone) {
      inviteData.phone = phone
    }

    // Create invite link
    const { data: invite, error } = await supabase
      .from('InviteLink')
      .insert(inviteData)
      .select('*')
      .single()

    if (error) {
      console.error('[AdminInvites] Error creating invite link:', error)
      return serverErrorResponse('Failed to create invite link')
    }

    // Send invite email if email is provided
    if (email) {
      try {
        await sendInviteEmail(email, token, { notes: notes || undefined })
      } catch (emailError) {
        console.error('[AdminInvites] Failed to send invite email:', emailError)
        // Don't fail the invite creation if email fails
      }
    }

    return successResponse(invite, 201)
  } catch (error) {
    console.error('[AdminInvites] Unexpected error:', error instanceof Error ? error.message : error)
    return serverErrorResponse('Failed to create invite link')
  }
}
