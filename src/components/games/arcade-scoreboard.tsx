'use client'

import { useState, useEffect } from 'react'

interface HighScore {
  id: string
  name: string
  score: number
  level: number
  createdAt: string
}

async function fetchScores(): Promise<HighScore[]> {
  try {
    const res = await fetch('/api/game-scores')
    if (!res.ok) return []
    const json = await res.json()
    return json.data ?? []
  } catch { return [] }
}

const RANK_COLOURS = [
  '#CCFF00', // 1st - lime
  '#00D9FF', // 2nd - cyan
  '#FF5D5D', // 3rd - coral
  '#FBBF24', // 4th - amber
  '#A855F7', // 5th - purple
]

export default function ArcadeScoreboard() {
  const [scores, setScores] = useState<HighScore[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchScores().then(s => {
      setScores(s)
      setLoading(false)
    })
  }, [])

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Cabinet frame */}
      <div className="relative bg-black border-4 border-gray-700 rounded-sm overflow-hidden">
        {/* Scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
          }}
        />

        {/* CRT vignette */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            boxShadow: 'inset 0 0 80px rgba(0,0,0,0.6), inset 0 0 20px rgba(0,0,0,0.3)',
          }}
        />

        <div className="relative z-0 p-6 pb-8">
          {/* Title */}
          <div className="text-center mb-6">
            <h2
              className="font-display text-2xl font-bold uppercase tracking-[0.3em] mb-1"
              style={{
                color: '#00D9FF',
                textShadow: '0 0 10px #00D9FF, 0 0 20px #00D9FF, 0 0 40px #00D9FF55',
              }}
            >
              High Scores
            </h2>
            <div className="flex items-center justify-center gap-2">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-500/50" />
              <span
                className="text-[10px] font-bold uppercase tracking-[0.5em]"
                style={{ color: '#FF5D5D', textShadow: '0 0 8px #FF5D5D88' }}
              >
                Bottle Breaker
              </span>
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-500/50" />
            </div>
          </div>

          {/* Column headers */}
          <div className="flex items-center text-[10px] font-bold uppercase tracking-[0.2em] mb-3 px-2"
            style={{ color: '#666' }}
          >
            <span className="w-8 text-center">RK</span>
            <span className="flex-1 pl-2">Player</span>
            <span className="w-12 text-center">LVL</span>
            <span className="w-16 text-right">Score</span>
          </div>

          <div className="h-px bg-gray-800 mb-2" />

          {/* Scores */}
          {loading ? (
            <div className="text-center py-8">
              <p
                className="text-sm font-display font-bold uppercase tracking-widest animate-pulse"
                style={{ color: '#FBBF24', textShadow: '0 0 10px #FBBF2488' }}
              >
                Loading...
              </p>
            </div>
          ) : scores.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <p
                className="text-sm font-display font-bold uppercase tracking-widest"
                style={{ color: '#CCFF00', textShadow: '0 0 10px #CCFF0088' }}
              >
                No Scores Yet
              </p>
              <p
                className="text-xs font-bold uppercase tracking-[0.3em] animate-pulse"
                style={{ color: '#FF5D5D', textShadow: '0 0 8px #FF5D5D66' }}
              >
                Insert Coin to Play
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {scores.slice(0, 20).map((hs, i) => {
                const colour = RANK_COLOURS[i] ?? '#888'
                const isTop3 = i < 3
                return (
                  <div
                    key={hs.id}
                    className="flex items-center px-2 py-1.5 transition-colors hover:bg-white/5"
                    style={{
                      borderLeft: isTop3 ? `3px solid ${colour}` : '3px solid transparent',
                    }}
                  >
                    {/* Rank */}
                    <span
                      className="w-8 text-center font-display font-bold text-sm"
                      style={{
                        color: colour,
                        textShadow: isTop3 ? `0 0 8px ${colour}66` : 'none',
                      }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>

                    {/* Name */}
                    <span
                      className="flex-1 pl-2 font-display font-bold text-sm uppercase truncate"
                      style={{
                        color: isTop3 ? '#fff' : '#aaa',
                        textShadow: isTop3 ? `0 0 6px ${colour}44` : 'none',
                      }}
                    >
                      {hs.name}
                    </span>

                    {/* Level */}
                    <span
                      className="w-12 text-center text-xs font-bold"
                      style={{ color: '#666' }}
                    >
                      {hs.level}
                    </span>

                    {/* Score */}
                    <span
                      className="w-16 text-right font-display font-bold text-sm tabular-nums"
                      style={{
                        color: colour,
                        textShadow: isTop3 ? `0 0 10px ${colour}88` : 'none',
                      }}
                    >
                      {hs.score.toLocaleString()}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          <div className="h-px bg-gray-800 mt-3" />

          {/* Footer */}
          <div className="text-center mt-4">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.4em] animate-pulse"
              style={{ color: '#FBBF24', textShadow: '0 0 8px #FBBF2466' }}
            >
              Play Above to Enter Your Name
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
