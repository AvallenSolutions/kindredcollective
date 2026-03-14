import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { sendJoinRequestEmail } from '@/lib/email'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/response'
import { applyRateLimit } from '@/lib/api/rate-limit'

const joinSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Valid email is required'),
  company: z.string().max(200).optional().default(''),
  type: z.enum(['brand', 'supplier', 'both']),
  message: z.string().max(2000).optional().default(''),
})

// POST /api/join - Submit a membership request
export async function POST(request: NextRequest) {
  // Rate limit: 5 requests per 10 minutes per IP
  const rateLimitResponse = applyRateLimit(request, 5, 10 * 60_000)
  if (rateLimitResponse) return rateLimitResponse

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid request body')
  }

  const parsed = joinSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(parsed.error.errors[0]?.message || 'Invalid request')
  }

  const { name, email, company, type, message } = parsed.data

  try {
    // Save to database
    await prisma.inviteRequest.create({
      data: {
        name,
        email,
        company: company || null,
        type,
        message: message || null,
      },
    })
  } catch (err) {
    console.error('[Join] Failed to save invite request:', err)
    return serverErrorResponse('Failed to submit request')
  }

  // Send notification email to admins (non-blocking)
  sendJoinRequestEmail({ name, email, company: company || '', type, message: message || '' }).catch(
    (err) => console.error('[Join] Failed to send notification email:', err)
  )

  return successResponse({ success: true })
}
