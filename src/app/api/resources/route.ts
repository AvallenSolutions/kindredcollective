import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSession } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { applyRateLimit } from '@/lib/api/rate-limit'
import { isSupportedVideoUrl } from '@/lib/resources/video-embed'

const VALID_TYPES = ['FILE', 'VIDEO', 'LINK'] as const
type ResourceType = (typeof VALID_TYPES)[number]

function normaliseTags(input: unknown): string[] {
  if (!input) return []
  const list = Array.isArray(input)
    ? input
    : String(input).split(',')
  return Array.from(
    new Set(
      list
        .map(t => String(t).trim().toLowerCase())
        .filter(t => t.length > 0 && t.length <= 30)
    )
  ).slice(0, 10)
}

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

// GET /api/resources - List resources
export async function GET(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, 60, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const session = await getSession()
  if (!session.isAuthenticated) return unauthorizedResponse()

  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const { page, limit, from, to } = parsePagination(searchParams)

  const category = searchParams.get('category')
  const type = searchParams.get('type')
  const tag = searchParams.get('tag')?.toLowerCase()
  const search = searchParams.get('search')?.trim()
  const sort = searchParams.get('sort') || 'newest'

  let query = supabase
    .from('Resource')
    .select(`
      id, title, description, type, status, fileUrl, fileName, fileSize, fileMime,
      url, tags, viewCount, downloadCount, createdAt, updatedAt,
      category:ResourceCategory(id, name, slug, color),
      author:User!authorId(
        id, email,
        member:Member(firstName, lastName, avatarUrl, jobTitle, company)
      )
    `, { count: 'exact' })
    .eq('status', 'PUBLISHED')

  if (category) query = query.eq('category.slug', category)
  if (type && (VALID_TYPES as readonly string[]).includes(type)) query = query.eq('type', type)
  if (tag) query = query.contains('tags', [tag])
  if (search) {
    const pattern = `%${search.replace(/[%_]/g, m => `\\${m}`)}%`
    query = query.or(`title.ilike.${pattern},description.ilike.${pattern}`)
  }

  if (sort === 'oldest') {
    query = query.order('createdAt', { ascending: true })
  } else if (sort === 'popular') {
    query = query.order('downloadCount', { ascending: false })
  } else {
    query = query.order('createdAt', { ascending: false })
  }

  query = query.range(from, to)

  const { data: resources, error, count } = await query

  if (error) {
    console.error('[Resources] Error fetching resources:', error)
    return serverErrorResponse('Failed to fetch resources')
  }

  return successResponse({
    resources: resources || [],
    pagination: paginationMeta(page, limit, count || 0),
  })
}

// POST /api/resources - Create a resource
export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, 10, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const session = await getSession()
  if (!session.isAuthenticated || !session.user) return unauthorizedResponse()

  const body = await request.json()
  const {
    title,
    description,
    type,
    categoryId,
    tags,
    url,
    fileUrl,
    filePath,
    fileName,
    fileSize,
    fileMime,
  } = body

  if (!title?.trim()) return errorResponse('Title is required')
  if (!description?.trim()) return errorResponse('Description is required')
  if (!categoryId) return errorResponse('Category is required')
  if (!type || !(VALID_TYPES as readonly string[]).includes(type)) {
    return errorResponse('Invalid resource type')
  }

  const resourceType = type as ResourceType

  if (resourceType === 'FILE') {
    if (!fileUrl || !filePath || !fileName) {
      return errorResponse('File upload is required for file resources')
    }
  } else {
    if (!url || typeof url !== 'string' || !isValidUrl(url)) {
      return errorResponse('A valid http(s) URL is required')
    }
    if (resourceType === 'VIDEO' && !isSupportedVideoUrl(url)) {
      return errorResponse('Video URL must be a YouTube or Vimeo link')
    }
  }

  const supabase = createAdminClient()

  const { data: cat, error: catError } = await supabase
    .from('ResourceCategory')
    .select('id')
    .eq('id', categoryId)
    .single()

  if (catError || !cat) return errorResponse('Invalid category')

  const insertData: Record<string, unknown> = {
    id: crypto.randomUUID(),
    title: title.trim(),
    description: description.trim(),
    type: resourceType,
    categoryId,
    authorId: session.user.id,
    tags: normaliseTags(tags),
    updatedAt: new Date().toISOString(),
  }

  if (resourceType === 'FILE') {
    insertData.fileUrl = fileUrl
    insertData.filePath = filePath
    insertData.fileName = fileName
    insertData.fileSize = typeof fileSize === 'number' ? fileSize : null
    insertData.fileMime = fileMime || null
  } else {
    insertData.url = url
  }

  const { data: resource, error } = await supabase
    .from('Resource')
    .insert(insertData)
    .select('id')
    .single()

  if (error) {
    console.error('[Resources] Error creating resource:', error)
    return serverErrorResponse('Failed to create resource')
  }

  return successResponse({ resource }, 201)
}
