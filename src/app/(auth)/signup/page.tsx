'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Loader2, Mail } from 'lucide-react'
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'

function SignupForm() {
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
  const [signupComplete, setSignupComplete] = useState(false)

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

      // Show the "check your email" confirmation screen
      setSignupComplete(true)
    } catch {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  // Show confirmation screen after successful signup
  if (signupComplete) {
    return (
      <div className="w-full max-w-md px-4">
        <Card className="shadow-brutal-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-cyan border-3 border-black mx-auto mb-6 flex items-center justify-center">
              <Mail className="w-8 h-8" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-3">Check your email</h2>
            <p className="text-gray-600 mb-2">
              We&apos;ve sent a confirmation link to
            </p>
            <p className="font-bold text-black mb-6">{formData.email}</p>
            <p className="text-sm text-gray-500 mb-6">
              Click the link in the email to confirm your account and get started with Kindred Collective.
            </p>
            <div className="bg-amber-50 border-2 border-amber-300 p-4 mb-6">
              <p className="text-sm text-amber-800">
                Can&apos;t find the email? Check your spam folder.
              </p>
            </div>
            <Link
              href="/login"
              className="block w-full text-center px-4 py-2 bg-cyan border-2 border-black font-bold uppercase text-sm neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              Go to Login
            </Link>
          </CardContent>
        </Card>
      </div>
    )
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
