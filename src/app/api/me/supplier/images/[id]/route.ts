import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth, getUserSupplierViaOrg } from '@/lib/auth/session'
import { deleteImage, extractPathFromUrl } from '@/lib/storage/upload'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

interface RouteParams {
  params: Promise<{ id: string }>
}

// DELETE /api/me/supplier/images/[id]?orgId=xxx - Delete supplier portfolio image
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

  const { id } = await params
  const adminClient = createAdminClient()

  try {
    // Get the image and verify ownership
    const { data: image } = await adminClient
      .from('SupplierImage')
      .select('id, url, supplierId')
      .eq('id', id)
      .single()

    if (!image) {
      return notFoundResponse('Image not found')
    }

    if (image.supplierId !== supplier.id) {
      return unauthorizedResponse('You do not own this image')
    }

    // Delete from storage
    const path = extractPathFromUrl(image.url, 'supplier-images')
    if (path) {
      try {
        await deleteImage('supplier-images', path)
      } catch (e) {
        console.error('Failed to delete from storage:', e)
      }
    }

    // Delete record
    const { error: deleteError } = await adminClient
      .from('SupplierImage')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting image record:', deleteError)
      return serverErrorResponse('Failed to delete image')
    }

    return successResponse({
      deleted: true,
      message: 'Image deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting supplier image:', error)
    return serverErrorResponse('Failed to delete image')
  }
}

// PATCH /api/me/supplier/images/[id]?orgId=xxx - Update image (alt text, order)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

  const { id } = await params
  const adminClient = createAdminClient()
  const body = await request.json()

  try {
    // Get the image and verify ownership
    const { data: image } = await adminClient
      .from('SupplierImage')
      .select('id, supplierId')
      .eq('id', id)
      .single()

    if (!image) {
      return notFoundResponse('Image not found')
    }

    if (image.supplierId !== supplier.id) {
      return unauthorizedResponse('You do not own this image')
    }

    // Update allowed fields
    const updates: Record<string, unknown> = {}
    if (body.alt !== undefined) updates.alt = body.alt
    if (body.order !== undefined) updates.order = body.order

    const { data: updatedImage, error: updateError } = await adminClient
      .from('SupplierImage')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating image:', updateError)
      return serverErrorResponse('Failed to update image')
    }

    return successResponse(updatedImage)
  } catch (error) {
    console.error('Error updating supplier image:', error)
    return serverErrorResponse('Failed to update image')
  }
}
