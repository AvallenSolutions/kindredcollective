import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/session'

// POST /api/onboarding/supplier - Create supplier + organisation
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    const adminSupabase = createAdminClient()

    const body = await request.json()
    const { companyName, category, description, logoUrl, services } = body

    if (!companyName || !category) {
      return NextResponse.json(
        { error: 'Company name and category are required' },
        { status: 400 }
      )
    }

    // Generate slug from company name
    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Check if slug already exists
    const { data: existingSlug } = await adminSupabase
      .from('Supplier')
      .select('id')
      .eq('slug', slug)
      .single()

    let finalSlug = slug
    if (existingSlug) {
      // Add random suffix if slug exists
      const randomSuffix = Math.random().toString(36).substring(2, 7)
      finalSlug = `${slug}-${randomSuffix}`
    }

    // Create supplier (no userId - access is through Organisation)
    const { data: supplier, error: supplierError } = await adminSupabase
      .from('Supplier')
      .insert({
        companyName,
        slug: finalSlug,
        category,
        description,
        logoUrl,
        services: services || [],
        isPublic: true,
        isVerified: false,
        claimStatus: 'CLAIMED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single()

    if (supplierError) {
      console.error('Error creating supplier:', supplierError)
      return NextResponse.json(
        { error: 'Failed to create supplier' },
        { status: 500 }
      )
    }

    // Create organisation for supplier
    const { data: organisation, error: orgError } = await adminSupabase
      .from('Organisation')
      .insert({
        name: companyName,
        slug: finalSlug,
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
      supplier,
      organisation,
    })
  } catch (error) {
    console.error('Error in POST /api/onboarding/supplier:', error)
    return NextResponse.json(
      { error: 'Unauthorized or invalid request' },
      { status: 401 }
    )
  }
}
