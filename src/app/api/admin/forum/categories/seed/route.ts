import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSession } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'
import { applyRateLimit } from '@/lib/api/rate-limit'

const DEFAULT_CATEGORIES = [
  {
    name: 'Introduce Yourself',
    slug: 'introduce-yourself',
    description: 'New here? Say hello and tell us about your brand or business',
    color: '#00D9FF', // cyan
    order: 1,
  },
  {
    name: 'General Discussion',
    slug: 'general-discussion',
    description: 'Chat about anything related to the indie drinks world',
    color: '#A78BFA', // purple
    order: 2,
  },
  {
    name: 'Suppliers',
    slug: 'suppliers',
    description: 'Supplier recommendations, reviews, and experiences',
    color: '#FF5D5D', // coral
    order: 3,
  },
  {
    name: 'Advice & Questions',
    slug: 'advice-questions',
    description: 'Get help from the community on any challenge',
    color: '#CCFF00', // lime
    order: 4,
  },
  {
    name: 'Industry News',
    slug: 'industry-news',
    description: 'Trends, regulations, market updates, and announcements',
    color: '#F59E0B', // amber
    order: 5,
  },
  {
    name: 'For Sale',
    slug: 'for-sale',
    description: 'Buy, sell, or trade equipment, stock, and supplies',
    color: '#10B981', // green
    order: 6,
  },
  {
    name: 'Events & Meetups',
    slug: 'events-meetups',
    description: 'Discuss upcoming events, plan meetups, share recaps',
    color: '#EC4899', // pink
    order: 7,
  },
  {
    name: 'Pets',
    slug: 'pets',
    description: 'Show off the real bosses behind your brand',
    color: '#F97316', // orange
    order: 8,
  },
]

// POST /api/admin/forum/categories/seed - Seed default forum categories (admin only)
export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, 5, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const session = await getSession()
  if (!session.isAuthenticated || !session.user) return unauthorizedResponse()
  if (session.user.role !== 'ADMIN') return errorResponse('Admin access required', 403)

  const supabase = createAdminClient()

  // Check what already exists to avoid duplicates
  const { data: existing } = await supabase
    .from('ForumCategory')
    .select('slug')

  const existingSlugs = new Set((existing || []).map(c => c.slug))

  const toInsert = DEFAULT_CATEGORIES
    .filter(cat => !existingSlugs.has(cat.slug))
    .map(cat => ({
      id: crypto.randomUUID(),
      ...cat,
    }))

  if (toInsert.length === 0) {
    return successResponse({ message: 'All default categories already exist', created: 0 })
  }

  const { error } = await supabase
    .from('ForumCategory')
    .insert(toInsert)

  if (error) {
    console.error('[Admin Forum] Error seeding categories:', error)
    return serverErrorResponse('Failed to seed categories')
  }

  return successResponse({
    message: `Created ${toInsert.length} categories`,
    created: toInsert.length,
    categories: toInsert.map(c => c.name),
  }, 201)
}
