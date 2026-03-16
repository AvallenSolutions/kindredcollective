import Parser from 'rss-parser'
import { RSS_SOURCES } from './sources'

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'KindredCollective/1.0 (+https://kindredcollective.co.uk)' },
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: false }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
    ],
  },
})

const SPIRIT_KEYWORDS = ['whisky', 'whiskey', 'gin', 'rum', 'vodka', 'tequila', 'brandy', 'cognac', 'mezcal', 'baijiu', 'liqueur', 'spirits', 'distillery', 'distiller']
const WINE_KEYWORDS = ['wine', 'champagne', 'prosecco', 'cava', 'sparkling', 'vineyard', 'winery', 'sommelier', 'chardonnay', 'cabernet', 'pinot', 'rosé', 'rose', 'port', 'sherry']
const BEER_KEYWORDS = ['beer', 'ale', 'lager', 'stout', 'porter', 'craft beer', 'brewery', 'hops', 'brewer', 'brewing', 'ipa', 'pale ale', 'draught', 'draft']
const CIDER_KEYWORDS = ['cider', 'perry', 'orchard', 'cidermaker']
const NON_ALC_KEYWORDS = ['non-alc', 'nonalc', 'alcohol-free', 'no alcohol', 'low alcohol', 'low-alcohol', '0%', 'zero alcohol', 'dealcoholised', 'mocktail', 'temperance']
const MIXER_KEYWORDS = ['mixer', 'tonic', 'ginger beer', 'shrub', 'cordial', 'bitters']

function detectCategory(title: string, description: string, defaultCategory: string): string {
  const text = `${title} ${description}`.toLowerCase()
  if (NON_ALC_KEYWORDS.some((kw) => text.includes(kw))) return 'NON_ALC'
  if (CIDER_KEYWORDS.some((kw) => text.includes(kw))) return 'CIDER'
  if (MIXER_KEYWORDS.some((kw) => text.includes(kw))) return 'MIXERS'
  if (BEER_KEYWORDS.some((kw) => text.includes(kw))) return 'BEER'
  if (WINE_KEYWORDS.some((kw) => text.includes(kw))) return 'WINE'
  if (SPIRIT_KEYWORDS.some((kw) => text.includes(kw))) return 'SPIRITS'
  return defaultCategory
}

export interface LiveArticle {
  id: string
  title: string
  url: string
  description: string | null
  imageUrl: string | null
  category: string
  publishedAt: string
  source: { name: string; siteUrl: string }
}

// ── In-memory cache ────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour
let _cache: { articles: LiveArticle[]; cachedAt: number } | null = null

/**
 * Fetch articles from all RSS sources and return them sorted by date.
 * Results are cached in memory for 1 hour to avoid hammering the feeds.
 */
export async function fetchAllFeedsLive(): Promise<LiveArticle[]> {
  if (_cache && Date.now() - _cache.cachedAt < CACHE_TTL_MS) {
    return _cache.articles
  }

  const results = await Promise.allSettled(
    RSS_SOURCES.map(async (source) => {
      const feed = await parser.parseURL(source.feedUrl)
      const articles: LiveArticle[] = []

      for (const item of feed.items ?? []) {
        if (!item.link || !item.title) continue

        const url = item.link.split('?')[0]
        const description = item.contentSnippet ?? item.content ?? item.summary ?? null
        const cleanDesc = description
          ? description.replace(/<[^>]+>/g, '').trim().slice(0, 300)
          : null

        // Image: try enclosure, then media:content, then media:thumbnail, then og-style
        const itemAny = item as any
        const imageUrl =
          item.enclosure?.url ??
          itemAny.mediaContent?.$.url ??
          itemAny.mediaThumbnail?.$.url ??
          null

        const publishedAt = item.pubDate
          ? new Date(item.pubDate).toISOString()
          : new Date().toISOString()

        const category = detectCategory(item.title, cleanDesc ?? '', source.defaultCategory)

        // Stable ID from URL
        const id = Buffer.from(url).toString('base64').slice(0, 24)

        articles.push({
          id,
          title: item.title,
          url,
          description: cleanDesc,
          imageUrl,
          category,
          publishedAt,
          source: { name: source.name, siteUrl: source.siteUrl },
        })
      }

      return articles
    })
  )

  const articles: LiveArticle[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') {
      articles.push(...result.value)
    }
    // silently skip failed feeds — one broken source shouldn't break the whole page
  }

  // Sort newest first, deduplicate by URL
  const seen = new Set<string>()
  const deduped = articles
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .filter((a) => {
      if (seen.has(a.url)) return false
      seen.add(a.url)
      return true
    })

  _cache = { articles: deduped, cachedAt: Date.now() }
  return deduped
}

// ── Legacy DB-backed sync (used by admin /api/news/refresh) ───────────────────
export interface SyncResult {
  added: number
  errors: string[]
}

export async function syncAllFeeds(): Promise<SyncResult> {
  // Invalidate live cache so next request picks up fresh data
  _cache = null

  let added = 0
  const errors: string[] = []

  try {
    const { prisma } = await import('@/lib/db')

    // Upsert all configured sources so they exist in the DB
    const dbSources = await Promise.all(
      RSS_SOURCES.map((s) =>
        prisma.newsSource.upsert({
          where: { feedUrl: s.feedUrl },
          create: { name: s.name, feedUrl: s.feedUrl, siteUrl: s.siteUrl, isActive: true },
          update: { name: s.name, siteUrl: s.siteUrl },
        })
      )
    )

    // Fetch each active source
    for (let i = 0; i < dbSources.length; i++) {
      const dbSource = dbSources[i]
      const sourceConfig = RSS_SOURCES[i]

      if (!dbSource.isActive) continue

      try {
        const feed = await parser.parseURL(dbSource.feedUrl)
        const articles: {
          sourceId: string
          title: string
          url: string
          description: string | null
          imageUrl: string | null
          category: string
          publishedAt: Date
          fetchedAt: Date
        }[] = []

        for (const item of feed.items ?? []) {
          if (!item.link || !item.title) continue
          const url = item.link.split('?')[0]
          const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date()
          const description = item.contentSnippet ?? item.content ?? item.summary ?? null
          const imageUrl = (item as any).enclosure?.url ?? null
          const category = detectCategory(item.title, description ?? '', sourceConfig.defaultCategory)
          articles.push({
            sourceId: dbSource.id,
            title: item.title,
            url,
            description: description ? description.slice(0, 1000) : null,
            imageUrl,
            category,
            publishedAt,
            fetchedAt: new Date(),
          })
        }

        if (articles.length > 0) {
          const result = await prisma.newsArticle.createMany({
            data: articles,
            skipDuplicates: true,
          })
          added += result.count
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        errors.push(`${sourceConfig.name}: ${message}`)
        console.error(`[rss] Failed to fetch ${sourceConfig.feedUrl}:`, message)
      }
    }
  } catch (err) {
    // Prisma/DB not available — fall through gracefully
    errors.push(`DB sync unavailable: ${err instanceof Error ? err.message : String(err)}`)
  }

  return { added, errors }
}
