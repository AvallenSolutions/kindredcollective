import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MessageSquare } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { HelpfulButton } from '@/components/knowledge/helpful-button'
import { truncate } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getEntry(slug: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('KnowledgeEntry')
    .select(
      `
      id, question, answer, slug, topicTags, sourceCount, viewCount, helpfulCount, createdAt,
      category:KnowledgeCategory(id, name, slug, color)
    `
    )
    .eq('slug', slug)
    .eq('isPublished', true)
    .eq('status', 'PUBLISHED')
    .maybeSingle()
  return data
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const entry = await getEntry(slug)
  if (!entry) return { title: 'Not found | Kindred Collective' }
  return {
    title: `${truncate(entry.question, 60)} | Ask the Collective`,
    description: truncate(entry.answer.replace(/\s+/g, ' '), 155),
  }
}

export default async function KnowledgeEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const entry = await getEntry(slug)
  if (!entry) notFound()

  const category = Array.isArray(entry.category) ? entry.category[0] : entry.category
  const tags = (entry.topicTags || []) as string[]

  // Fire-and-forget view count bump.
  const supabase = createAdminClient()
  void supabase
    .from('KnowledgeEntry')
    .update({ viewCount: (entry.viewCount ?? 0) + 1 })
    .eq('id', entry.id)
    .then(() => undefined)

  // Render answer paragraphs.
  const paragraphs = entry.answer.split(/\n{2,}/).filter(Boolean)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: entry.question,
      answerCount: 1,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    },
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="max-w-3xl mx-auto px-6 py-12">
        <Link
          href="/knowledge"
          className="inline-flex items-center gap-2 text-sm font-bold uppercase text-gray-500 hover:text-black mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          All Questions
        </Link>

        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {category && (
            <Link
              href={`/knowledge?category=${category.slug}`}
              className="px-2 py-0.5 border border-black text-[10px] font-bold uppercase"
              style={{ backgroundColor: category.color + '33' }}
            >
              {category.name}
            </Link>
          )}
          {entry.sourceCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-400">
              <MessageSquare className="w-3 h-3" />
              Based on {entry.sourceCount} community {entry.sourceCount === 1 ? 'discussion' : 'discussions'}
            </span>
          )}
        </div>

        <h1 className="font-display text-3xl md:text-5xl font-bold uppercase tracking-tighter leading-tight mb-8">
          {entry.question}
        </h1>

        <div className="prose prose-lg max-w-none space-y-4 text-gray-800">
          {paragraphs.map((p: string, i: number) => (
            <p key={i} className="text-lg leading-relaxed whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t-2 border-black">
            {tags.map((t) => (
              <Link
                key={t}
                href={`/knowledge?tag=${encodeURIComponent(t)}`}
                className="px-3 py-1 bg-gray-100 border border-black text-xs font-bold uppercase hover:bg-cyan transition-colors"
              >
                #{t}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 p-6 bg-gray-50 border-2 border-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-display font-bold uppercase text-lg">Was this helpful?</p>
            <p className="text-sm text-gray-600">
              This answer was distilled from the Kindred Collective community.
            </p>
          </div>
          <HelpfulButton slug={entry.slug} initialCount={entry.helpfulCount ?? 0} />
        </div>

        <div className="mt-10 p-6 bg-black text-white text-center">
          <p className="font-display font-bold uppercase text-xl mb-2">Got a question of your own?</p>
          <p className="text-sm text-gray-300 mb-4">
            Join the Collective to ask the community directly and unlock the full directory.
          </p>
          <Link
            href="/join"
            className="inline-block bg-coral text-black px-6 py-3 font-bold uppercase border-2 border-white neo-shadow hover:bg-white transition-colors"
          >
            Join Kindred Collective
          </Link>
        </div>
      </article>
    </div>
  )
}
