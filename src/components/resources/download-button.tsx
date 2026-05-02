'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

export function ResourceDownloadButton({ resourceId }: { resourceId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDownload() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/resources/${resourceId}/download`, { method: 'POST' })
      const data = await res.json()

      if (data.success && data.data?.url) {
        const a = document.createElement('a')
        a.href = data.data.url
        if (data.data.fileName) a.download = data.data.fileName
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else {
        setError(data.error || 'Download failed')
      }
    } catch {
      setError('Download failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="inline-flex items-center gap-2 px-6 py-3 bg-coral text-white border-2 border-black font-bold uppercase text-sm neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
        {loading ? 'Preparing...' : 'Download'}
      </button>
      {error && <p className="mt-2 text-sm font-bold text-coral">{error}</p>}
    </div>
  )
}
