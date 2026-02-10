import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/users/[id] - Get single user
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const { id } = await params
  const supabase = createAdminClient()

  // Fetch user with member profile and org memberships
  const [userResult, orgResult] = await Promise.all([
    supabase
      .from('User')
      .select('*, member:Member(*)')
      .eq('id', id)
      .single(),
    supabase
      .from('OrganisationMember')
      .select(`
        role,
        organisation:Organisation(
          id, name, slug, type,
          brand:Brand(id, name, slug),
          supplier:Supplier(id, companyName, slug)
        )
      `)
      .eq('userId', id),
  ])

  const { data: user, error } = userResult
  const organisations = (orgResult.data || []).map((m: any) => {
    const org = Array.isArray(m.organisation) ? m.organisation[0] : m.organisation
    return org ? { ...org, memberRole: m.role } : null
  }).filter(Boolean)

  if (!error && user) {
    ;(user as any).organisations = organisations
  }

  if (error || !user) {
    return notFoundResponse('User not found')
  }

  return successResponse(user)
}

// PATCH /api/admin/users/[id] - Update user
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const { id } = await params
  const supabase = createAdminClient()
  const body = await request.json()

  const { role, emailVerified } = body

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  }

  if (role && ['MEMBER', 'ADMIN'].includes(role)) {
    updates.role = role
  }

  if (emailVerified !== undefined) {
    updates.emailVerified = emailVerified ? new Date().toISOString() : null
  }

  const { data: user, error } = await supabase
    .from('User')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating user:', error)
    return serverErrorResponse('Failed to update user')
  }

  if (!user) {
    return notFoundResponse('User not found')
  }

  return successResponse(user)
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const { id } = await params
  const supabase = createAdminClient()

  // Delete from our database (cascade will handle related records)
  const { error: dbError } = await supabase
    .from('User')
    .delete()
    .eq('id', id)

  if (dbError) {
    console.error('Error deleting user from database:', dbError)
    return serverErrorResponse('Failed to delete user')
  }

  // Delete from Supabase Auth
  const { error: authError } = await supabase.auth.admin.deleteUser(id)

  if (authError) {
    console.error('Error deleting auth user:', authError)
    // User is already deleted from DB, log but don't fail
  }

  return successResponse({ deleted: true })
}
