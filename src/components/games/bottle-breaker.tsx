'use client'

import { useRef, useEffect, useState, useCallback } from 'react'

// ─── Brand colours ───────────────────────────────────────────────────────────
const CYAN = '#00D9FF'
const CORAL = '#FF5D5D'
const LIME = '#CCFF00'
const AMBER = '#FBBF24'
const PURPLE = '#A855F7'
const BLACK = '#000000'
const WHITE = '#FFFFFF'

// ─── Level generation (99 levels) ────────────────────────────────────────────
interface LevelDef {
  name: string
  rows: number
  cols: number
  ballSpeed: number
  maxHits: number
  paddleWidth: number
}

const NAMED_LEVELS: Record<number, string> = {
  1: 'The Warm-Up',
  2: 'Happy Hour',
  3: 'Last Orders',
  4: 'After Party',
  5: 'The Morning After',
  10: 'Second Round',
  15: 'On The Rocks',
  20: 'Shaken Not Stirred',
  25: 'Double Shot',
  30: 'Neat Pour',
  35: 'Top Shelf',
  40: 'Barrel Aged',
  45: 'Cask Strength',
  50: 'Halfway House',
  55: 'Proof Positive',
  60: 'Spirit Level',
  65: 'High Ball',
  70: 'Full Measure',
  75: 'Last Call',
  80: 'Lock-In',
  85: 'Nightcap',
  90: 'One More Round',
  95: 'The Final Straw',
  99: 'Legendary',
}

function generateLevel(n: number): LevelDef {
  // n is 1-indexed (1..99)
  const t = (n - 1) / 98 // 0..1 normalised progression

  const rows = Math.min(3 + Math.floor(t * 6), 9)           // 3 → 9
  const cols = Math.min(7 + Math.floor(t * 5), 12)           // 7 → 12
  const ballSpeed = 4 + t * 4                                 // 4 → 8
  const maxHits = n >= 4 ? Math.min(1 + Math.floor(t * 3), 3) : 1  // 1 → 3
  const paddleWidth = Math.max(100 - Math.floor(t * 40), 60) // 100 → 60

  const name = NAMED_LEVELS[n] ?? `Level ${n}`

  return { name, rows, cols, ballSpeed, maxHits, paddleWidth }
}

const TOTAL_LEVELS = 99
const BOTTLE_COLOURS = [CYAN, CORAL, LIME, AMBER, PURPLE]

const LEVEL_COMPLETE_MESSAGES = [
  'Nice warm-up! Time to pick up the pace.',
  'The drinks are flowing! Keep it going.',
  'Last orders at the bar — but not for you.',
  'Still standing after the after party!',
  'You survived the morning after. Respect.',
]

function getLevelMessage(levelIdx: number): string {
  if (levelIdx < LEVEL_COMPLETE_MESSAGES.length) return LEVEL_COMPLETE_MESSAGES[levelIdx]
  if (levelIdx >= 90) return 'Absolutely legendary. Keep going!'
  if (levelIdx >= 70) return 'Are you even human? Incredible.'
  if (levelIdx >= 50) return 'Halfway and beyond. Unstoppable.'
  if (levelIdx >= 30) return 'Serious skills on display here.'
  if (levelIdx >= 15) return 'Getting into the groove now.'
  return 'Smashed it! On to the next one.'
}

// ─── Leaderboard API ─────────────────────────────────────────────────────────
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
  } catch {
    return []
  }
}

async function submitScore(name: string, score: number, level: number): Promise<HighScore[]> {
  try {
    await fetch('/api/game-scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score, level }),
    })
    return fetchScores()
  } catch {
    return []
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface Brick {
  x: number
  y: number
  w: number
  h: number
  hits: number
  colour: string
  alive: boolean
}

interface Ball { x: number; y: number; dx: number; dy: number; r: number }
interface Paddle { x: number; y: number; w: number; h: number }
interface Particle {
  x: number; y: number; dx: number; dy: number
  life: number; maxLife: number; colour: string; size: number
}

type GameState = 'idle' | 'playing' | 'level-complete' | 'lost' | 'beaten'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function buildBricks(level: LevelDef, canvasW: number): Brick[] {
  const bricks: Brick[] = []
  const padding = 6
  const topOffset = 50
  const brickH = 22
  const totalPaddingW = padding * (level.cols + 1)
  const brickW = (canvasW - totalPaddingW) / level.cols

  for (let r = 0; r < level.rows; r++) {
    const rowColour = BOTTLE_COLOURS[r % BOTTLE_COLOURS.length]
    for (let c = 0; c < level.cols; c++) {
      bricks.push({
        x: padding + c * (brickW + padding),
        y: topOffset + r * (brickH + padding),
        w: brickW,
        h: brickH,
        hits: r < 2 && level.maxHits > 1 ? level.maxHits : 1,
        colour: rowColour,
        alive: true,
      })
    }
  }
  return bricks
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function BottleBreaker() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)
  const stateRef = useRef<{
    ball: Ball
    paddle: Paddle
    bricks: Brick[]
    particles: Particle[]
    lives: number
    score: number
    gameState: GameState
    level: number
    canvasW: number
    canvasH: number
    pointerX: number | null
  }>({
    ball: { x: 0, y: 0, dx: 0, dy: 0, r: 7 },
    paddle: { x: 0, y: 0, w: 100, h: 14 },
    bricks: [],
    particles: [],
    lives: 3,
    score: 0,
    gameState: 'idle',
    level: 0,
    canvasW: 480,
    canvasH: 600,
    pointerX: null,
  })

  const [displayState, setDisplayState] = useState<GameState>('idle')
  const [displayLevel, setDisplayLevel] = useState(0)
  const [displayScore, setDisplayScore] = useState(0)
  const [displayLives, setDisplayLives] = useState(3)
  const [highScores, setHighScores] = useState<HighScore[]>([])
  const [nameInput, setNameInput] = useState('')
  const [scoreSaved, setScoreSaved] = useState(false)
  const [qualifiesForBoard, setQualifiesForBoard] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load scores on mount
  useEffect(() => {
    fetchScores().then(setHighScores)
  }, [])

  function checkQualifies(score: number): boolean {
    if (highScores.length < 20) return score > 0
    return score > (highScores[highScores.length - 1]?.score ?? 0)
  }

  // ── Initialise / reset a level ──────────────────────────────────────────
  const initLevel = useCallback((levelIdx: number) => {
    const s = stateRef.current
    const lv = generateLevel(levelIdx + 1)
    s.level = levelIdx
    s.bricks = buildBricks(lv, s.canvasW)
    s.paddle.w = lv.paddleWidth
    s.paddle.x = (s.canvasW - lv.paddleWidth) / 2
    s.paddle.y = s.canvasH - 36
    s.ball = {
      x: s.canvasW / 2,
      y: s.paddle.y - 10,
      dx: lv.ballSpeed * (Math.random() > 0.5 ? 1 : -1) * 0.7,
      dy: -lv.ballSpeed,
      r: 7,
    }
    s.particles = []
    setDisplayLevel(levelIdx)
  }, [])

  const startGame = useCallback(() => {
    const s = stateRef.current
    s.lives = 3
    s.score = 0
    s.gameState = 'playing'
    initLevel(0)
    setDisplayState('playing')
    setDisplayScore(0)
    setDisplayLives(3)
    setScoreSaved(false)
    setQualifiesForBoard(false)
    setNameInput('')
  }, [initLevel])

  const continueToNextLevel = useCallback(() => {
    const s = stateRef.current
    const nextLevel = s.level + 1
    if (nextLevel < TOTAL_LEVELS) {
      s.gameState = 'playing'
      initLevel(nextLevel)
      setDisplayState('playing')
    }
  }, [initLevel])

  const handleGameEnd = useCallback((state: 'lost' | 'beaten') => {
    const s = stateRef.current
    s.gameState = state
    setDisplayState(state)
    setScoreSaved(false)
    setNameInput('')
    setQualifiesForBoard(checkQualifies(s.score))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highScores])

  const handleSaveScore = useCallback(async () => {
    const s = stateRef.current
    const name = nameInput.trim() || 'Anonymous'
    setSaving(true)
    const updated = await submitScore(name, s.score, s.level + 1)
    setHighScores(updated)
    setScoreSaved(true)
    setSaving(false)
  }, [nameInput])

  // ── Spawn particles on brick break ──────────────────────────────────────
  function spawnParticles(s: typeof stateRef.current, brick: Brick) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 3
      s.particles.push({
        x: brick.x + brick.w / 2,
        y: brick.y + brick.h / 2,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        colour: brick.colour,
        size: 3 + Math.random() * 4,
      })
    }
  }

  // ── Main game loop ──────────────────────────────────────────────────────
  const loop = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const s = stateRef.current

    ctx.fillStyle = WHITE
    ctx.fillRect(0, 0, s.canvasW, s.canvasH)

    // Update particles
    s.particles = s.particles.filter(p => {
      p.x += p.dx; p.y += p.dy; p.dy += 0.1; p.life--
      return p.life > 0
    })

    if (s.gameState === 'playing') {
      if (s.pointerX !== null) s.paddle.x = s.pointerX - s.paddle.w / 2
      s.paddle.x = Math.max(0, Math.min(s.canvasW - s.paddle.w, s.paddle.x))

      s.ball.x += s.ball.dx
      s.ball.y += s.ball.dy

      // Wall bounce
      if (s.ball.x - s.ball.r <= 0) { s.ball.x = s.ball.r; s.ball.dx = Math.abs(s.ball.dx) }
      if (s.ball.x + s.ball.r >= s.canvasW) { s.ball.x = s.canvasW - s.ball.r; s.ball.dx = -Math.abs(s.ball.dx) }
      if (s.ball.y - s.ball.r <= 0) { s.ball.y = s.ball.r; s.ball.dy = Math.abs(s.ball.dy) }

      // Bottom — lose life
      if (s.ball.y + s.ball.r > s.canvasH) {
        s.lives--
        setDisplayLives(s.lives)
        if (s.lives <= 0) {
          handleGameEnd('lost')
        } else {
          const lv = generateLevel(s.level + 1)
          s.ball = {
            x: s.paddle.x + s.paddle.w / 2,
            y: s.paddle.y - 10,
            dx: lv.ballSpeed * (Math.random() > 0.5 ? 1 : -1) * 0.7,
            dy: -lv.ballSpeed,
            r: 7,
          }
        }
      }

      // Paddle bounce
      if (
        s.ball.dy > 0 &&
        s.ball.y + s.ball.r >= s.paddle.y &&
        s.ball.y + s.ball.r <= s.paddle.y + s.paddle.h + 4 &&
        s.ball.x >= s.paddle.x &&
        s.ball.x <= s.paddle.x + s.paddle.w
      ) {
        s.ball.dy = -Math.abs(s.ball.dy)
        const hitPos = (s.ball.x - s.paddle.x) / s.paddle.w
        const angle = (hitPos - 0.5) * 1.2
        const speed = Math.sqrt(s.ball.dx ** 2 + s.ball.dy ** 2)
        s.ball.dx = speed * Math.sin(angle)
        s.ball.dy = -speed * Math.cos(angle)
      }

      // Brick collision
      for (const brick of s.bricks) {
        if (!brick.alive) continue
        if (
          s.ball.x + s.ball.r > brick.x &&
          s.ball.x - s.ball.r < brick.x + brick.w &&
          s.ball.y + s.ball.r > brick.y &&
          s.ball.y - s.ball.r < brick.y + brick.h
        ) {
          const oL = (s.ball.x + s.ball.r) - brick.x
          const oR = (brick.x + brick.w) - (s.ball.x - s.ball.r)
          const oT = (s.ball.y + s.ball.r) - brick.y
          const oB = (brick.y + brick.h) - (s.ball.y - s.ball.r)
          if (Math.min(oL, oR) < Math.min(oT, oB)) s.ball.dx = -s.ball.dx
          else s.ball.dy = -s.ball.dy

          brick.hits--
          if (brick.hits <= 0) {
            brick.alive = false
            s.score += 10
            spawnParticles(s, brick)
          } else {
            s.score += 5
          }
          setDisplayScore(s.score)
          break
        }
      }

      // Level clear
      if (s.bricks.every(b => !b.alive)) {
        if (s.level + 1 < TOTAL_LEVELS) {
          s.gameState = 'level-complete'
          setDisplayState('level-complete')
        } else {
          handleGameEnd('beaten')
        }
      }
    }

    // ── DRAW ──────────────────────────────────────────────────────────────
    for (const p of s.particles) {
      ctx.globalAlpha = p.life / p.maxLife
      ctx.fillStyle = p.colour
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
    }
    ctx.globalAlpha = 1

    for (const brick of s.bricks) {
      if (!brick.alive) continue
      const isMultiHit = brick.hits > 1
      ctx.fillStyle = BLACK
      ctx.fillRect(brick.x + 3, brick.y + 3, brick.w, brick.h)
      ctx.fillStyle = isMultiHit ? WHITE : brick.colour
      ctx.fillRect(brick.x, brick.y, brick.w, brick.h)
      ctx.strokeStyle = BLACK
      ctx.lineWidth = 2
      ctx.strokeRect(brick.x, brick.y, brick.w, brick.h)
      if (isMultiHit) {
        ctx.strokeStyle = brick.colour
        ctx.lineWidth = 2
        ctx.setLineDash([4, 3])
        ctx.strokeRect(brick.x + 4, brick.y + 4, brick.w - 8, brick.h - 8)
        ctx.setLineDash([])
      }
    }

    // Paddle
    ctx.fillStyle = BLACK
    ctx.fillRect(s.paddle.x + 3, s.paddle.y + 3, s.paddle.w, s.paddle.h)
    ctx.fillStyle = BLACK
    ctx.fillRect(s.paddle.x, s.paddle.y, s.paddle.w, s.paddle.h)
    ctx.strokeStyle = BLACK
    ctx.lineWidth = 2
    ctx.strokeRect(s.paddle.x, s.paddle.y, s.paddle.w, s.paddle.h)
    ctx.fillStyle = CYAN
    ctx.fillRect(s.paddle.x + 4, s.paddle.y + 4, s.paddle.w - 8, 6)

    // Ball
    ctx.fillStyle = BLACK
    ctx.beginPath()
    ctx.arc(s.ball.x + 2, s.ball.y + 2, s.ball.r, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = CORAL
    ctx.beginPath()
    ctx.arc(s.ball.x, s.ball.y, s.ball.r, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = BLACK
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(s.ball.x, s.ball.y, s.ball.r, 0, Math.PI * 2)
    ctx.stroke()

    animRef.current = requestAnimationFrame(loop)
  }, [handleGameEnd])

  // ── Canvas sizing ───────────────────────────────────────────────────────
  const resize = useCallback(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return
    const rect = container.getBoundingClientRect()
    const w = Math.min(rect.width, 520)
    const h = Math.min(w * 1.25, 650)
    canvas.width = w
    canvas.height = h
    stateRef.current.canvasW = w
    stateRef.current.canvasH = h
    stateRef.current.paddle.y = h - 36
  }, [])

  useEffect(() => {
    resize()
    window.addEventListener('resize', resize)
    animRef.current = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [resize, loop])

  // ── Pointer handling ────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function getX(e: MouseEvent | TouchEvent) {
      const rect = canvas!.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      return clientX - rect.left
    }

    function onMove(e: MouseEvent | TouchEvent) {
      e.preventDefault()
      stateRef.current.pointerX = getX(e)
    }

    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('touchmove', onMove, { passive: false })
    canvas.addEventListener('touchstart', onMove, { passive: false })

    return () => {
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('touchmove', onMove)
      canvas.removeEventListener('touchstart', onMove)
    }
  }, [])

  // ── Shared UI ─────────────────────────────────────────────────────────
  const btnClass = 'px-8 py-3 border-2 border-black font-display font-bold uppercase text-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all neo-shadow'

  const scoreboard = (
    <div className="w-full max-w-xs mt-3">
      <h4 className="font-display text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 text-center">
        High Scores
      </h4>
      {highScores.length === 0 ? (
        <p className="text-gray-500 text-xs text-center">No scores yet — be the first!</p>
      ) : (
        <div className="space-y-1">
          {highScores.slice(0, 10).map((hs, i) => (
            <div
              key={hs.id}
              className={`flex items-center justify-between text-xs px-3 py-1.5 border border-black/20 ${
                i === 0 ? 'bg-lime/30 font-bold' : i === 1 ? 'bg-cyan/20' : i === 2 ? 'bg-coral/20' : 'bg-white/50'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-gray-400 w-4 text-right">{i + 1}.</span>
                <span className="text-white font-bold truncate max-w-[120px]">{hs.name}</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-gray-400">Lv{hs.level}</span>
                <span className="text-white font-bold w-12 text-right">{hs.score}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const nameEntry = (
    <div className="w-full max-w-xs">
      {!scoreSaved ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !saving && handleSaveScore()}
            placeholder="Your name"
            maxLength={20}
            className="flex-1 px-3 py-2 bg-white/10 border-2 border-white/30 text-white font-bold text-sm placeholder:text-gray-500 focus:outline-none focus:border-cyan"
          />
          <button
            onClick={handleSaveScore}
            disabled={saving}
            className={`${btnClass} bg-cyan text-black ${saving ? 'opacity-50' : ''}`}
          >
            {saving ? '...' : 'Save'}
          </button>
        </div>
      ) : (
        <p className="text-cyan text-xs font-bold text-center uppercase tracking-wider">Score saved!</p>
      )}
    </div>
  )

  // ── Render ──────────────────────────────────────────────────────────────
  const currentLevel = generateLevel(displayLevel + 1)

  return (
    <div className="w-full max-w-[540px] mx-auto">
      {/* HUD */}
      <div className="flex items-center justify-between mb-3 px-1 font-display text-xs font-bold uppercase tracking-wider">
        <span>
          Level {displayLevel + 1}
          <span className="text-gray-400 ml-1">/ {TOTAL_LEVELS}</span>
        </span>
        <span className="text-cyan truncate mx-2">{currentLevel.name}</span>
        <span className="flex gap-3">
          <span>Score: {displayScore}</span>
          <span>
            {Array.from({ length: displayLives }).map((_, i) => (
              <span key={i} className="text-coral">&#9679;</span>
            ))}
          </span>
        </span>
      </div>

      {/* Canvas container */}
      <div ref={containerRef} className="relative w-full border-3 border-black neo-shadow bg-white">
        <canvas ref={canvasRef} className="block w-full" style={{ touchAction: 'none' }} />

        {/* ── Idle ── */}
        {displayState === 'idle' && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4 px-6 overflow-y-auto py-6">
            <h3 className="font-display text-3xl md:text-4xl font-bold uppercase text-white text-center">
              Bottle Breaker
            </h3>
            <p className="text-gray-300 text-sm text-center max-w-xs">
              Smash through the bottles before they smash your spirit. 99 levels. 3 lives. Move the paddle with your mouse or finger.
            </p>
            <button onClick={startGame} className={`${btnClass} bg-cyan text-black`}>
              Start Game
            </button>
            {highScores.length > 0 && scoreboard}
          </div>
        )}

        {/* ── Level complete ── */}
        {displayState === 'level-complete' && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4 px-6">
            <div className="px-4 py-1 bg-cyan border-2 border-black rotate-[-2deg] neo-shadow mb-1">
              <span className="text-xs font-bold uppercase tracking-widest">Level {displayLevel + 1} Complete</span>
            </div>
            <h3 className="font-display text-2xl md:text-3xl font-bold uppercase text-white text-center">
              {currentLevel.name}
            </h3>
            <p className="text-gray-300 text-sm text-center max-w-xs">
              {getLevelMessage(displayLevel)}
            </p>
            <p className="text-cyan text-lg font-bold">Score: {displayScore}</p>
            <p className="text-gray-400 text-xs">
              {displayLives} {displayLives === 1 ? 'life' : 'lives'} remaining
            </p>
            <button onClick={continueToNextLevel} className={`${btnClass} bg-lime text-black`}>
              Next Level
            </button>
          </div>
        )}

        {/* ── Game over ── */}
        {displayState === 'lost' && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4 px-6 overflow-y-auto py-6">
            <h3 className="font-display text-3xl font-bold uppercase text-coral text-center">
              Game Over
            </h3>
            <p className="text-white text-lg font-bold">Score: {displayScore}</p>
            <p className="text-gray-400 text-xs">
              Reached level {displayLevel + 1} — {currentLevel.name}
            </p>
            {qualifiesForBoard && nameEntry}
            <button onClick={startGame} className={`${btnClass} bg-coral text-white`}>
              Try Again
            </button>
            {scoreboard}
          </div>
        )}

        {/* ── All levels beaten ── */}
        {displayState === 'beaten' && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4 px-6 overflow-y-auto py-6">
            <div className="px-4 py-1 bg-lime border-2 border-black rotate-[-2deg] neo-shadow mb-1">
              <span className="text-xs font-bold uppercase tracking-widest">Champion</span>
            </div>
            <h3 className="font-display text-3xl font-bold uppercase text-white text-center">
              All 99 Levels Smashed!
            </h3>
            <p className="text-lime text-lg font-bold">Final Score: {displayScore}</p>
            {qualifiesForBoard && nameEntry}
            <div className="flex gap-3 mt-1">
              <button onClick={startGame} className={`${btnClass} bg-white text-black`}>
                Play Again
              </button>
            </div>
            {scoreboard}
          </div>
        )}
      </div>
    </div>
  )
}
