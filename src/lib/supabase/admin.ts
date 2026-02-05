import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * SECURITY: This client bypasses all Row Level Security (RLS) policies.
 * It should ONLY be used for trusted server-side operations where RLS
 * would create circular dependencies or where admin-level access is required.
 *
 * Current legitimate uses:
 * - getSession(): Fetching user role (RLS circular dependency)
 * - getUserMember(): Member profiles where RLS requires role lookup
 * - Signup flow: Creating records for newly authenticated users
 * - Admin API routes: Cross-user CRUD operations behind requireAdmin()
 *
 * NEVER pass this client to untrusted code or use it to serve
 * user-facing queries without explicit authorization checks.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin credentials')
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
