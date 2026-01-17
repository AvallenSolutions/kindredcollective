import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireSupplier } from '@/lib/auth'
import { uploadImage, validateFile } from '@/lib/storage/upload'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/me/supplier/images - List supplier portfolio images
export async function GET() {
  let user
  try {
    user = await requireSupplier()
  } catch {
    return unauthorizedResponse('Supplier access required')
  }

  const supabase = await createClient()

  // Get user's supplier
  const { data: supplier } = await supabase
    .from('Supplier')
    .select('id')
    .eq('userId', user.id)
    .single()

  if (!supplier) {
    return notFoundResponse('Supplier profile not found')
  }

  // Get supplier images
  const { data: images, error } = await supabase
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

// POST /api/me/supplier/images - Upload supplier portfolio image
export async function POST(request: NextRequest) {
  let user
  try {
    user = await requireSupplier()
  } catch {
    return unauthorizedResponse('Supplier access required')
  }

  const supabase = await createClient()

  try {
    // Get user's supplier
    const { data: supplier } = await supabase
      .from('Supplier')
      .select('id')
      .eq('userId', user.id)
      .single()

    if (!supplier) {
      return notFoundResponse('Supplier profile not found')
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
    const { data: image, error: insertError } = await supabase
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
