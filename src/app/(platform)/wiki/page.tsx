import Link from 'next/link'
import { BookOpen, Network, Building2, FileText, Tag } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getAllWikiPages, type WikiPage } from '@/lib/wiki'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const TYPE_META: Record<
  WikiPage['type'],
  { label: string; color: string; bg: string; Icon: typeof BookOpen }
> = {
  topic: { label: 'Topic Hub', color: 'text-black', bg: 'bg-cyan', Icon: Network },
  concept: { label: 'Concept', color: 'text-black', bg: 'bg-lime', Icon: BookOpen },
  entity: { label: 'Entity', color: 'text-white', bg: 'bg-coral', Icon: Building2 },
  source: { label: 'Source', color: 'text-white', bg: 'bg-black', Icon: FileText },
}

const TYPE_ORDER: WikiPage['type'][] = ['topic', 'concept', 'entity', 'source']

const TYPE_HEADINGS: Record<WikiPage['type'], string> = {
  topic: 'Topic Hubs',
  concept: 'Concepts',
  entity: 'Entities',
  source: 'Sources',
}

export default async function WikiIndexPage() {
  const session = await getSession()
  if (!session.isAuthenticated) redirect('/login')

  const pages = getAllWikiPages()

  const grouped = TYPE_ORDER.reduce<Record<WikiPage['type'], WikiPage[]>>(
    (acc, t) => {
      acc[t] = pages.filter((p) => p.type === t)
      return acc
    },
    { topic: [], concept: [], entity: [], source: [] }
  )

  const totalPages = pages.length

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Hero */}
      <section className="pt-32 pb-12 px-6 border-b-2 border-black bg-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-3 h-3 bg-lime rounded-full border border-black" />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Members Only
            </span>
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold uppercase tracking-tighter leading-none mb-4">
            Knowledge Hub
          </h1>
          <p className="text-xl font-medium text-gray-600 max-w-2xl mb-6">
            The Kindred Collective knowledge base — 7 years of member intelligence, UK legislation,
            and drinks-industry insight, maintained as a living wiki.
          </p>
          <div className="flex flex-wrap gap-4">
            {TYPE_ORDER.map((t) => {
              const { label, bg, color, Icon } = TYPE_META[t]
              const count = grouped[t].length
              return (
                <div
                  key={t}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 ${bg} ${color} border-2 border-black font-bold text-xs uppercase`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {count} {label}{count !== 1 ? 's' : ''}
                </div>
              )
            })}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-black font-bold text-xs uppercase">
              {totalPages} pages total
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        {TYPE_ORDER.map((type) => {
          const group = grouped[type]
          if (group.length === 0) return null
          const { label: typeLabel, bg, color, Icon } = TYPE_META[type]
          return (
            <section key={type}>
              <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-black">
                <div className={`w-8 h-8 ${bg} ${color} border-2 border-black flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h2 className="font-display text-2xl font-bold uppercase tracking-tight">
                  {TYPE_HEADINGS[type]}
                </h2>
                <span className="text-sm font-bold text-gray-400 uppercase ml-auto">
                  {group.length}
                </span>
              </div>

              <div
                className={
                  type === 'topic'
                    ? 'grid sm:grid-cols-2 gap-4'
                    : 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4'
                }
              >
                {group.map((page) => (
                  <Link key={page.slug} href={`/wiki/${page.slug}`}>
                    <div className="group bg-white border-2 border-black p-5 h-full flex flex-col hover:bg-gray-50 transition-colors neo-shadow-hover cursor-pointer">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span
                          className={`px-2 py-0.5 ${bg} ${color} border border-black text-[10px] font-bold uppercase shrink-0`}
                        >
                          {typeLabel}
                        </span>
                        {page.updated && (
                          <span className="text-[10px] text-gray-400 font-mono shrink-0">
                            {page.updated}
                          </span>
                        )}
                      </div>

                      <h3 className="font-display font-bold text-lg uppercase leading-tight mb-2 group-hover:text-coral transition-colors">
                        {page.title}
                      </h3>

                      {page.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3 flex-1">
                          {page.description}
                        </p>
                      )}

                      {page.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-auto pt-2">
                          <Tag className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
                          {page.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 text-[10px] font-bold uppercase"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
