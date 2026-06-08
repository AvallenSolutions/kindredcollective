import type { Metadata } from 'next'
import Link from 'next/link'
import { Filter, Search, HelpCircle } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { KnowledgeCard, type KnowledgeCardData } from '@/components/knowledge/knowledge-card'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Ask the Collective | Kindred Collective Knowledge Base',
  description:
    'Answers to the questions UK drinks founders ask most — on regulation, route to market, packaging, logistics, funding and more. Distilled from years of community knowledge.',
}

interface SearchParams {
  category?: string
  tag?: string
  search?: string
}

async function getData(filters: SearchParams) {
  const supabase = createAdminClient()

  const { data: categories } = await supabase
    .from('KnowledgeCategory')
    .select('id, name, slug, color, order')
    .order('order', { ascending: true })

  let query = supabase
    .from('KnowledgeEntry')
    .select(
      `
      id, question, answer, slug, topicTags, sourceCount, helpfulCount, createdAt,
      category:KnowledgeCategory(id, name, slug, color)
    `,
      { count: 'exact' }
    )
    .eq('isPublished', true)
    .eq('status', 'PUBLISHED')

  if (filters.category) {
    const cat = (categories || []).find((c) => c.slug === filters.category)
    if (cat) query = query.eq('categoryId', cat.id)
  }
  if (filters.tag) {
    query = query.contains('topicTags', [filters.tag.toLowerCase()])
  }
  if (filters.search) {
    const pattern = `%${filters.search.replace(/[%_]/g, (m) => `\\${m}`)}%`
    query = query.or(`question.ilike.${pattern},answer.ilike.${pattern}`)
  }

  query = query.order('helpfulCount', { ascending: false }).order('sourceCount', { ascending: false }).range(0, 49)

  const { data: entries, count } = await query

  const formatted: KnowledgeCardData[] = (entries || []).map((e: any) => ({
    slug: e.slug,
    question: e.question,
    answer: e.answer,
    topicTags: (e.topicTags || []) as string[],
    sourceCount: e.sourceCount,
    helpfulCount: e.helpfulCount,
    category: Array.isArray(e.category) ? e.category[0] : e.category,
  }))

  return { categories: categories || [], entries: formatted, total: count || 0 }
}

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const filters = await searchParams
  const { categories, entries, total } = await getData(filters)

  function buildQuery(overrides: Partial<SearchParams>): string {
    const params = new URLSearchParams()
    const merged = { ...filters, ...overrides }
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v as string)
    })
    const qs = params.toString()
    return qs ? `?${qs}` : ''
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <section className="pt-16 pb-12 px-6 border-b-2 border-black bg-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-3 h-3 bg-coral rounded-full border border-black"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Knowledge Base</span>
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold uppercase tracking-tighter leading-none mb-4">
            Ask the Collective
          </h1>
          <p className="text-xl font-medium text-gray-600 max-w-2xl">
            The questions independent drinks founders ask most — answered. Distilled from years of community
            knowledge so the good stuff never disappears in the feed again.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 shrink-0 space-y-6">
            <form className="bg-white border-2 border-black neo-shadow">
              {filters.category && <input type="hidden" name="category" value={filters.category} />}
              {filters.tag && <input type="hidden" name="tag" value={filters.tag} />}
              <div className="px-4 py-3 bg-black text-white font-bold uppercase text-sm flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search
              </div>
              <div className="p-3">
                <input
                  type="text"
                  name="search"
                  defaultValue={filters.search || ''}
                  placeholder="Search questions"
                  className="w-full px-3 py-2 border-2 border-black text-sm font-medium focus:outline-none focus:border-coral"
                />
                <button
                  type="submit"
                  className="mt-2 w-full px-3 py-2 bg-coral border-2 border-black text-xs font-bold uppercase hover:bg-black hover:text-coral transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            <div className="bg-white border-2 border-black neo-shadow">
              <div className="px-4 py-3 bg-black text-white font-bold uppercase text-sm flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Topics
              </div>
              <div className="p-2">
                <Link
                  href={`/knowledge${buildQuery({ category: undefined })}`}
                  className={`block px-3 py-2 text-sm font-bold uppercase hover:bg-gray-100 transition-colors ${
                    !filters.category ? 'bg-gray-100 border-l-4 border-black' : ''
                  }`}
                >
                  All Topics <span className="text-gray-400 ml-1">({total})</span>
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/knowledge${buildQuery({ category: cat.slug })}`}
                    className={`block px-3 py-2 text-sm font-bold uppercase hover:bg-gray-100 transition-colors ${
                      filters.category === cat.slug ? 'bg-gray-100 border-l-4 border-black' : ''
                    }`}
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full border border-black mr-2"
                      style={{ backgroundColor: cat.color }}
                    ></span>
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            {filters.tag && (
              <div className="bg-amber-50 border-2 border-black p-3 text-xs">
                <p className="font-bold uppercase mb-1">Tag filter</p>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-200 border border-black font-bold">#{filters.tag}</span>
                  <Link href={`/knowledge${buildQuery({ tag: undefined })}`} className="text-coral font-bold underline">
                    Clear
                  </Link>
                </div>
              </div>
            )}
          </aside>

          <div className="flex-1 min-w-0">
            {entries.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {entries.map((e) => (
                  <KnowledgeCard key={e.slug} entry={e} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 border-2 border-black">
                <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">
                  {filters.search || filters.category || filters.tag
                    ? 'No answers match your filters yet.'
                    : 'The knowledge base is being populated. Check back soon.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
