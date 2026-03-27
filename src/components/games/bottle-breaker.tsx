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

// ─── Layout patterns ────────────────────────────────────────────────────────
type LayoutPattern = 'full' | 'checkerboard' | 'diamond' | 'pyramid' | 'columns' | 'zigzag' | 'border' | 'scatter' | 'stripes' | 'wings'

const PATTERNS: LayoutPattern[] = [
  'full', 'checkerboard', 'diamond', 'pyramid', 'columns',
  'zigzag', 'border', 'scatter', 'stripes', 'wings',
]

function shouldPlace(pattern: LayoutPattern, r: number, c: number, rows: number, cols: number): boolean {
  switch (pattern) {
    case 'full': return true
    case 'checkerboard': return (r + c) % 2 === 0
    case 'diamond': {
      const cr = (rows - 1) / 2, cc = (cols - 1) / 2
      return (Math.abs(r - cr) / Math.max(rows, 1) + Math.abs(c - cc) / Math.max(cols, 1)) <= 0.5
    }
    case 'pyramid': {
      const skip = Math.floor((r * cols) / (2 * rows))
      return c >= skip && c < cols - skip
    }
    case 'columns': return c % 3 !== 1
    case 'zigzag': return r % 2 === 0 ? c < cols - 1 : c > 0
    case 'border': return r === 0 || r === rows - 1 || c === 0 || c === cols - 1
    case 'scatter': return ((r * 7 + c * 13 + r * c * 3) % 10) < 7
    case 'stripes': return r % 2 === 0
    case 'wings': {
      const mid = Math.floor(cols / 2)
      const gap = Math.max(0, 2 - r)
      return c < mid - gap || c > mid + gap
    }
    default: return true
  }
}

// ─── Level generation (99 levels) ────────────────────────────────────────────
interface LevelDef {
  name: string
  rows: number
  cols: number
  ballSpeed: number
  maxHits: number
  paddleWidth: number
  pattern: LayoutPattern
}

const NAMED_LEVELS: Record<number, string> = {
  1: 'The Warm-Up', 2: 'Happy Hour', 3: 'Last Orders', 4: 'After Party',
  5: 'The Morning After', 10: 'Second Round', 15: 'On The Rocks',
  20: 'Shaken Not Stirred', 25: 'Double Shot', 30: 'Neat Pour',
  35: 'Top Shelf', 40: 'Barrel Aged', 45: 'Cask Strength',
  50: 'Halfway House', 55: 'Proof Positive', 60: 'Spirit Level',
  65: 'High Ball', 70: 'Full Measure', 75: 'Last Call', 80: 'Lock-In',
  85: 'Nightcap', 90: 'One More Round', 95: 'The Final Straw', 99: 'Legendary',
}

function generateLevel(n: number): LevelDef {
  const t = (n - 1) / 98
  return {
    name: NAMED_LEVELS[n] ?? `Level ${n}`,
    rows: Math.min(3 + Math.floor(t * 6), 9),
    cols: Math.min(7 + Math.floor(t * 5), 12),
    ballSpeed: 4 + t * 4,
    maxHits: n >= 4 ? Math.min(1 + Math.floor(t * 3), 3) : 1,
    paddleWidth: Math.max(100 - Math.floor(t * 40), 60),
    pattern: PATTERNS[(n - 1) % PATTERNS.length],
  }
}

const TOTAL_LEVELS = 99
const BOTTLE_COLOURS = [CYAN, CORAL, LIME, AMBER, PURPLE]

// ─── Power-ups ───────────────────────────────────────────────────────────────
type PowerUpType = 'multiball' | 'wide' | 'fireball' | 'extralife' | 'slow'

interface PowerUpDef {
  label: string
  colour: string
  duration: number // frames (0 = instant)
}

const POWERUP_DEFS: Record<PowerUpType, PowerUpDef> = {
  multiball:  { label: 'x3',  colour: CYAN,   duration: 0 },
  wide:       { label: 'W',   colour: LIME,   duration: 480 },   // ~8 sec
  fireball:   { label: 'F',   colour: CORAL,  duration: 300 },   // ~5 sec
  extralife:  { label: '+1',  colour: PURPLE, duration: 0 },
  slow:       { label: 'S',   colour: AMBER,  duration: 360 },   // ~6 sec
}

const POWERUP_TYPES: PowerUpType[] = ['multiball', 'wide', 'fireball', 'extralife', 'slow']
const POWERUP_DROP_CHANCE = 0.15

interface PowerUp {
  x: number
  y: number
  type: PowerUpType
  size: number
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
  } catch { return [] }
}

async function submitScore(name: string, score: number, level: number): Promise<HighScore[]> {
  try {
    await fetch('/api/game-scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score, level }),
    })
    return fetchScores()
  } catch { return [] }
}

// ─── Types ───────────────────────────────────────────────────────────────────
type BrickShape = 'bottle' | 'can'

interface Brick {
  x: number; y: number; w: number; h: number
  hits: number; colour: string; alive: boolean; shape: BrickShape
}
interface Ball {
  x: number; y: number; dx: number; dy: number; r: number
}
interface Paddle { x: number; y: number; w: number; h: number }
interface Particle {
  x: number; y: number; dx: number; dy: number
  life: number; maxLife: number; colour: string; size: number
}

type GameState = 'idle' | 'playing' | 'lost' | 'beaten'

interface ActiveEffect {
  type: PowerUpType
  remaining: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function buildBricks(level: LevelDef, canvasW: number): Brick[] {
  const bricks: Brick[] = []
  const padding = 6, topOffset = 50, brickH = 28
  const brickW = (canvasW - padding * (level.cols + 1)) / level.cols
  for (let r = 0; r < level.rows; r++) {
    const rowColour = BOTTLE_COLOURS[r % BOTTLE_COLOURS.length]
    for (let c = 0; c < level.cols; c++) {
      if (!shouldPlace(level.pattern, r, c, level.rows, level.cols)) continue
      bricks.push({
        x: padding + c * (brickW + padding),
        y: topOffset + r * (brickH + padding),
        w: brickW, h: brickH,
        hits: r < 2 && level.maxHits > 1 ? level.maxHits : 1,
        colour: rowColour, alive: true,
        shape: (r + c) % 2 === 0 ? 'bottle' : 'can',
      })
    }
  }
  return bricks
}

// ─── Bottle & can drawing ───────────────────────────────────────────────────
function drawBottleShape(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, colour: string, isMultiHit: boolean) {
  const bodyH = h * 0.55
  const bodyY = y + h - bodyH
  const neckW = w * 0.32
  const neckX = x + (w - neckW) / 2
  const neckH = h * 0.35
  const neckY = y + h * 0.1
  const capW = neckW + 6
  const capH = h * 0.1
  const capX = x + (w - capW) / 2

  // Shadow
  ctx.fillStyle = BLACK
  ctx.beginPath()
  ctx.rect(capX + 3, y + 3, capW, capH)
  ctx.rect(neckX + 3, neckY + 3, neckW, neckH)
  ctx.rect(x + 3, bodyY + 3, w, bodyH)
  ctx.fill()

  // Fill body
  const fill = isMultiHit ? WHITE : colour
  ctx.fillStyle = fill
  ctx.fillRect(x, bodyY, w, bodyH)
  ctx.fillRect(neckX, neckY, neckW, neckH)

  // Cap
  ctx.fillStyle = BLACK
  ctx.fillRect(capX, y, capW, capH)

  // Outline - bottle silhouette
  ctx.strokeStyle = BLACK
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(capX, y + capH)
  ctx.lineTo(capX, y)
  ctx.lineTo(capX + capW, y)
  ctx.lineTo(capX + capW, y + capH)
  ctx.lineTo(neckX + neckW, neckY)
  ctx.lineTo(neckX + neckW, bodyY)
  ctx.lineTo(x + w, bodyY)
  ctx.lineTo(x + w, y + h)
  ctx.lineTo(x, y + h)
  ctx.lineTo(x, bodyY)
  ctx.lineTo(neckX, bodyY)
  ctx.lineTo(neckX, neckY)
  ctx.lineTo(capX, y + capH)
  ctx.stroke()

  // Highlight stripe
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.fillRect(x + 3, bodyY + 3, 3, bodyH - 6)

  // Multi-hit indicator
  if (isMultiHit) {
    ctx.strokeStyle = colour
    ctx.lineWidth = 2
    ctx.setLineDash([4, 3])
    ctx.strokeRect(x + 3, bodyY + 3, w - 6, bodyH - 6)
    ctx.setLineDash([])
  }
}

function drawCanShape(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, colour: string, isMultiHit: boolean) {
  const rimH = 3
  const bodyX = x + 2
  const bodyW = w - 4
  const tabW = 8
  const tabH = 4
  const tabX = x + w - tabW - 6
  const tabY = y + 1

  // Shadow
  ctx.fillStyle = BLACK
  ctx.beginPath()
  ctx.roundRect(x + 3, y + 3, w, h, 3)
  ctx.fill()

  // Main body
  const fill = isMultiHit ? WHITE : colour
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 3)
  ctx.fill()

  // Outline
  ctx.strokeStyle = BLACK
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 3)
  ctx.stroke()

  // Top rim
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  ctx.fillRect(bodyX, y, bodyW, rimH)
  ctx.strokeStyle = BLACK
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x, y + rimH)
  ctx.lineTo(x + w, y + rimH)
  ctx.stroke()

  // Bottom rim
  ctx.fillRect(bodyX, y + h - rimH, bodyW, rimH)
  ctx.beginPath()
  ctx.moveTo(x, y + h - rimH)
  ctx.lineTo(x + w, y + h - rimH)
  ctx.stroke()

  // Pull tab
  ctx.strokeStyle = BLACK
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(tabX, tabY, tabW, tabH, 1)
  ctx.stroke()

  // Highlight stripe
  ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.fillRect(x + 4, y + rimH + 2, 3, h - rimH * 2 - 4)

  // Multi-hit indicator
  if (isMultiHit) {
    ctx.strokeStyle = colour
    ctx.lineWidth = 2
    ctx.setLineDash([4, 3])
    ctx.strokeRect(x + 4, y + 4, w - 8, h - 8)
    ctx.setLineDash([])
  }
}

function makeBall(canvasW: number, paddleY: number, speed: number): Ball {
  return {
    x: canvasW / 2,
    y: paddleY - 10,
    dx: speed * (Math.random() > 0.5 ? 1 : -1) * 0.7,
    dy: -speed,
    r: 7,
  }
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function BottleBreaker() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)
  const stateRef = useRef<{
    balls: Ball[]
    paddle: Paddle
    bricks: Brick[]
    particles: Particle[]
    powerUps: PowerUp[]
    effects: ActiveEffect[]
    lives: number
    score: number
    gameState: GameState
    level: number
    basePaddleW: number
    baseBallSpeed: number
    canvasW: number
    canvasH: number
    pointerX: number | null
  }>({
    balls: [],
    paddle: { x: 0, y: 0, w: 100, h: 14 },
    bricks: [],
    particles: [],
    powerUps: [],
    effects: [],
    lives: 3,
    score: 0,
    gameState: 'idle',
    level: 0,
    basePaddleW: 100,
    baseBallSpeed: 4,
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
  const [toast, setToast] = useState<{ message: string; sub: string } | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(message: string, sub: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ message, sub })
    toastTimerRef.current = setTimeout(() => {
      setToast(null)
      toastTimerRef.current = null
    }, 2000)
  }

  useEffect(() => {
    fetchScores().then(setHighScores)
    return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current) }
  }, [])

  function checkQualifies(score: number): boolean {
    if (highScores.length < 20) return score > 0
    return score > (highScores[highScores.length - 1]?.score ?? 0)
  }

  // ── Helpers ─────────────────────────────────────────────────────────────
  function hasEffect(type: PowerUpType): boolean {
    return stateRef.current.effects.some(e => e.type === type)
  }

  function spawnParticles(s: typeof stateRef.current, brick: Brick) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 3
      s.particles.push({
        x: brick.x + brick.w / 2, y: brick.y + brick.h / 2,
        dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed,
        life: 30 + Math.random() * 20, maxLife: 50,
        colour: brick.colour, size: 3 + Math.random() * 4,
      })
    }
  }

  function maybeDropPowerUp(s: typeof stateRef.current, brick: Brick) {
    if (Math.random() < POWERUP_DROP_CHANCE) {
      const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)]
      s.powerUps.push({
        x: brick.x + brick.w / 2,
        y: brick.y + brick.h / 2,
        type,
        size: 18,
      })
    }
  }

  function applyPowerUp(s: typeof stateRef.current, pu: PowerUp) {
    const def = POWERUP_DEFS[pu.type]

    switch (pu.type) {
      case 'multiball': {
        // Spawn 2 extra balls from the first ball's position
        const ref = s.balls[0]
        if (ref) {
          const speed = Math.sqrt(ref.dx ** 2 + ref.dy ** 2)
          s.balls.push(
            { x: ref.x, y: ref.y, dx: speed * 0.7, dy: -speed * 0.7, r: 7 },
            { x: ref.x, y: ref.y, dx: -speed * 0.7, dy: -speed * 0.7, r: 7 },
          )
        }
        break
      }
      case 'wide': {
        // Remove existing wide effect, add fresh one
        s.effects = s.effects.filter(e => e.type !== 'wide')
        s.effects.push({ type: 'wide', remaining: def.duration })
        s.paddle.w = s.basePaddleW * 1.5
        break
      }
      case 'fireball': {
        s.effects = s.effects.filter(e => e.type !== 'fireball')
        s.effects.push({ type: 'fireball', remaining: def.duration })
        break
      }
      case 'extralife': {
        s.lives = Math.min(s.lives + 1, 5)
        setDisplayLives(s.lives)
        break
      }
      case 'slow': {
        s.effects = s.effects.filter(e => e.type !== 'slow')
        s.effects.push({ type: 'slow', remaining: def.duration })
        for (const b of s.balls) {
          b.dx *= 0.6
          b.dy *= 0.6
        }
        break
      }
    }

    showToast(
      pu.type === 'multiball' ? 'Multi-Ball!' :
      pu.type === 'wide' ? 'Wide Paddle!' :
      pu.type === 'fireball' ? 'Fireball!' :
      pu.type === 'extralife' ? 'Extra Life!' :
      'Slow Ball!',
      POWERUP_DEFS[pu.type].label,
    )
  }

  // ── Init / reset ────────────────────────────────────────────────────────
  const initLevel = useCallback((levelIdx: number) => {
    const s = stateRef.current
    const lv = generateLevel(levelIdx + 1)
    s.level = levelIdx
    s.bricks = buildBricks(lv, s.canvasW)
    s.basePaddleW = lv.paddleWidth
    s.baseBallSpeed = lv.ballSpeed
    s.paddle.w = lv.paddleWidth
    s.paddle.x = (s.canvasW - lv.paddleWidth) / 2
    s.paddle.y = s.canvasH - 36
    s.balls = [makeBall(s.canvasW, s.paddle.y, lv.ballSpeed)]
    s.particles = []
    s.powerUps = []
    s.effects = []
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

  const advanceToNextLevel = useCallback((completedLevel: number) => {
    const s = stateRef.current
    const completedDef = generateLevel(completedLevel + 1)
    showToast(`Level ${completedLevel + 1} Complete!`, completedDef.name)
    if (completedLevel + 1 < TOTAL_LEVELS) {
      s.gameState = 'playing'
      initLevel(completedLevel + 1)
      setDisplayState('playing')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setSaving(true)
    const updated = await submitScore(nameInput.trim() || 'Anonymous', s.score, s.level + 1)
    setHighScores(updated)
    setScoreSaved(true)
    setSaving(false)
  }, [nameInput])

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
      // ── Update active effects ──
      for (let i = s.effects.length - 1; i >= 0; i--) {
        s.effects[i].remaining--
        if (s.effects[i].remaining <= 0) {
          const expired = s.effects[i]
          s.effects.splice(i, 1)
          // Revert effect
          if (expired.type === 'wide') {
            s.paddle.w = s.basePaddleW
          }
          if (expired.type === 'slow') {
            // Re-accelerate balls to normal speed
            for (const b of s.balls) {
              const curSpeed = Math.sqrt(b.dx ** 2 + b.dy ** 2)
              if (curSpeed > 0) {
                const scale = s.baseBallSpeed / curSpeed
                b.dx *= scale
                b.dy *= scale
              }
            }
          }
        }
      }

      // ── Move paddle ──
      if (s.pointerX !== null) s.paddle.x = s.pointerX - s.paddle.w / 2
      s.paddle.x = Math.max(0, Math.min(s.canvasW - s.paddle.w, s.paddle.x))

      // ── Move & collide each ball ──
      const isFireball = hasEffect('fireball')

      for (let bi = s.balls.length - 1; bi >= 0; bi--) {
        const ball = s.balls[bi]
        ball.x += ball.dx
        ball.y += ball.dy

        // Wall bounce
        if (ball.x - ball.r <= 0) { ball.x = ball.r; ball.dx = Math.abs(ball.dx) }
        if (ball.x + ball.r >= s.canvasW) { ball.x = s.canvasW - ball.r; ball.dx = -Math.abs(ball.dx) }
        if (ball.y - ball.r <= 0) { ball.y = ball.r; ball.dy = Math.abs(ball.dy) }

        // Bottom — remove ball
        if (ball.y + ball.r > s.canvasH) {
          s.balls.splice(bi, 1)
          continue
        }

        // Paddle bounce
        if (
          ball.dy > 0 &&
          ball.y + ball.r >= s.paddle.y &&
          ball.y + ball.r <= s.paddle.y + s.paddle.h + 4 &&
          ball.x >= s.paddle.x &&
          ball.x <= s.paddle.x + s.paddle.w
        ) {
          ball.dy = -Math.abs(ball.dy)
          const hitPos = (ball.x - s.paddle.x) / s.paddle.w
          const angle = (hitPos - 0.5) * 1.2
          const speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2)
          ball.dx = speed * Math.sin(angle)
          ball.dy = -speed * Math.cos(angle)
        }

        // Brick collision
        for (const brick of s.bricks) {
          if (!brick.alive) continue
          if (
            ball.x + ball.r > brick.x &&
            ball.x - ball.r < brick.x + brick.w &&
            ball.y + ball.r > brick.y &&
            ball.y - ball.r < brick.y + brick.h
          ) {
            // Fireball: smash through without bouncing
            if (!isFireball) {
              const oL = (ball.x + ball.r) - brick.x
              const oR = (brick.x + brick.w) - (ball.x - ball.r)
              const oT = (ball.y + ball.r) - brick.y
              const oB = (brick.y + brick.h) - (ball.y - ball.r)
              if (Math.min(oL, oR) < Math.min(oT, oB)) ball.dx = -ball.dx
              else ball.dy = -ball.dy
            }

            if (isFireball) {
              // Fireball destroys in one hit
              brick.alive = false
              brick.hits = 0
              s.score += 10
              spawnParticles(s, brick)
              maybeDropPowerUp(s, brick)
              // Don't break — keep smashing through
            } else {
              brick.hits--
              if (brick.hits <= 0) {
                brick.alive = false
                s.score += 10
                spawnParticles(s, brick)
                maybeDropPowerUp(s, brick)
              } else {
                s.score += 5
              }
              break
            }
          }
        }
      }

      // ── All balls lost ──
      if (s.balls.length === 0) {
        s.lives--
        setDisplayLives(s.lives)
        // Clear timed effects on life loss
        s.effects = []
        s.paddle.w = s.basePaddleW
        if (s.lives <= 0) {
          handleGameEnd('lost')
        } else {
          s.balls = [makeBall(s.canvasW, s.paddle.y, s.baseBallSpeed)]
        }
      }

      setDisplayScore(s.score)

      // ── Move power-up drops ──
      for (let pi = s.powerUps.length - 1; pi >= 0; pi--) {
        const pu = s.powerUps[pi]
        pu.y += 2 // fall speed

        // Caught by paddle?
        if (
          pu.y + pu.size / 2 >= s.paddle.y &&
          pu.y - pu.size / 2 <= s.paddle.y + s.paddle.h &&
          pu.x + pu.size / 2 >= s.paddle.x &&
          pu.x - pu.size / 2 <= s.paddle.x + s.paddle.w
        ) {
          applyPowerUp(s, pu)
          s.powerUps.splice(pi, 1)
          continue
        }

        // Fell off screen
        if (pu.y - pu.size / 2 > s.canvasH) {
          s.powerUps.splice(pi, 1)
        }
      }

      // ── Level clear ──
      if (s.bricks.every(b => !b.alive)) {
        if (s.level + 1 < TOTAL_LEVELS) {
          advanceToNextLevel(s.level)
        } else {
          handleGameEnd('beaten')
        }
      }
    }

    // ── DRAW ──────────────────────────────────────────────────────────────

    // Particles
    for (const p of s.particles) {
      ctx.globalAlpha = p.life / p.maxLife
      ctx.fillStyle = p.colour
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
    }
    ctx.globalAlpha = 1

    // Bricks (bottles & cans)
    for (const brick of s.bricks) {
      if (!brick.alive) continue
      const isMultiHit = brick.hits > 1
      if (brick.shape === 'bottle') {
        drawBottleShape(ctx, brick.x, brick.y, brick.w, brick.h, brick.colour, isMultiHit)
      } else {
        drawCanShape(ctx, brick.x, brick.y, brick.w, brick.h, brick.colour, isMultiHit)
      }
    }

    // Power-up drops
    for (const pu of s.powerUps) {
      const def = POWERUP_DEFS[pu.type]
      const sz = pu.size
      // Shadow
      ctx.fillStyle = BLACK
      ctx.fillRect(pu.x - sz / 2 + 2, pu.y - sz / 2 + 2, sz, sz)
      // Body
      ctx.fillStyle = def.colour
      ctx.fillRect(pu.x - sz / 2, pu.y - sz / 2, sz, sz)
      ctx.strokeStyle = BLACK
      ctx.lineWidth = 2
      ctx.strokeRect(pu.x - sz / 2, pu.y - sz / 2, sz, sz)
      // Label
      ctx.fillStyle = BLACK
      ctx.font = 'bold 11px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(def.label, pu.x, pu.y + 1)
    }

    // Paddle
    const paddleColour = hasEffect('wide') ? LIME : BLACK
    const stripeColour = hasEffect('fireball') ? CORAL : CYAN
    ctx.fillStyle = BLACK
    ctx.fillRect(s.paddle.x + 3, s.paddle.y + 3, s.paddle.w, s.paddle.h)
    ctx.fillStyle = paddleColour
    ctx.fillRect(s.paddle.x, s.paddle.y, s.paddle.w, s.paddle.h)
    ctx.strokeStyle = BLACK
    ctx.lineWidth = 2
    ctx.strokeRect(s.paddle.x, s.paddle.y, s.paddle.w, s.paddle.h)
    ctx.fillStyle = stripeColour
    ctx.fillRect(s.paddle.x + 4, s.paddle.y + 4, s.paddle.w - 8, 6)

    // Balls
    const ballColour = hasEffect('fireball') ? AMBER : CORAL
    for (const ball of s.balls) {
      ctx.fillStyle = BLACK
      ctx.beginPath()
      ctx.arc(ball.x + 2, ball.y + 2, ball.r, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = ballColour
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = BLACK
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2)
      ctx.stroke()
      // Fireball glow
      if (hasEffect('fireball')) {
        ctx.globalAlpha = 0.3
        ctx.fillStyle = CORAL
        ctx.beginPath()
        ctx.arc(ball.x, ball.y, ball.r + 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }
    }

    // Active effect indicators (bottom-left)
    let indicatorX = 6
    for (const eff of s.effects) {
      const def = POWERUP_DEFS[eff.type]
      const pct = eff.remaining / def.duration
      const barW = 30
      ctx.fillStyle = def.colour
      ctx.globalAlpha = 0.8
      ctx.fillRect(indicatorX, s.canvasH - 10, barW * pct, 4)
      ctx.globalAlpha = 0.3
      ctx.fillRect(indicatorX, s.canvasH - 10, barW, 4)
      ctx.globalAlpha = 1
      ctx.fillStyle = BLACK
      ctx.font = 'bold 8px Inter, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'bottom'
      ctx.fillText(def.label, indicatorX, s.canvasH - 12)
      indicatorX += barW + 8
    }

    animRef.current = requestAnimationFrame(loop)
  }, [handleGameEnd, advanceToNextLevel])

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

      {/* Canvas */}
      <div ref={containerRef} className="relative w-full border-3 border-black neo-shadow bg-white">
        <canvas ref={canvasRef} className="block w-full" style={{ touchAction: 'none' }} />

        {/* ── Idle ── */}
        {displayState === 'idle' && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4 px-6 overflow-y-auto py-6">
            <h3 className="font-display text-3xl md:text-4xl font-bold uppercase text-white text-center">
              Bottle Breaker
            </h3>
            <p className="text-gray-300 text-sm text-center max-w-xs">
              Smash through the bottles. 99 levels. 3 lives. Catch power-ups for special abilities!
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-xs">
              {POWERUP_TYPES.map(type => {
                const def = POWERUP_DEFS[type]
                return (
                  <div key={type} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span className="inline-block w-4 h-4 border border-black text-center leading-4 font-bold" style={{ backgroundColor: def.colour, fontSize: 8 }}>{def.label}</span>
                    <span className="capitalize">{type === 'multiball' ? 'Multi-Ball' : type === 'extralife' ? 'Extra Life' : type === 'wide' ? 'Wide Paddle' : type === 'fireball' ? 'Fireball' : 'Slow Ball'}</span>
                  </div>
                )
              })}
            </div>
            <button onClick={startGame} className={`${btnClass} bg-cyan text-black`}>
              Start Game
            </button>
            {highScores.length > 0 && scoreboard}
          </div>
        )}

        {/* ── Toast ── */}
        {toast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 animate-bounce">
            <div className="bg-cyan border-2 border-black neo-shadow px-5 py-2 text-center whitespace-nowrap">
              <p className="font-display text-sm font-bold uppercase">{toast.message}</p>
              <p className="text-xs font-bold text-black/60">{toast.sub}</p>
            </div>
          </div>
        )}

        {/* ── Game over ── */}
        {displayState === 'lost' && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4 px-6 overflow-y-auto py-6">
            <h3 className="font-display text-3xl font-bold uppercase text-coral text-center">Game Over</h3>
            <p className="text-white text-lg font-bold">Score: {displayScore}</p>
            <p className="text-gray-400 text-xs">Reached level {displayLevel + 1} — {currentLevel.name}</p>
            {qualifiesForBoard && nameEntry}
            <button onClick={startGame} className={`${btnClass} bg-coral text-white`}>Try Again</button>
            {scoreboard}
          </div>
        )}

        {/* ── Beaten ── */}
        {displayState === 'beaten' && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4 px-6 overflow-y-auto py-6">
            <div className="px-4 py-1 bg-lime border-2 border-black rotate-[-2deg] neo-shadow mb-1">
              <span className="text-xs font-bold uppercase tracking-widest">Champion</span>
            </div>
            <h3 className="font-display text-3xl font-bold uppercase text-white text-center">All 99 Levels Smashed!</h3>
            <p className="text-lime text-lg font-bold">Final Score: {displayScore}</p>
            {qualifiesForBoard && nameEntry}
            <div className="flex gap-3 mt-1">
              <button onClick={startGame} className={`${btnClass} bg-white text-black`}>Play Again</button>
            </div>
            {scoreboard}
          </div>
        )}
      </div>
    </div>
  )
}
