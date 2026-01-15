import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/me - Get current user profile with related data
export async function GET() {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const supabase = await createClient()

  // Get user with all related profiles
  const { data: fullUser, error } = await supabase
    .from('User')
    .select(`
      *,
      brand:Brand(*),
      supplier:Supplier(*),
      member:Member(*),
      savedSuppliers:SavedSupplier(supplierId),
      savedBrands:SavedBrand(brandId)
    `)
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return serverErrorResponse('Failed to fetch profile')
  }

  return successResponse(fullUser)
}

// PATCH /api/me - Update current user's basic info
export async function PATCH(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const supabase = await createClient()
  const body = await request.json()

  // Users can only update their email (with verification)
  const { email } = body

  if (email && email !== user.email) {
    // Update email in Supabase Auth (will send verification)
    const { error: authError } = await supabase.auth.updateUser({
      email,
    })

    if (authError) {
      console.error('Error updating email:', authError)
      return serverErrorResponse('Failed to update email')
    }
  }

  const { data: updatedUser, error } = await supabase
    .from('User')
    .update({
      updatedAt: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating user:', error)
    return serverErrorResponse('Failed to update user')
  }

  return successResponse(updatedUser)
}
