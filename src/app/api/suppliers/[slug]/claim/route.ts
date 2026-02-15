import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'
import { sendClaimVerificationEmail } from '@/lib/email'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// Generate a random 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Helper to get supplier by slug
async function getSupplierBySlug(supabase: Awaited<ReturnType<typeof createClient>>, slug: string) {
  const { data: supplier } = await supabase
    .from('Supplier')
    .select('id, companyName, slug, claimStatus, contactEmail')
    .eq('slug', slug)
    .single()
  return supplier
}

// POST /api/suppliers/[slug]/claim - Initiate claim for an unclaimed supplier profile
export async function POST(request: NextRequest, { params }: RouteParams) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const { slug } = await params
  const supabase = await createClient()
  const body = await request.json()

  const { companyEmail } = body

  if (!companyEmail) {
    return errorResponse('Company email is required for verification')
  }

  // Check if supplier exists
  const supplier = await getSupplierBySlug(supabase, slug)

  if (!supplier) {
    return notFoundResponse('Supplier not found')
  }

  // Check if supplier is already claimed (by claimStatus only)
  if (supplier.claimStatus === 'CLAIMED') {
    return errorResponse('This supplier profile has already been claimed')
  }

  // Check if there's already a pending claim by this user
  const { data: existingClaim } = await supabase
    .from('SupplierClaim')
    .select('id, status')
    .eq('supplierId', supplier.id)
    .eq('userId', user.id)
    .single()

  if (existingClaim) {
    if (existingClaim.status === 'PENDING') {
      return errorResponse('You already have a pending claim for this supplier')
    }
    if (existingClaim.status === 'REJECTED') {
      return errorResponse('Your previous claim for this supplier was rejected')
    }
  }

  // Generate verification code
  const verificationCode = generateVerificationCode()

  // Create the claim
  const { data: claim, error } = await supabase
    .from('SupplierClaim')
    .insert({
      supplierId: supplier.id,
      userId: user.id,
      status: 'PENDING',
      companyEmail,
      verificationCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating claim:', error)
    return serverErrorResponse('Failed to create claim')
  }

  // Update supplier status to pending
  await supabase
    .from('Supplier')
    .update({ claimStatus: 'PENDING' })
    .eq('id', supplier.id)

  // Send verification email
  try {
    await sendClaimVerificationEmail(companyEmail, verificationCode, supplier.companyName)
  } catch (emailError) {
    console.error('[SupplierClaim] Failed to send verification email:', emailError)
    // Don't fail the claim if email fails
  }

  return successResponse({
    claim: {
      id: claim.id,
      status: claim.status,
      companyEmail: claim.companyEmail,
      createdAt: claim.createdAt,
    },
    message: `A verification code has been sent to ${companyEmail}. Please check your email and verify your claim.`,
    // In development, include the code for testing (remove in production)
    ...(process.env.NODE_ENV === 'development' ? { verificationCode } : {}),
  }, 201)
}

// PATCH /api/suppliers/[slug]/claim - Verify claim with code
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const { slug } = await params
  const supabase = await createClient()
  const adminSupabase = createAdminClient()
  const body = await request.json()

  const { verificationCode } = body

  if (!verificationCode) {
    return errorResponse('Verification code is required')
  }

  // Get supplier by slug
  const supplier = await getSupplierBySlug(supabase, slug)
  if (!supplier) {
    return notFoundResponse('Supplier not found')
  }

  // Get the pending claim
  const { data: claim } = await supabase
    .from('SupplierClaim')
    .select('id, verificationCode, status')
    .eq('supplierId', supplier.id)
    .eq('userId', user.id)
    .eq('status', 'PENDING')
    .single()

  if (!claim) {
    return notFoundResponse('No pending claim found for this supplier')
  }

  // Verify the code
  if (claim.verificationCode !== verificationCode) {
    return errorResponse('Invalid verification code')
  }

  // Update the claim status
  const { error: claimError } = await supabase
    .from('SupplierClaim')
    .update({
      status: 'CLAIMED',
      processedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq('id', claim.id)

  if (claimError) {
    console.error('Error updating claim:', claimError)
    return serverErrorResponse('Failed to verify claim')
  }

  // Update the supplier claim status (no userId - access is through Organisation)
  const { data: updatedSupplier, error: supplierError } = await adminSupabase
    .from('Supplier')
    .update({
      claimStatus: 'CLAIMED',
      updatedAt: new Date().toISOString(),
    })
    .eq('id', supplier.id)
    .select()
    .single()

  if (supplierError) {
    console.error('Error updating supplier:', supplierError)
    return serverErrorResponse('Failed to update supplier')
  }

  // Create organisation for the claimed supplier
  const { data: organisation, error: orgError } = await adminSupabase
    .from('Organisation')
    .insert({
      name: supplier.companyName,
      slug: supplier.slug,
      type: 'SUPPLIER',
      supplierId: supplier.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (orgError) {
    console.error('Error creating organisation:', orgError)
    return serverErrorResponse('Failed to create organisation')
  }

  // Add the claiming user as organisation owner
  const { error: memberError } = await adminSupabase
    .from('OrganisationMember')
    .insert({
      organisationId: organisation.id,
      userId: user.id,
      role: 'OWNER',
      joinedAt: new Date().toISOString(),
    })

  if (memberError) {
    console.error('Error adding organisation member:', memberError)
    return serverErrorResponse('Failed to add user to organisation')
  }

  return successResponse({
    supplier: updatedSupplier,
    organisation,
    message: 'Supplier profile claimed successfully! You can now manage this profile.',
  })
}
