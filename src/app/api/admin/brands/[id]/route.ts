import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/brands/[id] - Get single brand with all details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const { id } = await params
  const supabase = await createClient()

  const { data: brand, error } = await supabase
    .from('Brand')
    .select('*, user:User(email, role, member:Member(firstName, lastName)), images:BrandImage(*), savedBy:SavedBrand(count)')
    .eq('id', id)
    .single()

  if (error || !brand) {
    return notFoundResponse('Brand not found')
  }

  return successResponse(brand)
}

// PATCH /api/admin/brands/[id] - Update brand
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()

  const allowedFields = [
    'name',
    'slug',
    'tagline',
    'description',
    'story',
    'logoUrl',
    'heroImageUrl',
    'websiteUrl',
    'instagramUrl',
    'linkedinUrl',
    'twitterUrl',
    'category',
    'subcategories',
    'yearFounded',
    'location',
    'country',
    'isVerified',
    'isPublic',
    'userId',
  ]

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  }

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field]
    }
  }

  const { data: brand, error } = await supabase
    .from('Brand')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating brand:', error)
    return serverErrorResponse('Failed to update brand')
  }

  if (!brand) {
    return notFoundResponse('Brand not found')
  }

  return successResponse(brand)
}

// DELETE /api/admin/brands/[id] - Delete brand
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const { id } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from('Brand')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting brand:', error)
    return serverErrorResponse('Failed to delete brand')
  }

  return successResponse({ deleted: true })
}
