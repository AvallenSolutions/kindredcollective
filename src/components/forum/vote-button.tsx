'use client'

import { useState } from 'react'
import { ArrowBigUp, ArrowBigDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ForumVoteButtonProps {
  targetType: 'post' | 'comment'
  targetId: string
  initialScore: number
  initialUserVote: number
  horizontal?: boolean
}

export function ForumVoteButton({
  targetType,
  targetId,
  initialScore,
  initialUserVote,
  horizontal = false,
}: ForumVoteButtonProps) {
  const [score, setScore] = useState(initialScore)
  const [userVote, setUserVote] = useState(initialUserVote)
  const [loading, setLoading] = useState(false)

  async function handleVote(value: 1 | -1) {
    if (loading) return

    const newValue = userVote === value ? 0 : value
    const scoreDiff = newValue - userVote

    // Optimistic update
    setScore(score + scoreDiff)
    setUserVote(newValue)
    setLoading(true)

    try {
      const url = targetType === 'post'
        ? `/api/forum/posts/${targetId}/vote`
        : `/api/forum/comments/${targetId}/vote`

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: newValue }),
      })

      if (!res.ok) {
        // Revert on failure
        setScore(score)
        setUserVote(userVote)
      }
    } catch {
      setScore(score)
      setUserVote(userVote)
    } finally {
      setLoading(false)
    }
  }

  if (horizontal) {
    return (
      <div className="inline-flex items-center gap-1 border-2 border-black">
        <button
          onClick={() => handleVote(1)}
          className={cn(
            'p-1.5 hover:bg-cyan transition-colors',
            userVote === 1 && 'bg-cyan'
          )}
          aria-label="Upvote"
        >
          <ArrowBigUp className="w-5 h-5" />
        </button>
        <span className="font-display font-bold text-sm px-1">{score}</span>
        <button
          onClick={() => handleVote(-1)}
          className={cn(
            'p-1.5 hover:bg-coral transition-colors',
            userVote === -1 && 'bg-coral'
          )}
          aria-label="Downvote"
        >
          <ArrowBigDown className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        onClick={() => handleVote(1)}
        className={cn(
          'p-1 hover:text-cyan transition-colors rounded',
          userVote === 1 && 'text-cyan'
        )}
        aria-label="Upvote"
      >
        <ArrowBigUp className={cn('w-7 h-7', userVote === 1 && 'fill-current')} />
      </button>
      <span className="font-display font-bold text-xl leading-none">{score}</span>
      <button
        onClick={() => handleVote(-1)}
        className={cn(
          'p-1 hover:text-coral transition-colors rounded',
          userVote === -1 && 'text-coral'
        )}
        aria-label="Downvote"
      >
        <ArrowBigDown className={cn('w-7 h-7', userVote === -1 && 'fill-current')} />
      </button>
    </div>
  )
}
