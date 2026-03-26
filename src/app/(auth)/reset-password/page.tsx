'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md px-4">
        <Card className="shadow-brutal-lg">
          <CardContent className="pt-6 text-center text-gray-600 text-sm py-10">
            Verifying your reset link...
          </CardContent>
        </Card>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    // Listen for the PASSWORD_RECOVERY event fired when the user arrives
    // via the reset link (hash fragment is picked up by the browser client)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })

    async function establishSession() {
      // Verify token_hash directly from query params (sent by our forgot-password email).
      // This uses the browser Supabase client which handles session/cookie
      // management natively — no server-side callback needed.
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type') as 'recovery' | 'email' | 'magiclink' | 'signup'
      if (tokenHash && type) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        })
        if (!verifyError && !cancelled) {
          setReady(true)
          return
        }
        if (verifyError) {
          console.error('[reset-password] verifyOtp failed:', verifyError.message)
          if (!cancelled) setInvalid(true)
          return
        }
      }

      // Handle PKCE code exchange: Supabase may redirect with ?code=xxx
      const code = searchParams.get('code')
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (!exchangeError && !cancelled) {
          setReady(true)
          return
        }
        if (exchangeError) {
          console.error('[reset-password] code exchange failed:', exchangeError.message)
        }
      }

      // Check if a session already exists (e.g. from server-side callback)
      const { data: { session } } = await supabase.auth.getSession()
      if (session && !cancelled) {
        setReady(true)
        return
      }

      // Give the hash-fragment auth event time to fire, then mark invalid
      // (Supabase client library auto-detects tokens in the URL hash)
      setTimeout(() => {
        if (!cancelled) setInvalid(true)
      }, 3000)
    }

    establishSession()

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    setTimeout(() => {
      router.push('/dashboard')
      router.refresh()
    }, 2000)
  }

  if (success) {
    return (
      <div className="w-full max-w-md px-4">
        <Card className="shadow-brutal-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Password Updated</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="bg-cyan/10 border-2 border-cyan px-4 py-3 text-sm mb-6">
              Your password has been successfully updated. Redirecting to your dashboard...
            </div>
            <Link
              href="/dashboard"
              className="block w-full text-center px-4 py-2 bg-cyan border-2 border-black font-bold uppercase text-sm neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              Go to Dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (invalid) {
    return (
      <div className="w-full max-w-md px-4">
        <Card className="shadow-brutal-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Link Expired</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="bg-coral/10 border-2 border-coral text-coral px-4 py-3 text-sm mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </div>
            <Link
              href="/forgot-password"
              className="block w-full text-center px-4 py-2 bg-cyan border-2 border-black font-bold uppercase text-sm neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              Request New Link
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="w-full max-w-md px-4">
        <Card className="shadow-brutal-lg">
          <CardContent className="pt-6 text-center text-gray-600 text-sm py-10">
            Verifying your reset link...
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md px-4">
      <Card className="shadow-brutal-lg">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl">Set New Password</CardTitle>
          <p className="text-gray-600 text-sm mt-2">
            Choose a new password for your account
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-coral/10 border-2 border-coral text-coral px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <p className="text-xs text-gray-500">Minimum 8 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>

          <Link
            href="/login"
            className="block text-center text-sm text-gray-600 hover:text-cyan mt-6"
          >
            Back to Login
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
