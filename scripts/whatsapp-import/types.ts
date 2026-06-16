import { z } from 'zod/v4'

/**
 * Shared types and Zod schemas for the WhatsApp import pipeline.
 *
 * The schemas double as (a) runtime validation of AI output and (b) the
 * structured-output format passed to the Claude API via zodOutputFormat.
 */

// A single parsed chat message. `sourceMessageHash` is deterministic and is the
// backbone of pipeline idempotency — re-running on an overlapping export
// produces identical hashes, so duplicates are trivially detected.
export interface StructuredMessage {
  sourceMessageHash: string
  timestamp: Date
  sender: string
  body: string
  urls: string[]
}

// What the AI is allowed to see: the `sender` field is stripped entirely so no
// personal names leave for the API. Anonymisation is enforced again on output.
export interface AnonymisedMessage {
  sourceMessageHash: string
  timestamp: string // ISO 8601
  body: string
  urls: string[]
}

// A chunk of anonymised messages sent to the classification model in one call.
export interface MessageChunk {
  id: string // deterministic hash of the chunk contents (for disk caching)
  messages: AnonymisedMessage[]
}

// SupplierCategory enum values — kept in sync with prisma/schema.prisma.
export const SUPPLIER_CATEGORIES = [
  'PACKAGING',
  'INGREDIENTS',
  'LOGISTICS',
  'CO_PACKING',
  'DESIGN',
  'MARKETING',
  'EQUIPMENT',
  'CONSULTING',
  'LEGAL',
  'FINANCE',
  'DISTRIBUTION',
  'RECRUITMENT',
  'SOFTWARE',
  'SUSTAINABILITY',
  'PR',
  'PHOTOGRAPHY',
  'WEB_DEVELOPMENT',
  'OTHER',
] as const

export type SupplierCategory = (typeof SUPPLIER_CATEGORIES)[number]

// ============= AI OUTPUT SCHEMAS =============

export const RecommendationSchema = z.object({
  rawSupplierName: z.string().describe('Company/service name exactly as mentioned in the chat'),
  category: z.enum(SUPPLIER_CATEGORIES),
  sentiment: z.enum(['positive', 'neutral', 'mixed']),
  quoteSnippet: z
    .string()
    .describe('A short, anonymised paraphrase of what was said about them. NO personal names.'),
  sourceMessageHashes: z.array(z.string()).describe('Hashes of the messages this came from'),
})
export type ExtractedRecommendation = z.infer<typeof RecommendationSchema>

export const LinkMentionSchema = z.object({
  url: z.string(),
  contextTitle: z.string().describe('A short human title describing what the link is'),
  suggestedCategorySlug: z.string().describe('A lowercase-hyphenated topic slug for the link'),
  sourceMessageHash: z.string(),
})
export type ClassifiedLink = z.infer<typeof LinkMentionSchema>

export const QuestionCandidateSchema = z.object({
  questionText: z.string().describe('The question being asked, rephrased generically with no names'),
  topicGuess: z.string().describe('A short topic label, e.g. "HMRC duty" or "retail listings"'),
  relatedMessageHashes: z.array(z.string()),
})
export type QuestionCandidate = z.infer<typeof QuestionCandidateSchema>

export const ChunkClassificationSchema = z.object({
  recommendations: z.array(RecommendationSchema).default([]),
  linkMentions: z.array(LinkMentionSchema).default([]),
  questionCandidates: z.array(QuestionCandidateSchema).default([]),
})
export type ChunkClassification = z.infer<typeof ChunkClassificationSchema>

export const KnowledgeSynthesisSchema = z.object({
  canonicalQuestion: z.string().describe('A single clear, anonymised question representing the cluster'),
  synthesisedAnswer: z
    .string()
    .describe('A helpful, anonymised answer synthesised from the community discussion. NO personal names.'),
  topicTags: z.array(z.string()).describe('Lowercase topic tags'),
  categorySlug: z.string().describe('One of the provided knowledge category slugs'),
  confidence: z.number().min(0).max(1).describe('Confidence that this is an accurate, useful entry'),
})
export type KnowledgeSynthesis = z.infer<typeof KnowledgeSynthesisSchema>
