'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [inviteValidating, setInviteValidating] = useState(true)
  const [inviteValid, setInviteValid] = useState(false)

  // Validate invite token on mount
  useEffect(() => {
    if (!inviteToken) {
      setInviteValidating(false)
      setInviteValid(false)
      setError('An invite link is required to join Kindred Collective')
      return
    }

    fetch(`/api/invites/validate?token=${inviteToken}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.valid) {
          setInviteValid(true)
        } else {
          setInviteValid(false)
          setError(data.error || 'Invalid invite link')
        }
      })
      .catch(() => {
        setInviteValid(false)
        setError('Failed to validate invite link')
      })
      .finally(() => {
        setInviteValidating(false)
      })
  }, [inviteToken])

  // Show loading state while validating invite
  if (inviteValidating) {
    return (
      <div className="w-full max-w-md px-4 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-cyan" />
        <p className="text-gray-600">Validating invite...</p>
      </div>
    )
  }

  // Show error if no invite or invalid invite
  if (!inviteToken || !inviteValid) {
    return (
      <div className="w-full max-w-md px-4">
        <Card className="shadow-brutal-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Invite Required</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="bg-coral/10 border-2 border-coral text-coral px-4 py-3 text-sm mb-4">
              {error || 'An invite link is required to join Kindred Collective'}
            </div>
            <p className="text-center text-gray-600 mb-4">
              Kindred Collective is a private membership community. Please contact an administrator to receive an invite link.
            </p>
            <Link
              href="/login"
              className="block w-full text-center px-4 py-2 bg-cyan border-2 border-black font-bold uppercase text-sm neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              Back to Login
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteToken) return

    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          inviteToken: inviteToken,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create account')
        setLoading(false)
        return
      }

      // Sign in the user after successful signup
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (signInError) {
        // User created but needs to verify email
        router.push('/login?message=verify_email')
        return
      }

      // Redirect to onboarding to complete profile setup
      router.push('/onboarding')
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  const handleOAuthSignup = async (provider: 'google' | 'linkedin_oidc') => {
    if (!inviteToken) return

    const supabase = createClient()

    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?invite=${inviteToken}`,
      },
    })
  }

  return (
    <div className="w-full max-w-md px-4">
      <Card className="shadow-brutal-lg">
        <CardHeader className="text-center pb-2">
          <CardTitle className="font-display text-2xl">Join Kindred Collective</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Create your account to get started
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthSignup('google')}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthSignup('linkedin_oidc')}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              Continue with LinkedIn
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or</span>
            </div>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="bg-coral/10 border-2 border-coral text-coral px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Smith"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
              />
              <p className="text-xs text-gray-500">Minimum 8 characters</p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>

            <p className="text-xs text-center text-gray-500">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="underline hover:text-cyan">Terms</Link>
              {' '}and{' '}
              <Link href="/privacy" className="underline hover:text-cyan">Privacy Policy</Link>
            </p>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-black hover:text-cyan">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function SignupLoading() {
  return (
    <div className="w-full max-w-md px-4 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-cyan" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupLoading />}>
      <SignupForm />
    </Suspense>
  )
}
