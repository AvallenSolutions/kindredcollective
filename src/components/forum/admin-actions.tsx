'use client'

import { useState } from 'react'
import { Pin, Trash2, RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ForumAdminActionsProps {
  postId: string
  isPinned: boolean
  status: string
}

export function ForumAdminActions({ postId, isPinned, status }: ForumAdminActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleAction(updates: Record<string, unknown>) {
    setLoading(true)
    try {
      await fetch(`/api/forum/posts/${postId}`, {
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
      <button
        onClick={() => handleAction({ isPinned: !isPinned })}
        disabled={loading}
        className={`p-1.5 border border-black text-xs hover:bg-amber-400 transition-colors disabled:opacity-50 ${
          isPinned ? 'bg-amber-400' : 'bg-white'
        }`}
        title={isPinned ? 'Unpin' : 'Pin'}
      >
        <Pin className="w-3.5 h-3.5" />
      </button>
      {status === 'PUBLISHED' ? (
        <button
          onClick={() => handleAction({ status: 'REMOVED' })}
          disabled={loading}
          className="p-1.5 border border-black bg-white text-xs hover:bg-red-200 transition-colors disabled:opacity-50"
          title="Remove post"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button
          onClick={() => handleAction({ status: 'PUBLISHED' })}
          disabled={loading}
          className="p-1.5 border border-black bg-white text-xs hover:bg-green-200 transition-colors disabled:opacity-50"
          title="Restore post"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
