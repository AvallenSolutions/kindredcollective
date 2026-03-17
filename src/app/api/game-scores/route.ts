import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
} from '@/lib/api/response'
import { applyRateLimit } from '@/lib/api/rate-limit'

const MAX_SCORES = 20
const MAX_NAME_LENGTH = 20

// GET /api/game-scores - Fetch top scores
export async function GET(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, 30, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = createAdminClient()

    const { data: scores, error } = await supabase
      .from('GameScore')
      .select('id, name, score, level, createdAt')
      .order('score', { ascending: false })
      .limit(MAX_SCORES)

    if (error) {
      return serverErrorResponse('Failed to fetch scores')
    }

    return successResponse(scores || [])
  } catch {
    return serverErrorResponse()
  }
}

// POST /api/game-scores - Submit a new score
export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, 10, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    const { name, score, level } = body

    // Validate
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return errorResponse('Name is required')
    }
    if (typeof score !== 'number' || score < 0 || !Number.isFinite(score)) {
      return errorResponse('Invalid score')
    }
    if (typeof level !== 'number' || level < 1 || level > 99 || !Number.isInteger(level)) {
      return errorResponse('Invalid level')
    }

    const sanitizedName = name.trim().slice(0, MAX_NAME_LENGTH)

    const supabase = createAdminClient()

    // Check if this score qualifies for the leaderboard
    const { count } = await supabase
      .from('GameScore')
      .select('id', { count: 'exact', head: true })

    if ((count ?? 0) >= MAX_SCORES) {
      // Get the lowest score on the board
      const { data: lowest } = await supabase
        .from('GameScore')
        .select('id, score')
        .order('score', { ascending: true })
        .limit(1)
        .single()

      if (lowest && score <= lowest.score) {
        return errorResponse('Score does not qualify for the leaderboard')
      }

      // Remove the lowest score to make room
      if (lowest) {
        await supabase.from('GameScore').delete().eq('id', lowest.id)
      }
    }

    const { data: newScore, error } = await supabase
      .from('GameScore')
      .insert({
        id: crypto.randomUUID(),
        name: sanitizedName,
        score,
        level,
      })
      .select()
      .single()

    if (error) {
      return serverErrorResponse('Failed to save score')
    }

    return successResponse(newScore, 201)
  } catch {
    return serverErrorResponse()
  }
}
