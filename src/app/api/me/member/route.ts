import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/me/member - Get current user's member profile
export async function GET() {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const supabase = await createClient()

  const { data: member, error } = await supabase
    .from('Member')
    .select('*')
    .eq('userId', user.id)
    .single()

  if (error || !member) {
    return notFoundResponse('Member profile not found')
  }

  return successResponse(member)
}

// POST /api/me/member - Create member profile
export async function POST(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const supabase = await createClient()
  const body = await request.json()

  // Check if user already has a member profile
  const { data: existing } = await supabase
    .from('Member')
    .select('id')
    .eq('userId', user.id)
    .single()

  if (existing) {
    return errorResponse('Member profile already exists. Use PATCH to update.')
  }

  const { firstName, lastName, jobTitle, bio, linkedinUrl, phone, isPublic } = body

  if (!firstName || !lastName) {
    return errorResponse('First name and last name are required')
  }

  const { data: member, error } = await supabase
    .from('Member')
    .insert({
      userId: user.id,
      firstName,
      lastName,
      jobTitle: jobTitle || null,
      bio: bio || null,
      linkedinUrl: linkedinUrl || null,
      phone: phone || null,
      isPublic: isPublic ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating member:', error)
    return serverErrorResponse('Failed to create member profile')
  }

  return successResponse(member, 201)
}

// PATCH /api/me/member - Update member profile
export async function PATCH(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const supabase = await createClient()
  const body = await request.json()

  const allowedFields = [
    'firstName',
    'lastName',
    'jobTitle',
    'bio',
    'avatarUrl',
    'linkedinUrl',
    'phone',
    'isPublic',
  ]

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  }

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field]
    }
  }

  const { data: member, error } = await supabase
    .from('Member')
    .update(updates)
    .eq('userId', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating member:', error)
    return serverErrorResponse('Failed to update member profile')
  }

  if (!member) {
    return notFoundResponse('Member profile not found')
  }

  return successResponse(member)
}
