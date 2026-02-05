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

// Helper to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// GET /api/me/organisation - Get user's organisation
export async function GET() {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const supabase = await createClient()

  // Get user's organisation membership
  const { data: membership, error: membershipError } = await supabase
    .from('OrganisationMember')
    .select(`
      id,
      isOwner,
      joinedAt,
      organisation:Organisation(
        id,
        name,
        slug,
        type,
        createdAt,
        brand:Brand(id, name, slug, logoUrl),
        supplier:Supplier(id, companyName, slug, logoUrl),
        members:OrganisationMember(
          id,
          isOwner,
          joinedAt,
          user:User(id, email, member:Member(firstName, lastName, avatarUrl))
        )
      )
    `)
    .eq('userId', user.id)
    .single()

  if (membershipError && membershipError.code !== 'PGRST116') {
    console.error('[Organisation] Error fetching membership:', membershipError)
    return serverErrorResponse('Failed to fetch organisation')
  }

  if (!membership) {
    return successResponse({
      hasOrganisation: false,
      organisation: null,
    })
  }

  return successResponse({
    hasOrganisation: true,
    isOwner: membership.isOwner,
    organisation: membership.organisation,
  })
}

// POST /api/me/organisation - Create organisation
export async function POST(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const session = await getSession()
  const supabase = await createClient()
  const body = await request.json()

  const { name } = body

  if (!name) {
    return errorResponse('Organisation name is required')
  }

  // Check if user already has an organisation
  const { data: existingMembership, error: existingError } = await supabase
    .from('OrganisationMember')
    .select('id')
    .eq('userId', user.id)
    .single()

  if (existingError && existingError.code !== 'PGRST116') {
    console.error('[Organisation] Error checking existing membership:', existingError)
    return serverErrorResponse('Failed to check membership')
  }

  if (existingMembership) {
    return errorResponse('You are already a member of an organisation')
  }

  // Get the user's brand or supplier
  let brandId = null
  let supplierId = null

  if (session.isBrand) {
    const { data: brand, error: brandError } = await supabase
      .from('Brand')
      .select('id')
      .eq('userId', user.id)
      .single()

    if (brandError && brandError.code !== 'PGRST116') {
      console.error('[Organisation] Error fetching brand:', brandError)
      return serverErrorResponse('Failed to fetch brand profile')
    }
    brandId = brand?.id || null
  } else if (session.isSupplier) {
    const { data: supplier, error: supplierError } = await supabase
      .from('Supplier')
      .select('id')
      .eq('userId', user.id)
      .single()

    if (supplierError && supplierError.code !== 'PGRST116') {
      console.error('[Organisation] Error fetching supplier:', supplierError)
      return serverErrorResponse('Failed to fetch supplier profile')
    }
    supplierId = supplier?.id || null
  }

  if (!brandId && !supplierId) {
    return errorResponse('You need a brand or supplier profile to create an organisation')
  }

  // Generate unique slug
  let slug = generateSlug(name)
  const { data: existingOrg, error: slugError } = await supabase
    .from('Organisation')
    .select('id')
    .eq('slug', slug)
    .single()

  if (slugError && slugError.code !== 'PGRST116') {
    console.error('[Organisation] Error checking slug:', slugError)
    return serverErrorResponse('Failed to check slug availability')
  }

  if (existingOrg) {
    slug = `${slug}-${Date.now()}`
  }

  // Create organisation
  const { data: organisation, error: orgError } = await supabase
    .from('Organisation')
    .insert({
      name,
      slug,
      type: session.isBrand ? 'BRAND' : 'SUPPLIER',
      brandId,
      supplierId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (orgError) {
    console.error('[Organisation] Error creating organisation:', orgError)
    return serverErrorResponse('Failed to create organisation')
  }

  // Add user as owner
  const { error: memberError } = await supabase
    .from('OrganisationMember')
    .insert({
      organisationId: organisation.id,
      userId: user.id,
      isOwner: true,
      joinedAt: new Date().toISOString(),
    })

  if (memberError) {
    console.error('[Organisation] Error adding member:', memberError)
    // Rollback organisation creation
    await supabase.from('Organisation').delete().eq('id', organisation.id)
    return serverErrorResponse('Failed to create organisation')
  }

  return successResponse({
    organisation,
    message: 'Organisation created successfully',
  }, 201)
}

// DELETE /api/me/organisation - Delete organisation (owner only)
export async function DELETE() {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const supabase = await createClient()

  // Get user's organisation membership
  const { data: membership, error: membershipError } = await supabase
    .from('OrganisationMember')
    .select('id, isOwner, organisationId')
    .eq('userId', user.id)
    .single()

  if (membershipError && membershipError.code !== 'PGRST116') {
    console.error('[Organisation] Error fetching membership:', membershipError)
    return serverErrorResponse('Failed to fetch membership')
  }

  if (!membership) {
    return notFoundResponse('You are not a member of any organisation')
  }

  if (!membership.isOwner) {
    return errorResponse('Only the organisation owner can delete it', 403)
  }

  // Delete organisation (cascades to members and invites)
  const { error } = await supabase
    .from('Organisation')
    .delete()
    .eq('id', membership.organisationId)

  if (error) {
    console.error('[Organisation] Error deleting organisation:', error)
    return serverErrorResponse('Failed to delete organisation')
  }

  return successResponse({
    deleted: true,
    message: 'Organisation deleted successfully',
  })
}
