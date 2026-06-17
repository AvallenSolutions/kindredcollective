import { describe, it, expect } from 'vitest'
import { anonymiseMessages, buildNameSet, containsPII, fullNamesOnly, scrubOutput } from '../anonymise'
import { parseExport } from '../parse'

describe('anonymise', () => {
  const raw = [
    '[01/02/2023, 09:00:00] Jane Doe: anyone recommend a co-packer?',
    '[01/02/2023, 09:05:00] Bob Smith: try Saverglass, great service. Call me on +44 7764 585318',
    '[01/02/2023, 09:06:00] Bob Smith: or email bob@example.com',
  ].join('\n')

  const messages = parseExport(raw)
  const nameSet = buildNameSet(messages.map((m) => m.sender))

  it('strips the sender field entirely (AI never sees names)', () => {
    const anon = anonymiseMessages(messages, nameSet)
    expect(anon[0]).not.toHaveProperty('sender')
  })

  it('redacts phone numbers, emails and member names but keeps company names', () => {
    const anon = anonymiseMessages(messages, nameSet)
    const joined = anon.map((m) => m.body).join('\n')
    expect(joined).not.toContain('+44 7764 585318')
    expect(joined).not.toContain('bob@example.com')
    expect(joined).not.toContain('Bob')
    expect(joined).not.toContain('Jane')
    expect(joined).toContain('Saverglass') // company names preserved — they are the value
  })

  it('containsPII catches a member name echoed in synthesised output', () => {
    expect(containsPII('Bob said the co-packer was great', nameSet)).toBe(true)
    expect(containsPII('A member recommended a great co-packer', nameSet)).toBe(false)
  })

  it('containsPII catches emails and phone numbers', () => {
    expect(containsPII('reach them at hi@firm.com', nameSet)).toBe(true)
    expect(containsPII('call +44 7700 900123 today', nameSet)).toBe(true)
  })

  it('scrubOutput redacts residual PII', () => {
    expect(scrubOutput('Bob recommends them', nameSet)).toContain('[member]')
  })

  it('fullNamesOnly avoids false positives on common-word names but catches full names', () => {
    // Add a member whose name is a common English word.
    const set = buildNameSet(['Will May', 'Jane Doe'])
    const strong = fullNamesOnly(set)
    // Clean answer containing the common words "will"/"may" must NOT be flagged.
    expect(containsPII('You will need a licence and may apply in May', strong)).toBe(false)
    // A genuine full-name leak IS still caught.
    expect(containsPII('This was recommended by Will May at the meetup', strong)).toBe(true)
    expect(containsPII('Jane Doe can help', strong)).toBe(true)
  })
})
