'use client'

import { Calendar } from 'lucide-react'

export function CalendarButtons() {
  const handleGoogle = () => {
    const feedUrl = `${window.location.origin}/api/events/calendar`
    const webcalUrl = feedUrl.replace(/^https?:\/\//, 'webcal://')
    window.open(
      `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`,
      '_blank'
    )
  }

  const handleIcal = () => {
    window.location.href = '/api/events/calendar'
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={handleGoogle}
        className="px-6 py-3 bg-cyan text-black border-2 border-black font-bold uppercase hover:bg-white transition-colors flex items-center gap-2"
      >
        <Calendar className="w-5 h-5" />
        Add to Google
      </button>
      <button
        onClick={handleIcal}
        className="px-6 py-3 bg-white text-black border-2 border-black font-bold uppercase hover:bg-cyan transition-colors"
      >
        iCal
      </button>
    </div>
  )
}
