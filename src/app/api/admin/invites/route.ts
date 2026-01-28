import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'
import { randomBytes } from 'crypto'

// GET /api/admin/invites - List all invite links
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)

  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const isActive = searchParams.get('isActive')

  let query = supabase
    .from('InviteLink')
    .select('*, admin:User!InviteLink_createdBy_fkey(email, member:Member(firstName, lastName))', { count: 'exact' })
    .order('createdAt', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (isActive !== null && isActive !== undefined) {
    query = query.eq('isActive', isActive === 'true')
  }

  const { data: invites, error, count } = await query

  if (error) {
    console.error('Error fetching invite links:', error)
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
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  })
}

// POST /api/admin/invites - Create a new invite link
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()

    const supabase = createAdminClient()
    const body = await request.json()

    const { expiresAt, maxUses, notes } = body

    // Generate a secure random token (32 characters, URL-safe)
    const token = randomBytes(24).toString('base64url')

    // Prepare invite data
    const inviteData: any = {
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

    // Create invite link
    const { data: invite, error } = await supabase
      .from('InviteLink')
      .insert(inviteData)
      .select('*, admin:User!InviteLink_createdBy_fkey(email, member:Member(firstName, lastName))')
      .single()

    if (error) {
      console.error('Error creating invite link:', error)
      return serverErrorResponse('Failed to create invite link')
    }

    return successResponse(invite, 201)
  } catch (error) {
    console.error('Error in POST /api/admin/invites:', error)
    return unauthorizedResponse('Admin access required')
  }
}
