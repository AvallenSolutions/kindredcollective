import Parser from 'rss-parser'
import { prisma } from '@/lib/db'
import { RSS_SOURCES } from './sources'

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'KindredCollective/1.0 (+https://kindredcollective.co.uk)' },
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

export interface SyncResult {
  added: number
  errors: string[]
}

export async function syncAllFeeds(): Promise<SyncResult> {
  let added = 0
  const errors: string[] = []

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
        const imageUrl = item.enclosure?.url ?? null
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

  return { added, errors }
}
