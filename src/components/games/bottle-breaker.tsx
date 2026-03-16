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

// ─── Level definitions ───────────────────────────────────────────────────────
interface LevelDef {
  name: string
  rows: number
  cols: number
  ballSpeed: number
  /** max hits for multi-hit bottles (1 = one hit) */
  maxHits: number
  paddleWidth: number
}

const LEVELS: LevelDef[] = [
  { name: 'The Warm-Up', rows: 3, cols: 7, ballSpeed: 4, maxHits: 1, paddleWidth: 100 },
  { name: 'Happy Hour', rows: 4, cols: 8, ballSpeed: 4.5, maxHits: 1, paddleWidth: 95 },
  { name: 'Last Orders', rows: 5, cols: 8, ballSpeed: 5, maxHits: 1, paddleWidth: 90 },
  { name: 'After Party', rows: 5, cols: 8, ballSpeed: 5.5, maxHits: 2, paddleWidth: 85 },
  { name: 'The Morning After', rows: 6, cols: 9, ballSpeed: 6, maxHits: 2, paddleWidth: 80 },
]

const BOTTLE_COLOURS = [CYAN, CORAL, LIME, AMBER, PURPLE]

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

interface Ball {
  x: number
  y: number
  dx: number
  dy: number
  r: number
}

interface Paddle {
  x: number
  y: number
  w: number
  h: number
}

interface Particle {
  x: number
  y: number
  dx: number
  dy: number
  life: number
  maxLife: number
  colour: string
  size: number
}

type GameState = 'idle' | 'playing' | 'won' | 'lost' | 'beaten'

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

  // ── Initialise / reset a level ──────────────────────────────────────────
  const initLevel = useCallback((levelIdx: number) => {
    const s = stateRef.current
    const lv = LEVELS[levelIdx]
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
  }, [initLevel])

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

    // — Clear —
    ctx.fillStyle = WHITE
    ctx.fillRect(0, 0, s.canvasW, s.canvasH)

    // — Update particles —
    s.particles = s.particles.filter(p => {
      p.x += p.dx
      p.y += p.dy
      p.dy += 0.1 // gravity
      p.life--
      return p.life > 0
    })

    if (s.gameState === 'playing') {
      // — Move paddle toward pointer —
      if (s.pointerX !== null) {
        s.paddle.x = s.pointerX - s.paddle.w / 2
      }
      // clamp paddle
      s.paddle.x = Math.max(0, Math.min(s.canvasW - s.paddle.w, s.paddle.x))

      // — Move ball —
      s.ball.x += s.ball.dx
      s.ball.y += s.ball.dy

      // wall bounce
      if (s.ball.x - s.ball.r <= 0) { s.ball.x = s.ball.r; s.ball.dx = Math.abs(s.ball.dx) }
      if (s.ball.x + s.ball.r >= s.canvasW) { s.ball.x = s.canvasW - s.ball.r; s.ball.dx = -Math.abs(s.ball.dx) }
      if (s.ball.y - s.ball.r <= 0) { s.ball.y = s.ball.r; s.ball.dy = Math.abs(s.ball.dy) }

      // bottom — lose life
      if (s.ball.y + s.ball.r > s.canvasH) {
        s.lives--
        setDisplayLives(s.lives)
        if (s.lives <= 0) {
          s.gameState = 'lost'
          setDisplayState('lost')
        } else {
          // reset ball on paddle
          const lv = LEVELS[s.level]
          s.ball = {
            x: s.paddle.x + s.paddle.w / 2,
            y: s.paddle.y - 10,
            dx: lv.ballSpeed * (Math.random() > 0.5 ? 1 : -1) * 0.7,
            dy: -lv.ballSpeed,
            r: 7,
          }
        }
      }

      // paddle bounce
      if (
        s.ball.dy > 0 &&
        s.ball.y + s.ball.r >= s.paddle.y &&
        s.ball.y + s.ball.r <= s.paddle.y + s.paddle.h + 4 &&
        s.ball.x >= s.paddle.x &&
        s.ball.x <= s.paddle.x + s.paddle.w
      ) {
        s.ball.dy = -Math.abs(s.ball.dy)
        // angle based on where it hit the paddle
        const hitPos = (s.ball.x - s.paddle.x) / s.paddle.w // 0..1
        const angle = (hitPos - 0.5) * 1.2 // -0.6..0.6
        const speed = Math.sqrt(s.ball.dx ** 2 + s.ball.dy ** 2)
        s.ball.dx = speed * Math.sin(angle)
        s.ball.dy = -speed * Math.cos(angle)
      }

      // brick collision
      for (const brick of s.bricks) {
        if (!brick.alive) continue
        if (
          s.ball.x + s.ball.r > brick.x &&
          s.ball.x - s.ball.r < brick.x + brick.w &&
          s.ball.y + s.ball.r > brick.y &&
          s.ball.y - s.ball.r < brick.y + brick.h
        ) {
          // determine bounce direction
          const overlapLeft = (s.ball.x + s.ball.r) - brick.x
          const overlapRight = (brick.x + brick.w) - (s.ball.x - s.ball.r)
          const overlapTop = (s.ball.y + s.ball.r) - brick.y
          const overlapBottom = (brick.y + brick.h) - (s.ball.y - s.ball.r)
          const minOverlapX = Math.min(overlapLeft, overlapRight)
          const minOverlapY = Math.min(overlapTop, overlapBottom)

          if (minOverlapX < minOverlapY) {
            s.ball.dx = -s.ball.dx
          } else {
            s.ball.dy = -s.ball.dy
          }

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

      // check level clear
      if (s.bricks.every(b => !b.alive)) {
        if (s.level + 1 < LEVELS.length) {
          initLevel(s.level + 1)
        } else {
          s.gameState = 'beaten'
          setDisplayState('beaten')
        }
      }
    }

    // ── DRAW ──────────────────────────────────────────────────────────────

    // particles (behind everything)
    for (const p of s.particles) {
      const alpha = p.life / p.maxLife
      ctx.globalAlpha = alpha
      ctx.fillStyle = p.colour
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
    }
    ctx.globalAlpha = 1

    // bricks
    for (const brick of s.bricks) {
      if (!brick.alive) continue
      const isMultiHit = brick.hits > 1
      // shadow
      ctx.fillStyle = BLACK
      ctx.fillRect(brick.x + 3, brick.y + 3, brick.w, brick.h)
      // brick body
      ctx.fillStyle = isMultiHit ? WHITE : brick.colour
      ctx.fillRect(brick.x, brick.y, brick.w, brick.h)
      // border
      ctx.strokeStyle = BLACK
      ctx.lineWidth = 2
      ctx.strokeRect(brick.x, brick.y, brick.w, brick.h)
      // inner stripe for multi-hit
      if (isMultiHit) {
        ctx.strokeStyle = brick.colour
        ctx.lineWidth = 2
        ctx.setLineDash([4, 3])
        ctx.strokeRect(brick.x + 4, brick.y + 4, brick.w - 8, brick.h - 8)
        ctx.setLineDash([])
      }
    }

    // paddle
    ctx.fillStyle = BLACK
    ctx.fillRect(s.paddle.x + 3, s.paddle.y + 3, s.paddle.w, s.paddle.h)
    ctx.fillStyle = BLACK
    ctx.fillRect(s.paddle.x, s.paddle.y, s.paddle.w, s.paddle.h)
    ctx.strokeStyle = BLACK
    ctx.lineWidth = 2
    ctx.strokeRect(s.paddle.x, s.paddle.y, s.paddle.w, s.paddle.h)
    // accent stripe on paddle
    ctx.fillStyle = CYAN
    ctx.fillRect(s.paddle.x + 4, s.paddle.y + 4, s.paddle.w - 8, 6)

    // ball
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
  }, [initLevel])

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

  // ── Lifecycle ───────────────────────────────────────────────────────────
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

  // ── Render ──────────────────────────────────────────────────────────────
  const levelDef = LEVELS[displayLevel]

  return (
    <div className="w-full max-w-[540px] mx-auto">
      {/* HUD */}
      <div className="flex items-center justify-between mb-3 px-1 font-display text-xs font-bold uppercase tracking-wider">
        <span>
          Level {displayLevel + 1}
          <span className="text-gray-400 ml-1">/ {LEVELS.length}</span>
        </span>
        <span className="text-cyan">{levelDef?.name}</span>
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

        {/* Overlays */}
        {displayState === 'idle' && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4 px-6">
            <h3 className="font-display text-3xl md:text-4xl font-bold uppercase text-white text-center">
              Bottle Breaker
            </h3>
            <p className="text-gray-300 text-sm text-center max-w-xs">
              Smash through the bottles before they smash your spirit. Move the paddle with your mouse or finger.
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-cyan text-black border-2 border-black font-display font-bold uppercase text-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all neo-shadow"
            >
              Start Game
            </button>
          </div>
        )}

        {displayState === 'lost' && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4 px-6">
            <h3 className="font-display text-3xl font-bold uppercase text-coral text-center">
              Game Over
            </h3>
            <p className="text-white text-lg font-bold">Score: {displayScore}</p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-coral text-white border-2 border-black font-display font-bold uppercase text-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all neo-shadow"
            >
              Try Again
            </button>
          </div>
        )}

        {displayState === 'beaten' && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4 px-6">
            <div className="px-4 py-1 bg-lime border-2 border-black rotate-[-2deg] neo-shadow mb-2">
              <span className="text-xs font-bold uppercase tracking-widest">Champion</span>
            </div>
            <h3 className="font-display text-3xl font-bold uppercase text-white text-center">
              All Bottles Smashed!
            </h3>
            <p className="text-lime text-lg font-bold">Final Score: {displayScore}</p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={startGame}
                className="px-6 py-3 bg-white text-black border-2 border-black font-display font-bold uppercase text-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all neo-shadow"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
