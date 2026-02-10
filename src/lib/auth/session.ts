import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AuthSession, SessionUser, UserOrganisation, isAdmin } from './types'
import type { UserRole } from '@prisma/client'

/**
 * Get the current authenticated session with user role and organisation affiliations
 * Use this in Server Components and API routes
 */
export async function getSession(): Promise<AuthSession> {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    return {
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      organisations: [],
      hasBrandAffiliation: false,
      hasSupplierAffiliation: false,
    }
  }

  // Use admin client to bypass RLS when fetching user data
  const adminClient = createAdminClient()

  // Fetch user + org memberships in parallel
  const [userResult, orgResult] = await Promise.all([
    adminClient
      .from('User')
      .select('id, email, role')
      .eq('id', authUser.id)
      .single(),
    adminClient
      .from('OrganisationMember')
      .select(`
        role,
        organisation:Organisation(
          id, name, slug, type,
          brand:Brand(id, name, slug),
          supplier:Supplier(id, companyName, slug)
        )
      `)
      .eq('userId', authUser.id),
  ])

  if (userResult.error || !userResult.data) {
    if (userResult.error && userResult.error.code !== 'PGRST116') {
      console.error('[Session] Database error fetching user:', authUser.id, userResult.error)
    } else {
      console.error('[Session] User not found in database:', authUser.id)
    }
    return {
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      organisations: [],
      hasBrandAffiliation: false,
      hasSupplierAffiliation: false,
    }
  }

  const dbUser = userResult.data
  const orgMemberships = orgResult.data || []

  const organisations: UserOrganisation[] = orgMemberships
    .filter((m: any) => m.organisation)
    .map((m: any) => {
      const org = Array.isArray(m.organisation) ? m.organisation[0] : m.organisation
      if (!org) return null
      const brand = Array.isArray(org.brand) ? org.brand[0] : org.brand
      const supplier = Array.isArray(org.supplier) ? org.supplier[0] : org.supplier
      return {
        organisationId: org.id,
        organisationName: org.name,
        organisationSlug: org.slug,
        organisationType: org.type as 'BRAND' | 'SUPPLIER',
        memberRole: m.role,
        brandId: brand?.id,
        brandName: brand?.name,
        brandSlug: brand?.slug,
        supplierId: supplier?.id,
        supplierName: supplier?.companyName,
        supplierSlug: supplier?.slug,
      }
    })
    .filter(Boolean) as UserOrganisation[]

  const sessionUser: SessionUser = {
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role as UserRole,
  }

  return {
    user: sessionUser,
    isAuthenticated: true,
    isAdmin: isAdmin(sessionUser.role),
    organisations,
    hasBrandAffiliation: organisations.some(o => o.organisationType === 'BRAND'),
    hasSupplierAffiliation: organisations.some(o => o.organisationType === 'SUPPLIER'),
  }
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession()

  if (!session.isAuthenticated || !session.user) {
    throw new Error('UNAUTHORIZED')
  }

  return session.user
}

/**
 * Require specific role(s) - throws if user doesn't have permission
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<SessionUser> {
  const user = await requireAuth()

  if (!allowedRoles.includes(user.role)) {
    throw new Error('FORBIDDEN')
  }

  return user
}

/**
 * Require admin role
 */
export async function requireAdmin(): Promise<SessionUser> {
  return requireRole(['ADMIN'])
}

/**
 * Get user's member profile (if they have one)
 */
export async function getUserMember(userId: string) {
  const adminClient = createAdminClient()

  const { data: member, error } = await adminClient
    .from('Member')
    .select('*')
    .eq('userId', userId)
    .single()

  if (error) {
    return null
  }

  return member
}

/**
 * Get a brand the user can manage via organisation membership
 */
export async function getUserBrandViaOrg(userId: string, orgId: string) {
  const adminClient = createAdminClient()

  // Verify user is a member of this org with sufficient permissions
  const { data: membership, error: memberError } = await adminClient
    .from('OrganisationMember')
    .select('role')
    .eq('organisationId', orgId)
    .eq('userId', userId)
    .single()

  if (memberError || !membership) return null

  // Fetch the org's brand
  const { data: org, error: orgError } = await adminClient
    .from('Organisation')
    .select('brandId, brand:Brand(*)')
    .eq('id', orgId)
    .eq('type', 'BRAND')
    .single()

  if (orgError || !org) return null

  const brand = Array.isArray(org.brand) ? org.brand[0] : org.brand
  return brand ? { ...brand, userRole: membership.role } : null
}

/**
 * Get a supplier the user can manage via organisation membership
 */
export async function getUserSupplierViaOrg(userId: string, orgId: string) {
  const adminClient = createAdminClient()

  const { data: membership, error: memberError } = await adminClient
    .from('OrganisationMember')
    .select('role')
    .eq('organisationId', orgId)
    .eq('userId', userId)
    .single()

  if (memberError || !membership) return null

  const { data: org, error: orgError } = await adminClient
    .from('Organisation')
    .select('supplierId, supplier:Supplier(*)')
    .eq('id', orgId)
    .eq('type', 'SUPPLIER')
    .single()

  if (orgError || !org) return null

  const supplier = Array.isArray(org.supplier) ? org.supplier[0] : org.supplier
  return supplier ? { ...supplier, userRole: membership.role } : null
}

/**
 * Get ALL brands the user manages (via organisation memberships)
 */
export async function getUserBrands(userId: string) {
  const adminClient = createAdminClient()

  const { data: memberships, error } = await adminClient
    .from('OrganisationMember')
    .select(`
      role,
      organisation:Organisation(
        id, name, slug, type,
        brand:Brand(*)
      )
    `)
    .eq('userId', userId)

  if (error || !memberships) return []

  return memberships
    .filter((m: any) => {
      const org = Array.isArray(m.organisation) ? m.organisation[0] : m.organisation
      return org?.type === 'BRAND' && org?.brand
    })
    .map((m: any) => {
      const org = Array.isArray(m.organisation) ? m.organisation[0] : m.organisation
      const brand = Array.isArray(org.brand) ? org.brand[0] : org.brand
      return { ...brand, organisationId: org.id, userRole: m.role }
    })
    .filter(Boolean)
}

/**
 * Get ALL suppliers the user manages (via organisation memberships)
 */
export async function getUserSuppliers(userId: string) {
  const adminClient = createAdminClient()

  const { data: memberships, error } = await adminClient
    .from('OrganisationMember')
    .select(`
      role,
      organisation:Organisation(
        id, name, slug, type,
        supplier:Supplier(*)
      )
    `)
    .eq('userId', userId)

  if (error || !memberships) return []

  return memberships
    .filter((m: any) => {
      const org = Array.isArray(m.organisation) ? m.organisation[0] : m.organisation
      return org?.type === 'SUPPLIER' && org?.supplier
    })
    .map((m: any) => {
      const org = Array.isArray(m.organisation) ? m.organisation[0] : m.organisation
      const supplier = Array.isArray(org.supplier) ? org.supplier[0] : org.supplier
      return { ...supplier, organisationId: org.id, userRole: m.role }
    })
    .filter(Boolean)
}
