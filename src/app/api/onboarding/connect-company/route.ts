import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/session'

// POST /api/onboarding/connect-company
//
// Connects the current user to an existing company (brand or supplier).
// - If the company has no OWNER → user claims ownership (OWNER role)
// - If the company already has an OWNER → user joins (MEMBER role)
// - A SupplierClaim note is recorded for suppliers; for brands, tracked via OrganisationMember.
//
// Body: { companyId: string, companyType: 'BRAND' | 'SUPPLIER' }
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const adminSupabase = createAdminClient()
    const body = await request.json()
    const { companyId, companyType } = body

    if (!companyId || !companyType) {
      return NextResponse.json(
        { error: 'Company ID and type are required' },
        { status: 400 }
      )
    }

    if (!['BRAND', 'SUPPLIER'].includes(companyType)) {
      return NextResponse.json({ error: 'Invalid company type' }, { status: 400 })
    }

    // Look up the company
    let companyName = ''
    let companySlug = ''

    if (companyType === 'BRAND') {
      const { data: brand } = await adminSupabase
        .from('Brand')
        .select('id, name, slug')
        .eq('id', companyId)
        .single()
      if (!brand) {
        return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
      }
      companyName = brand.name
      companySlug = brand.slug
    } else {
      const { data: supplier } = await adminSupabase
        .from('Supplier')
        .select('id, companyName, slug, claimStatus')
        .eq('id', companyId)
        .single()
      if (!supplier) {
        return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
      }
      companyName = supplier.companyName
      companySlug = supplier.slug
    }

    // Find or create Organisation
    const orgField = companyType === 'BRAND' ? 'brandId' : 'supplierId'
    let orgId: string

    const { data: existingOrg } = await adminSupabase
      .from('Organisation')
      .select('id')
      .eq(orgField, companyId)
      .single()

    if (existingOrg) {
      orgId = existingOrg.id
    } else {
      const { data: newOrg, error: orgError } = await adminSupabase
        .from('Organisation')
        .insert({
          id: crypto.randomUUID(),
          name: companyName,
          slug: companySlug,
          type: companyType,
          [orgField]: companyId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single()

      if (orgError) {
        console.error('Error creating organisation:', orgError)
        return NextResponse.json({ error: 'Failed to create organisation' }, { status: 500 })
      }
      orgId = newOrg.id
    }

    // Check if user is already a member
    const { data: existingMember } = await adminSupabase
      .from('OrganisationMember')
      .select('id')
      .eq('organisationId', orgId)
      .eq('userId', user.id)
      .single()

    if (existingMember) {
      return NextResponse.json({
        error: 'You are already connected to this company',
      }, { status: 400 })
    }

    // Determine role: OWNER if no existing owner, MEMBER otherwise
    const { data: existingOwner } = await adminSupabase
      .from('OrganisationMember')
      .select('id')
      .eq('organisationId', orgId)
      .eq('role', 'OWNER')
      .limit(1)

    const hasOwner = existingOwner && existingOwner.length > 0
    const role = hasOwner ? 'MEMBER' : 'OWNER'

    // Add user to organisation
    const { error: memberError } = await adminSupabase
      .from('OrganisationMember')
      .insert({
        id: crypto.randomUUID(),
        organisationId: orgId,
        userId: user.id,
        role,
        joinedAt: new Date().toISOString(),
      })

    if (memberError) {
      console.error('Error adding organisation member:', memberError)
      return NextResponse.json({ error: 'Failed to connect to company' }, { status: 500 })
    }

    // Get user details for the note
    const { data: member } = await adminSupabase
      .from('Member')
      .select('firstName, lastName')
      .eq('userId', user.id)
      .single()

    const userName = member
      ? `${member.firstName} ${member.lastName}`.trim()
      : user.email

    const now = new Date().toISOString()
    const noteText = role === 'OWNER'
      ? `Ownership claimed by ${userName} (${user.email}) during onboarding on ${new Date().toLocaleDateString('en-GB')}.`
      : `${userName} (${user.email}) joined as a team member during onboarding on ${new Date().toLocaleDateString('en-GB')}.`

    // For suppliers: create a SupplierClaim record as an audit trail + update claimStatus
    if (companyType === 'SUPPLIER') {
      if (role === 'OWNER') {
        // Update supplier claimStatus to CLAIMED
        await adminSupabase
          .from('Supplier')
          .update({ claimStatus: 'CLAIMED', updatedAt: now })
          .eq('id', companyId)
      }

      // Create claim record as audit trail (won't conflict if user hasn't claimed before)
      const { error: claimError } = await adminSupabase
        .from('SupplierClaim')
        .upsert({
          id: crypto.randomUUID(),
          supplierId: companyId,
          userId: user.id,
          status: 'CLAIMED',
          companyEmail: user.email,
          notes: noteText,
          processedAt: now,
          createdAt: now,
          updatedAt: now,
        }, {
          onConflict: 'supplierId,userId',
        })

      if (claimError) {
        // Non-critical — log but don't fail
        console.error('Error creating supplier claim record:', claimError)
      }
    }

    return NextResponse.json({
      success: true,
      organisation: { id: orgId, name: companyName, type: companyType },
      role,
      note: noteText,
    })
  } catch (error) {
    console.error('Error in POST /api/onboarding/connect-company:', error)
    return NextResponse.json(
      { error: 'Unauthorized or invalid request' },
      { status: 401 }
    )
  }
}
