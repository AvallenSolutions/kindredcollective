import { describe, it, expect } from 'vitest'
import {
  canonicaliseUrl,
  clusterQuestions,
  matchSupplier,
  normaliseSupplierName,
  slugify,
  uniqueSlug,
  type SupplierRef,
} from '../normalise'

describe('supplier matching', () => {
  const suppliers: SupplierRef[] = [
    { id: 's1', companyName: 'London City Bond Ltd', slug: 'london-city-bond-ltd' },
    { id: 's2', companyName: 'Saverglass', slug: 'saverglass' },
  ]

  it('normalises company names (strips Ltd, punctuation, case)', () => {
    expect(normaliseSupplierName('London City Bond Ltd')).toBe('london city bond')
    expect(normaliseSupplierName('SAVERGLASS')).toBe('saverglass')
  })

  it('matches exact and near-name variants to the same supplier', () => {
    expect(matchSupplier('London City Bond', suppliers)).toBe('s1')
    expect(matchSupplier('london city bond ltd', suppliers)).toBe('s1')
    expect(matchSupplier('Saverglass', suppliers)).toBe('s2')
  })

  it('returns null for an unknown supplier (becomes an unmatched mention)', () => {
    expect(matchSupplier('Some Random Co We Have Never Heard Of', suppliers)).toBeNull()
  })
})

describe('url canonicalisation', () => {
  it('strips tracking params and trailing slash; dedups variants', () => {
    const a = canonicaliseUrl('https://example.com/article/?utm_source=wa&id=5')
    const b = canonicaliseUrl('https://example.com/article/?id=5')
    expect(a).toBe('https://example.com/article?id=5')
    expect(a).toBe(b)
  })
})

describe('slugs', () => {
  it('slugifies and de-duplicates', () => {
    expect(slugify('How do I get a Waitrose listing?')).toBe('how-do-i-get-a-waitrose-listing')
    const taken = new Set<string>()
    expect(uniqueSlug('abc', taken)).toBe('abc')
    expect(uniqueSlug('abc', taken)).toBe('abc-2')
  })
})

describe('question clustering', () => {
  it('groups questions about the same topic together', () => {
    const clusters = clusterQuestions([
      { questionText: 'How do I get listed in Waitrose?', topicGuess: 'retail listings', relatedMessageHashes: ['h1'] },
      { questionText: 'What is the Waitrose range review process?', topicGuess: 'retail listings', relatedMessageHashes: ['h2'] },
      { questionText: 'Which haulier delivers to Europe from a bonded warehouse?', topicGuess: 'export logistics', relatedMessageHashes: ['h3'] },
    ])
    // The two Waitrose questions cluster; the logistics one is separate.
    const waitrose = clusters.find((c) => c.questions.some((q) => q.includes('Waitrose')))
    expect(waitrose?.questions.length).toBe(2)
    expect(clusters.length).toBe(2)
  })
})
