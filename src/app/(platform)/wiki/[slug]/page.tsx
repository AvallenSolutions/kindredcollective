import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, BookOpen, Network, Building2, FileText, Tag, Link2 } from 'lucide-react'
import { getSession } from '@/lib/auth/session'
import { getWikiPage, getAllWikiPages, getBacklinks, renderMarkdownToHtml, type WikiPage } from '@/lib/wiki'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const TYPE_META: Record<
  WikiPage['type'],
  { label: string; bg: string; color: string; Icon: typeof BookOpen }
> = {
  topic: { label: 'Topic Hub', bg: 'bg-cyan', color: 'text-black', Icon: Network },
  concept: { label: 'Concept', bg: 'bg-lime', color: 'text-black', Icon: BookOpen },
  entity: { label: 'Entity', bg: 'bg-coral', color: 'text-white', Icon: Building2 },
  source: { label: 'Source', bg: 'bg-black', color: 'text-white', Icon: FileText },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = getWikiPage(slug)
  if (!page) return { title: 'Not found | Kindred Knowledge Hub' }
  return {
    title: `${page.title} | Kindred Knowledge Hub`,
    description: page.description || undefined,
  }
}

export default async function WikiDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const session = await getSession()
  if (!session.isAuthenticated) redirect('/login')

  const { slug } = await params
  const page = getWikiPage(slug)
  if (!page) return notFound()

  const allPages = getAllWikiPages()
  const slugToTitle = new Map(allPages.map((p) => [p.slug, p.title]))
  const backlinks = getBacklinks(slug, allPages)
  const html = renderMarkdownToHtml(page.body, slugToTitle)

  const { label, bg, color, Icon } = TYPE_META[page.type]

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Top bar */}
      <div className="pt-24 pb-4 px-6 border-b-2 border-black bg-gray-100">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/wiki"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide hover:text-coral transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Knowledge Hub
          </Link>

          <div className="flex items-center gap-3 mb-3">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${bg} ${color} border-2 border-black text-xs font-bold uppercase`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </span>
            {page.updated && (
              <span className="text-xs text-gray-500 font-mono">Updated {page.updated}</span>
            )}
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tighter leading-none mb-4">
            {page.title}
          </h1>

          {page.description && (
            <p className="text-lg text-gray-600 mb-4">{page.description}</p>
          )}

          {page.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-gray-400" />
              {page.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-white border-2 border-black text-[11px] font-bold uppercase"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        <article
          className="wiki-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Backlinks */}
        {backlinks.length > 0 && (
          <aside className="mt-12 pt-8 border-t-2 border-black">
            <div className="flex items-center gap-2 mb-4">
              <Link2 className="w-4 h-4" />
              <h2 className="font-display text-base font-bold uppercase tracking-wide">
                Linked from ({backlinks.length})
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {backlinks.map((bl) => {
                const blMeta = TYPE_META[bl.type]
                return (
                  <Link
                    key={bl.slug}
                    href={`/wiki/${bl.slug}`}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${blMeta.bg} ${blMeta.color} border-2 border-black text-xs font-bold uppercase hover:opacity-80 transition-opacity`}
                  >
                    <blMeta.Icon className="w-3 h-3" />
                    {bl.title}
                  </Link>
                )
              })}
            </div>
          </aside>
        )}

        {/* Source files note */}
        {page.sources.length > 0 && (
          <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-300">
            <p className="text-xs font-bold uppercase text-gray-400 mb-2">Source documents</p>
            <ul className="space-y-1">
              {page.sources.map((src) => (
                <li key={src} className="text-xs font-mono text-gray-500">
                  {src}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
