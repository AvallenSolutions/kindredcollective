import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const role = searchParams.get('role')
  const search = searchParams.get('search')

  let query = supabase
    .from('User')
    .select('*', { count: 'exact' })
    .order('createdAt', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (role) {
    query = query.eq('role', role)
  }

  if (search) {
    query = query.ilike('email', `%${search}%`)
  }

  const { data: users, error, count } = await query

  if (error) {
    console.error('Error fetching users:', error)
    return serverErrorResponse('Failed to fetch users')
  }

  return successResponse({
    users,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  })
}

// POST /api/admin/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const supabase = await createClient()
  const body = await request.json()

  const { email, role } = body

  if (!email || !role) {
    return errorResponse('Email and role are required')
  }

  if (!['BRAND', 'SUPPLIER', 'ADMIN'].includes(role)) {
    return errorResponse('Invalid role')
  }

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  })

  if (authError) {
    console.error('Error creating auth user:', authError)
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
    console.error('Error creating user record:', dbError)
    return serverErrorResponse('Failed to create user record')
  }

  return successResponse(user, 201)
}
