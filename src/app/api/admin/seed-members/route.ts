import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// POST /api/admin/seed-members - Ensure all users have Member records
export async function POST() {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const supabase = createAdminClient()

  // Get all users
  const { data: users, error: usersError } = await supabase
    .from('User')
    .select('id, email, role')

  if (usersError || !users) {
    return serverErrorResponse('Failed to fetch users')
  }

  // Get existing members
  const { data: existingMembers } = await supabase
    .from('Member')
    .select('userId')

  const existingUserIds = new Set(existingMembers?.map((m) => m.userId) || [])

  // Create Member records for users who don't have one
  const usersWithoutMembers = users.filter((u) => !existingUserIds.has(u.id))

  let created = 0
  const errors: string[] = []

  for (const user of usersWithoutMembers) {
    // Extract name from email or user metadata
    const emailName = user.email.split('@')[0]
    const parts = emailName.split(/[._-]/)
    const firstName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'User'
    const lastName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : ''

    const { error } = await supabase
      .from('Member')
      .insert({
        id: crypto.randomUUID(),
        userId: user.id,
        firstName,
        lastName,
        jobTitle: user.role === 'ADMIN' ? 'Admin' : null,
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

    if (error) {
      errors.push(`${user.email}: ${error.message}`)
    } else {
      created++
    }
  }

  return successResponse({
    totalUsers: users.length,
    existingMembers: existingUserIds.size,
    created,
    errors,
  })
}

// GET /api/admin/seed-members - Check status
export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const supabase = createAdminClient()

  const { data: users } = await supabase
    .from('User')
    .select('id, email, role')

  const { data: members } = await supabase
    .from('Member')
    .select('userId, firstName, lastName, isPublic')

  const memberUserIds = new Set(members?.map((m) => m.userId) || [])
  const usersWithoutMembers = users?.filter((u) => !memberUserIds.has(u.id)) || []

  return successResponse({
    totalUsers: users?.length || 0,
    totalMembers: members?.length || 0,
    usersWithoutMembers: usersWithoutMembers.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
    })),
  })
}
