import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { Resend } from 'resend'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'
import { applyRateLimit } from '@/lib/api/rate-limit'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM_EMAIL = 'Kindred Collective <noreply@kindredcollective.co.uk>'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

interface RouteParams {
  params: Promise<{ slug: string }>
}

// POST /api/suppliers/[slug]/contact - Send inquiry to supplier
export async function POST(request: NextRequest, { params }: RouteParams) {
  // Rate limit: 5 contact requests per minute per IP
  const rateLimited = applyRateLimit(request, 5, 60_000)
  if (rateLimited) return rateLimited

  let user
  try {
    user = await requireAuth()
  } catch {
    return unauthorizedResponse()
  }

  const { slug } = await params
  const supabase = await createClient()
  const body = await request.json()

  const {
    subject,
    message,
    contactEmail,
    contactPhone,
    companyName,
    projectDetails,
  } = body

  // Validate required fields
  if (!subject || !message) {
    return errorResponse('Subject and message are required')
  }

  if (message.length < 20) {
    return errorResponse('Message must be at least 20 characters')
  }

  // Check if supplier exists and get contact info
  const { data: supplier } = await supabase
    .from('Supplier')
    .select('id, companyName, contactEmail, contactName, isPublic')
    .eq('slug', slug)
    .single()

  if (!supplier) {
    return notFoundResponse('Supplier not found')
  }

  if (!supplier.isPublic) {
    return errorResponse('Cannot contact a private supplier')
  }

  if (!supplier.contactEmail) {
    return errorResponse('This supplier has no contact email configured')
  }

  // Get the user's info
  const { data: member } = await supabase
    .from('Member')
    .select('firstName, lastName, phone')
    .eq('userId', user.id)
    .single()

  const senderName = member ? `${member.firstName} ${member.lastName}` : (user.email ? user.email.split('@')[0] : 'A member')
  const senderCompany = companyName || null
  const senderEmail = contactEmail || user.email
  const senderPhone = contactPhone || member?.phone || null

  // Build and send the inquiry email
  const emailHtml = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #00D9FF; padding: 24px; border: 3px solid #000;">
        <h1 style="font-family: 'Space Grotesk', Arial, sans-serif; margin: 0; font-size: 24px;">
          Kindred Collective
        </h1>
      </div>
      <div style="padding: 32px 24px; border: 3px solid #000; border-top: 0;">
        <h2 style="margin-top: 0;">New Inquiry from ${escapeHtml(senderName)}</h2>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        ${senderCompany ? `<p><strong>Company:</strong> ${escapeHtml(senderCompany)}</p>` : ''}
        <p><strong>Email:</strong> <a href="mailto:${escapeHtml(senderEmail)}">${escapeHtml(senderEmail)}</a></p>
        ${senderPhone ? `<p><strong>Phone:</strong> ${escapeHtml(senderPhone)}</p>` : ''}
        <hr style="border: 1px solid #eee; margin: 16px 0;" />
        <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
        ${projectDetails ? `<hr style="border: 1px solid #eee; margin: 16px 0;" /><p><strong>Project Details:</strong></p><p style="white-space: pre-wrap;">${escapeHtml(projectDetails)}</p>` : ''}
        <hr style="border: 1px solid #eee; margin: 16px 0;" />
        <p style="color: #666; font-size: 14px;">
          This inquiry was sent via Kindred Collective. Reply directly to ${escapeHtml(senderEmail)} to respond.
        </p>
      </div>
    </div>
  `

  if (resend) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: supplier.contactEmail,
        subject: `New inquiry from ${senderName}: ${subject}`,
        html: emailHtml,
        replyTo: senderEmail,
      })
    } catch (err) {
      console.error('[SupplierContact] Failed to send email:', err)
      return serverErrorResponse('Failed to send inquiry email')
    }
  } else {
    console.log(`[SupplierContact] No RESEND_API_KEY. Would send to: ${supplier.contactEmail}`)
    console.log(`[SupplierContact] From: ${senderName} (${senderEmail}), Subject: ${subject}`)
  }

  return successResponse({
    sent: true,
    message: `Your inquiry has been sent to ${supplier.companyName}. They will respond to ${senderEmail}.`,
    inquiry: {
      to: supplier.companyName,
      subject,
      sentAt: new Date().toISOString(),
    },
  })
}
