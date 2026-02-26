import { NextRequest } from 'next/server'
import { Resend } from 'resend'
import { applyRateLimit } from '@/lib/api/rate-limit'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/response'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const ADMIN_EMAIL = 'hello@kindredcollective.co.uk'
const FROM_EMAIL = 'Kindred Collective <noreply@kindredcollective.co.uk>'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// POST /api/join-request - Submit a membership request
export async function POST(request: NextRequest) {
  // Rate limit: 3 requests per minute per IP
  const rateLimited = applyRateLimit(request, 3, 60_000)
  if (rateLimited) return rateLimited

  const body = await request.json()
  const { name, email, company, type, message } = body

  if (!name || !email) {
    return errorResponse('Name and email are required')
  }

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Membership Request</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; font-weight: bold;">Name:</td><td style="padding: 8px;">${escapeHtml(name)}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;">${escapeHtml(email)}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Company:</td><td style="padding: 8px;">${escapeHtml(company || 'Not provided')}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Type:</td><td style="padding: 8px;">${escapeHtml(type || 'brand')}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Message:</td><td style="padding: 8px;">${escapeHtml(message || 'No message')}</td></tr>
      </table>
    </div>
  `

  if (resend) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: `Membership Request: ${name} (${type})`,
        html: emailContent,
        replyTo: email,
      })
    } catch (err) {
      console.error('[JoinRequest] Failed to send email:', err)
      return serverErrorResponse('Failed to submit request')
    }
  } else {
    console.log('[JoinRequest] No RESEND_API_KEY configured. Request from:', name, email)
    console.log('[JoinRequest] Details:', { name, email, company, type, message })
  }

  return successResponse({ sent: true, message: 'Your request has been submitted' })
}
