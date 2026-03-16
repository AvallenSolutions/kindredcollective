import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/admin/claims/[id] - Get single claim details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const { id } = params
  const supabase = createAdminClient()

  const { data: claim, error } = await supabase
    .from('SupplierClaim')
    .select('*, supplier:Supplier(id, companyName, slug, claimStatus), user:User(email, role, member:Member(firstName, lastName, phone))')
    .eq('id', id)
    .single()

  if (error || !claim) {
    return notFoundResponse('Claim not found')
  }

  return successResponse(claim)
}

// PATCH /api/admin/claims/[id] - Approve or reject claim
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let admin
  try {
    admin = await requireAdmin()
  } catch {
    return unauthorizedResponse('Admin access required')
  }

  const { id } = params
  const supabase = createAdminClient()
  const body = await request.json()

  const { status, notes } = body

  if (!status || !['CLAIMED', 'REJECTED'].includes(status)) {
    return errorResponse('Status must be either CLAIMED or REJECTED')
  }

  // Get the claim first
  const { data: claim, error: claimError } = await supabase
    .from('SupplierClaim')
    .select('*, supplier:Supplier(id, companyName, slug)')
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

  // If approved, update supplier claim status and wire up organisation access
  if (status === 'CLAIMED') {
    const supplier = claim.supplier as { id: string; companyName: string; slug: string }

    // Update supplier claim status (no userId field — access is via Organisation)
    const { error: updateSupplierError } = await supabase
      .from('Supplier')
      .update({
        claimStatus: 'CLAIMED',
        updatedAt: new Date().toISOString(),
      })
      .eq('id', supplier.id)

    if (updateSupplierError) {
      console.error('Error updating supplier:', updateSupplierError)
      // Rollback the claim update
      await supabase
        .from('SupplierClaim')
        .update({ status: 'PENDING', processedAt: null, processedBy: null })
        .eq('id', id)
      return serverErrorResponse('Failed to update supplier ownership')
    }

    // Check if an Organisation already exists for this supplier
    const { data: existingOrg } = await supabase
      .from('Organisation')
      .select('id')
      .eq('supplierId', supplier.id)
      .single()

    let orgId: string

    if (existingOrg) {
      orgId = existingOrg.id
    } else {
      // Create Organisation for the supplier
      const { data: newOrg, error: orgError } = await supabase
        .from('Organisation')
        .insert({
          name: supplier.companyName,
          slug: supplier.slug,
          type: 'SUPPLIER',
          supplierId: supplier.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (orgError || !newOrg) {
        console.error('Error creating organisation:', orgError)
        return serverErrorResponse('Failed to create organisation for supplier')
      }

      orgId = newOrg.id
    }

    // Check if user is already a member of this org
    const { data: existingMember } = await supabase
      .from('OrganisationMember')
      .select('id')
      .eq('organisationId', orgId)
      .eq('userId', claim.userId)
      .single()

    if (!existingMember) {
      const { error: memberError } = await supabase
        .from('OrganisationMember')
        .insert({
          organisationId: orgId,
          userId: claim.userId,
          role: 'OWNER',
          joinedAt: new Date().toISOString(),
        })

      if (memberError) {
        console.error('Error adding organisation member:', memberError)
        return serverErrorResponse('Failed to add claimant to organisation')
      }
    }
  }

  // Fetch the updated claim to return
  const { data: updatedClaim } = await supabase
    .from('SupplierClaim')
    .select('*, supplier:Supplier(id, companyName, slug, claimStatus), user:User(email)')
    .eq('id', id)
    .single()

  return successResponse(updatedClaim)
}
