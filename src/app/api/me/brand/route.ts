import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireBrand } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/me/brand - Get current user's brand profile
export async function GET() {
  let user
  try {
    user = await requireBrand()
  } catch {
    return unauthorizedResponse('Brand access required')
  }

  const supabase = await createClient()

  const { data: brand, error } = await supabase
    .from('Brand')
    .select('*, images:BrandImage(*)')
    .eq('userId', user.id)
    .single()

  if (error || !brand) {
    return notFoundResponse('Brand profile not found')
  }

  return successResponse(brand)
}

// POST /api/me/brand - Create brand profile
export async function POST(request: NextRequest) {
  let user
  try {
    user = await requireBrand()
  } catch {
    return unauthorizedResponse('Brand access required')
  }

  const supabase = await createClient()
  const body = await request.json()

  // Check if user already has a brand
  const { data: existing } = await supabase
    .from('Brand')
    .select('id')
    .eq('userId', user.id)
    .single()

  if (existing) {
    return errorResponse('Brand profile already exists')
  }

  const {
    name,
    slug,
    tagline,
    description,
    story,
    category,
    subcategories,
    yearFounded,
    location,
    country,
    websiteUrl,
    instagramUrl,
    linkedinUrl,
    twitterUrl,
    logoUrl,
    heroImageUrl,
  } = body

  if (!name || !slug || !category) {
    return errorResponse('Name, slug, and category are required')
  }

  const { data: brand, error } = await supabase
    .from('Brand')
    .insert({
      userId: user.id,
      name,
      slug,
      tagline,
      description,
      story,
      category,
      subcategories: subcategories || [],
      yearFounded,
      location,
      country,
      websiteUrl,
      instagramUrl,
      linkedinUrl,
      twitterUrl,
      logoUrl,
      heroImageUrl,
      isPublic: true,
      isVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating brand:', error)
    if (error.code === '23505') {
      return errorResponse('Slug already exists')
    }
    return serverErrorResponse('Failed to create brand')
  }

  return successResponse(brand, 201)
}

// PATCH /api/me/brand - Update brand profile
export async function PATCH(request: NextRequest) {
  let user
  try {
    user = await requireBrand()
  } catch {
    return unauthorizedResponse('Brand access required')
  }

  const supabase = await createClient()
  const body = await request.json()

  const allowedFields = [
    'name',
    'tagline',
    'description',
    'story',
    'category',
    'subcategories',
    'yearFounded',
    'location',
    'country',
    'websiteUrl',
    'instagramUrl',
    'linkedinUrl',
    'twitterUrl',
    'logoUrl',
    'heroImageUrl',
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

  const { data: brand, error } = await supabase
    .from('Brand')
    .update(updates)
    .eq('userId', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating brand:', error)
    return serverErrorResponse('Failed to update brand')
  }

  if (!brand) {
    return notFoundResponse('Brand profile not found')
  }

  return successResponse(brand)
}

// DELETE /api/me/brand - Delete brand profile
export async function DELETE() {
  let user
  try {
    user = await requireBrand()
  } catch {
    return unauthorizedResponse('Brand access required')
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('Brand')
    .delete()
    .eq('userId', user.id)

  if (error) {
    console.error('Error deleting brand:', error)
    return serverErrorResponse('Failed to delete brand')
  }

  return successResponse({ deleted: true })
}
