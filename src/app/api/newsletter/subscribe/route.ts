import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/response'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, source } = body

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return errorResponse('A valid email address is required')
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('NewsletterSubscriber')
    .upsert(
      {
        email: (email as string).toLowerCase().trim(),
        source: source || 'website',
        subscribedAt: new Date().toISOString(),
      },
      { onConflict: 'email' }
    )

  if (error) {
    console.error('[Newsletter] Subscription error:', error)
    return serverErrorResponse('Failed to subscribe. Please try again.')
  }

  return successResponse({ subscribed: true })
}
