import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/me/saved-suppliers - List user's saved suppliers
export async function GET() {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const supabase = await createClient()

  const { data: savedSuppliers, error } = await supabase
    .from('SavedSupplier')
    .select(`
      id,
      createdAt,
      supplier:Supplier(
        id,
        companyName,
        slug,
        tagline,
        logoUrl,
        category,
        location,
        country,
        isVerified,
        services
      )
    `)
    .eq('userId', user.id)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('Error fetching saved suppliers:', error)
    return serverErrorResponse('Failed to fetch saved suppliers')
  }

  return successResponse({
    savedSuppliers: savedSuppliers || [],
    total: savedSuppliers?.length || 0,
  })
}

// POST /api/me/saved-suppliers - Save a supplier
export async function POST(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const supabase = await createClient()
  const body = await request.json()

  const { supplierId } = body

  if (!supplierId) {
    return errorResponse('Supplier ID is required')
  }

  // Check if supplier exists and is public
  const { data: supplier } = await supabase
    .from('Supplier')
    .select('id, isPublic')
    .eq('id', supplierId)
    .single()

  if (!supplier) {
    return errorResponse('Supplier not found')
  }

  if (!supplier.isPublic) {
    return errorResponse('Cannot save a private supplier')
  }

  // Check if already saved
  const { data: existing } = await supabase
    .from('SavedSupplier')
    .select('id')
    .eq('userId', user.id)
    .eq('supplierId', supplierId)
    .single()

  if (existing) {
    return errorResponse('Supplier already saved')
  }

  const { data: savedSupplier, error } = await supabase
    .from('SavedSupplier')
    .insert({
      userId: user.id,
      supplierId,
      createdAt: new Date().toISOString(),
    })
    .select(`
      id,
      createdAt,
      supplier:Supplier(id, companyName, slug, logoUrl)
    `)
    .single()

  if (error) {
    console.error('Error saving supplier:', error)
    return serverErrorResponse('Failed to save supplier')
  }

  return successResponse(savedSupplier, 201)
}
