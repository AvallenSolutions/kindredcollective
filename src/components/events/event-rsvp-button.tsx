'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Ticket, CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/ui'

interface EventRsvpButtonProps {
  eventSlug: string
  eventId: string
  eventTitle: string
  isFree: boolean
  isRegistrationExternal: boolean
  registrationUrl?: string
  isPast: boolean
  capacity?: number
  currentAttendees: number
}

type RsvpStatus = 'GOING' | 'INTERESTED' | 'NOT_GOING' | null

export function EventRsvpButton({
  eventSlug,
  eventId,
  eventTitle,
  isFree,
  isRegistrationExternal,
  registrationUrl,
  isPast,
  capacity,
  currentAttendees,
}: EventRsvpButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<RsvpStatus>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchCurrentRsvp()
  }, [])

  async function fetchCurrentRsvp() {
    try {
      const res = await fetch(`/api/events/${eventSlug}/rsvp`)
      if (res.ok) {
        const data = await res.json()
        if (data.rsvp) {
          setCurrentStatus(data.rsvp.status)
        }
      }
    } catch (err) {
      // User not logged in or no RSVP yet
    }
  }

  async function handleRsvp(status: RsvpStatus) {
    if (!status) return

    setLoading(true)
    setError('')

    try {
      const method = currentStatus ? 'PATCH' : 'POST'
      const res = await fetch(`/api/events/${eventSlug}/rsvp`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setCurrentStatus(status)
        setSuccess(true)
        setTimeout(() => {
          setIsOpen(false)
          setSuccess(false)
          router.refresh()
        }, 1500)
      } else {
        setError(data.error || 'Failed to update RSVP')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update RSVP')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancelRsvp() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/events/${eventSlug}/rsvp`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setCurrentStatus(null)
        setSuccess(true)
        setTimeout(() => {
          setIsOpen(false)
          setSuccess(false)
          router.refresh()
        }, 1500)
      } else {
        setError(data.error || 'Failed to cancel RSVP')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to cancel RSVP')
    } finally {
      setLoading(false)
    }
  }

  function handleClick() {
    // If external registration URL, open it
    if (isRegistrationExternal && registrationUrl) {
      window.open(registrationUrl, '_blank')
      return
    }

    // Otherwise open RSVP modal
    setIsOpen(true)
  }

  const isFull = capacity && currentAttendees >= capacity
  const buttonText = currentStatus === 'GOING'
    ? '✓ Attending'
    : isFree
      ? 'RSVP'
      : 'Get Tickets'

  return (
    <>
      <Button
        size="lg"
        onClick={handleClick}
        disabled={isPast || (isFull && currentStatus !== 'GOING')}
        variant={currentStatus === 'GOING' ? 'outline' : 'primary'}
      >
        <Ticket className="w-4 h-4 mr-2" />
        {isFull && currentStatus !== 'GOING' ? 'Event Full' : buttonText}
      </Button>

      {isOpen && !isRegistrationExternal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-black neo-shadow max-w-md w-full">
            {/* Header */}
            <div className="p-6 border-b-2 border-black flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold uppercase">
                RSVP to Event
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 border-2 border-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-4 bg-red-100 border-2 border-red-500 text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-100 border-2 border-green-500 text-green-700">
                  RSVP updated successfully!
                </div>
              )}

              <div>
                <h3 className="font-bold mb-1">{eventTitle}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {isFree ? 'This is a free event.' : `Ticket price: £${capacity}`}
                </p>
              </div>

              {currentStatus && (
                <div className="p-3 bg-cyan-50 border-2 border-cyan-200">
                  <p className="text-sm font-medium">
                    Current status: <span className="uppercase">{currentStatus}</span>
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={() => handleRsvp('GOING')}
                  disabled={loading || success || (isFull && currentStatus !== 'GOING')}
                  variant={currentStatus === 'GOING' ? 'primary' : 'outline'}
                  className="w-full"
                >
                  {currentStatus === 'GOING' && <CheckCircle className="w-4 h-4 mr-2" />}
                  I&apos;m Going
                </Button>

                <Button
                  onClick={() => handleRsvp('INTERESTED')}
                  disabled={loading || success}
                  variant={currentStatus === 'INTERESTED' ? 'primary' : 'outline'}
                  className="w-full"
                >
                  {currentStatus === 'INTERESTED' && <CheckCircle className="w-4 h-4 mr-2" />}
                  I&apos;m Interested
                </Button>

                {currentStatus && (
                  <Button
                    onClick={handleCancelRsvp}
                    disabled={loading || success}
                    variant="outline"
                    className="w-full text-red-600 border-red-600 hover:bg-red-50"
                  >
                    Cancel RSVP
                  </Button>
                )}
              </div>

              {isFull && currentStatus !== 'GOING' && (
                <p className="text-sm text-red-600 font-medium">
                  This event is at capacity. You can mark yourself as &quot;Interested&quot; to be notified if spots open up.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
