import { createHash } from 'crypto'
import type { StructuredMessage } from './types'

/**
 * Stage 1 — parse a raw WhatsApp export (.txt) into StructuredMessage[].
 *
 * WhatsApp exports each message as:
 *   [DD/MM/YYYY, HH:MM:SS] Sender Name: message body
 * Multi-line messages continue on subsequent lines with no timestamp prefix.
 */

// Matches a message header line and captures date parts, sender and the first
// line of the body.
const LINE_RE =
  /^\[(\d{2})\/(\d{2})\/(\d{4}),\s(\d{2}):(\d{2}):(\d{2})\]\s([^:]+?):\s([\s\S]*)$/

// System / non-content lines to drop.
const SKIP_PATTERNS = [
  /Messages and calls are end-to-end encrypted/i,
  /\bcreated (this group|the group)\b/i,
  /\bchanged the group\b/i,
  /\bchanged this group's icon\b/i,
  /\badded you\b/i,
  /\bjoined (from the community|using this group's invite link)\b/i,
  /\bchanged their phone number\b/i,
  /\byou were added\b/i,
]

// Media placeholders WhatsApp inserts when media is excluded from the export.
const MEDIA_PLACEHOLDER_RE =
  /\b(image|video|audio|sticker|GIF|document|Contact card)\s+omitted\b/i

const URL_RE = /https?:\/\/[^\s]+/g

// Invisible directionality / control marks WhatsApp sprinkles into exports.
const CONTROL_MARKS_RE = /[‎‏‪-‮]/g

export function hashMessage(isoTimestamp: string, sender: string, body: string): string {
  return createHash('sha256').update(`${isoTimestamp}|${sender}|${body}`).digest('hex').slice(0, 32)
}

function extractUrls(body: string): string[] {
  const matches = body.match(URL_RE)
  if (!matches) return []
  // Strip trailing punctuation that often clings to pasted URLs.
  return matches.map((u) => u.replace(/[)\].,;]+$/, ''))
}

function buildDate(d: string, mo: string, y: string, h: string, mi: string, s: string): Date {
  // WhatsApp exports use DD/MM/YYYY. Construct as UTC for deterministic hashing.
  return new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s)))
}

function isSkippable(sender: string, body: string): boolean {
  const trimmed = body.trim()
  // A pure media placeholder (nothing else in the message) is dropped.
  if (MEDIA_PLACEHOLDER_RE.test(trimmed) && trimmed.replace(MEDIA_PLACEHOLDER_RE, '').trim() === '') {
    return true
  }
  return SKIP_PATTERNS.some((re) => re.test(`${sender}: ${body}`))
}

/**
 * Parse the full export text into structured messages. Lines that don't start
 * with a timestamp header are treated as continuations of the previous message.
 */
export function parseExport(raw: string): StructuredMessage[] {
  const lines = raw.split(/\r?\n/)
  const messages: StructuredMessage[] = []
  let current: { date: Date; sender: string; bodyLines: string[] } | null = null

  const commit = (entry: { date: Date; sender: string; bodyLines: string[] }) => {
    const sender = entry.sender.replace(CONTROL_MARKS_RE, '').trim()
    const body = entry.bodyLines.join('\n').replace(CONTROL_MARKS_RE, '').trim()
    if (!body) return
    if (isSkippable(sender, body)) return
    const iso = entry.date.toISOString()
    messages.push({
      sourceMessageHash: hashMessage(iso, sender, body),
      timestamp: entry.date,
      sender,
      body,
      urls: extractUrls(body),
    })
  }

  for (const line of lines) {
    const stripped = line.replace(/^[‎‏]/, '')
    const m = stripped.match(LINE_RE)
    if (m) {
      if (current) commit(current)
      const [, d, mo, y, h, mi, s, sender, firstLine] = m
      current = { date: buildDate(d, mo, y, h, mi, s), sender, bodyLines: [firstLine] }
    } else if (current) {
      current.bodyLines.push(line)
    }
    // Lines before the first header (rare) are ignored.
  }
  if (current) commit(current)

  return messages
}
