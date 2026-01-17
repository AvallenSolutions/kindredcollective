import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireBrand } from '@/lib/auth'
import { uploadImage, validateFile } from '@/lib/storage/upload'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/me/brand/images - List brand images
export async function GET() {
  let user
  try {
    user = await requireBrand()
  } catch {
    return unauthorizedResponse('Brand access required')
  }

  const supabase = await createClient()

  // Get user's brand
  const { data: brand } = await supabase
    .from('Brand')
    .select('id')
    .eq('userId', user.id)
    .single()

  if (!brand) {
    return notFoundResponse('Brand profile not found')
  }

  // Get brand images
  const { data: images, error } = await supabase
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

// POST /api/me/brand/images - Upload brand image
export async function POST(request: NextRequest) {
  let user
  try {
    user = await requireBrand()
  } catch {
    return unauthorizedResponse('Brand access required')
  }

  const supabase = await createClient()

  try {
    // Get user's brand
    const { data: brand } = await supabase
      .from('Brand')
      .select('id')
      .eq('userId', user.id)
      .single()

    if (!brand) {
      return notFoundResponse('Brand profile not found')
    }

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
    const { data: existingImages } = await supabase
      .from('BrandImage')
      .select('order')
      .eq('brandId', brand.id)
      .order('order', { ascending: false })
      .limit(1)

    const nextOrder = existingImages && existingImages.length > 0
      ? (existingImages[0].order || 0) + 1
      : 0

    // Upload image
    const { url } = await uploadImage(file, 'brand-images', brand.id)

    // Create image record
    const { data: image, error: insertError } = await supabase
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
