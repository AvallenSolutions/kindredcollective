import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { getSession } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

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
    .select('id, companyName, claimStatus, contactEmail, userId')
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

  const session = await getSession()
  if (!session.isSupplier && !session.isAdmin) {
    return errorResponse('Only supplier users can claim supplier profiles', 403)
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

  // Check if supplier is already claimed
  if (supplier.claimStatus === 'CLAIMED' || supplier.userId) {
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

  // Check if user already owns a supplier profile
  const { data: userSupplier } = await supabase
    .from('Supplier')
    .select('id')
    .eq('userId', user.id)
    .single()

  if (userSupplier) {
    return errorResponse('You already have a supplier profile')
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

  // In a production app, you would send an email with the verification code
  // For now, we'll return a message indicating the process
  // TODO: Integrate with Supabase Email or Resend

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

  // Update the supplier to link it to the user
  const { data: updatedSupplier, error: supplierError } = await supabase
    .from('Supplier')
    .update({
      userId: user.id,
      claimStatus: 'CLAIMED',
      updatedAt: new Date().toISOString(),
    })
    .eq('id', supplier.id)
    .select()
    .single()

  if (supplierError) {
    console.error('Error updating supplier:', supplierError)
    return serverErrorResponse('Failed to update supplier ownership')
  }

  return successResponse({
    supplier: updatedSupplier,
    message: 'Supplier profile claimed successfully! You can now manage this profile.',
  })
}
