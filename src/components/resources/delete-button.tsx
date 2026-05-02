'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'

export function ResourceDeleteButton({
  resourceId,
  isAdminAction,
}: {
  resourceId: string
  isAdminAction: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    const confirmText = isAdminAction
      ? 'Remove this resource (soft delete)?'
      : 'Delete this resource? This cannot be undone.'
    if (!confirm(confirmText)) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/resources/${resourceId}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        router.push('/community/resources')
        router.refresh()
      } else {
        setError(data.error || 'Failed to delete')
        setLoading(false)
      }
    } catch {
      setError('Failed to delete')
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleDelete}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-black font-bold uppercase text-xs hover:bg-red-100 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        {isAdminAction ? 'Remove' : 'Delete'}
      </button>
      {error && <span className="text-xs font-bold text-coral">{error}</span>}
    </div>
  )
}
