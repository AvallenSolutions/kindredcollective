/**
 * Pipeline configuration: model IDs, pricing, chunking, cost guard, and the
 * knowledge taxonomy the pipeline assigns entries to.
 */

// Cheap model for the high-volume classification pass; strong model for answer
// synthesis. See the Claude API skill for the rationale.
export const MODELS = {
  CLASSIFY: 'claude-haiku-4-5',
  SYNTHESISE: 'claude-opus-4-8',
} as const

// USD per 1M tokens. Cache write = 1.25x input, cache read = 0.1x input.
export const PRICING: Record<
  string,
  { input: number; output: number; cacheWrite: number; cacheRead: number }
> = {
  'claude-haiku-4-5': { input: 1, output: 5, cacheWrite: 1.25, cacheRead: 0.1 },
  'claude-opus-4-8': { input: 5, output: 25, cacheWrite: 6.25, cacheRead: 0.5 },
}

// Target input size per classification chunk (tokens, estimated). Comfortably
// under Haiku's 200K window — kept small to localise conversation context and
// bound per-call cost/latency.
export const CHUNK_TARGET_TOKENS = 12000

// A gap larger than this between consecutive messages starts a new chunk
// boundary where possible (keeps a conversation thread within one chunk).
export const THREAD_GAP_MS = 30 * 60 * 1000

// Hard spend ceiling. The run aborts before a call that would exceed it.
export const MAX_SPEND_USD = Number(process.env.WHATSAPP_IMPORT_MAX_SPEND_USD || 25)

// System author + categories the pipeline depends on (created by seed-knowledge.ts).
export const SYSTEM_USER_EMAIL = 'system@kindredcollective.co.uk'
export const COMMUNITY_LINKS_CATEGORY_SLUG = 'community-links'

// Knowledge base taxonomy, grounded in the recurring topics in the chat.
export const KNOWLEDGE_CATEGORIES = [
  { slug: 'regulation-compliance', name: 'Regulation & Compliance', color: '#FF6B6B' },
  { slug: 'route-to-market', name: 'Route to Market', color: '#00D9FF' },
  { slug: 'production-packaging', name: 'Production & Packaging', color: '#A3E635' },
  { slug: 'logistics-export', name: 'Logistics & Export', color: '#FBBF24' },
  { slug: 'sales-marketing-pr', name: 'Sales, Marketing & PR', color: '#F472B6' },
  { slug: 'funding-finance', name: 'Funding & Finance', color: '#34D399' },
  { slug: 'sustainability', name: 'Sustainability', color: '#4ADE80' },
  { slug: 'people-suppliers', name: 'People & Suppliers', color: '#818CF8' },
  { slug: 'general', name: 'General', color: '#94A3B8' },
] as const

export const KNOWLEDGE_CATEGORY_SLUGS = KNOWLEDGE_CATEGORIES.map((c) => c.slug)
