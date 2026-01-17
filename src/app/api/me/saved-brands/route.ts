import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/me/saved-brands - List user's saved brands
export async function GET() {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const supabase = await createClient()

  const { data: savedBrands, error } = await supabase
    .from('SavedBrand')
    .select(`
      id,
      createdAt,
      brand:Brand(
        id,
        name,
        slug,
        tagline,
        logoUrl,
        category,
        location,
        country,
        isVerified
      )
    `)
    .eq('userId', user.id)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('Error fetching saved brands:', error)
    return serverErrorResponse('Failed to fetch saved brands')
  }

  return successResponse({
    savedBrands: savedBrands || [],
    total: savedBrands?.length || 0,
  })
}

// POST /api/me/saved-brands - Save a brand
export async function POST(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const supabase = await createClient()
  const body = await request.json()

  const { brandId } = body

  if (!brandId) {
    return errorResponse('Brand ID is required')
  }

  // Check if brand exists and is public
  const { data: brand } = await supabase
    .from('Brand')
    .select('id, isPublic')
    .eq('id', brandId)
    .single()

  if (!brand) {
    return errorResponse('Brand not found')
  }

  if (!brand.isPublic) {
    return errorResponse('Cannot save a private brand')
  }

  // Check if already saved
  const { data: existing } = await supabase
    .from('SavedBrand')
    .select('id')
    .eq('userId', user.id)
    .eq('brandId', brandId)
    .single()

  if (existing) {
    return errorResponse('Brand already saved')
  }

  const { data: savedBrand, error } = await supabase
    .from('SavedBrand')
    .insert({
      userId: user.id,
      brandId,
      createdAt: new Date().toISOString(),
    })
    .select(`
      id,
      createdAt,
      brand:Brand(id, name, slug, logoUrl)
    `)
    .single()

  if (error) {
    console.error('Error saving brand:', error)
    return serverErrorResponse('Failed to save brand')
  }

  return successResponse(savedBrand, 201)
}
