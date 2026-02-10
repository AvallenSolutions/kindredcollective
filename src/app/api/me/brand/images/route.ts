import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth, getUserBrandViaOrg } from '@/lib/auth/session'
import { uploadImage, validateFile } from '@/lib/storage/upload'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/me/brand/images?orgId=xxx - List brand images
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

  const brand = await getUserBrandViaOrg(user.id, orgId)
  if (!brand) {
    return notFoundResponse('Brand not found or access denied')
  }

  const adminClient = createAdminClient()
  const { data: images, error } = await adminClient
    .from('BrandImage')
    .select('id, url, alt, order, createdAt')
    .eq('brandId', brand.id)
    .order('order', { ascending: true })

  if (error) {
    console.error('Error fetching brand images:', error)
    return serverErrorResponse('Failed to fetch images')
  }

  return successResponse({
    images: images || [],
    total: images?.length || 0,
  })
}

// POST /api/me/brand/images?orgId=xxx - Upload brand image
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

  const brand = await getUserBrandViaOrg(user.id, orgId)
  if (!brand) {
    return notFoundResponse('Brand not found or access denied')
  }

  const adminClient = createAdminClient()

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const alt = formData.get('alt') as string | null

    if (!file) {
      return errorResponse('No file provided')
    }

    const validation = validateFile(file)
    if (!validation.valid) {
      return errorResponse(validation.error || 'Invalid file')
    }

    const { data: existingImages } = await adminClient
      .from('BrandImage')
      .select('order')
      .eq('brandId', brand.id)
      .order('order', { ascending: false })
      .limit(1)

    const nextOrder = existingImages && existingImages.length > 0
      ? (existingImages[0].order || 0) + 1
      : 0

    const { url } = await uploadImage(file, 'brand-images', brand.id)

    const { data: image, error: insertError } = await adminClient
      .from('BrandImage')
      .insert({
        brandId: brand.id,
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
    console.error('Error uploading brand image:', error)
    return serverErrorResponse('Failed to upload image')
  }
}
