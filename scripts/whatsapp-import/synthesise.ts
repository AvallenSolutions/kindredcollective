import { createHash } from 'crypto'
import { extractStructured } from './anthropic'
import { KNOWLEDGE_CATEGORY_SLUGS, MODELS } from './config'
import {
  KnowledgeSynthesisSchema,
  type KnowledgeSynthesis,
  type QuestionCandidate,
} from './types'

/**
 * Stage 2c — answer synthesis pass (strong model). Runs only on CLUSTERED
 * question candidates (a few hundred), turning a messy set of related questions
 * into one clean, anonymised Q&A entry. Adaptive thinking is enabled because
 * synthesising a good answer from fragmentary chat is a non-trivial task.
 */

export interface QuestionCluster {
  topic: string
  questions: string[]
  sourceMessageHashes: string[]
}

const SYNTH_SYSTEM = `You write entries for "Ask the Collective", a public knowledge base distilled from years of a UK drinks-industry founders' community. You are given a cluster of related questions that members have asked over time (already anonymised).

Produce ONE canonical knowledge entry:
- canonicalQuestion: a single clear question capturing what people want to know
- synthesisedAnswer: a genuinely helpful, practical answer aimed at a UK drinks founder. Write 2–5 short paragraphs or a tight bulleted list. Base it on widely-understood industry practice; do not invent specific figures, prices or named individuals. If the topic is genuinely ambiguous or you cannot give a useful general answer, say so briefly and set a low confidence.
- topicTags: 2–5 lowercase tags
- categorySlug: exactly one of: ${KNOWLEDGE_CATEGORY_SLUGS.join(', ')}
- confidence: 0–1, how confident you are this is an accurate, useful, evergreen entry

NEVER include any personal name. The answer is public-facing, so keep it professional and free of private details.`

export function clusterIdHash(cluster: QuestionCluster): string {
  const basis = [...cluster.sourceMessageHashes].sort().join('|')
  return createHash('sha256').update(basis).digest('hex').slice(0, 32)
}

export async function synthesiseCluster(cluster: QuestionCluster): Promise<KnowledgeSynthesis> {
  const user = `Topic: ${cluster.topic}\n\nQuestions asked by members:\n${cluster.questions
    .map((q, i) => `${i + 1}. ${q}`)
    .join('\n')}`

  const { data } = await extractStructured<KnowledgeSynthesis>({
    key: `synth-${clusterIdHash(cluster)}`,
    model: MODELS.SYNTHESISE,
    system: SYNTH_SYSTEM,
    user,
    schema: KnowledgeSynthesisSchema,
    schemaName: 'knowledge_synthesis',
    maxTokens: 16000,
    adaptiveThinking: true,
  })

  // Defend the category against an off-list value from the model.
  const categorySlug = KNOWLEDGE_CATEGORY_SLUGS.includes(data.categorySlug as any)
    ? data.categorySlug
    : 'general'

  return { ...data, categorySlug }
}

/** Helper exposed for the normalise stage to reference candidate shape. */
export type { QuestionCandidate }
