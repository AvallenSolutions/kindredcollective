import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  successResponse,
  serverErrorResponse,
} from '@/lib/api/response'
import { sanitizeFilterInput } from '@/lib/api/sanitize'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { applyRateLimit } from '@/lib/api/rate-limit'

// GET /api/members - Public member directory
export async function GET(request: NextRequest) {
  // Rate limit: 60 requests per minute per IP
  const rateLimitResponse = applyRateLimit(request, 60, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const supabase = await createClient()
  const adminClient = createAdminClient()
  const { searchParams } = new URL(request.url)

  // Pagination (clamped to [1, 100])
  const { page, limit, from, to } = parsePagination(searchParams)

  // Filters
  const rawSearch = searchParams.get('search')
  const affiliationType = searchParams.get('role') // Filter by affiliation type (BRAND, SUPPLIER)

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
      userId
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

  const memberList = members || []

  // Fetch org affiliations for all members via OrganisationMember
  const userIds = memberList.map(m => m.userId)
  const { data: orgMemberships } = await adminClient
    .from('OrganisationMember')
    .select(`
      userId,
      organisation:Organisation(
        id, name, slug, type,
        brand:Brand(id, name, slug, logoUrl, category),
        supplier:Supplier(id, companyName, slug, logoUrl, category)
      )
    `)
    .in('userId', userIds)

  // Build userId -> affiliations map
  const affiliationMap = new Map<string, { type: string, name: string, slug: string, logoUrl: string | null, category: string }[]>()
  if (orgMemberships) {
    for (const membership of orgMemberships as any[]) {
      const org = Array.isArray(membership.organisation) ? membership.organisation[0] : membership.organisation
      if (!org) continue

      const brand = org.brand ? (Array.isArray(org.brand) ? org.brand[0] : org.brand) : null
      const supplier = org.supplier ? (Array.isArray(org.supplier) ? org.supplier[0] : org.supplier) : null

      const entry = brand
        ? { type: 'brand', name: brand.name, slug: brand.slug, logoUrl: brand.logoUrl, category: brand.category }
        : supplier
          ? { type: 'supplier', name: supplier.companyName, slug: supplier.slug, logoUrl: supplier.logoUrl, category: supplier.category }
          : null

      if (entry) {
        if (!affiliationMap.has(membership.userId)) {
          affiliationMap.set(membership.userId, [entry])
        } else {
          affiliationMap.get(membership.userId)!.push(entry)
        }
      }
    }
  }

  // Filter by affiliation type if specified
  let filteredMembers = memberList
  if (affiliationType && (affiliationType === 'BRAND' || affiliationType === 'SUPPLIER')) {
    const targetType = affiliationType.toLowerCase()
    filteredMembers = filteredMembers.filter((m) => {
      const affiliations = affiliationMap.get(m.userId)
      return affiliations?.some(a => a.type === targetType)
    })
  }

  // Process members to flatten the structure
  const processedMembers = filteredMembers.map((member) => {
    const affiliations = affiliationMap.get(member.userId) || []
    const primaryCompany = affiliations[0] || null

    return {
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      fullName: `${member.firstName} ${member.lastName}`,
      jobTitle: member.jobTitle,
      bio: member.bio,
      avatarUrl: member.avatarUrl,
      linkedinUrl: member.linkedinUrl,
      company: primaryCompany,
      affiliations,
      createdAt: member.createdAt,
    }
  })

  return successResponse({
    members: processedMembers,
    pagination: paginationMeta(page, limit, count || 0),
  })
}
