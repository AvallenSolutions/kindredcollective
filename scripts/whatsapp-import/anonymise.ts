import type { AnonymisedMessage, StructuredMessage } from './types'

/**
 * Stage 1.5 — anonymisation, enforced twice (defence-in-depth):
 *  1. BEFORE the AI: the `sender` field is dropped entirely (the AI never sees
 *     names), and bodies have phone numbers, emails, @mentions and known member
 *     names redacted. Supplier/company names are intentionally KEPT — they are
 *     the value that maps to the directory.
 *  2. AFTER the AI: `containsPII` re-scans synthesised text/quotes so a name the
 *     model echoed from context can be caught and the record dropped/redacted.
 */

const PHONE_RE = /(?:\+?\d[\d\s()–\-]{7,}\d)/g
const EMAIL_RE = /[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g
const MENTION_RE = /@⁨?[^⁩\n]+⁩?/g // WhatsApp wraps @mentions in FSI/PDI marks

// Tokens that look like names but are common words — never treat as PII.
const STOPWORDS = new Set([
  'The', 'And', 'For', 'Are', 'You', 'All', 'Hey', 'Hi', 'Yes', 'Thanks', 'Cheers',
  'Good', 'Morning', 'Happy', 'New', 'Year', 'Group', 'Main', 'Feed', 'General',
])

/**
 * Build the set of personal-name tokens to redact. Sources:
 *  - the chat's own sender names (these ARE the members)
 *  - any extra names loaded from the DB (Member names, supplier contact names)
 *
 * We collect both full "First Last" strings and individual capitalised tokens.
 */
export function buildNameSet(senders: string[], extraNames: string[] = []): Set<string> {
  const set = new Set<string>()
  const add = (name: string) => {
    const clean = name.replace(/[~+]/g, '').trim()
    if (!clean) return
    // Skip phone-number "senders" (e.g. "+44 7764 585318").
    if (/\d/.test(clean)) return
    set.add(clean)
    for (const token of clean.split(/\s+/)) {
      if (token.length >= 3 && /^[A-Z][a-zA-Z'\-]+$/.test(token) && !STOPWORDS.has(token)) {
        set.add(token)
      }
    }
  }
  senders.forEach(add)
  extraNames.forEach(add)
  return set
}

function buildNameRegex(nameSet: Set<string>): RegExp | null {
  const names = Array.from(nameSet).sort((a, b) => b.length - a.length) // longest first
  if (names.length === 0) return null
  const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return new RegExp(`\\b(?:${escaped.join('|')})\\b`, 'g')
}

/** Redact phones, emails, @mentions and known names from a single string. */
export function redactBody(body: string, nameRegex: RegExp | null): string {
  let out = body
    .replace(EMAIL_RE, '[email]')
    .replace(MENTION_RE, '[member]')
    .replace(PHONE_RE, '[phone]')
  if (nameRegex) out = out.replace(nameRegex, '[member]')
  return out
}

/** Strip senders and redact bodies. The returned objects are AI-safe. */
export function anonymiseMessages(
  messages: StructuredMessage[],
  nameSet: Set<string>
): AnonymisedMessage[] {
  const nameRegex = buildNameRegex(nameSet)
  return messages.map((m) => ({
    sourceMessageHash: m.sourceMessageHash,
    timestamp: m.timestamp.toISOString(),
    body: redactBody(m.body, nameRegex),
    urls: m.urls,
  }))
}

/**
 * Post-filter: returns true if `text` still contains anything that looks like
 * PII (a phone, an email, or a known member name). Used to quarantine/redact
 * AI output before it is persisted.
 */
export function containsPII(text: string, nameSet: Set<string>): boolean {
  // Use fresh, non-global regexes: `.test()` on a /g regex is stateful.
  if (new RegExp(EMAIL_RE.source).test(text)) return true
  if (new RegExp(PHONE_RE.source).test(text)) return true
  const names = Array.from(nameSet)
  if (names.length === 0) return false
  const escaped = names
    .sort((a, b) => b.length - a.length)
    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return new RegExp(`\\b(?:${escaped.join('|')})\\b`).test(text)
}

/** Best-effort scrub of AI output: redact any residual PII. */
export function scrubOutput(text: string, nameSet: Set<string>): string {
  return redactBody(text, buildNameRegex(nameSet))
}
