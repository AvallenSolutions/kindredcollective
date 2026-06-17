import { PrismaClient } from '@prisma/client'
import { COMMUNITY_LINKS_CATEGORY_SLUG, SYSTEM_USER_EMAIL } from './config'
import type { SupplierCategory } from './types'

/**
 * Stage 4 — idempotent persistence via Prisma. Re-runs are convergent, not
 * additive: knowledge entries upsert on `sourceHash`, endorsements are guarded
 * by [supplierId, sourceMessageHash], and links dedup on canonical URL. All
 * imported records default to UNPUBLISHED for admin review.
 */

export interface PreparedKnowledge {
  question: string
  answer: string
  slug: string
  topicTags: string[]
  categorySlug: string
  sourceHash: string
  sourceCount: number
  confidence: number
}

export interface PreparedEndorsement {
  supplierId: string | null
  rawSupplierName: string
  category: SupplierCategory
  quoteSnippet: string
  sentiment: string
  sourceMessageHash: string
}

export interface PreparedLink {
  url: string
  title: string
  description: string
  tags: string[]
}

export interface PersistDeps {
  prisma: PrismaClient
}

/** Resolve (and require) the prerequisites created by seed-knowledge.ts. */
export async function loadPersistContext(prisma: PrismaClient) {
  const systemUser = await prisma.user.findUnique({ where: { email: SYSTEM_USER_EMAIL } })
  if (!systemUser) {
    throw new Error(`System user ${SYSTEM_USER_EMAIL} not found — run \`npm run seed:knowledge\` first`)
  }
  const knowledgeCategories = await prisma.knowledgeCategory.findMany({ select: { id: true, slug: true } })
  const linkCategory = await prisma.resourceCategory.findUnique({
    where: { slug: COMMUNITY_LINKS_CATEGORY_SLUG },
  })
  if (knowledgeCategories.length === 0 || !linkCategory) {
    throw new Error('Knowledge/link categories missing — run `npm run seed:knowledge` first')
  }
  const catBySlug = new Map(knowledgeCategories.map((c) => [c.slug, c.id]))
  return { systemUserId: systemUser.id, catBySlug, linkCategoryId: linkCategory.id }
}

async function uniqueEntrySlug(prisma: PrismaClient, base: string, ownSourceHash: string): Promise<string> {
  let slug = base || 'entry'
  let n = 2
  // Avoid colliding with a *different* entry's slug.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.knowledgeEntry.findUnique({ where: { slug } })
    if (!existing || existing.sourceHash === ownSourceHash) return slug
    slug = `${base}-${n++}`
  }
}

export async function persistKnowledge(
  prisma: PrismaClient,
  ctx: { catBySlug: Map<string, string> },
  entries: PreparedKnowledge[]
): Promise<{ created: number; updated: number }> {
  let created = 0
  let updated = 0
  for (const e of entries) {
    const categoryId = ctx.catBySlug.get(e.categorySlug) ?? ctx.catBySlug.get('general')!
    const existing = await prisma.knowledgeEntry.findUnique({ where: { sourceHash: e.sourceHash } })
    if (existing) {
      await prisma.knowledgeEntry.update({
        where: { sourceHash: e.sourceHash },
        data: {
          question: e.question,
          answer: e.answer,
          topicTags: e.topicTags,
          categoryId,
          sourceCount: e.sourceCount,
          confidence: e.confidence,
        },
      })
      updated++
    } else {
      const slug = await uniqueEntrySlug(prisma, e.slug, e.sourceHash)
      await prisma.knowledgeEntry.create({
        data: {
          question: e.question,
          answer: e.answer,
          slug,
          topicTags: e.topicTags,
          categoryId,
          sourceHash: e.sourceHash,
          sourceCount: e.sourceCount,
          confidence: e.confidence,
          status: 'DRAFT',
          isPublished: false,
          importedAt: new Date(),
        },
      })
      created++
    }
  }
  return { created, updated }
}

export async function persistEndorsements(
  prisma: PrismaClient,
  endorsements: PreparedEndorsement[]
): Promise<{ created: number; skipped: number }> {
  if (endorsements.length === 0) return { created: 0, skipped: 0 }

  // De-dupe within this batch on (supplierId | rawName) + sourceMessageHash.
  const keyOf = (e: PreparedEndorsement) =>
    e.supplierId ? `${e.supplierId}|${e.sourceMessageHash}` : `raw:${e.rawSupplierName}|${e.sourceMessageHash}`
  const seen = new Set<string>()
  const deduped = endorsements.filter((e) => {
    const k = keyOf(e)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })

  // One read to find what already exists (idempotent re-runs), then bulk insert.
  const existing = new Set<string>()
  const supplierIds = Array.from(new Set(deduped.map((e) => e.supplierId).filter(Boolean))) as string[]
  if (supplierIds.length > 0) {
    const rows = await prisma.supplierEndorsement.findMany({
      where: { supplierId: { in: supplierIds } },
      select: { supplierId: true, sourceMessageHash: true },
    })
    rows.forEach((r) => existing.add(`${r.supplierId}|${r.sourceMessageHash}`))
  }
  const rawRows = await prisma.supplierEndorsement.findMany({
    where: { supplierId: null },
    select: { rawSupplierName: true, sourceMessageHash: true },
  })
  rawRows.forEach((r) => existing.add(`raw:${r.rawSupplierName}|${r.sourceMessageHash}`))

  const toInsert = deduped
    .filter((e) => !existing.has(keyOf(e)))
    .map((e) => ({
      supplierId: e.supplierId,
      rawSupplierName: e.rawSupplierName,
      category: e.category,
      quoteSnippet: e.quoteSnippet,
      sentiment: e.sentiment,
      sourceMessageHash: e.sourceMessageHash,
      isPublished: false,
    }))

  let created = 0
  const BATCH = 500
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const res = await prisma.supplierEndorsement.createMany({
      data: toInsert.slice(i, i + BATCH),
      skipDuplicates: true,
    })
    created += res.count
  }
  return { created, skipped: deduped.length - created }
}

export async function persistLinks(
  prisma: PrismaClient,
  ctx: { systemUserId: string; linkCategoryId: string },
  links: PreparedLink[]
): Promise<{ created: number; skipped: number }> {
  if (links.length === 0) return { created: 0, skipped: 0 }

  // De-dupe within batch by URL.
  const seen = new Set<string>()
  const deduped = links.filter((l) => {
    if (seen.has(l.url)) return false
    seen.add(l.url)
    return true
  })

  // One read for existing imported links (Resource.url isn't unique), then bulk insert.
  const urls = deduped.map((l) => l.url)
  const existingRows = await prisma.resource.findMany({
    where: { type: 'LINK', url: { in: urls } },
    select: { url: true },
  })
  const existing = new Set(existingRows.map((r) => r.url))

  const toInsert = deduped
    .filter((l) => !existing.has(l.url))
    .map((l) => ({
      title: l.title.slice(0, 200),
      description: l.description || l.url,
      type: 'LINK' as const,
      status: 'PUBLISHED' as const,
      url: l.url,
      tags: Array.from(new Set(['imported', ...l.tags])).slice(0, 8),
      categoryId: ctx.linkCategoryId,
      authorId: ctx.systemUserId,
    }))

  let created = 0
  const BATCH = 500
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const res = await prisma.resource.createMany({ data: toInsert.slice(i, i + BATCH), skipDuplicates: true })
    created += res.count
  }
  return { created, skipped: deduped.length - created }
}
