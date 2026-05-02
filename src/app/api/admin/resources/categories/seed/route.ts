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
    name: 'Templates',
    slug: 'templates',
    description: 'Ready-to-use templates: contracts, decks, spreadsheets',
    color: '#00D9FF',
    order: 1,
  },
  {
    name: 'Marketing',
    slug: 'marketing',
    description: 'Marketing playbooks, brand guides, campaign assets',
    color: '#FF5D5D',
    order: 2,
  },
  {
    name: 'Sales',
    slug: 'sales',
    description: 'Sales decks, pitch examples, distributor packs',
    color: '#CCFF00',
    order: 3,
  },
  {
    name: 'Production',
    slug: 'production',
    description: 'Recipes, process docs, supplier specs',
    color: '#A78BFA',
    order: 4,
  },
  {
    name: 'Legal & Compliance',
    slug: 'legal-compliance',
    description: 'Legal templates, regulations, label compliance',
    color: '#F59E0B',
    order: 5,
  },
  {
    name: 'Operations',
    slug: 'operations',
    description: 'Ops processes, finance, logistics, fulfilment',
    color: '#10B981',
    order: 6,
  },
  {
    name: 'Sustainability',
    slug: 'sustainability',
    description: 'ESG resources, carbon reporting, packaging guides',
    color: '#EC4899',
    order: 7,
  },
  {
    name: 'Learning & Inspiration',
    slug: 'learning-inspiration',
    description: 'Talks, podcasts, articles and case studies',
    color: '#F97316',
    order: 8,
  },
]

// POST /api/admin/resources/categories/seed - Seed default resource categories (admin only)
export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, 5, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const session = await getSession()
  if (!session.isAuthenticated || !session.user) return unauthorizedResponse()
  if (session.user.role !== 'ADMIN') return errorResponse('Admin access required', 403)

  const supabase = createAdminClient()

  const { data: existing, error: fetchError } = await supabase
    .from('ResourceCategory')
    .select('slug')

  if (fetchError) {
    console.error('[Admin Resources] Error fetching existing categories:', fetchError)
  }

  const existingSlugs = new Set((existing || []).map(c => c.slug))

  const now = new Date().toISOString()
  const toInsert = DEFAULT_CATEGORIES
    .filter(cat => !existingSlugs.has(cat.slug))
    .map(cat => ({
      id: crypto.randomUUID(),
      ...cat,
      createdAt: now,
    }))

  if (toInsert.length === 0) {
    return successResponse({ message: 'All default categories already exist', created: 0 })
  }

  const created: string[] = []
  const errors: string[] = []

  for (const cat of toInsert) {
    const { error } = await supabase
      .from('ResourceCategory')
      .insert(cat)

    if (error) {
      console.error(`[Admin Resources] Error inserting category "${cat.name}":`, error)
      errors.push(`${cat.name}: ${error.message}`)
    } else {
      created.push(cat.name)
    }
  }

  if (created.length === 0) {
    return serverErrorResponse(`Failed to seed categories: ${errors.join('; ')}`)
  }

  return successResponse({
    message: `Created ${created.length} of ${toInsert.length} categories`,
    created: created.length,
    categories: created,
    ...(errors.length > 0 ? { errors } : {}),
  }, 201)
}
