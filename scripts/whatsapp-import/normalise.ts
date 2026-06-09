import type { QuestionCandidate } from './types'
import type { QuestionCluster } from './synthesise'

/**
 * Stage 3 — normalisation, deduplication and clustering (all pure functions,
 * unit-testable without a DB).
 */

// ---- Supplier name normalisation & matching ----

export function normaliseSupplierName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\b(ltd|limited|llp|plc|co|inc|the)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const prev = new Array(n + 1)
  for (let j = 0; j <= n; j++) prev[j] = j
  for (let i = 1; i <= m; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= n; j++) {
      const tmp = prev[j]
      prev[j] = Math.min(
        prev[j] + 1,
        prev[j - 1] + 1,
        diag + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
      diag = tmp
    }
  }
  return prev[n]
}

export interface SupplierRef {
  id: string
  companyName: string
  slug: string
}

/**
 * Match a raw supplier mention to an existing supplier. Returns the id, or null
 * if no confident match (the endorsement is then stored as an unmatched mention
 * for admin review — we never auto-create suppliers).
 */
export function matchSupplier(rawName: string, suppliers: SupplierRef[]): string | null {
  const target = normaliseSupplierName(rawName)
  if (!target) return null
  let best: { id: string; score: number } | null = null
  for (const s of suppliers) {
    const cand = normaliseSupplierName(s.companyName)
    if (!cand) continue
    if (cand === target) return s.id
    // Containment (e.g. "lcb" vs "london city bond") or close edit distance.
    const longer = Math.max(cand.length, target.length)
    const dist = levenshtein(cand, target)
    const similarity = 1 - dist / longer
    const contains = cand.includes(target) || target.includes(cand)
    const score = contains ? Math.max(similarity, 0.9) : similarity
    if (score >= 0.85 && (!best || score > best.score)) best = { id: s.id, score }
  }
  return best?.id ?? null
}

// ---- URL canonicalisation & dedup ----

const TRACKING_PARAMS = /^(utm_|fbclid|gclid|mc_|ref$|igshid)/i

export function canonicaliseUrl(url: string): string {
  try {
    const u = new URL(url.trim())
    u.hash = ''
    u.pathname = u.pathname.replace(/\/+$/, '') // drop trailing slash from path
    const keep = new URLSearchParams()
    u.searchParams.forEach((v, k) => {
      if (!TRACKING_PARAMS.test(k)) keep.set(k, v)
    })
    u.search = keep.toString()
    return u.toString().replace(/\/$/, '')
  } catch {
    return url.trim().replace(/\/$/, '')
  }
}

// ---- Slugs ----

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/** Ensure slug uniqueness within a run by appending -2, -3, … on collision. */
export function uniqueSlug(base: string, taken: Set<string>): string {
  let slug = base || 'entry'
  let n = 2
  while (taken.has(slug)) {
    slug = `${base}-${n++}`
  }
  taken.add(slug)
  return slug
}

// ---- Question clustering ----

const QUESTION_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'to', 'of', 'for', 'in', 'on', 'is', 'are', 'do',
  'does', 'can', 'anyone', 'any', 'has', 'have', 'how', 'what', 'who', 'with', 'i',
  'we', 'you', 'my', 'our', 'best', 'good', 'know', 'recommend', 'use', 'using',
])

function keywords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !QUESTION_STOPWORDS.has(w))
  )
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let inter = 0
  a.forEach((x) => {
    if (b.has(x)) inter++
  })
  return inter / (a.size + b.size - inter)
}

/**
 * Greedy clustering of question candidates by keyword overlap of topic+question.
 * Merges the ~thousands of raw questions into a few hundred canonical clusters
 * before the (expensive) synthesis pass.
 */
export function clusterQuestions(
  candidates: QuestionCandidate[],
  threshold = 0.5
): QuestionCluster[] {
  const clusters: { kw: Set<string>; topics: Set<string>; cluster: QuestionCluster }[] = []

  for (const c of candidates) {
    const kw = keywords(`${c.topicGuess} ${c.questionText}`)
    const topicKey = c.topicGuess.toLowerCase().trim()
    // Merge if the normalised topic matches exactly, or keyword overlap is high.
    let target = clusters.find((cl) => cl.topics.has(topicKey) || jaccard(cl.kw, kw) >= threshold)
    if (!target) {
      target = { kw: new Set(kw), topics: new Set([topicKey]), cluster: { topic: c.topicGuess, questions: [], sourceMessageHashes: [] } }
      clusters.push(target)
    } else {
      kw.forEach((k) => target!.kw.add(k))
      target.topics.add(topicKey)
    }
    target.cluster.questions.push(c.questionText)
    target.cluster.sourceMessageHashes.push(...c.relatedMessageHashes)
  }

  // De-dup questions and hashes within each cluster.
  return clusters.map(({ cluster }) => ({
    topic: cluster.topic,
    questions: Array.from(new Set(cluster.questions)),
    sourceMessageHashes: Array.from(new Set(cluster.sourceMessageHashes)),
  }))
}
