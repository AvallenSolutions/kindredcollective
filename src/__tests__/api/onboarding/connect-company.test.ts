import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks (vi.mock factories are hoisted — no outer variable refs) ───
vi.mock('@/lib/auth/session', () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: 'user-1', email: 'test@example.com', role: 'MEMBER' }),
}))

// Tracking mock
interface MockCall {
  table: string
  method: string
  args?: unknown[]
}

let mockCalls: MockCall[] = []
let singleCallIndex: number
let singleResponses: Array<{ data: unknown; error: unknown }>

function createTrackingMock() {
  singleCallIndex = 0
  mockCalls = []

  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  let currentTable = ''

  chain.from = vi.fn().mockImplementation((table: string) => {
    currentTable = table
    mockCalls.push({ table, method: 'from' })
    return chain
  })

  chain.select = vi.fn().mockImplementation((...args: unknown[]) => {
    mockCalls.push({ table: currentTable, method: 'select', args })
    return chain
  })

  chain.insert = vi.fn().mockImplementation((...args: unknown[]) => {
    mockCalls.push({ table: currentTable, method: 'insert', args })
    return chain
  })

  chain.update = vi.fn().mockImplementation((...args: unknown[]) => {
    mockCalls.push({ table: currentTable, method: 'update', args })
    return chain
  })

  chain.upsert = vi.fn().mockImplementation((...args: unknown[]) => {
    mockCalls.push({ table: currentTable, method: 'upsert', args })
    return chain
  })

  chain.eq = vi.fn().mockReturnValue(chain)
  chain.limit = vi.fn().mockReturnValue(chain)

  chain.single = vi.fn().mockImplementation(() => {
    const response = singleResponses[singleCallIndex] || { data: null, error: null }
    singleCallIndex++
    return Promise.resolve(response)
  })

  return chain
}

let mockSupabase: ReturnType<typeof createTrackingMock>

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockSupabase,
}))

// ── Import ───────────────────────────────────────────────────────────
import { POST } from '@/app/api/onboarding/connect-company/route'
import { NextRequest } from 'next/server'

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/onboarding/connect-company', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

// ── Tests ────────────────────────────────────────────────────────────

describe('POST /api/onboarding/connect-company', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCalls = []
    singleCallIndex = 0
  })

  it('returns 400 when companyId or companyType is missing', async () => {
    mockSupabase = createTrackingMock()
    singleResponses = []

    const res = await POST(makeRequest({ companyId: 'abc' }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe('Company ID and type are required')
  })

  it('returns 400 for invalid companyType', async () => {
    mockSupabase = createTrackingMock()
    singleResponses = []

    const res = await POST(makeRequest({ companyId: 'abc', companyType: 'INVALID' }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe('Invalid company type')
  })

  it('returns 404 when brand does not exist', async () => {
    mockSupabase = createTrackingMock()
    singleResponses = [
      { data: null, error: { code: 'PGRST116' } },
    ]

    const res = await POST(makeRequest({ companyId: 'x', companyType: 'BRAND' }))
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json.error).toBe('Brand not found')
  })

  it('returns 404 when supplier does not exist', async () => {
    mockSupabase = createTrackingMock()
    singleResponses = [
      { data: null, error: { code: 'PGRST116' } },
    ]

    const res = await POST(makeRequest({ companyId: 'x', companyType: 'SUPPLIER' }))
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json.error).toBe('Supplier not found')
  })

  it('returns 400 when user is already connected', async () => {
    mockSupabase = createTrackingMock()
    singleResponses = [
      { data: { id: 'b1', name: 'TestBrand', slug: 'testbrand' }, error: null },
      { data: { id: 'org-1' }, error: null },
      { data: { id: 'member-1' }, error: null },
    ]

    const res = await POST(makeRequest({ companyId: 'b1', companyType: 'BRAND' }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe('You are already connected to this company')
  })

  it('assigns OWNER role when company has no existing owner', async () => {
    mockSupabase = createTrackingMock()

    // Override limit to return empty array (no owner)
    mockSupabase.limit = vi.fn().mockResolvedValue({ data: [], error: null })

    singleResponses = [
      { data: { id: 'b2', name: 'UnownedBrand', slug: 'unowned' }, error: null },
      { data: { id: 'org-2' }, error: null },
      { data: null, error: { code: 'PGRST116' } }, // not a member
      { data: { firstName: 'Tim', lastName: 'Test' }, error: null },
    ]

    const res = await POST(makeRequest({ companyId: 'b2', companyType: 'BRAND' }))
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.role).toBe('OWNER')
    expect(json.organisation.name).toBe('UnownedBrand')
  })

  it('assigns MEMBER role when company already has an owner', async () => {
    mockSupabase = createTrackingMock()

    mockSupabase.limit = vi.fn().mockResolvedValue({ data: [{ id: 'existing-owner' }], error: null })

    singleResponses = [
      { data: { id: 's1', companyName: 'OwnedSupplier', slug: 'owned', claimStatus: 'CLAIMED' }, error: null },
      { data: { id: 'org-3' }, error: null },
      { data: null, error: { code: 'PGRST116' } },
      { data: { firstName: 'New', lastName: 'User' }, error: null },
    ]

    const res = await POST(makeRequest({ companyId: 's1', companyType: 'SUPPLIER' }))
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.role).toBe('MEMBER')
  })

  it('creates Organisation when one does not exist for the company', async () => {
    mockSupabase = createTrackingMock()

    mockSupabase.limit = vi.fn().mockResolvedValue({ data: [], error: null })

    singleResponses = [
      { data: { id: 'b3', name: 'NewBrand', slug: 'newbrand' }, error: null },
      { data: null, error: { code: 'PGRST116' } }, // no org
      { data: { id: 'org-new', name: 'NewBrand', type: 'BRAND' }, error: null }, // org insert
      { data: null, error: { code: 'PGRST116' } }, // not a member
      { data: { firstName: 'Test', lastName: 'User' }, error: null },
    ]

    const res = await POST(makeRequest({ companyId: 'b3', companyType: 'BRAND' }))
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.role).toBe('OWNER')

    const orgInserts = mockCalls.filter(c => c.table === 'Organisation' && c.method === 'insert')
    expect(orgInserts.length).toBe(1)
  })

  it('creates SupplierClaim audit record for supplier connections', async () => {
    mockSupabase = createTrackingMock()

    mockSupabase.limit = vi.fn().mockResolvedValue({ data: [], error: null })

    singleResponses = [
      { data: { id: 's4', companyName: 'AuditSupplier', slug: 'audit', claimStatus: 'UNCLAIMED' }, error: null },
      { data: { id: 'org-4' }, error: null },
      { data: null, error: { code: 'PGRST116' } },
      { data: { firstName: 'Audit', lastName: 'Person' }, error: null },
    ]

    const res = await POST(makeRequest({ companyId: 's4', companyType: 'SUPPLIER' }))
    const json = await res.json()

    expect(json.success).toBe(true)

    const claimUpserts = mockCalls.filter(c => c.table === 'SupplierClaim' && c.method === 'upsert')
    expect(claimUpserts.length).toBe(1)

    const supplierUpdates = mockCalls.filter(c => c.table === 'Supplier' && c.method === 'update')
    expect(supplierUpdates.length).toBe(1)
  })

  it('does NOT create SupplierClaim for brand connections', async () => {
    mockSupabase = createTrackingMock()

    mockSupabase.limit = vi.fn().mockResolvedValue({ data: [], error: null })

    singleResponses = [
      { data: { id: 'b5', name: 'BrandNoAudit', slug: 'brandnoaudit' }, error: null },
      { data: { id: 'org-5' }, error: null },
      { data: null, error: { code: 'PGRST116' } },
      { data: { firstName: 'Brand', lastName: 'User' }, error: null },
    ]

    const res = await POST(makeRequest({ companyId: 'b5', companyType: 'BRAND' }))
    const json = await res.json()

    expect(json.success).toBe(true)

    const claimCalls = mockCalls.filter(c => c.table === 'SupplierClaim')
    expect(claimCalls.length).toBe(0)
  })
})
