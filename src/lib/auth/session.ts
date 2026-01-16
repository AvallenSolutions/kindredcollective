import { createClient } from '@/lib/supabase/server'
import { AuthSession, SessionUser, hasPermission, isAdmin, isBrand, isSupplier } from './types'
import type { UserRole } from '@prisma/client'

/**
 * Get the current authenticated session with user role
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
      isBrand: false,
      isSupplier: false,
    }
  }

  // Get user with role from our User table
  const { data: dbUser, error } = await supabase
    .from('User')
    .select('id, email, role')
    .eq('id', authUser.id)
    .single()

  if (error || !dbUser) {
    // User exists in auth but not in our User table
    // This shouldn't happen in normal flow, but handle gracefully
    console.error('User not found in database:', authUser.id, error)
    return {
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isBrand: false,
      isSupplier: false,
    }
  }

  const sessionUser: SessionUser = {
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role as UserRole,
  }

  return {
    user: sessionUser,
    isAuthenticated: true,
    isAdmin: isAdmin(sessionUser.role),
    isBrand: isBrand(sessionUser.role),
    isSupplier: isSupplier(sessionUser.role),
  }
}

/**
 * Require authentication - throws redirect if not authenticated
 * Use at the top of protected pages/routes
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

  if (!hasPermission(user.role, allowedRoles)) {
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
 * Require supplier role (or admin)
 */
export async function requireSupplier(): Promise<SessionUser> {
  return requireRole(['SUPPLIER', 'ADMIN'])
}

/**
 * Require brand role (or admin)
 */
export async function requireBrand(): Promise<SessionUser> {
  return requireRole(['BRAND', 'ADMIN'])
}

/**
 * Get user's supplier profile (if they have one)
 */
export async function getUserSupplier(userId: string) {
  const supabase = await createClient()

  const { data: supplier, error } = await supabase
    .from('Supplier')
    .select('*')
    .eq('userId', userId)
    .single()

  if (error) {
    return null
  }

  return supplier
}

/**
 * Get user's brand profile (if they have one)
 */
export async function getUserBrand(userId: string) {
  const supabase = await createClient()

  const { data: brand, error } = await supabase
    .from('Brand')
    .select('*')
    .eq('userId', userId)
    .single()

  if (error) {
    return null
  }

  return brand
}

/**
 * Get user's member profile (if they have one)
 */
export async function getUserMember(userId: string) {
  const supabase = await createClient()

  const { data: member, error } = await supabase
    .from('Member')
    .select('*')
    .eq('userId', userId)
    .single()

  if (error) {
    return null
  }

  return member
}
