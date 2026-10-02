export const MESSAGE_BODY_MAX = 2000
export const MESSAGE_FIELD_MAX = 100

// Supabase select for an EventMessage with the author's public profile
export const EVENT_MESSAGE_SELECT = `
  id, body, standNumber, attendingDates, parentId, createdAt,
  author:User!authorId(
    id, email,
    member:Member(firstName, lastName, avatarUrl, jobTitle, company, linkedinUrl, isPublic)
  )
`

export interface EventMessage {
  id: string
  body: string
  standNumber: string | null
  attendingDates: string | null
  parentId: string | null
  createdAt: string
  author: {
    id: string
    name: string
    avatarUrl: string | null
    jobTitle: string | null
    company: string | null
    linkedinUrl: string | null
    email: string | null
  }
}

function one<T>(value: T | T[] | null | undefined): T | null {
  return (Array.isArray(value) ? value[0] : value) ?? null
}

// Map a Supabase row (selected with EVENT_MESSAGE_SELECT) to the shape the UI uses
export function toEventMessage(row: any): EventMessage {
  const author = one<any>(row.author)
  const member = one<any>(author?.member)
  return {
    id: row.id,
    body: row.body,
    standNumber: row.standNumber ?? null,
    attendingDates: row.attendingDates ?? null,
    parentId: row.parentId ?? null,
    createdAt: row.createdAt,
    author: {
      id: author?.id ?? '',
      name: member ? `${member.firstName} ${member.lastName}` : 'Kindred member',
      avatarUrl: member?.avatarUrl ?? null,
      jobTitle: member?.jobTitle ?? null,
      company: member?.company ?? null,
      linkedinUrl: member?.linkedinUrl ?? null,
      // Only share an email when the member has a public profile, as in the members directory
      email: member?.isPublic ? author?.email ?? null : null,
    },
  }
}

export type EventMessageInput = {
  body: string
  standNumber: string | null
  attendingDates: string | null
  parentId: string | null
}

function optionalText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

// Validate a new message. Stand number and attendance only apply to top-level messages.
export function parseEventMessageInput(
  input: unknown
): { data: EventMessageInput } | { error: string } {
  const raw = (input ?? {}) as Record<string, unknown>
  const body = typeof raw.body === 'string' ? raw.body.trim() : ''
  if (!body) return { error: 'Message is required' }
  if (body.length > MESSAGE_BODY_MAX) {
    return { error: `Message must be ${MESSAGE_BODY_MAX} characters or fewer` }
  }

  const parentId = optionalText(raw.parentId)
  const standNumber = parentId ? null : optionalText(raw.standNumber)
  const attendingDates = parentId ? null : optionalText(raw.attendingDates)

  if ((standNumber?.length ?? 0) > MESSAGE_FIELD_MAX) {
    return { error: `Stand number must be ${MESSAGE_FIELD_MAX} characters or fewer` }
  }
  if ((attendingDates?.length ?? 0) > MESSAGE_FIELD_MAX) {
    return { error: `Attendance details must be ${MESSAGE_FIELD_MAX} characters or fewer` }
  }

  return { data: { body, standNumber, attendingDates, parentId } }
}
