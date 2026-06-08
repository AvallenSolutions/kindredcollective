import Link from 'next/link'
import { MessageSquare, ThumbsUp } from 'lucide-react'

export interface KnowledgeCardData {
  slug: string
  question: string
  answer: string
  topicTags: string[]
  sourceCount: number
  helpfulCount: number
  category?: { name: string; color: string } | null
}

export function KnowledgeCard({ entry }: { entry: KnowledgeCardData }) {
  return (
    <Link href={`/knowledge/${entry.slug}`}>
      <div className="group bg-white border-2 border-black p-5 h-full flex flex-col hover:bg-gray-50 transition-colors neo-shadow-hover cursor-pointer">
        <div className="flex items-start justify-between gap-3 mb-3">
          {entry.category && (
            <span
              className="px-2 py-0.5 border border-black text-[10px] font-bold uppercase shrink-0"
              style={{ backgroundColor: entry.category.color + '33' }}
            >
              {entry.category.name}
            </span>
          )}
          {entry.sourceCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-400 shrink-0">
              <MessageSquare className="w-3 h-3" />
              {entry.sourceCount} {entry.sourceCount === 1 ? 'discussion' : 'discussions'}
            </span>
          )}
        </div>

        <h3 className="font-display font-bold text-lg uppercase leading-tight mb-2 group-hover:text-coral transition-colors line-clamp-3">
          {entry.question}
        </h3>

        <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">{entry.answer}</p>

        {entry.topicTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {entry.topicTags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 bg-gray-100 border border-gray-300 text-[10px] font-bold uppercase"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {entry.helpfulCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500 pt-3 border-t border-gray-200">
            <ThumbsUp className="w-3 h-3" />
            <span className="font-bold">{entry.helpfulCount}</span> found this helpful
          </div>
        )}
      </div>
    </Link>
  )
}
