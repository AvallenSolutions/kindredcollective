import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth, getUserSupplierViaOrg } from '@/lib/auth/session'
import { uploadImage, validateFile } from '@/lib/storage/upload'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/me/supplier/images?orgId=xxx - List supplier portfolio images
export async function GET(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse('Authentication required')
  }

  const orgId = request.nextUrl.searchParams.get('orgId')
  if (!orgId) {
    return errorResponse('orgId query parameter is required')
  }

  const supplier = await getUserSupplierViaOrg(user.id, orgId)
  if (!supplier) {
    return notFoundResponse('Supplier not found or access denied')
  }

  const adminClient = createAdminClient()

  // Get supplier images
  const { data: images, error } = await adminClient
    .from('SupplierImage')
    .select('id, url, alt, order, createdAt')
    .eq('supplierId', supplier.id)
    .order('order', { ascending: true })

  if (error) {
    console.error('Error fetching supplier images:', error)
    return serverErrorResponse('Failed to fetch images')
  }

  return successResponse({
    images: images || [],
    total: images?.length || 0,
  })
}

// POST /api/me/supplier/images?orgId=xxx - Upload supplier portfolio image
export async function POST(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse('Authentication required')
  }

  const orgId = request.nextUrl.searchParams.get('orgId')
  if (!orgId) {
    return errorResponse('orgId query parameter is required')
  }

  const supplier = await getUserSupplierViaOrg(user.id, orgId)
  if (!supplier) {
    return notFoundResponse('Supplier not found or access denied')
  }

  const adminClient = createAdminClient()

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const alt = formData.get('alt') as string | null

    if (!file) {
      return errorResponse('No file provided')
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      return errorResponse(validation.error || 'Invalid file')
    }

    // Get current max order
    const { data: existingImages } = await adminClient
      .from('SupplierImage')
      .select('order')
      .eq('supplierId', supplier.id)
      .order('order', { ascending: false })
      .limit(1)

    const nextOrder = existingImages && existingImages.length > 0
      ? (existingImages[0].order || 0) + 1
      : 0

    // Upload image
    const { url } = await uploadImage(file, 'supplier-images', supplier.id)

    // Create image record
    const { data: image, error: insertError } = await adminClient
      .from('SupplierImage')
      .insert({
        supplierId: supplier.id,
        url,
        alt: alt || null,
        order: nextOrder,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating image record:', insertError)
      return serverErrorResponse('Failed to save image')
    }

    return successResponse(image, 201)
  } catch (error) {
    console.error('Error uploading supplier image:', error)
    return serverErrorResponse('Failed to upload image')
  }
}
