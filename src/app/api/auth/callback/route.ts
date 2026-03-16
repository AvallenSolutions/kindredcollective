import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const inviteToken = searchParams.get('invite')
  const next = searchParams.get('next') ?? '/onboarding' // Redirect to onboarding for profile setup

  const cookieStore = await cookies()

  // Capture cookies set by Supabase auth operations so we can apply them to
  // the specific NextResponse we return. cookies() from next/headers writes to
  // the implicit default response — NOT to a custom NextResponse.redirect —
  // so without this the browser never receives session cookies.
  const pendingCookies: Array<{ name: string; value: string; options: CookieOptions }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach((c) => pendingCookies.push(c))
        },
      },
    }
  )

  function withCookies(response: NextResponse): NextResponse {
    pendingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })
    return response
  }

  // Handle password reset (and other OTP-based flows) via token_hash
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'recovery' | 'signup' | 'magiclink' | 'email',
    })

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      const redirectPath = type === 'recovery' ? '/reset-password' : next

      if (isLocalEnv) {
        return withCookies(NextResponse.redirect(`${origin}${redirectPath}`))
      } else if (forwardedHost) {
        return withCookies(NextResponse.redirect(`https://${forwardedHost}${redirectPath}`))
      } else {
        return withCookies(NextResponse.redirect(`${origin}${redirectPath}`))
      }
    }

    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
  }

  if (code) {
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && sessionData?.user) {
      const user = sessionData.user

      // Check if user already exists in our User table
      const { data: existingUser } = await supabase
        .from('User')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingUser) {
        const adminSupabase = createAdminClient()

        // Validate invite token (REQUIRED for new signups)
        if (!inviteToken) {
          // New users MUST have an invite token
          return NextResponse.redirect(`${origin}/signup?error=invite_required`)
        }

        let validatedInviteToken = null
        if (inviteToken) {
          const { data: invite, error: inviteError } = await adminSupabase
            .from('InviteLink')
            .select('id, token, isActive, expiresAt, maxUses, usedCount')
            .eq('token', inviteToken)
            .single()

          // Check invite validity
          if (!invite ||
              !invite.isActive ||
              (invite.expiresAt && new Date(invite.expiresAt) < new Date()) ||
              (invite.maxUses && invite.usedCount >= invite.maxUses)) {
            // Invalid, inactive, expired, or maxed out invite
            return NextResponse.redirect(`${origin}/signup?error=invalid_invite`)
          }

          validatedInviteToken = inviteToken

          // Increment invite usage count
          await adminSupabase
            .from('InviteLink')
            .update({ usedCount: invite.usedCount + 1 })
            .eq('id', invite.id)
        }

        // Create user record in our database - always as MEMBER
        const { error: createError } = await adminSupabase
          .from('User')
          .insert({
            id: user.id,
            email: user.email!,
            role: 'MEMBER',
            inviteLinkToken: validatedInviteToken,
            emailVerified: user.email_confirmed_at ? new Date(user.email_confirmed_at).toISOString() : null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })

        if (createError) {
          console.error('Error creating user record:', createError)
          // Don't fail the auth flow, but log the error
        }

        // Create a basic member profile
        const metadata = user.user_metadata || {}
        const firstName = metadata.first_name || metadata.full_name?.split(' ')[0] || ''
        const lastName = metadata.last_name || metadata.full_name?.split(' ').slice(1).join(' ') || ''

        if (firstName || lastName) {
          await supabase
            .from('Member')
            .insert({
              userId: user.id,
              firstName: firstName || 'User',
              lastName: lastName || '',
              isPublic: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return withCookies(NextResponse.redirect(`${origin}${next}`))
      } else if (forwardedHost) {
        return withCookies(NextResponse.redirect(`https://${forwardedHost}${next}`))
      } else {
        return withCookies(NextResponse.redirect(`${origin}${next}`))
      }
    }
  }

  // No server-side token found — Supabase may have sent the token as a hash
  // fragment (implicit flow), which is invisible to the server. Return a small
  // HTML page that reads the hash client-side and redirects accordingly.
  return new NextResponse(
    `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Redirecting...</title></head>
<body>
<script>
  var hash = window.location.hash.substring(1);
  var params = {};
  hash.split('&').forEach(function(part) {
    var kv = part.split('=');
    params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
  });
  if (params.type === 'recovery' && params.access_token) {
    window.location.href = '/reset-password#' + hash;
  } else {
    window.location.href = '/login?error=auth_callback_error';
  }
</script>
</body>
</html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  )
}
