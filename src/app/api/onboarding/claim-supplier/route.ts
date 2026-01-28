import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/session'

// POST /api/onboarding/claim-supplier - Claim existing supplier + create organisation
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Check if user already has a supplier
    const adminSupabase = createAdminClient()
    const { data: existingSupplier } = await adminSupabase
      .from('Supplier')
      .select('id')
      .eq('userId', user.id)
      .single()

    if (existingSupplier) {
      return NextResponse.json(
        { error: 'You already have a supplier profile' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { supplierId, verificationCode } = body

    if (!supplierId) {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 }
      )
    }

    // Get supplier
    const { data: supplier, error: supplierError } = await adminSupabase
      .from('Supplier')
      .select('*')
      .eq('id', supplierId)
      .single()

    if (supplierError || !supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Check if already claimed
    if (supplier.claimStatus !== 'UNCLAIMED') {
      return NextResponse.json(
        { error: 'This supplier has already been claimed' },
        { status: 400 }
      )
    }

    // For now, we'll skip verification code and directly claim
    // In production, you'd want to verify ownership via email or other means

    // Update supplier with user ID and claim status
    const { error: updateError } = await adminSupabase
      .from('Supplier')
      .update({
        userId: user.id,
        claimStatus: 'CLAIMED',
        updatedAt: new Date().toISOString(),
      })
      .eq('id', supplierId)

    if (updateError) {
      console.error('Error claiming supplier:', updateError)
      return NextResponse.json(
        { error: 'Failed to claim supplier' },
        { status: 500 }
      )
    }

    // Create organisation for supplier
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
      return NextResponse.json(
        { error: 'Failed to create organisation' },
        { status: 500 }
      )
    }

    // Add user as organisation owner
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
      return NextResponse.json(
        { error: 'Failed to add user to organisation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      supplier: { ...supplier, userId: user.id, claimStatus: 'CLAIMED' },
      organisation,
    })
  } catch (error) {
    console.error('Error in POST /api/onboarding/claim-supplier:', error)
    return NextResponse.json(
      { error: 'Unauthorized or invalid request' },
      { status: 401 }
    )
  }
}
