'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Mail, Copy, Check, Trash2, Crown, Shield, User as UserIcon, Users, X } from 'lucide-react'
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Member {
  id: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  joinedAt: string
  user: {
    id: string
    email: string
    role: string
    member: {
      firstName: string
      lastName: string
      jobTitle: string | null
      avatarUrl: string | null
    }[]
  }
}

interface Organisation {
  id: string
  name: string
  type: 'BRAND' | 'SUPPLIER'
}

export default function TeamSettingsPage() {
  const [organisation, setOrganisation] = useState<Organisation | null>(null)
  const [userRole, setUserRole] = useState<'OWNER' | 'ADMIN' | 'MEMBER' | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER')
  const [inviting, setInviting] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Transfer ownership modal
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferToUserId, setTransferToUserId] = useState('')
  const [transferring, setTransferring] = useState(false)

  useEffect(() => {
    fetchOrganisation()
  }, [])

  const fetchOrganisation = async () => {
    try {
      const response = await fetch('/api/organisations/my-organisation')
      const data = await response.json()

      if (data.success) {
        setOrganisation(data.organisation)
        setUserRole(data.userRole)
        fetchMembers(data.organisation.id)
      } else {
        setError('No organisation found')
        setLoading(false)
      }
    } catch (err) {
      console.error('Error fetching organisation:', err)
      setError('Failed to load organisation')
      setLoading(false)
    }
  }

  const fetchMembers = async (orgId: string) => {
    try {
      const response = await fetch(`/api/organisations/${orgId}/members`)
      const data = await response.json()

      if (data.success) {
        setMembers(data.members)
      }
    } catch (err) {
      console.error('Error fetching members:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!organisation) return

    setInviting(true)
    setError(null)

    try {
      const response = await fetch(`/api/organisations/${organisation.id}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })

      const data = await response.json()

      if (data.success) {
        setInviteUrl(data.inviteUrl)
        setInviteEmail('')
        // Don't close modal so user can copy link
      } else {
        setError(data.error || 'Failed to create invite')
      }
    } catch (err) {
      console.error('Error creating invite:', err)
      setError('An error occurred')
    } finally {
      setInviting(false)
    }
  }

  const copyInviteUrl = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!organisation) return
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      const response = await fetch(`/api/organisations/${organisation.id}/members/${userId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        fetchMembers(organisation.id)
      } else {
        setError(data.error || 'Failed to remove member')
      }
    } catch (err) {
      console.error('Error removing member:', err)
      setError('An error occurred')
    }
  }

  const handleTransferOwnership = async () => {
    if (!organisation || !transferToUserId) return

    setTransferring(true)
    setError(null)

    try {
      const response = await fetch(`/api/organisations/${organisation.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOwnerId: transferToUserId }),
      })

      const data = await response.json()

      if (data.success) {
        setShowTransferModal(false)
        setTransferToUserId('')
        fetchOrganisation() // Refresh to update roles
      } else {
        setError(data.error || 'Failed to transfer ownership')
      }
    } catch (err) {
      console.error('Error transferring ownership:', err)
      setError('An error occurred')
    } finally {
      setTransferring(false)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow border-2 border-black text-xs font-bold uppercase"><Crown className="w-3 h-3" /> Owner</span>
      case 'ADMIN':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-magenta text-white border-2 border-black text-xs font-bold uppercase"><Shield className="w-3 h-3" /> Admin</span>
      case 'MEMBER':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan border-2 border-black text-xs font-bold uppercase"><UserIcon className="w-3 h-3" /> Member</span>
      default:
        return null
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <p>Loading team settings...</p>
      </div>
    )
  }

  if (error && !organisation) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Card className="shadow-brutal-lg">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">{error}</p>
            <p className="text-center text-sm text-gray-500 mt-2">
              Complete your onboarding to create or join an organisation.
            </p>
            <div className="flex justify-center mt-4">
              <Link
                href="/onboarding"
                className="px-4 py-2 bg-cyan border-2 border-black font-bold uppercase text-sm neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                Go to Onboarding
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!organisation || !userRole) return null

  const canInvite = userRole === 'OWNER' || userRole === 'ADMIN'
  const canTransferOwnership = userRole === 'OWNER'
  const adminMembers = members.filter(m => m.role === 'ADMIN')

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/settings"
            className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Team Management</h1>
            <p className="text-gray-600">{organisation.name}</p>
          </div>
        </div>

        {canInvite && (
          <button
            onClick={() => {
              setShowInviteModal(true)
              setInviteUrl(null)
              setError(null)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan border-2 border-black font-bold uppercase text-sm neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            <Plus className="w-4 h-4" /> Invite Member
          </button>
        )}
      </div>

      {error && (
        <div className="bg-coral/10 border-2 border-coral text-coral px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Team Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{members.length}</p>
            <p className="text-xs text-gray-600 uppercase tracking-wide">Total Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{members.filter(m => m.role === 'OWNER').length}</p>
            <p className="text-xs text-gray-600 uppercase tracking-wide">Owner</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{members.filter(m => m.role === 'ADMIN').length}</p>
            <p className="text-xs text-gray-600 uppercase tracking-wide">Admins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{members.filter(m => m.role === 'MEMBER').length}</p>
            <p className="text-xs text-gray-600 uppercase tracking-wide">Members</p>
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      <Card className="shadow-brutal-lg">
        <CardHeader className="border-b-2 border-black">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y-2 divide-black">
            {members.map((member) => {
              const memberInfo = member.user.member[0]
              if (!memberInfo) return null

              return (
                <div key={member.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-cyan border-2 border-black flex items-center justify-center font-bold">
                        {memberInfo.avatarUrl ? (
                          <img
                            src={memberInfo.avatarUrl}
                            alt={`${memberInfo.firstName} ${memberInfo.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getInitials(memberInfo.firstName, memberInfo.lastName)
                        )}
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold">
                            {memberInfo.firstName} {memberInfo.lastName}
                          </p>
                          {getRoleBadge(member.role)}
                        </div>
                        <p className="text-sm text-gray-600">{member.user.email}</p>
                        {memberInfo.jobTitle && (
                          <p className="text-sm text-gray-500">{memberInfo.jobTitle}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {member.role !== 'OWNER' && canInvite && (
                        <button
                          onClick={() => handleRemoveMember(member.user.id)}
                          className="p-2 bg-white border-2 border-black neo-shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4 text-coral" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Transfer Ownership Section */}
      {canTransferOwnership && adminMembers.length > 0 && (
        <Card className="shadow-brutal-lg mt-8">
          <CardHeader className="border-b-2 border-black">
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold mb-1">Transfer Ownership</p>
                <p className="text-sm text-gray-600">
                  Transfer ownership to another admin. You will become an admin.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowTransferModal(true)}
                className="border-coral text-coral hover:bg-coral hover:text-white"
              >
                Transfer Ownership
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="border-b-2 border-black">
              <div className="flex items-center justify-between">
                <CardTitle>Invite Team Member</CardTitle>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-1 hover:bg-gray-100 border-2 border-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {!inviteUrl ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="inviteEmail">Email Address</Label>
                    <Input
                      id="inviteEmail"
                      type="email"
                      placeholder="colleague@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inviteRole">Role</Label>
                    <select
                      id="inviteRole"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'MEMBER')}
                      className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
                    >
                      <option value="MEMBER">Member</option>
                      {userRole === 'OWNER' && <option value="ADMIN">Admin</option>}
                    </select>
                  </div>

                  <Button
                    onClick={handleInvite}
                    disabled={inviting || !inviteEmail}
                    className="w-full"
                  >
                    {inviting ? 'Creating Invite...' : 'Create Invite'}
                  </Button>
                </>
              ) : (
                <>
                  <div className="bg-green-50 border-2 border-green-500 text-green-700 px-4 py-3 text-sm">
                    Invite created successfully!
                  </div>

                  <div className="space-y-2">
                    <Label>Invite Link</Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={inviteUrl}
                        className="flex-1"
                      />
                      <button
                        onClick={copyInviteUrl}
                        className="p-2 bg-cyan border-2 border-black neo-shadow hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Share this link with your colleague. It expires in 7 days.
                    </p>
                  </div>

                  <Button
                    onClick={() => setShowInviteModal(false)}
                    className="w-full"
                  >
                    Done
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transfer Ownership Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="border-b-2 border-black">
              <div className="flex items-center justify-between">
                <CardTitle className="text-red-600">Transfer Ownership</CardTitle>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="p-1 hover:bg-gray-100 border-2 border-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="bg-yellow/10 border-2 border-yellow text-yellow-800 px-4 py-3 text-sm">
                ⚠️ This action cannot be undone. You will become an admin.
              </div>

              <div className="space-y-2">
                <Label htmlFor="newOwner">Select New Owner</Label>
                <select
                  id="newOwner"
                  value={transferToUserId}
                  onChange={(e) => setTransferToUserId(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
                >
                  <option value="">Select an admin...</option>
                  {adminMembers.map((member) => {
                    const memberInfo = member.user.member[0]
                    return (
                      <option key={member.user.id} value={member.user.id}>
                        {memberInfo.firstName} {memberInfo.lastName} ({member.user.email})
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleTransferOwnership}
                  disabled={transferring || !transferToUserId}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {transferring ? 'Transferring...' : 'Transfer Ownership'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
