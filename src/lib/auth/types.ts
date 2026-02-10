import { UserRole, OrganisationMemberRole } from '@prisma/client'

export type { UserRole, OrganisationMemberRole }

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface SessionUser {
  id: string
  email: string
  role: UserRole
}

export interface UserOrganisation {
  organisationId: string
  organisationName: string
  organisationSlug: string
  organisationType: 'BRAND' | 'SUPPLIER'
  memberRole: OrganisationMemberRole
  brandId?: string
  brandName?: string
  brandSlug?: string
  supplierId?: string
  supplierName?: string
  supplierSlug?: string
}

export interface AuthSession {
  user: SessionUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  organisations: UserOrganisation[]
  hasBrandAffiliation: boolean
  hasSupplierAffiliation: boolean
}

// ============= Permission Helpers =============

export function isAdmin(role: UserRole | undefined): boolean {
  return role === 'ADMIN'
}

export function canManageOrganisation(
  session: AuthSession,
  organisationId: string
): boolean {
  if (!session.isAuthenticated) return false
  if (session.isAdmin) return true
  const org = session.organisations.find(o => o.organisationId === organisationId)
  return org?.memberRole === 'OWNER' || org?.memberRole === 'ADMIN'
}

export function canManageBrand(
  session: AuthSession,
  brandId: string
): boolean {
  if (!session.isAuthenticated) return false
  if (session.isAdmin) return true
  const org = session.organisations.find(o => o.brandId === brandId)
  return org?.memberRole === 'OWNER' || org?.memberRole === 'ADMIN'
}

export function canManageSupplier(
  session: AuthSession,
  supplierId: string
): boolean {
  if (!session.isAuthenticated) return false
  if (session.isAdmin) return true
  const org = session.organisations.find(o => o.supplierId === supplierId)
  return org?.memberRole === 'OWNER' || org?.memberRole === 'ADMIN'
}

export function getUserBrandOrgs(session: AuthSession): UserOrganisation[] {
  return session.organisations.filter(o => o.organisationType === 'BRAND')
}

export function getUserSupplierOrgs(session: AuthSession): UserOrganisation[] {
  return session.organisations.filter(o => o.organisationType === 'SUPPLIER')
}

export function hasPermission(userRole: UserRole | undefined, allowedRoles: readonly UserRole[]): boolean {
  if (!userRole) return false
  return allowedRoles.includes(userRole)
}
