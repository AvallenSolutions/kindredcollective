import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

interface RouteParams {
  params: Promise<{ id: string }>
}

// DELETE /api/me/saved-suppliers/[id] - Unsave a supplier
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const { id } = await params
  const supabase = await createClient()

  // Check if saved entry exists and belongs to user
  const { data: saved } = await supabase
    .from('SavedSupplier')
    .select('id')
    .eq('id', id)
    .eq('userId', user.id)
    .single()

  if (!saved) {
    return notFoundResponse('Saved supplier not found')
  }

  const { error } = await supabase
    .from('SavedSupplier')
    .delete()
    .eq('id', id)
    .eq('userId', user.id)

  if (error) {
    console.error('Error unsaving supplier:', error)
    return serverErrorResponse('Failed to unsave supplier')
  }

  return successResponse({ deleted: true })
}
