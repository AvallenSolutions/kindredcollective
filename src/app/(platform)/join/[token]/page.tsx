'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Building2, Store, Check, ArrowRight } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'

interface InviteDetails {
  email: string
  organisation: {
    id: string
    name: string
    type: 'BRAND' | 'SUPPLIER'
  }
  expiresAt: string
}

export default function JoinPage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const { token } = params

  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // First check if the user is logged in
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.success || !data.user) {
          // Not logged in — redirect to login with return URL
          router.replace(`/login?redirect=/join/${token}`)
          return
        }
        // Logged in — fetch invite details
        return fetch(`/api/me/organisation/invite/${token}`)
      })
      .then(res => {
        if (!res) return // redirecting
        return res.json()
      })
      .then(data => {
        if (!data) return
        if (data.success) {
          setInvite(data.invite)
        } else {
          setError(data.error || 'Invalid or expired invite link')
        }
      })
      .catch(() => {
        setError('Failed to load invite details')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [token, router])

  const handleAccept = async () => {
    setAccepting(true)
    setError(null)

    try {
      const res = await fetch(`/api/me/organisation/invite/${token}`, {
        method: 'POST',
      })
      const data = await res.json()

      if (data.success) {
        setAccepted(true)
        setTimeout(() => router.push('/dashboard'), 2000)
      } else {
        setError(data.error || 'Failed to accept invite')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan" />
      </div>
    )
  }

  const OrgIcon = invite?.organisation.type === 'BRAND' ? Building2 : Store
  const orgColour = invite?.organisation.type === 'BRAND' ? 'bg-cyan' : 'bg-coral'

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold uppercase tracking-tight mb-2">
            You&apos;re Invited
          </h1>
          <p className="text-gray-600">Join your team on Kindred Collective</p>
        </div>

        <Card className="shadow-brutal-lg border-3 border-black">
          <CardHeader className="border-b-2 border-black">
            <div className={`w-12 h-12 ${orgColour} border-3 border-black flex items-center justify-center mb-4`}>
              {accepted
                ? <Check className="w-6 h-6" />
                : <OrgIcon className="w-6 h-6" />
              }
            </div>
            <CardTitle className="font-display text-2xl uppercase tracking-tight">
              {accepted ? 'Welcome aboard!' : invite?.organisation.name ?? 'Organisation Invite'}
            </CardTitle>
            {invite && !accepted && (
              <p className="text-sm text-gray-600 mt-1">
                {invite.organisation.type === 'BRAND' ? 'Brand' : 'Supplier'} &middot; Invite sent to{' '}
                <span className="font-medium">{invite.email}</span>
              </p>
            )}
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            {error && (
              <div className="bg-coral/10 border-2 border-coral text-coral px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {accepted && (
              <div className="bg-lime/20 border-2 border-lime px-4 py-3 text-sm">
                You&apos;ve joined <strong>{invite?.organisation.name}</strong>. Redirecting to your dashboard&hellip;
              </div>
            )}

            {!accepted && invite && (
              <>
                <p className="text-gray-700 text-sm">
                  You&apos;ve been invited to join{' '}
                  <strong>{invite.organisation.name}</strong> as a team member.
                  Click below to accept and gain access to the shared workspace.
                </p>

                <Button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="w-full"
                >
                  {accepting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Accepting&hellip;</>
                  ) : (
                    <>Accept Invite <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500">
                  Expires {new Date(invite.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </>
            )}

            {!accepted && !invite && !error && (
              <p className="text-gray-600 text-sm text-center">Loading invite details&hellip;</p>
            )}

            {!accepted && (
              <div className="border-t-2 border-black pt-4 text-center">
                <Link href="/dashboard" className="text-sm text-gray-500 hover:text-cyan underline">
                  Go to dashboard instead
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
