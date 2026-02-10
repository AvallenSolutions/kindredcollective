import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/session'

// POST /api/onboarding/brand - Create brand + organisation
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    const adminSupabase = createAdminClient()

    const body = await request.json()
    const { name, category, description, logoUrl } = body

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Brand name and category are required' },
        { status: 400 }
      )
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Check if slug already exists
    const { data: existingSlug } = await adminSupabase
      .from('Brand')
      .select('id')
      .eq('slug', slug)
      .single()

    let finalSlug = slug
    if (existingSlug) {
      // Add random suffix if slug exists
      const randomSuffix = Math.random().toString(36).substring(2, 7)
      finalSlug = `${slug}-${randomSuffix}`
    }

    // Create brand (no userId - access is through Organisation)
    const { data: brand, error: brandError } = await adminSupabase
      .from('Brand')
      .insert({
        name,
        slug: finalSlug,
        category,
        description,
        logoUrl,
        isPublic: true,
        isVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single()

    if (brandError) {
      console.error('Error creating brand:', brandError)
      return NextResponse.json(
        { error: 'Failed to create brand' },
        { status: 500 }
      )
    }

    // Create organisation for brand
    const { data: organisation, error: orgError } = await adminSupabase
      .from('Organisation')
      .insert({
        name,
        slug: finalSlug,
        type: 'BRAND',
        brandId: brand.id,
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
      brand,
      organisation,
    })
  } catch (error) {
    console.error('Error in POST /api/onboarding/brand:', error)
    return NextResponse.json(
      { error: 'Unauthorized or invalid request' },
      { status: 401 }
    )
  }
}
