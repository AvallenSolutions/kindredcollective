import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL ||
      `${request.nextUrl.protocol}//${request.nextUrl.host}`

    // Use the admin client to generate a recovery token.
    // This bypasses Supabase's built-in email system entirely so we can
    // send the reset link ourselves via Resend.
    const supabase = createAdminClient()

    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
    })

    if (error || !data?.properties?.hashed_token) {
      console.error('[forgot-password] generateLink error:', error)
      // Return success anyway to prevent email enumeration
      return NextResponse.json({ success: true })
    }

    // Build the reset URL pointing at our callback route, which verifies
    // the token server-side and redirects to /reset-password with a live session.
    const resetUrl = `${origin}/api/auth/callback?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=recovery&next=/reset-password`

    await sendPasswordResetEmail(email, resetUrl)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[forgot-password] Unexpected error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
