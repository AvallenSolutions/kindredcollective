import { describe, it, expect } from 'vitest'
import { parseExport, hashMessage } from '../parse'

describe('parseExport', () => {
  it('parses a single message with correct timestamp, sender and body', () => {
    const msgs = parseExport('[01/02/2023, 14:30:05] Jane Doe: hello world')
    expect(msgs).toHaveLength(1)
    expect(msgs[0].sender).toBe('Jane Doe')
    expect(msgs[0].body).toBe('hello world')
    expect(msgs[0].timestamp.toISOString()).toBe('2023-02-01T14:30:05.000Z')
  })

  it('merges multi-line continuations into one message', () => {
    const raw = ['[01/02/2023, 14:30:05] Jane Doe: line one', 'line two', 'line three'].join('\n')
    const msgs = parseExport(raw)
    expect(msgs).toHaveLength(1)
    expect(msgs[0].body).toBe('line one\nline two\nline three')
  })

  it('skips system lines and media placeholders', () => {
    const raw = [
      '[21/05/2018, 07:41:32] KINDRED SPIRITS: ‎Messages and calls are end-to-end encrypted.',
      '[21/05/2018, 07:41:32] Geo Frost: ‎Geo Frost created this group',
      '[21/05/2018, 07:42:00] Geo Frost: ‎image omitted',
      '[21/05/2018, 07:43:00] Geo Frost: a real message',
    ].join('\n')
    const msgs = parseExport(raw)
    expect(msgs).toHaveLength(1)
    expect(msgs[0].body).toBe('a real message')
  })

  it('produces a stable, deterministic hash and varies it on body change', () => {
    const a = parseExport('[01/02/2023, 14:30:05] Jane Doe: hello')
    const b = parseExport('[01/02/2023, 14:30:05] Jane Doe: hello')
    const c = parseExport('[01/02/2023, 14:30:05] Jane Doe: hello!')
    expect(a[0].sourceMessageHash).toBe(b[0].sourceMessageHash)
    expect(a[0].sourceMessageHash).not.toBe(c[0].sourceMessageHash)
    expect(a[0].sourceMessageHash).toBe(hashMessage('2023-02-01T14:30:05.000Z', 'Jane Doe', 'hello'))
  })

  it('extracts URLs from a message body, stripping trailing punctuation', () => {
    const msgs = parseExport('[01/02/2023, 14:30:05] Jane Doe: see https://example.com/page).')
    expect(msgs[0].urls).toEqual(['https://example.com/page'])
  })
})
