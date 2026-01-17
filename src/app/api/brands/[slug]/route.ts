import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  successResponse,
  notFoundResponse,
} from '@/lib/api/response'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// GET /api/brands/[slug] - Get single brand detail
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: brand, error } = await supabase
    .from('Brand')
    .select(`
      id,
      name,
      slug,
      tagline,
      description,
      story,
      logoUrl,
      heroImageUrl,
      websiteUrl,
      instagramUrl,
      linkedinUrl,
      twitterUrl,
      category,
      subcategories,
      yearFounded,
      location,
      country,
      isVerified,
      createdAt,
      images:BrandImage(id, url, alt, order),
      user:User(
        member:Member(firstName, lastName, jobTitle, avatarUrl)
      )
    `)
    .eq('slug', slug)
    .eq('isPublic', true)
    .single()

  if (error || !brand) {
    return notFoundResponse('Brand not found')
  }

  // Get the member info if available (Supabase returns nested relations as arrays)
  const user = Array.isArray(brand.user) ? brand.user[0] : brand.user
  const memberData = user?.member
  const member = Array.isArray(memberData) ? memberData[0] : memberData

  return successResponse({
    ...brand,
    user: undefined, // Remove nested user object
    contact: member ? {
      name: `${member.firstName} ${member.lastName}`,
      jobTitle: member.jobTitle,
      avatarUrl: member.avatarUrl,
    } : null,
  })
}
