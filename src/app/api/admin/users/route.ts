import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'
import { sanitizeFilterInput } from '@/lib/api/sanitize'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)

  const { page, limit, from, to } = parsePagination(searchParams)
  const role = searchParams.get('role')
  const rawSearch = searchParams.get('search')

  let query = supabase
    .from('User')
    .select('*', { count: 'exact' })
    .order('createdAt', { ascending: false })
    .range(from, to)

  if (role) {
    query = query.eq('role', role)
  }

  if (rawSearch) {
    const search = sanitizeFilterInput(rawSearch)
    query = query.ilike('email', `%${search}%`)
  }

  const { data: users, error, count } = await query

  if (error) {
    console.error('[AdminUsers] Error fetching users:', error)
    return serverErrorResponse('Failed to fetch users')
  }

  return successResponse({
    users,
    pagination: paginationMeta(page, limit, count || 0),
  })
}

// POST /api/admin/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const supabase = createAdminClient()
  const body = await request.json()

  const { email, role } = body

  if (!email || !role) {
    return errorResponse('Email and role are required')
  }

  if (!['MEMBER', 'ADMIN'].includes(role)) {
    return errorResponse('Invalid role. Must be MEMBER or ADMIN')
  }

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  })

  if (authError) {
    console.error('[AdminUsers] Error creating auth user:', authError)
    return errorResponse(authError.message)
  }

  // Create user record in our database
  const { data: user, error: dbError } = await supabase
    .from('User')
    .insert({
      id: authData.user.id,
      email,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (dbError) {
    console.error('[AdminUsers] Error creating user record:', dbError)
    return serverErrorResponse('Failed to create user record')
  }

  return successResponse(user, 201)
}
