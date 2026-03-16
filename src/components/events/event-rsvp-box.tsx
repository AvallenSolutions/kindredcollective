'use client'

import { useState, useEffect } from 'react'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Attendee {
  name: string
  company?: string
}

interface EventRsvpBoxProps {
  eventId: string
  eventSlug: string
  compact?: boolean
}

export function EventRsvpBox({ eventId, eventSlug, compact = false }: EventRsvpBoxProps) {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAttendees() {
      try {
        const res = await fetch(`/api/events/${eventSlug}/attendees`)
        if (!res.ok) return
        const json = await res.json()
        if (json.data) {
          setAttendees(json.data.attendees ?? [])
          setTotalCount(json.data.totalCount ?? 0)
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchAttendees()
  }, [eventSlug])

  if (loading || totalCount === 0) return null

  const displayLimit = compact ? 3 : 6
  const shown = attendees.slice(0, displayLimit)
  const remaining = totalCount - shown.length

  return (
    <div className={cn('border-t-2 border-black/10 pt-3 mt-3', compact && 'pt-2 mt-2')}>
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-3.5 h-3.5 text-cyan" />
        <span className="text-xs font-display font-bold uppercase tracking-wider text-gray-500">
          {totalCount} Going
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {shown.map((attendee, i) => (
          <div
            key={i}
            className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-200 text-xs"
            title={attendee.company ? `${attendee.name} — ${attendee.company}` : attendee.name}
          >
            <span
              className="w-5 h-5 flex items-center justify-center bg-cyan border border-black text-[9px] font-bold flex-shrink-0"
            >
              {attendee.name.charAt(0).toUpperCase()}
            </span>
            <span className="font-bold truncate max-w-[100px]">{attendee.name}</span>
          </div>
        ))}
        {remaining > 0 && (
          <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-gray-400">
            +{remaining} more
          </span>
        )}
      </div>
    </div>
  )
}
