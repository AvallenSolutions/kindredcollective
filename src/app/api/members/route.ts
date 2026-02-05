import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  successResponse,
  serverErrorResponse,
} from '@/lib/api/response'
import { sanitizeFilterInput } from '@/lib/api/sanitize'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { applyRateLimit } from '@/lib/api/rate-limit'

interface SupabaseMemberUser {
  id?: string
  role?: string
  brand?: { id: string; name: string; slug: string; logoUrl: string | null; category: string } | Array<{ id: string; name: string; slug: string; logoUrl: string | null; category: string }>
  supplier?: { id: string; companyName: string; slug: string; logoUrl: string | null; category: string } | Array<{ id: string; companyName: string; slug: string; logoUrl: string | null; category: string }>
}

interface SupabaseMember {
  id: string
  firstName: string
  lastName: string
  jobTitle: string | null
  bio: string | null
  avatarUrl: string | null
  linkedinUrl: string | null
  createdAt: string
  user: SupabaseMemberUser | SupabaseMemberUser[]
}

// GET /api/members - Public member directory
export async function GET(request: NextRequest) {
  // Rate limit: 60 requests per minute per IP
  const rateLimitResponse = applyRateLimit(request, 60, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  // Pagination (clamped to [1, 100])
  const { page, limit, from, to } = parsePagination(searchParams)

  // Filters
  const rawSearch = searchParams.get('search')
  const role = searchParams.get('role') // Filter by user role (BRAND, SUPPLIER)

  let query = supabase
    .from('Member')
    .select(`
      id,
      firstName,
      lastName,
      jobTitle,
      bio,
      avatarUrl,
      linkedinUrl,
      createdAt,
      user:User(
        id,
        role,
        brand:Brand(id, name, slug, logoUrl, category),
        supplier:Supplier(id, companyName, slug, logoUrl, category)
      )
    `, { count: 'exact' })
    .eq('isPublic', true)
    .order('createdAt', { ascending: false })
    .range(from, to)

  if (rawSearch) {
    const search = sanitizeFilterInput(rawSearch)
    query = query.or(`firstName.ilike.%${search}%,lastName.ilike.%${search}%,jobTitle.ilike.%${search}%`)
  }

  const { data: members, error, count } = await query

  if (error) {
    console.error('[Members] Error fetching members:', error)
    return serverErrorResponse('Failed to fetch members')
  }

  // Filter by role if specified - Supabase returns nested relations as arrays
  let filteredMembers = (members || []) as SupabaseMember[]
  if (role && (role === 'BRAND' || role === 'SUPPLIER')) {
    filteredMembers = filteredMembers.filter((m) => {
      const user = Array.isArray(m.user) ? m.user[0] : m.user
      return user?.role === role
    })
  }

  // Process members to flatten the structure
  const processedMembers = filteredMembers.map((member) => {
    const user = Array.isArray(member.user) ? member.user[0] : member.user
    const brand = user?.brand ? (Array.isArray(user.brand) ? user.brand[0] : user.brand) : null
    const supplier = user?.supplier ? (Array.isArray(user.supplier) ? user.supplier[0] : user.supplier) : null
    return {
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      fullName: `${member.firstName} ${member.lastName}`,
      jobTitle: member.jobTitle,
      bio: member.bio,
      avatarUrl: member.avatarUrl,
      linkedinUrl: member.linkedinUrl,
      role: user?.role || null,
      company: brand
        ? { type: 'brand', ...brand }
        : supplier
          ? { type: 'supplier', ...supplier }
          : null,
      createdAt: member.createdAt,
    }
  })

  return successResponse({
    members: processedMembers,
    pagination: paginationMeta(page, limit, count || 0),
  })
}
