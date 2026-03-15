'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

interface Props {
  source?: string
  className?: string
  inputClassName?: string
  buttonClassName?: string
  buttonLabel?: string
  successClassName?: string
}

export function NewsletterForm({
  source = 'website',
  className = 'flex flex-col sm:flex-row gap-2 max-w-md mx-auto',
  inputClassName = 'flex-1 px-4 py-3 bg-white text-black font-bold focus:outline-none border-2 border-black',
  buttonClassName = 'px-6 py-3 bg-black text-white font-bold uppercase hover:bg-white hover:text-black transition-colors border-2 border-black',
  buttonLabel = 'Subscribe',
  successClassName = 'flex items-center justify-center gap-2 font-bold py-3',
}: Props) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  if (status === 'success') {
    return (
      <div className={successClassName}>
        <Check className="w-5 h-5" />
        You&apos;re subscribed!
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setStatus('success')
      } else {
        setErrorMsg(data.error || 'Something went wrong')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className={className}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={status === 'loading'}
          className={inputClassName}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className={buttonClassName}
        >
          {status === 'loading' ? 'Subscribing...' : buttonLabel}
        </button>
      </form>
      {status === 'error' && (
        <p className="text-sm text-red-500 mt-2 text-center">{errorMsg}</p>
      )}
    </div>
  )
}
