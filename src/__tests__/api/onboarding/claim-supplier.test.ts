import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks (hoisted — no outer variable refs) ─────────────────────────
vi.mock('@/lib/auth/session', () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: 'user-1', email: 'test@example.com', role: 'MEMBER' }),
}))

vi.mock('@/lib/email', () => ({
  sendClaimVerificationEmail: vi.fn().mockResolvedValue({ success: true }),
}))

// Track all from() + insert() calls to verify behaviour
let fromCalls: string[] = []
let insertCalls: Array<{ table: string; data: unknown }> = []

function createMockWithResponses(responses: Record<string, unknown>[]) {
  let responseIndex = 0
  fromCalls = []
  insertCalls = []
  let currentTable = ''

  const chain: Record<string, ReturnType<typeof vi.fn>> = {}

  chain.from = vi.fn().mockImplementation((table: string) => {
    currentTable = table
    fromCalls.push(table)
    return chain
  })

  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.limit = vi.fn().mockReturnValue(chain)

  chain.insert = vi.fn().mockImplementation((data: unknown) => {
    insertCalls.push({ table: currentTable, data })
    return chain
  })

  chain.update = vi.fn().mockReturnValue(chain)
  chain.upsert = vi.fn().mockReturnValue(chain)

  chain.single = vi.fn().mockImplementation(() => {
    const resp = responses[responseIndex] || { data: null, error: null }
    responseIndex++
    return Promise.resolve(resp)
  })

  return chain
}

let mockSupabase: ReturnType<typeof createMockWithResponses>

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockSupabase,
}))

// ── Import ───────────────────────────────────────────────────────────
import { POST } from '@/app/api/onboarding/claim-supplier/route'
import { NextRequest } from 'next/server'

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/onboarding/claim-supplier', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

// ── Tests ────────────────────────────────────────────────────────────

describe('POST /api/onboarding/claim-supplier', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fromCalls = []
    insertCalls = []
  })

  it('returns 400 when supplierId is missing', async () => {
    mockSupabase = createMockWithResponses([])
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Supplier ID is required')
  })

  it('returns 404 when supplier does not exist', async () => {
    mockSupabase = createMockWithResponses([
      { data: null, error: { message: 'not found' } },
    ])
    const res = await POST(makeRequest({ supplierId: 'nonexistent' }))
    expect(res.status).toBe(404)
    expect((await res.json()).error).toBe('Supplier not found')
  })

  it('returns 400 when supplier is already claimed', async () => {
    mockSupabase = createMockWithResponses([
      { data: { id: 's1', companyName: 'Test', slug: 'test', claimStatus: 'CLAIMED', contactEmail: null }, error: null },
    ])
    const res = await POST(makeRequest({ supplierId: 's1', companyEmail: 'a@b.com' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('This supplier has already been claimed')
  })

  it('Step 1: sends verification code for unclaimed supplier', async () => {
    mockSupabase = createMockWithResponses([
      // Supplier lookup — unclaimed
      { data: { id: 's1', companyName: 'Test', slug: 'test', claimStatus: 'UNCLAIMED', contactEmail: null }, error: null },
      // Check existing claim — none
      { data: null, error: { code: 'PGRST116' } },
    ])

    const res = await POST(makeRequest({ supplierId: 's1', companyEmail: 'me@test.com' }))
    const json = await res.json()

    expect(json.requiresVerification).toBe(true)
    expect(json.message).toContain('me@test.com')
  })

  describe('Step 2: verify code', () => {
    it('succeeds and reuses existing Organisation', async () => {
      // .single() calls in order:
      // 1. Supplier lookup
      // 2. SupplierClaim select
      // 3. Supplier .update().eq().select().single()
      // 4. Organisation .select().eq().single()
      // 5. OrganisationMember .select().eq().eq().single()
      // Note: SupplierClaim .update().eq() does NOT end in .single()
      mockSupabase = createMockWithResponses([
        { data: { id: 's1', companyName: 'Alkatera', slug: 'alkatera', claimStatus: 'PENDING', contactEmail: null }, error: null },
        { data: { id: 'claim-1', verificationCode: '123456', status: 'PENDING' }, error: null },
        { data: { id: 's1', companyName: 'Alkatera', claimStatus: 'CLAIMED' }, error: null },
        { data: { id: 'org-existing', name: 'Alkatera', type: 'SUPPLIER' }, error: null },
        { data: null, error: { code: 'PGRST116' } },
      ])

      const res = await POST(makeRequest({ supplierId: 's1', verificationCode: '123456' }))
      const json = await res.json()

      expect(json.success).toBe(true)

      // Should NOT have inserted into Organisation table
      const orgInserts = insertCalls.filter(c => c.table === 'Organisation')
      expect(orgInserts.length).toBe(0)

      // Should have inserted into OrganisationMember
      const memberInserts = insertCalls.filter(c => c.table === 'OrganisationMember')
      expect(memberInserts.length).toBe(1)
    })

    it('succeeds and creates Organisation when none exists', async () => {
      mockSupabase = createMockWithResponses([
        // 1. Supplier lookup
        { data: { id: 's2', companyName: 'NewCo', slug: 'newco', claimStatus: 'PENDING', contactEmail: null }, error: null },
        // 2. SupplierClaim select
        { data: { id: 'claim-2', verificationCode: '654321', status: 'PENDING' }, error: null },
        // 3. Supplier update → .select().single()
        { data: { id: 's2', companyName: 'NewCo', claimStatus: 'CLAIMED' }, error: null },
        // 4. Organisation lookup — NOT found
        { data: null, error: { code: 'PGRST116' } },
        // 5. Organisation insert → .select().single()
        { data: { id: 'org-new', name: 'NewCo', type: 'SUPPLIER' }, error: null },
        // 6. OrganisationMember check — not a member
        { data: null, error: { code: 'PGRST116' } },
      ])

      const res = await POST(makeRequest({ supplierId: 's2', verificationCode: '654321' }))
      const json = await res.json()

      expect(json.success).toBe(true)

      // Should have inserted into Organisation
      const orgInserts = insertCalls.filter(c => c.table === 'Organisation')
      expect(orgInserts.length).toBe(1)

      // Should have inserted into OrganisationMember
      const memberInserts = insertCalls.filter(c => c.table === 'OrganisationMember')
      expect(memberInserts.length).toBe(1)
    })

    it('does not duplicate OrganisationMember if already a member', async () => {
      mockSupabase = createMockWithResponses([
        // 1. Supplier lookup
        { data: { id: 's3', companyName: 'ExistCo', slug: 'existco', claimStatus: 'PENDING', contactEmail: null }, error: null },
        // 2. SupplierClaim select
        { data: { id: 'claim-3', verificationCode: '111111', status: 'PENDING' }, error: null },
        // 3. Supplier update → .select().single()
        { data: { id: 's3', companyName: 'ExistCo', claimStatus: 'CLAIMED' }, error: null },
        // 4. Organisation lookup — found
        { data: { id: 'org-exist', name: 'ExistCo', type: 'SUPPLIER' }, error: null },
        // 5. OrganisationMember check — already exists!
        { data: { id: 'member-existing' }, error: null },
      ])

      const res = await POST(makeRequest({ supplierId: 's3', verificationCode: '111111' }))
      const json = await res.json()

      expect(json.success).toBe(true)

      // Should NOT have inserted OrganisationMember
      const memberInserts = insertCalls.filter(c => c.table === 'OrganisationMember')
      expect(memberInserts.length).toBe(0)
    })

    it('returns 404 when no pending claim exists', async () => {
      mockSupabase = createMockWithResponses([
        // 1. Supplier lookup
        { data: { id: 's4', companyName: 'Test', slug: 'test', claimStatus: 'PENDING', contactEmail: null }, error: null },
        // 2. SupplierClaim lookup — not found
        { data: null, error: { code: 'PGRST116' } },
      ])

      const res = await POST(makeRequest({ supplierId: 's4', verificationCode: '999999' }))
      expect(res.status).toBe(404)
      expect((await res.json()).error).toContain('No pending claim found')
    })

    it('returns 400 for invalid verification code', async () => {
      mockSupabase = createMockWithResponses([
        // 1. Supplier lookup
        { data: { id: 's5', companyName: 'Test', slug: 'test', claimStatus: 'PENDING', contactEmail: null }, error: null },
        // 2. SupplierClaim lookup — code doesn't match
        { data: { id: 'claim-5', verificationCode: '123456', status: 'PENDING' }, error: null },
      ])

      const res = await POST(makeRequest({ supplierId: 's5', verificationCode: '000000' }))
      expect(res.status).toBe(400)
      expect((await res.json()).error).toBe('Invalid verification code')
    })
  })
})
