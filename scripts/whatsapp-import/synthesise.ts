import { createHash } from 'crypto'
import { extractStructured } from './anthropic'
import { KNOWLEDGE_CATEGORY_SLUGS, MODELS } from './config'
import {
  KnowledgeSynthesisSchema,
  type KnowledgeSynthesis,
  type QuestionCandidate,
} from './types'

/**
 * Stage 2c — answer synthesis pass. For each topic cluster, the model is given
 * the questions AND excerpts of the community's ACTUAL discussion, and writes a
 * specific answer grounded in what members really shared. Output is members-only,
 * so naming real suppliers/companies/contacts/tactics is wanted.
 */

export interface QuestionCluster {
  topic: string
  questions: string[]
  sourceMessageHashes: string[]
}

const SYNTH_SYSTEM = `You write internal, MEMBERS-ONLY knowledge-base entries for the Kindred Collective, a private community of UK drinks-industry founders.

You are given (a) the questions members asked on a topic and (b) excerpts from the community's ACTUAL WhatsApp discussions about it. Write the specific, practical answer the community actually gave.

Rules:
- GROUND the answer in the provided discussion excerpts. Preserve the specifics members shared: named suppliers, companies, products, tools, services, prices, lead times, contacts and concrete tactics. These specifics are the whole point — do NOT replace them with generic advice.
- Write as collective knowledge ("Members recommend…", "The usual route is…", "Several people warned…"). Don't attribute statements to a specific named member, and don't invent details that the excerpts don't support.
- The excerpts may contain unrelated chatter (group chats interleave topics). Use only what's relevant; ignore the rest.
- If the excerpts don't actually contain a useful answer, write a short honest note and set a LOW confidence (< 0.4) so it can be filtered out.
- This is internal to paying members, so being specific and naming names/companies is expected.

Output:
- canonicalQuestion: one clear question
- synthesisedAnswer: Markdown, formatted to be scannable. Start with a 1–2 sentence summary, then a bulleted list ("- " per line) of the specific options/recommendations, **bolding** the supplier/tool/tactic name at the start of each bullet (e.g. "- **Starling** — praised for ease of setup and Xero integration"). Finish with any caveats or warnings members raised. Ground everything in the excerpts.
- topicTags: 2–5 lowercase tags
- categorySlug: exactly one of: ${KNOWLEDGE_CATEGORY_SLUGS.join(', ')}
- confidence: 0–1`

export function clusterIdHash(cluster: QuestionCluster): string {
  const basis = [...cluster.sourceMessageHashes].sort().join('|')
  return createHash('sha256').update(basis).digest('hex').slice(0, 32)
}

export async function synthesiseCluster(
  cluster: QuestionCluster,
  discussion: string
): Promise<KnowledgeSynthesis> {
  const user = `TOPIC: ${cluster.topic}

QUESTIONS MEMBERS ASKED:
${cluster.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

ACTUAL COMMUNITY DISCUSSION (excerpts):
${discussion || '(no discussion captured)'}`

  // SYNTH_MODEL lets you trade quality for cost (e.g. claude-haiku-4-5).
  const model = process.env.SYNTH_MODEL || MODELS.SYNTHESISE
  const adaptiveThinking = !/haiku/i.test(model)

  const { data } = await extractStructured<KnowledgeSynthesis>({
    // "synth2" key: grounded-answer rework — intentionally busts the old
    // generic-answer cache. Omits the model so resumes reuse paid answers.
    key: `synth2-${clusterIdHash(cluster)}`,
    model,
    system: SYNTH_SYSTEM,
    user,
    schema: KnowledgeSynthesisSchema,
    schemaName: 'knowledge_synthesis',
    maxTokens: 16000,
    adaptiveThinking,
  })

  // Defend the category against an off-list value from the model.
  const categorySlug = KNOWLEDGE_CATEGORY_SLUGS.includes(data.categorySlug as any)
    ? data.categorySlug
    : 'general'

  return { ...data, categorySlug }
}

/** Helper exposed for the normalise stage to reference candidate shape. */
export type { QuestionCandidate }
