import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireSupplier } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/me/supplier - Get current user's supplier profile
export async function GET() {
  let user
  try {
    user = await requireSupplier()
  } catch {
    return unauthorizedResponse('Supplier access required')
  }

  const supabase = await createClient()

  const { data: supplier, error } = await supabase
    .from('Supplier')
    .select(`
      *,
      images:SupplierImage(*),
      offers:Offer(*),
      reviews:SupplierReview(*)
    `)
    .eq('userId', user.id)
    .single()

  if (error || !supplier) {
    return notFoundResponse('Supplier profile not found')
  }

  return successResponse(supplier)
}

// POST /api/me/supplier - Create supplier profile (or claim existing)
export async function POST(request: NextRequest) {
  let user
  try {
    user = await requireSupplier()
  } catch {
    return unauthorizedResponse('Supplier access required')
  }

  const supabase = await createClient()
  const body = await request.json()

  // Check if user already has a supplier profile
  const { data: existing } = await supabase
    .from('Supplier')
    .select('id')
    .eq('userId', user.id)
    .single()

  if (existing) {
    return errorResponse('Supplier profile already exists')
  }

  const {
    companyName,
    slug,
    tagline,
    description,
    category,
    services,
    subcategories,
    certifications,
    location,
    country,
    serviceRegions,
    websiteUrl,
    linkedinUrl,
    instagramUrl,
    portfolioUrl,
    logoUrl,
    heroImageUrl,
    contactName,
    contactEmail,
    contactPhone,
    moqMin,
    moqMax,
    leadTimeDays,
  } = body

  if (!companyName || !slug || !category) {
    return errorResponse('Company name, slug, and category are required')
  }

  const { data: supplier, error } = await supabase
    .from('Supplier')
    .insert({
      userId: user.id,
      companyName,
      slug,
      tagline,
      description,
      category,
      services: services || [],
      subcategories: subcategories || [],
      certifications: certifications || [],
      location,
      country,
      serviceRegions: serviceRegions || [],
      websiteUrl,
      linkedinUrl,
      instagramUrl,
      portfolioUrl,
      logoUrl,
      heroImageUrl,
      contactName,
      contactEmail,
      contactPhone,
      moqMin,
      moqMax,
      leadTimeDays,
      isPublic: true,
      isVerified: false,
      claimStatus: 'CLAIMED',
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating supplier:', error)
    if (error.code === '23505') {
      return errorResponse('Slug already exists')
    }
    return serverErrorResponse('Failed to create supplier')
  }

  return successResponse(supplier, 201)
}

// PATCH /api/me/supplier - Update supplier profile
export async function PATCH(request: NextRequest) {
  let user
  try {
    user = await requireSupplier()
  } catch {
    return unauthorizedResponse('Supplier access required')
  }

  const supabase = await createClient()
  const body = await request.json()

  const allowedFields = [
    'companyName',
    'tagline',
    'description',
    'category',
    'services',
    'subcategories',
    'certifications',
    'location',
    'country',
    'serviceRegions',
    'websiteUrl',
    'linkedinUrl',
    'instagramUrl',
    'portfolioUrl',
    'logoUrl',
    'heroImageUrl',
    'contactName',
    'contactEmail',
    'contactPhone',
    'moqMin',
    'moqMax',
    'leadTimeDays',
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

  const { data: supplier, error } = await supabase
    .from('Supplier')
    .update(updates)
    .eq('userId', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating supplier:', error)
    return serverErrorResponse('Failed to update supplier')
  }

  if (!supplier) {
    return notFoundResponse('Supplier profile not found')
  }

  return successResponse(supplier)
}

// DELETE /api/me/supplier - Delete supplier profile
export async function DELETE() {
  let user
  try {
    user = await requireSupplier()
  } catch {
    return unauthorizedResponse('Supplier access required')
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('Supplier')
    .delete()
    .eq('userId', user.id)

  if (error) {
    console.error('Error deleting supplier:', error)
    return serverErrorResponse('Failed to delete supplier')
  }

  return successResponse({ deleted: true })
}
