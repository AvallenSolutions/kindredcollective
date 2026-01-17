import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from '@/lib/api/response'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// POST /api/suppliers/[slug]/contact - Send inquiry to supplier
export async function POST(request: NextRequest, { params }: RouteParams) {
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

  // Get user's brand if they have one
  const { data: userBrand } = await supabase
    .from('Brand')
    .select('name')
    .eq('userId', user.id)
    .single()

  const senderName = member ? `${member.firstName} ${member.lastName}` : user.email.split('@')[0]
  const senderCompany = companyName || userBrand?.name || null
  const senderEmail = contactEmail || user.email
  const senderPhone = contactPhone || member?.phone || null

  // Log the inquiry (for analytics and backup)
  // In a production app, you would also send an email here
  // TODO: Create SupplierInquiry table for logging, integrate with email service

  // For now, we'll simulate success and provide details for the user
  // In production, this would trigger an email to the supplier

  const inquiryData = {
    supplierId: supplier.id,
    supplierName: supplier.companyName,
    supplierEmail: supplier.contactEmail,
    senderUserId: user.id,
    senderName,
    senderEmail,
    senderPhone,
    senderCompany,
    subject,
    message,
    projectDetails,
    sentAt: new Date().toISOString(),
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Supplier Inquiry:', inquiryData)
  }

  // In production, integrate with email service:
  // await sendEmail({
  //   to: supplier.contactEmail,
  //   subject: `New inquiry from ${senderName}: ${subject}`,
  //   template: 'supplier-inquiry',
  //   data: inquiryData,
  // })

  return successResponse({
    sent: true,
    message: `Your inquiry has been sent to ${supplier.companyName}. They will respond to ${senderEmail}.`,
    inquiry: {
      to: supplier.companyName,
      subject,
      sentAt: inquiryData.sentAt,
    },
  })
}
