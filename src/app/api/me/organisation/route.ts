import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth, getSession } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// GET /api/me/organisation - Get ALL user's organisations (multi-affiliation)
export async function GET() {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const adminClient = createAdminClient()

  const { data: memberships, error } = await adminClient
    .from('OrganisationMember')
    .select(`
      id,
      role,
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
          role,
          joinedAt,
          user:User(id, email, member:Member(firstName, lastName, avatarUrl))
        )
      )
    `)
    .eq('userId', user.id)

  if (error) {
    console.error('[Organisation] Error fetching memberships:', error)
    return serverErrorResponse('Failed to fetch organisations')
  }

  const organisations = (memberships || []).map((m: any) => {
    const org = Array.isArray(m.organisation) ? m.organisation[0] : m.organisation
    return {
      ...org,
      userRole: m.role,
      joinedAt: m.joinedAt,
    }
  }).filter(Boolean)

  return successResponse({
    organisations,
    total: organisations.length,
  })
}

// POST /api/me/organisation - Create organisation (users can now create multiple)
export async function POST(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const adminClient = createAdminClient()
  const body = await request.json()

  const { name, type, brandId, supplierId } = body

  if (!name) {
    return errorResponse('Organisation name is required')
  }

  if (!type || !['BRAND', 'SUPPLIER'].includes(type)) {
    return errorResponse('Type must be BRAND or SUPPLIER')
  }

  // Generate unique slug
  let slug = generateSlug(name)
  const { data: existingOrg } = await adminClient
    .from('Organisation')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existingOrg) {
    slug = `${slug}-${Date.now()}`
  }

  const { data: organisation, error: orgError } = await adminClient
    .from('Organisation')
    .insert({
      name,
      slug,
      type,
      brandId: brandId || null,
      supplierId: supplierId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (orgError) {
    console.error('[Organisation] Error creating organisation:', orgError)
    return serverErrorResponse('Failed to create organisation')
  }

  const { error: memberError } = await adminClient
    .from('OrganisationMember')
    .insert({
      organisationId: organisation.id,
      userId: user.id,
      role: 'OWNER',
      joinedAt: new Date().toISOString(),
    })

  if (memberError) {
    console.error('[Organisation] Error adding member:', memberError)
    await adminClient.from('Organisation').delete().eq('id', organisation.id)
    return serverErrorResponse('Failed to create organisation')
  }

  return successResponse({
    organisation,
    message: 'Organisation created successfully',
  }, 201)
}

// DELETE /api/me/organisation?orgId=xxx - Delete a specific organisation (owner only)
export async function DELETE(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const orgId = request.nextUrl.searchParams.get('orgId')
  if (!orgId) {
    return errorResponse('orgId query parameter is required')
  }

  const adminClient = createAdminClient()

  const { data: membership } = await adminClient
    .from('OrganisationMember')
    .select('id, role, organisationId')
    .eq('userId', user.id)
    .eq('organisationId', orgId)
    .single()

  if (!membership) {
    return notFoundResponse('Organisation not found')
  }

  if (membership.role !== 'OWNER') {
    return errorResponse('Only the organisation owner can delete it', 403)
  }

  const { error } = await adminClient
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
