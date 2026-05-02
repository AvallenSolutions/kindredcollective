'use client'

import { useState } from 'react'
import { Trash2, RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ResourceAdminActionsProps {
  resourceId: string
  status: string
}

export function ResourceAdminActions({ resourceId, status }: ResourceAdminActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleAction(updates: Record<string, unknown>) {
    setLoading(true)
    try {
      await fetch(`/api/resources/${resourceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      router.refresh()
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      {status === 'PUBLISHED' ? (
        <button
          onClick={() => handleAction({ status: 'REMOVED' })}
          disabled={loading}
          className="p-1.5 border border-black bg-white text-xs hover:bg-red-200 transition-colors disabled:opacity-50"
          title="Remove resource"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button
          onClick={() => handleAction({ status: 'PUBLISHED' })}
          disabled={loading}
          className="p-1.5 border border-black bg-white text-xs hover:bg-green-200 transition-colors disabled:opacity-50"
          title="Restore resource"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
