import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  let email: string

  try {
    const body = await request.json()
    email = body?.email
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ||
    `${request.nextUrl.protocol}//${request.nextUrl.host}`

  // Step 1: generate a signed recovery link via the admin client so we can
  // send the link ourselves without relying on Supabase's email delivery.
  // We use the action_link from generateLink which routes through Supabase's
  // own /auth/v1/verify endpoint — this handles token verification reliably
  // and redirects to our reset-password page with session tokens in the hash.
  let resetUrl: string | null = null

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${origin}/reset-password`,
      },
    })

    if (error) {
      console.error('[forgot-password] generateLink error:', error)
    } else {
      resetUrl = data?.properties?.action_link ?? null
      if (!resetUrl) {
        console.error('[forgot-password] generateLink returned no action_link', data)
      }
    }
  } catch (err) {
    console.error('[forgot-password] generateLink threw:', err)
  }

  // Step 2: send the email via Resend (if we have a link).
  if (resetUrl) {
    try {
      await sendPasswordResetEmail(email, resetUrl)
      console.log('[forgot-password] reset email sent to', email)
    } catch (err) {
      console.error('[forgot-password] sendPasswordResetEmail threw:', err)
    }
  }

  // Always return success — prevents email enumeration and avoids leaking
  // whether the address exists in our system.
  return NextResponse.json({ success: true })
}
