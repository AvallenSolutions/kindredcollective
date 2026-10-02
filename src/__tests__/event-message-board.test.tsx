import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EventMessageBoard } from '@/components/events/event-message-board'
import type { EventMessage } from '@/lib/events/messages'

function makeMessage(overrides: Partial<EventMessage> = {}): EventMessage {
  return {
    id: 'm1',
    body: 'On stand all week',
    standNumber: 'B42',
    attendingDates: 'Tue to Thu',
    parentId: null,
    createdAt: '2026-10-01T10:00:00.000Z',
    author: {
      id: 'user-2',
      name: 'Sam Smith',
      avatarUrl: null,
      jobTitle: 'Founder',
      company: 'Gin Co',
      linkedinUrl: 'https://linkedin.com/in/sam',
      email: 'sam@example.com',
    },
    ...overrides,
  }
}

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('confirm', () => true)
})

describe('EventMessageBoard', () => {
  it('shows stand number, attendance and contact links for other members', () => {
    render(
      <EventMessageBoard eventSlug="expo" initialMessages={[makeMessage()]} currentUserId="user-1" isAdmin={false} />
    )
    expect(screen.getByText('Stand B42')).toBeInTheDocument()
    expect(screen.getByText('Tue to Thu')).toBeInTheDocument()
    expect(screen.getByText('LinkedIn').closest('a')).toHaveAttribute('href', 'https://linkedin.com/in/sam')
    expect(screen.getByText('Email').closest('a')).toHaveAttribute('href', 'mailto:sam@example.com')
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
  })

  it('posts a message and adds it to the board', async () => {
    const created = makeMessage({ id: 'm2', body: 'Here Tuesday', standNumber: null, attendingDates: 'Tuesday', author: { ...makeMessage().author, id: 'user-1', name: 'Jo Bloggs' } })
    fetchMock.mockResolvedValue({ json: () => Promise.resolve({ success: true, data: { message: created } }) })

    render(<EventMessageBoard eventSlug="expo" initialMessages={[]} currentUserId="user-1" isAdmin={false} />)
    fireEvent.change(screen.getByPlaceholderText(/exhibiting on the Tuesday/), { target: { value: 'Here Tuesday' } })
    fireEvent.change(screen.getByLabelText(/When you're there/), { target: { value: 'Tuesday' } })
    fireEvent.click(screen.getByText('Post Message'))

    await waitFor(() => expect(screen.getByText('Here Tuesday')).toBeInTheDocument())
    expect(fetchMock).toHaveBeenCalledWith('/api/events/expo/messages', expect.objectContaining({ method: 'POST' }))
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ body: 'Here Tuesday', attendingDates: 'Tuesday', standNumber: '' })
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('shows API errors', async () => {
    fetchMock.mockResolvedValue({ json: () => Promise.resolve({ success: false, error: 'Message is required' }) })
    render(<EventMessageBoard eventSlug="expo" initialMessages={[]} currentUserId="user-1" isAdmin={false} />)
    fireEvent.change(screen.getByPlaceholderText(/exhibiting on the Tuesday/), { target: { value: 'x' } })
    fireEvent.click(screen.getByText('Post Message'))
    await waitFor(() => expect(screen.getByText('Message is required')).toBeInTheDocument())
  })

  it('sends replies with the parent id and nests them', async () => {
    const reply = makeMessage({ id: 'r1', parentId: 'm1', body: 'See you there', standNumber: null, attendingDates: null, author: { ...makeMessage().author, id: 'user-1', name: 'Jo Bloggs' } })
    fetchMock.mockResolvedValue({ json: () => Promise.resolve({ success: true, data: { message: reply } }) })

    render(
      <EventMessageBoard eventSlug="expo" initialMessages={[makeMessage()]} currentUserId="user-1" isAdmin={false} />
    )
    fireEvent.click(screen.getByText('Reply'))
    fireEvent.change(screen.getByPlaceholderText('Reply to Sam Smith...'), { target: { value: 'See you there' } })
    fireEvent.click(screen.getAllByText('Reply').find((el) => el.closest('button[type="submit"]'))!)

    await waitFor(() => expect(screen.getByText('See you there')).toBeInTheDocument())
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ body: 'See you there', parentId: 'm1' })
  })

  it('lets an admin delete a message along with its replies', async () => {
    fetchMock.mockResolvedValue({ json: () => Promise.resolve({ success: true, data: { deleted: true } }) })
    const reply = makeMessage({ id: 'r1', parentId: 'm1', body: 'A reply' })

    render(
      <EventMessageBoard eventSlug="expo" initialMessages={[makeMessage(), reply]} currentUserId="admin-1" isAdmin />
    )
    fireEvent.click(screen.getAllByText('Delete')[0])

    await waitFor(() => expect(screen.queryByText('On stand all week')).not.toBeInTheDocument())
    expect(screen.queryByText('A reply')).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/events/expo/messages/m1', { method: 'DELETE' })
  })
})
