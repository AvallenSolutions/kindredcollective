import { UserRole } from '@prisma/client'

export type { UserRole }

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

export interface AuthSession {
  user: SessionUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  isBrand: boolean
  isSupplier: boolean
}

// Permission checks
export const permissions = {
  // Admin permissions
  admin: {
    manageUsers: ['ADMIN'] as UserRole[],
    manageAllSuppliers: ['ADMIN'] as UserRole[],
    manageAllBrands: ['ADMIN'] as UserRole[],
    manageAllEvents: ['ADMIN'] as UserRole[],
    manageAllOffers: ['ADMIN'] as UserRole[],
    viewAnalytics: ['ADMIN'] as UserRole[],
  },
  // Supplier permissions
  supplier: {
    manageOwnProfile: ['SUPPLIER', 'ADMIN'] as UserRole[],
    manageOwnOffers: ['SUPPLIER', 'ADMIN'] as UserRole[],
    viewOfferClaims: ['SUPPLIER', 'ADMIN'] as UserRole[],
  },
  // Brand/User permissions
  brand: {
    manageOwnProfile: ['BRAND', 'ADMIN'] as UserRole[],
    manageOwnEvents: ['BRAND', 'ADMIN'] as UserRole[],
    claimOffers: ['BRAND', 'SUPPLIER', 'ADMIN'] as UserRole[],
  },
  // Common permissions
  common: {
    viewPublicSuppliers: ['BRAND', 'SUPPLIER', 'ADMIN'] as UserRole[],
    viewPublicBrands: ['BRAND', 'SUPPLIER', 'ADMIN'] as UserRole[],
    viewPublicEvents: ['BRAND', 'SUPPLIER', 'ADMIN'] as UserRole[],
    saveSuppliers: ['BRAND', 'SUPPLIER', 'ADMIN'] as UserRole[],
    writeReviews: ['BRAND', 'ADMIN'] as UserRole[],
  },
} as const

export function hasPermission(userRole: UserRole | undefined, allowedRoles: readonly UserRole[]): boolean {
  if (!userRole) return false
  return allowedRoles.includes(userRole)
}

export function isAdmin(role: UserRole | undefined): boolean {
  return role === 'ADMIN'
}

export function isBrand(role: UserRole | undefined): boolean {
  return role === 'BRAND'
}

export function isSupplier(role: UserRole | undefined): boolean {
  return role === 'SUPPLIER'
}
