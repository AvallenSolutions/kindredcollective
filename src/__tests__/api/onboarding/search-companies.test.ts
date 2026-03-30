import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────
vi.mock('@/lib/auth/session', () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: 'user-1', email: 'test@example.com', role: 'MEMBER' }),
}))

let selectResults: Record<string, { data: unknown; error: unknown }>
let inResults: Array<{ data: unknown; error: unknown }>
let inCallIndex: number

function createSearchMock() {
  inCallIndex = 0
  let currentTable = ''

  const chain: Record<string, ReturnType<typeof vi.fn>> = {}

  chain.from = vi.fn().mockImplementation((table: string) => {
    currentTable = table
    return chain
  })

  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.ilike = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockReturnValue(chain)

  chain.limit = vi.fn().mockImplementation(() => {
    const result = selectResults[currentTable]
    if (result) return Promise.resolve(result)
    return Promise.resolve({ data: [], error: null })
  })

  chain.in = vi.fn().mockImplementation(() => {
    const result = inResults[inCallIndex] || { data: [], error: null }
    inCallIndex++
    return Promise.resolve(result)
  })

  chain.single = vi.fn().mockResolvedValue({ data: null, error: null })

  return chain
}

let mockSupabase: ReturnType<typeof createSearchMock>

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockSupabase,
}))

// ── Import ───────────────────────────────────────────────────────────
import { GET } from '@/app/api/onboarding/search-companies/route'
import { NextRequest } from 'next/server'

function makeRequest(query: string) {
  return new NextRequest(`http://localhost/api/onboarding/search-companies?q=${encodeURIComponent(query)}`)
}

// ── Tests ────────────────────────────────────────────────────────────

describe('GET /api/onboarding/search-companies', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array when query is too short', async () => {
    mockSupabase = createSearchMock()
    selectResults = {}
    inResults = []

    const res = await GET(makeRequest('a'))
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.companies).toEqual([])
  })

  it('returns empty array when query is empty', async () => {
    mockSupabase = createSearchMock()
    selectResults = {}
    inResults = []

    const res = await GET(new NextRequest('http://localhost/api/onboarding/search-companies'))
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.companies).toEqual([])
  })

  it('returns brands and suppliers combined and sorted alphabetically', async () => {
    mockSupabase = createSearchMock()
    selectResults = {
      Brand: {
        data: [
          { id: 'b1', name: 'Acme Spirits', slug: 'acme', category: 'SPIRITS', description: null, logoUrl: null },
        ],
        error: null,
      },
      Supplier: {
        data: [
          { id: 's1', companyName: 'Acme Packaging', slug: 'acme-pkg', category: 'PACKAGING', description: 'Packing stuff', logoUrl: null, claimStatus: 'UNCLAIMED' },
        ],
        error: null,
      },
    }
    inResults = [
      { data: [], error: null }, // brand orgs
      { data: [], error: null }, // supplier orgs
    ]

    const res = await GET(makeRequest('acme'))
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.companies.length).toBe(2)
    // Sorted alphabetically: Acme Packaging before Acme Spirits
    expect(json.companies[0].name).toBe('Acme Packaging')
    expect(json.companies[0].type).toBe('SUPPLIER')
    expect(json.companies[1].name).toBe('Acme Spirits')
    expect(json.companies[1].type).toBe('BRAND')
  })

  it('normalises supplier companyName to name field', async () => {
    mockSupabase = createSearchMock()
    selectResults = {
      Brand: { data: [], error: null },
      Supplier: {
        data: [
          { id: 's2', companyName: 'TestSupplier', slug: 'test', category: 'DESIGN', description: null, logoUrl: null, claimStatus: 'CLAIMED' },
        ],
        error: null,
      },
    }
    inResults = [
      { data: [], error: null },
    ]

    const res = await GET(makeRequest('test'))
    const json = await res.json()

    expect(json.companies[0].name).toBe('TestSupplier')
    expect(json.companies[0].type).toBe('SUPPLIER')
  })

  it('includes hasOwner=true when organisation has an OWNER member', async () => {
    mockSupabase = createSearchMock()
    selectResults = {
      Brand: {
        data: [
          { id: 'b-owned', name: 'OwnedBrand', slug: 'owned', category: 'BEER', description: null, logoUrl: null },
        ],
        error: null,
      },
      Supplier: { data: [], error: null },
    }
    inResults = [
      // Brand orgs — return org with OWNER member
      { data: [{ brandId: 'b-owned', members: [{ role: 'OWNER' }] }], error: null },
      // Supplier orgs
      { data: [], error: null },
    ]

    const res = await GET(makeRequest('owned'))
    const json = await res.json()

    expect(json.companies[0].hasOwner).toBe(true)
  })

  it('includes hasOwner=false when no OWNER member exists', async () => {
    mockSupabase = createSearchMock()
    selectResults = {
      Brand: {
        data: [
          { id: 'b-unowned', name: 'UnownedBrand', slug: 'unowned', category: 'WINE', description: null, logoUrl: null },
        ],
        error: null,
      },
      Supplier: { data: [], error: null },
    }
    inResults = [
      // Brand orgs — org exists but only has MEMBER, no OWNER
      { data: [{ brandId: 'b-unowned', members: [{ role: 'MEMBER' }] }], error: null },
      { data: [], error: null },
    ]

    const res = await GET(makeRequest('unowned'))
    const json = await res.json()

    expect(json.companies[0].hasOwner).toBe(false)
  })
})
