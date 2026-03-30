import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/session'
import { sendClaimVerificationEmail } from '@/lib/email'

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// POST /api/onboarding/claim-supplier
//
// Step 1 — initiate: { supplierId, companyEmail }
//   → creates SupplierClaim, sends verification code to companyEmail
//   → returns { requiresVerification: true }
//
// Step 2 — verify: { supplierId, verificationCode }
//   → validates code, marks supplier CLAIMED, creates Organisation + OrganisationMember
//   → returns { success: true, supplier, organisation }
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const adminSupabase = createAdminClient()
    const body = await request.json()
    const { supplierId, companyEmail, verificationCode } = body

    if (!supplierId) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 })
    }

    // Fetch supplier
    const { data: supplier, error: supplierError } = await adminSupabase
      .from('Supplier')
      .select('id, companyName, slug, claimStatus, contactEmail')
      .eq('id', supplierId)
      .single()

    if (supplierError || !supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    if (supplier.claimStatus === 'CLAIMED') {
      return NextResponse.json({ error: 'This supplier has already been claimed' }, { status: 400 })
    }

    // ── STEP 2: verify code ──────────────────────────────────────────────
    if (verificationCode) {
      const { data: claim } = await adminSupabase
        .from('SupplierClaim')
        .select('id, verificationCode, status')
        .eq('supplierId', supplierId)
        .eq('userId', user.id)
        .eq('status', 'PENDING')
        .single()

      if (!claim) {
        return NextResponse.json(
          { error: 'No pending claim found. Please start the claim process again.' },
          { status: 404 }
        )
      }

      if (claim.verificationCode !== verificationCode) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
      }

      // Mark claim as CLAIMED
      await adminSupabase
        .from('SupplierClaim')
        .update({ status: 'CLAIMED', processedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
        .eq('id', claim.id)

      // Update supplier claim status
      const { data: updatedSupplier, error: updateError } = await adminSupabase
        .from('Supplier')
        .update({ claimStatus: 'CLAIMED', updatedAt: new Date().toISOString() })
        .eq('id', supplierId)
        .select()
        .single()

      if (updateError) {
        console.error('Error claiming supplier:', updateError)
        return NextResponse.json({ error: 'Failed to claim supplier' }, { status: 500 })
      }

      // Check if Organisation already exists for this supplier
      let organisation: Record<string, unknown> | null = null

      const { data: existingOrg } = await adminSupabase
        .from('Organisation')
        .select('*')
        .eq('supplierId', supplier.id)
        .single()

      if (existingOrg) {
        organisation = existingOrg
      } else {
        // Create Organisation only if one doesn't exist
        const { data: newOrg, error: orgError } = await adminSupabase
          .from('Organisation')
          .insert({
            id: crypto.randomUUID(),
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
          return NextResponse.json({ error: 'Failed to create organisation' }, { status: 500 })
        }
        organisation = newOrg
      }

      // Check if user is already a member
      const { data: existingMember } = await adminSupabase
        .from('OrganisationMember')
        .select('id')
        .eq('organisationId', (organisation as Record<string, unknown>).id)
        .eq('userId', user.id)
        .single()

      if (!existingMember) {
        // Add user as owner
        const { error: memberError } = await adminSupabase
          .from('OrganisationMember')
          .insert({
            id: crypto.randomUUID(),
            organisationId: (organisation as Record<string, unknown>).id,
            userId: user.id,
            role: 'OWNER',
            joinedAt: new Date().toISOString(),
          })

        if (memberError) {
          console.error('Error adding organisation member:', memberError)
          return NextResponse.json({ error: 'Failed to add user to organisation' }, { status: 500 })
        }
      }

      return NextResponse.json({
        success: true,
        supplier: updatedSupplier,
        organisation,
      })
    }

    // ── STEP 1: initiate claim ───────────────────────────────────────────
    if (!companyEmail) {
      return NextResponse.json(
        { error: 'Company email is required to verify ownership' },
        { status: 400 }
      )
    }

    // Check for an existing pending claim by this user
    const { data: existingClaim } = await adminSupabase
      .from('SupplierClaim')
      .select('id, status')
      .eq('supplierId', supplierId)
      .eq('userId', user.id)
      .single()

    if (existingClaim?.status === 'REJECTED') {
      return NextResponse.json(
        { error: 'Your previous claim for this supplier was rejected' },
        { status: 400 }
      )
    }

    const code = generateVerificationCode()

    if (existingClaim?.status === 'PENDING') {
      // Resend / update verification code on existing claim
      await adminSupabase
        .from('SupplierClaim')
        .update({ verificationCode: code, companyEmail, updatedAt: new Date().toISOString() })
        .eq('id', existingClaim.id)
    } else {
      // Create new claim record
      const { error: insertError } = await adminSupabase
        .from('SupplierClaim')
        .insert({
          id: crypto.randomUUID(),
          supplierId,
          userId: user.id,
          status: 'PENDING',
          companyEmail,
          verificationCode: code,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })

      if (insertError) {
        console.error('Error creating claim:', insertError)
        return NextResponse.json({ error: 'Failed to initiate claim' }, { status: 500 })
      }

      // Mark supplier as PENDING
      await adminSupabase
        .from('Supplier')
        .update({ claimStatus: 'PENDING', updatedAt: new Date().toISOString() })
        .eq('id', supplierId)
    }

    // Send verification email
    try {
      await sendClaimVerificationEmail(companyEmail, code, supplier.companyName)
    } catch (emailError) {
      console.error('[OnboardingClaim] Failed to send verification email:', emailError)
      // Don't fail — code is still stored
    }

    return NextResponse.json({
      requiresVerification: true,
      message: `A verification code has been sent to ${companyEmail}. Please enter it below to complete your claim.`,
      ...(process.env.NODE_ENV === 'development' ? { verificationCode: code } : {}),
    })
  } catch (error) {
    console.error('Error in POST /api/onboarding/claim-supplier:', error)
    return NextResponse.json({ error: 'Unauthorized or invalid request' }, { status: 401 })
  }
}
