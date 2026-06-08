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
  let created = 0
  let skipped = 0
  for (const en of endorsements) {
    if (en.supplierId) {
      // Compound-unique upsert prevents double-counting on re-run.
      const before = await prisma.supplierEndorsement.findUnique({
        where: { supplierId_sourceMessageHash: { supplierId: en.supplierId, sourceMessageHash: en.sourceMessageHash } },
      })
      await prisma.supplierEndorsement.upsert({
        where: { supplierId_sourceMessageHash: { supplierId: en.supplierId, sourceMessageHash: en.sourceMessageHash } },
        update: { quoteSnippet: en.quoteSnippet, sentiment: en.sentiment, category: en.category },
        create: {
          supplierId: en.supplierId,
          rawSupplierName: en.rawSupplierName,
          category: en.category,
          quoteSnippet: en.quoteSnippet,
          sentiment: en.sentiment,
          sourceMessageHash: en.sourceMessageHash,
          isPublished: false,
        },
      })
      before ? skipped++ : created++
    } else {
      // Unmatched mention: Postgres treats NULL as distinct in the unique
      // index, so guard manually on (rawSupplierName, sourceMessageHash).
      const existing = await prisma.supplierEndorsement.findFirst({
        where: { supplierId: null, rawSupplierName: en.rawSupplierName, sourceMessageHash: en.sourceMessageHash },
      })
      if (existing) {
        skipped++
        continue
      }
      await prisma.supplierEndorsement.create({
        data: {
          supplierId: null,
          rawSupplierName: en.rawSupplierName,
          category: en.category,
          quoteSnippet: en.quoteSnippet,
          sentiment: en.sentiment,
          sourceMessageHash: en.sourceMessageHash,
          isPublished: false,
        },
      })
      created++
    }
  }
  return { created, skipped }
}

export async function persistLinks(
  prisma: PrismaClient,
  ctx: { systemUserId: string; linkCategoryId: string },
  links: PreparedLink[]
): Promise<{ created: number; skipped: number }> {
  let created = 0
  let skipped = 0
  for (const l of links) {
    // Resource.url is nullable/non-unique (FILE/VIDEO rows have url=null), so
    // dedup with a findFirst guard rather than a DB constraint.
    const existing = await prisma.resource.findFirst({ where: { url: l.url, type: 'LINK' } })
    if (existing) {
      skipped++
      continue
    }
    await prisma.resource.create({
      data: {
        title: l.title.slice(0, 200),
        description: l.description || l.url,
        type: 'LINK',
        status: 'PUBLISHED',
        url: l.url,
        tags: Array.from(new Set(['imported', ...l.tags])).slice(0, 8),
        categoryId: ctx.linkCategoryId,
        authorId: ctx.systemUserId,
      },
    })
    created++
  }
  return { created, skipped }
}
