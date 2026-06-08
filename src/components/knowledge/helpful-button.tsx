'use client'

import { useState } from 'react'
import { ThumbsUp, Check } from 'lucide-react'

export function HelpfulButton({ slug, initialCount }: { slug: string; initialCount: number }) {
  const [count, setCount] = useState(initialCount)
  const [done, setDone] = useState(false)
  const [pending, setPending] = useState(false)

  async function vote() {
    if (done || pending) return
    setPending(true)
    try {
      const res = await fetch(`/api/knowledge/${slug}/helpful`, { method: 'POST' })
      const json = await res.json()
      if (json?.success && typeof json.data?.helpfulCount === 'number') {
        setCount(json.data.helpfulCount)
      } else {
        setCount((c) => c + 1)
      }
      setDone(true)
    } catch {
      // best-effort feedback; ignore network errors
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      onClick={vote}
      disabled={done || pending}
      className={`inline-flex items-center gap-2 px-4 py-2 border-2 border-black font-bold uppercase text-sm transition-colors neo-shadow ${
        done ? 'bg-lime cursor-default' : 'bg-white hover:bg-cyan'
      }`}
    >
      {done ? <Check className="w-4 h-4" /> : <ThumbsUp className="w-4 h-4" />}
      {done ? 'Thanks!' : 'Helpful'}
      <span className="text-gray-500">({count})</span>
    </button>
  )
}
