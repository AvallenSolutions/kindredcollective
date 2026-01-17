import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
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

// GET /api/admin/claims/[id] - Get single claim details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const { id } = await params
  const supabase = await createClient()

  const { data: claim, error } = await supabase
    .from('SupplierClaim')
    .select('*, supplier:Supplier(*, user:User(email)), user:User(email, role, member:Member(firstName, lastName, phone))')
    .eq('id', id)
    .single()

  if (error || !claim) {
    return notFoundResponse('Claim not found')
  }

  return successResponse(claim)
}

// PATCH /api/admin/claims/[id] - Approve or reject claim
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  let admin
  try {
    admin = await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()

  const { status, notes } = body

  if (!status || !['CLAIMED', 'REJECTED'].includes(status)) {
    return errorResponse('Status must be either CLAIMED or REJECTED')
  }

  // Get the claim first
  const { data: claim, error: claimError } = await supabase
    .from('SupplierClaim')
    .select('*, supplier:Supplier(id)')
    .eq('id', id)
    .single()

  if (claimError || !claim) {
    return notFoundResponse('Claim not found')
  }

  if (claim.status !== 'PENDING') {
    return errorResponse('This claim has already been processed')
  }

  // Update the claim
  const { error: updateClaimError } = await supabase
    .from('SupplierClaim')
    .update({
      status,
      notes: notes || claim.notes,
      processedAt: new Date().toISOString(),
      processedBy: admin.id,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateClaimError) {
    console.error('Error updating claim:', updateClaimError)
    return serverErrorResponse('Failed to update claim')
  }

  // If approved, update the supplier to link it to the user
  if (status === 'CLAIMED') {
    const { error: updateSupplierError } = await supabase
      .from('Supplier')
      .update({
        userId: claim.userId,
        claimStatus: 'CLAIMED',
        updatedAt: new Date().toISOString(),
      })
      .eq('id', claim.supplierId)

    if (updateSupplierError) {
      console.error('Error updating supplier:', updateSupplierError)
      // Rollback the claim update
      await supabase
        .from('SupplierClaim')
        .update({
          status: 'PENDING',
          processedAt: null,
          processedBy: null,
        })
        .eq('id', id)
      return serverErrorResponse('Failed to update supplier ownership')
    }
  }

  // Fetch the updated claim
  const { data: updatedClaim } = await supabase
    .from('SupplierClaim')
    .select('*, supplier:Supplier(id, companyName, slug, userId), user:User(email)')
    .eq('id', id)
    .single()

  return successResponse(updatedClaim)
}
