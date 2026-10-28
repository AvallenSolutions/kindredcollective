import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Fake database ────────────────────────────────────────────────────
type Row = Record<string, unknown>
let tables: Record<string, Row[]>
let currentUserId: string

function createFakeDb() {
  return {
    from(table: string) {
      const filters: Array<[string, unknown]> = []
      let insertedRow: Row | null = null
      let deleting = false
      const matches = () =>
        (tables[table] || []).filter((r) => filters.every(([c, v]) => r[c] === v))
      const chain: Record<string, any> = {}
      chain.select = () => chain
      chain.order = () => chain
      chain.range = () => chain
      chain.eq = (col: string, val: unknown) => {
        filters.push([col, val])
        return chain
      }
      chain.insert = (row: Row) => {
        insertedRow = row
        tables[table] = [...(tables[table] || []), row]
        return chain
      }
      chain.delete = () => {
        deleting = true
        return chain
      }
      chain.single = () => {
        if (insertedRow) return Promise.resolve({ data: insertedRow, error: null })
        const row = matches()[0]
        return Promise.resolve(row ? { data: row, error: null } : { data: null, error: { code: 'PGRST116' } })
      }
      chain.then = (resolve: (v: unknown) => unknown) => {
        const data = matches()
        if (deleting) {
          tables[table] = (tables[table] || []).filter((r) => !data.includes(r))
          return Promise.resolve({ error: null }).then(resolve)
        }
        return Promise.resolve({ data, error: null, count: data.length }).then(resolve)
      }
      return chain
    },
  }
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => createFakeDb(),
}))

vi.mock('@/lib/auth/session', async (importActual) => ({
  ...(await importActual<typeof import('@/lib/auth/session')>()),
  requireAuth: () => Promise.resolve({ id: currentUserId }),
  getSession: () => Promise.resolve({ isAdmin: false, user: { id: currentUserId } }),
}))

import { GET, POST } from '@/app/api/me/offers/route'
import { PATCH, DELETE } from '@/app/api/me/offers/[id]/route'

function request(method: string, orgId: string, body?: unknown) {
  return new NextRequest(`http://localhost/api/me/offers?orgId=${orgId}`, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json' },
  })
}

const offerBody = { title: 'Launch deal', type: 'PERCENTAGE_DISCOUNT', discountValue: 10 }
const idParams = (id: string) => ({ params: Promise.resolve({ id }) })

beforeEach(() => {
  tables = {
    Organisation: [
      { id: 'org-brand', type: 'BRAND', brandId: 'brand-1', supplierId: null },
      { id: 'org-supplier', type: 'SUPPLIER', brandId: null, supplierId: 'supplier-1' },
      { id: 'org-empty', type: 'BRAND', brandId: null, supplierId: null },
    ],
    OrganisationMember: [
      { organisationId: 'org-brand', userId: 'brand-owner', role: 'OWNER' },
      { organisationId: 'org-brand', userId: 'brand-member', role: 'MEMBER' },
      { organisationId: 'org-supplier', userId: 'supplier-member', role: 'MEMBER' },
      { organisationId: 'org-empty', userId: 'brand-member', role: 'MEMBER' },
    ],
    Offer: [],
  }
})

describe('/api/me/offers', () => {
  it.each([
    ['brand OWNER', 'brand-owner', 'org-brand', { brandId: 'brand-1' }],
    ['brand MEMBER', 'brand-member', 'org-brand', { brandId: 'brand-1' }],
    ['supplier MEMBER', 'supplier-member', 'org-supplier', { supplierId: 'supplier-1' }],
  ])('lets a %s create an offer owned by their organisation', async (_label, userId, orgId, owner) => {
    currentUserId = userId

    const res = await POST(request('POST', orgId, offerBody))

    expect(res.status).toBe(201)
    expect(tables.Offer).toHaveLength(1)
    expect(tables.Offer[0]).toMatchObject({ ...owner, title: 'Launch deal', status: 'DRAFT' })
    const otherColumn = 'brandId' in owner ? 'supplierId' : 'brandId'
    expect(tables.Offer[0][otherColumn]).toBeUndefined()
  })

  it('rejects a user who is not a member of the organisation', async () => {
    currentUserId = 'supplier-member'

    const res = await POST(request('POST', 'org-brand', offerBody))

    expect(res.status).toBe(404)
    expect(tables.Offer).toHaveLength(0)
  })

  it('rejects an organisation with no linked brand or supplier', async () => {
    currentUserId = 'brand-member'

    const res = await POST(request('POST', 'org-empty', offerBody))

    expect(res.status).toBe(404)
    expect(tables.Offer).toHaveLength(0)
  })

  it('lists only the offers owned by the requested organisation', async () => {
    tables.Offer = [
      { id: 'o1', brandId: 'brand-1', title: 'Brand offer' },
      { id: 'o2', supplierId: 'supplier-1', title: 'Supplier offer' },
    ]
    currentUserId = 'brand-member'

    const res = await GET(request('GET', 'org-brand'))
    const json = await res.json()

    expect(json.data.offers.map((o: Row) => o.id)).toEqual(['o1'])
  })

  it('lets a brand member update and delete their own offer but not another owner\'s', async () => {
    tables.Offer = [
      { id: 'o1', brandId: 'brand-1', supplierId: null, title: 'Brand offer' },
      { id: 'o2', brandId: null, supplierId: 'supplier-1', title: 'Supplier offer' },
    ]
    currentUserId = 'brand-member'

    const forbidden = await PATCH(request('PATCH', 'org-brand', { title: 'x' }), idParams('o2'))
    expect(forbidden.status).toBe(403)

    const forbiddenDelete = await DELETE(request('DELETE', 'org-brand'), idParams('o2'))
    expect(forbiddenDelete.status).toBe(403)

    const ok = await DELETE(request('DELETE', 'org-brand'), idParams('o1'))
    expect(ok.status).toBe(200)
    expect(tables.Offer.map((o) => o.id)).toEqual(['o2'])
  })
})
