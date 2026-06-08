import { createHash } from 'crypto'
import type { AnonymisedMessage, MessageChunk } from './types'
import { CHUNK_TARGET_TOKENS, THREAD_GAP_MS } from './config'

/**
 * Stage 2a — group anonymised messages into token-bounded chunks for the
 * classification model. Chunks are built in chronological order; a chunk is
 * closed when it reaches the token budget, preferring to break on a >30min
 * conversation gap so a single thread stays within one chunk.
 *
 * Token counts are estimated (chars/4) to keep this offline-testable. This is
 * a sizing heuristic only; the model's real token accounting is what's billed.
 */

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

function chunkId(messages: AnonymisedMessage[]): string {
  const basis = messages.map((m) => m.sourceMessageHash).join('|')
  return createHash('sha256').update(basis).digest('hex').slice(0, 32)
}

export function chunkMessages(
  messages: AnonymisedMessage[],
  targetTokens: number = CHUNK_TARGET_TOKENS
): MessageChunk[] {
  const chunks: MessageChunk[] = []
  let buffer: AnonymisedMessage[] = []
  let bufferTokens = 0
  let prevTime: number | null = null

  const flush = () => {
    if (buffer.length === 0) return
    chunks.push({ id: chunkId(buffer), messages: buffer })
    buffer = []
    bufferTokens = 0
  }

  for (const m of messages) {
    const t = new Date(m.timestamp).getTime()
    const gap = prevTime != null ? t - prevTime : 0
    const tokens = estimateTokens(m.body) + 24 // overhead per message line

    // Close the chunk at the budget, preferring a natural thread boundary.
    if (buffer.length > 0 && (bufferTokens + tokens > targetTokens || (gap > THREAD_GAP_MS && bufferTokens > targetTokens * 0.6))) {
      flush()
    }

    buffer.push(m)
    bufferTokens += tokens
    prevTime = t
  }
  flush()

  return chunks
}
