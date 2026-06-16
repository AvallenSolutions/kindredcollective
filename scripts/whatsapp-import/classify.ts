import { extractStructured } from './anthropic'
import { MODELS } from './config'
import {
  ChunkClassificationSchema,
  SUPPLIER_CATEGORIES,
  type ChunkClassification,
  type MessageChunk,
} from './types'

/**
 * Stage 2b — bulk classification pass (cheap model). For each chunk of
 * anonymised messages, extract supplier/service recommendations, shared links,
 * and recurring-question candidates as structured JSON.
 */

const CLASSIFY_SYSTEM = `You analyse messages from a private WhatsApp group of UK drinks-industry founders (the "Kindred Collective"). The messages have already been anonymised: personal names, phone numbers and emails are replaced with [member]/[phone]/[email]. Company, brand and supplier names are kept — those are valuable.

From each batch of messages, extract three things:

1. recommendations — when someone recommends, endorses or warns about a SUPPLIER or SERVICE PROVIDER (e.g. a co-packer, importer, label printer, PR agency, distributor, law firm, designer). For each:
   - rawSupplierName: the company/service name exactly as written
   - category: one of ${SUPPLIER_CATEGORIES.join(', ')}
   - sentiment: positive | neutral | mixed
   - quoteSnippet: a SHORT anonymised paraphrase of what was said. Never include personal names.
   - sourceMessageHashes: the hashes of the source messages

2. linkMentions — useful URLs shared (articles, regulations, tools, guides). For each: url, a short contextTitle, a lowercase-hyphenated suggestedCategorySlug, and the sourceMessageHash.

3. questionCandidates — recurring, generally-useful QUESTIONS the community asks (regulation, route to market, packaging, logistics, funding, etc.). Rephrase generically with no names. Include topicGuess and relatedMessageHashes. Ignore pure chit-chat, logistics of meetups, and one-off personal questions.

Only extract genuinely useful, reusable knowledge. It is fine to return empty arrays. NEVER output a personal name in any field.

Each message is given as: <hash> [ISO timestamp] body`

function renderChunk(chunk: MessageChunk): string {
  return chunk.messages
    .map((m) => `${m.sourceMessageHash} [${m.timestamp}] ${m.body}`)
    .join('\n')
}

export async function classifyChunk(chunk: MessageChunk): Promise<ChunkClassification> {
  const { data } = await extractStructured<ChunkClassification>({
    key: `classify-${chunk.id}`,
    model: MODELS.CLASSIFY,
    system: CLASSIFY_SYSTEM,
    user: renderChunk(chunk),
    schema: ChunkClassificationSchema,
    schemaName: 'chunk_classification',
    maxTokens: 16000,
  })
  return {
    recommendations: data.recommendations ?? [],
    linkMentions: data.linkMentions ?? [],
    questionCandidates: data.questionCandidates ?? [],
  }
}
