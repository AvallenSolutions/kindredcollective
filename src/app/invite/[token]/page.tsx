'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2, Building2 } from 'lucide-react'
import { Button } from '@/components/ui'

interface InviteDetails {
  email: string
  organisation: {
    id: string
    name: string
    type: string
  }
  expiresAt: string
}

export default function InviteAcceptPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function fetchInvite() {
      try {
        const res = await fetch(`/api/me/organisation/invite/${token}`)
        const data = await res.json()

        if (!res.ok) {
          // If 401, user needs to log in first
          if (res.status === 401) {
            router.push(`/login?redirect=/invite/${token}`)
            return
          }
          setError(data.error || 'Invalid or expired invite')
          return
        }

        setInvite(data.data?.invite || data.invite)
      } catch {
        setError('Failed to load invite details')
      } finally {
        setLoading(false)
      }
    }

    fetchInvite()
  }, [token, router])

  async function handleAccept() {
    setAccepting(true)
    setError('')

    try {
      const res = await fetch(`/api/me/organisation/invite/${token}`, {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to accept invite')
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch {
      setError('Failed to accept invite')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-cyan" />
          <p className="text-gray-600 font-medium">Loading invite...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white border-3 border-black neo-shadow p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Welcome to the team!</h1>
          <p className="text-gray-600 mb-4">
            You&apos;ve successfully joined {invite?.organisation?.name}. Redirecting to your dashboard...
          </p>
        </div>
      </div>
    )
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white border-3 border-black neo-shadow p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Invalid Invite</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const org = invite?.organisation
  const orgType = org?.type === 'SUPPLIER' ? 'supplier' : 'brand'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white border-3 border-black neo-shadow p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-cyan border-2 border-black mx-auto mb-4 flex items-center justify-center">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">Team Invitation</h1>
          <p className="text-gray-600">
            You&apos;ve been invited to join <strong>{org?.name}</strong> ({orgType}) on Kindred Collective.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-100 border-2 border-red-500 text-red-700 mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full"
          >
            {accepting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              'Accept Invitation'
            )}
          </Button>

          <Link href="/dashboard" className="block">
            <Button variant="outline" className="w-full">
              Decline
            </Button>
          </Link>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          This invite expires on {invite?.expiresAt ? new Date(invite.expiresAt).toLocaleDateString('en-GB') : 'N/A'}
        </p>
      </div>
    </div>
  )
}
