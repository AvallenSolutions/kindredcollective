'use client'

import { useState } from 'react'
import { MessageSquare, Reply, Send, Trash2, Linkedin, Mail, MapPin, CalendarDays } from 'lucide-react'
import { Badge, Button, Card, CardContent, Input, Label, Textarea } from '@/components/ui'
import { formatDate, getInitials } from '@/lib/utils'
import { MESSAGE_BODY_MAX, MESSAGE_FIELD_MAX, type EventMessage } from '@/lib/events/messages'

interface EventMessageBoardProps {
  eventSlug: string
  initialMessages: EventMessage[]
  currentUserId: string | null
  isAdmin: boolean
}

export function EventMessageBoard({
  eventSlug,
  initialMessages,
  currentUserId,
  isAdmin,
}: EventMessageBoardProps) {
  const [messages, setMessages] = useState<EventMessage[]>(initialMessages)
  const [body, setBody] = useState('')
  const [attendingDates, setAttendingDates] = useState('')
  const [standNumber, setStandNumber] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Newest posts first; replies in the order they were written
  const topLevel = messages
    .filter((m) => !m.parentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const repliesByParent = new Map<string, EventMessage[]>()
  for (const m of messages) {
    if (!m.parentId) continue
    const list = repliesByParent.get(m.parentId) || []
    list.push(m)
    repliesByParent.set(m.parentId, list)
  }
  repliesByParent.forEach((list) => list.sort((a, b) => a.createdAt.localeCompare(b.createdAt)))

  async function postMessage(payload: Record<string, string | null>): Promise<boolean> {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/events/${eventSlug}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Failed to post message. Please try again.')
        return false
      }
      setMessages((prev) => [...prev, data.data.message])
      return true
    } catch {
      setError('Failed to post message. Please try again.')
      return false
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    const ok = await postMessage({ body, attendingDates, standNumber })
    if (ok) {
      setBody('')
      setAttendingDates('')
      setStandNumber('')
    }
  }

  async function handleReply(e: React.FormEvent, parentId: string) {
    e.preventDefault()
    if (!replyText.trim()) return
    const ok = await postMessage({ body: replyText, parentId })
    if (ok) {
      setReplyTo(null)
      setReplyText('')
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this message? Any replies to it will also be removed.')) return
    setError(null)
    try {
      const res = await fetch(`/api/events/${eventSlug}/messages/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Failed to delete message.')
        return
      }
      setMessages((prev) => prev.filter((m) => m.id !== id && m.parentId !== id))
    } catch {
      setError('Failed to delete message.')
    }
  }

  function renderMessage(message: EventMessage, isReply: boolean) {
    const { author } = message
    const canDelete = isAdmin || author.id === currentUserId
    const isOwn = author.id === currentUserId
    const subtitle = [author.jobTitle, author.company].filter(Boolean).join(' at ')
    const replies = repliesByParent.get(message.id) || []

    return (
      <div key={message.id} className={isReply ? 'ml-6 md:ml-10 border-l-2 border-gray-200 pl-4' : ''}>
        <div className="py-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full border-2 border-black bg-cyan flex items-center justify-center overflow-hidden flex-shrink-0">
              {author.avatarUrl ? (
                <img src={author.avatarUrl} className="w-full h-full object-cover" alt="" />
              ) : (
                <span className="text-[10px] font-bold">{getInitials(author.name)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-bold text-sm">{author.name}</span>
                <span className="text-xs text-gray-400">{formatDate(message.createdAt)}</span>
              </div>
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}

              {(message.attendingDates || message.standNumber) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {message.attendingDates && (
                    <Badge variant="lime" className="normal-case tracking-normal">
                      <CalendarDays className="w-3 h-3 mr-1" />
                      {message.attendingDates}
                    </Badge>
                  )}
                  {message.standNumber && (
                    <Badge variant="cyan" className="normal-case tracking-normal">
                      <MapPin className="w-3 h-3 mr-1" />
                      Stand {message.standNumber}
                    </Badge>
                  )}
                </div>
              )}

              <p className="text-sm text-gray-800 whitespace-pre-wrap break-words mt-2">{message.body}</p>

              <div className="flex flex-wrap items-center gap-4 mt-2">
                {!isReply && currentUserId && (
                  <button
                    type="button"
                    onClick={() => {
                      setReplyTo(replyTo === message.id ? null : message.id)
                      setReplyText('')
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold uppercase text-gray-500 hover:text-coral transition-colors"
                  >
                    <Reply className="w-3 h-3" />
                    Reply
                  </button>
                )}
                {!isOwn && author.linkedinUrl && (
                  <a
                    href={author.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold uppercase text-gray-500 hover:text-coral transition-colors"
                  >
                    <Linkedin className="w-3 h-3" />
                    LinkedIn
                  </a>
                )}
                {!isOwn && author.email && (
                  <a
                    href={`mailto:${author.email}`}
                    className="inline-flex items-center gap-1 text-xs font-bold uppercase text-gray-500 hover:text-coral transition-colors"
                  >
                    <Mail className="w-3 h-3" />
                    Email
                  </a>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDelete(message.id)}
                    className="inline-flex items-center gap-1 text-xs font-bold uppercase text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                )}
              </div>

              {replyTo === message.id && (
                <form onSubmit={(e) => handleReply(e, message.id)} className="mt-3 space-y-2">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to ${author.name}...`}
                    rows={3}
                    maxLength={MESSAGE_BODY_MAX}
                    className="min-h-[80px] text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={submitting || !replyText.trim()}>
                      <Send className="w-3 h-3 mr-1" />
                      {submitting ? 'Sending...' : 'Reply'}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setReplyTo(null)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {replies.map((reply) => renderMessage(reply, true))}
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-xl font-bold">Message Board</h2>
          <Badge variant="cyan">
            <MessageSquare className="w-3 h-3 mr-1" />
            {messages.length} {messages.length === 1 ? 'message' : 'messages'}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Let members know when you&apos;re there, share your stand number and arrange to meet up.
        </p>

        {error && (
          <div className="mb-4 bg-red-50 border-2 border-red-300 text-red-700 px-4 py-2 text-sm">
            {error}
          </div>
        )}

        {currentUserId ? (
          <form onSubmit={handleSubmit} className="space-y-3 pb-6 border-b-2 border-gray-200">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="e.g. We're exhibiting on the Tuesday, come and say hello. Keen to meet anyone looking for a co-packer."
              rows={3}
              maxLength={MESSAGE_BODY_MAX}
              className="min-h-[96px]"
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="event-message-dates" className="text-xs">
                  When you&apos;re there (optional)
                </Label>
                <Input
                  id="event-message-dates"
                  value={attendingDates}
                  onChange={(e) => setAttendingDates(e.target.value)}
                  placeholder="e.g. Tuesday only"
                  maxLength={MESSAGE_FIELD_MAX}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="event-message-stand" className="text-xs">
                  Stand number (optional)
                </Label>
                <Input
                  id="event-message-stand"
                  value={standNumber}
                  onChange={(e) => setStandNumber(e.target.value)}
                  placeholder="e.g. B42"
                  maxLength={MESSAGE_FIELD_MAX}
                />
              </div>
            </div>
            <Button type="submit" disabled={submitting || !body.trim()}>
              <Send className="w-4 h-4 mr-2" />
              {submitting ? 'Posting...' : 'Post Message'}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-gray-500 pb-6 border-b-2 border-gray-200">
            Log in to post on the message board.
          </p>
        )}

        <div className="divide-y divide-gray-100">
          {topLevel.length > 0 ? (
            topLevel.map((message) => renderMessage(message, false))
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">No messages yet</p>
              <p className="text-xs text-gray-400 mt-1">Start the conversation for this event.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
