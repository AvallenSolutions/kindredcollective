import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  successResponse,
  serverErrorResponse,
} from '@/lib/api/response'

// GET /api/members - Public member directory
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  // Pagination
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  // Filters
  const search = searchParams.get('search')
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
    .range((page - 1) * limit, page * limit - 1)

  if (search) {
    query = query.or(`firstName.ilike.%${search}%,lastName.ilike.%${search}%,jobTitle.ilike.%${search}%`)
  }

  const { data: members, error, count } = await query

  if (error) {
    console.error('Error fetching members:', error)
    return serverErrorResponse('Failed to fetch members')
  }

  // Filter by role if specified
  let filteredMembers = members || []
  if (role && (role === 'BRAND' || role === 'SUPPLIER')) {
    filteredMembers = filteredMembers.filter(m => m.user?.role === role)
  }

  // Process members to flatten the structure
  const processedMembers = filteredMembers.map(member => {
    const user = member.user
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
      company: user?.brand
        ? { type: 'brand', ...user.brand }
        : user?.supplier
          ? { type: 'supplier', ...user.supplier }
          : null,
      createdAt: member.createdAt,
    }
  })

  return successResponse({
    members: processedMembers,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  })
}
