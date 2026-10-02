import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mocks ────────────────────────────────────────────────────────────
let mockSession: { isAuthenticated: boolean; isAdmin: boolean; user: { id: string } | null }

vi.mock('@/lib/auth/session', () => ({
  getSession: () => Promise.resolve(mockSession),
}))

// Each .single() call pops the next queued response; writes are recorded
let singleResponses: Array<{ data: unknown; error: unknown }>
let inserts: Array<{ table: string; row: Record<string, unknown> }>
let deletes: string[]
let deleteError: unknown

function createMock() {
  let table = ''
  const chain: Record<string, any> = {}
  chain.from = vi.fn((t: string) => {
    table = t
    return chain
  })
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn((col: string, val: string) => {
    if (chain._deleting) {
      deletes.push(val)
      chain._deleting = false
      return Promise.resolve({ error: deleteError })
    }
    return chain
  })
  chain.insert = vi.fn((row: Record<string, unknown>) => {
    inserts.push({ table, row })
    return Promise.resolve({ error: null })
  })
  chain.delete = vi.fn(() => {
    chain._deleting = true
    return chain
  })
  chain.single = vi.fn(() => Promise.resolve(singleResponses.shift() ?? { data: null, error: null }))
  return chain
}

let mockSupabase: ReturnType<typeof createMock>

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockSupabase,
}))

import { POST } from '@/app/api/events/[slug]/messages/route'
import { DELETE } from '@/app/api/events/[slug]/messages/[id]/route'
import { parseEventMessageInput, toEventMessage } from '@/lib/events/messages'

function postRequest(body: unknown) {
  return new NextRequest('http://localhost/api/events/expo/messages', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': crypto.randomUUID() },
  })
}

function deleteRequest() {
  return new NextRequest('http://localhost/api/events/expo/messages/msg-1', {
    method: 'DELETE',
    headers: { 'x-forwarded-for': crypto.randomUUID() },
  })
}

const slugParams = { params: Promise.resolve({ slug: 'expo' }) }
const deleteParams = { params: Promise.resolve({ slug: 'expo', id: 'msg-1' }) }

const createdRow = {
  id: 'new-id',
  body: 'Come and say hello',
  standNumber: 'B42',
  attendingDates: 'Tuesday',
  parentId: null,
  createdAt: '2026-10-02T10:00:00.000Z',
  author: {
    id: 'user-1',
    email: 'jo@example.com',
    member: { firstName: 'Jo', lastName: 'Bloggs', avatarUrl: null, jobTitle: 'Founder', company: 'Spirits Co', linkedinUrl: null, isPublic: true },
  },
}

beforeEach(() => {
  mockSession = { isAuthenticated: true, isAdmin: false, user: { id: 'user-1' } }
  singleResponses = []
  inserts = []
  deletes = []
  deleteError = null
  mockSupabase = createMock()
})

// ── parseEventMessageInput ───────────────────────────────────────────
describe('parseEventMessageInput', () => {
  it('trims fields and treats blanks as null', () => {
    expect(parseEventMessageInput({ body: '  Hi  ', standNumber: ' ', attendingDates: ' Tue ' })).toEqual({
      data: { body: 'Hi', standNumber: null, attendingDates: 'Tue', parentId: null },
    })
  })

  it('requires a body', () => {
    expect(parseEventMessageInput({ body: '   ' })).toEqual({ error: 'Message is required' })
    expect(parseEventMessageInput(null)).toEqual({ error: 'Message is required' })
  })

  it('rejects over-long values', () => {
    expect('error' in parseEventMessageInput({ body: 'x'.repeat(2001) })).toBe(true)
    expect('error' in parseEventMessageInput({ body: 'ok', standNumber: 'x'.repeat(101) })).toBe(true)
  })

  it('drops stand number and attendance on replies', () => {
    expect(parseEventMessageInput({ body: 'Yes', parentId: 'p1', standNumber: 'B1', attendingDates: 'Tue' })).toEqual({
      data: { body: 'Yes', standNumber: null, attendingDates: null, parentId: 'p1' },
    })
  })
})

// ── toEventMessage ───────────────────────────────────────────────────
describe('toEventMessage', () => {
  it('maps author details and shares email for public profiles', () => {
    const msg = toEventMessage(createdRow)
    expect(msg.author).toEqual({
      id: 'user-1',
      name: 'Jo Bloggs',
      avatarUrl: null,
      jobTitle: 'Founder',
      company: 'Spirits Co',
      linkedinUrl: null,
      email: 'jo@example.com',
    })
  })

  it('hides email for private profiles and handles array relations', () => {
    const row = {
      ...createdRow,
      author: [{ ...createdRow.author, member: [{ ...createdRow.author.member, isPublic: false }] }],
    }
    expect(toEventMessage(row).author.email).toBeNull()
    expect(toEventMessage(row).author.name).toBe('Jo Bloggs')
  })
})

// ── POST /api/events/[slug]/messages ─────────────────────────────────
describe('POST /api/events/[slug]/messages', () => {
  it('returns 401 when not logged in', async () => {
    mockSession = { isAuthenticated: false, isAdmin: false, user: null }
    const res = await POST(postRequest({ body: 'Hi' }), slugParams)
    expect(res.status).toBe(401)
  })

  it('returns 404 for an unknown or unpublished event', async () => {
    singleResponses = [{ data: null, error: { code: 'PGRST116' } }]
    const res = await POST(postRequest({ body: 'Hi' }), slugParams)
    expect(res.status).toBe(404)
  })

  it('returns 400 for an empty message', async () => {
    singleResponses = [{ data: { id: 'event-1' }, error: null }]
    const res = await POST(postRequest({ body: '' }), slugParams)
    expect(res.status).toBe(400)
    expect(inserts).toHaveLength(0)
  })

  it('creates a message with stand number and attendance', async () => {
    singleResponses = [
      { data: { id: 'event-1' }, error: null },
      { data: createdRow, error: null },
    ]
    const res = await POST(
      postRequest({ body: 'Come and say hello', standNumber: 'B42', attendingDates: 'Tuesday' }),
      slugParams
    )
    expect(res.status).toBe(201)
    expect(inserts).toHaveLength(1)
    expect(inserts[0].table).toBe('EventMessage')
    expect(inserts[0].row).toMatchObject({
      eventId: 'event-1',
      authorId: 'user-1',
      body: 'Come and say hello',
      standNumber: 'B42',
      attendingDates: 'Tuesday',
      parentId: null,
    })
    const json = await res.json()
    expect(json.data.message.author.name).toBe('Jo Bloggs')
  })

  it('rejects replies to a reply', async () => {
    singleResponses = [
      { data: { id: 'event-1' }, error: null },
      { data: { id: 'p1', parentId: 'p0' }, error: null },
    ]
    const res = await POST(postRequest({ body: 'Hi', parentId: 'p1' }), slugParams)
    expect(res.status).toBe(400)
    expect(inserts).toHaveLength(0)
  })

  it('rejects replies to a message on another event', async () => {
    singleResponses = [
      { data: { id: 'event-1' }, error: null },
      { data: null, error: { code: 'PGRST116' } },
    ]
    const res = await POST(postRequest({ body: 'Hi', parentId: 'other' }), slugParams)
    expect(res.status).toBe(400)
    expect(inserts).toHaveLength(0)
  })
})

// ── DELETE /api/events/[slug]/messages/[id] ──────────────────────────
describe('DELETE /api/events/[slug]/messages/[id]', () => {
  it('lets the author delete their message', async () => {
    singleResponses = [
      { data: { id: 'event-1' }, error: null },
      { data: { id: 'msg-1', authorId: 'user-1' }, error: null },
    ]
    const res = await DELETE(deleteRequest(), deleteParams)
    expect(res.status).toBe(200)
    expect(deletes).toEqual(['msg-1'])
  })

  it("forbids deleting someone else's message", async () => {
    singleResponses = [
      { data: { id: 'event-1' }, error: null },
      { data: { id: 'msg-1', authorId: 'user-2' }, error: null },
    ]
    const res = await DELETE(deleteRequest(), deleteParams)
    expect(res.status).toBe(403)
    expect(deletes).toHaveLength(0)
  })

  it("lets an admin delete someone else's message", async () => {
    mockSession = { isAuthenticated: true, isAdmin: true, user: { id: 'admin-1' } }
    singleResponses = [
      { data: { id: 'event-1' }, error: null },
      { data: { id: 'msg-1', authorId: 'user-2' }, error: null },
    ]
    const res = await DELETE(deleteRequest(), deleteParams)
    expect(res.status).toBe(200)
    expect(deletes).toEqual(['msg-1'])
  })

  it('returns 404 when the message is not on this event', async () => {
    singleResponses = [
      { data: { id: 'event-1' }, error: null },
      { data: null, error: { code: 'PGRST116' } },
    ]
    const res = await DELETE(deleteRequest(), deleteParams)
    expect(res.status).toBe(404)
  })
})
