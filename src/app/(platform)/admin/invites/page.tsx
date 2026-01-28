'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Copy, Check, X, ExternalLink, Calendar, Users } from 'lucide-react'

interface InviteLink {
  id: string
  token: string
  createdAt: string
  expiresAt: string | null
  maxUses: number | null
  usedCount: number
  isActive: boolean
  notes: string | null
  admin: {
    email: string
    member: {
      firstName: string
      lastName: string
    }
  }
}

interface InviteStats {
  total: number
  active: number
  inactive: number
  totalSignups: number
}

export default function AdminInvitesPage() {
  const [invites, setInvites] = useState<InviteLink[]>([])
  const [stats, setStats] = useState<InviteStats>({ total: 0, active: 0, inactive: 0, totalSignups: 0 })
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  // Form state for creating invite
  const [formData, setFormData] = useState({
    expiresAt: '',
    maxUses: '',
    notes: '',
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchInvites()
  }, [])

  const fetchInvites = async () => {
    try {
      const response = await fetch('/api/admin/invites')
      const data = await response.json()
      if (data.success) {
        setInvites(data.data.invites || [])
        setStats(data.data.stats || { total: 0, active: 0, inactive: 0, totalSignups: 0 })
      }
    } catch (error) {
      console.error('Error fetching invites:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const payload: any = {}

      if (formData.expiresAt) {
        payload.expiresAt = new Date(formData.expiresAt).toISOString()
      }

      if (formData.maxUses && parseInt(formData.maxUses) > 0) {
        payload.maxUses = parseInt(formData.maxUses)
      }

      if (formData.notes) {
        payload.notes = formData.notes
      }

      const response = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        setShowCreateModal(false)
        setFormData({ expiresAt: '', maxUses: '', notes: '' })
        fetchInvites()

        // Auto-copy the new invite link
        const inviteUrl = `${window.location.origin}/signup?invite=${data.data.token}`
        navigator.clipboard.writeText(inviteUrl)
        setCopiedToken(data.data.token)
        setTimeout(() => setCopiedToken(null), 3000)
      } else {
        alert('Failed to create invite link')
      }
    } catch (error) {
      console.error('Error creating invite:', error)
      alert('An error occurred')
    } finally {
      setCreating(false)
    }
  }

  const handleDeactivate = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this invite link?')) return

    try {
      const response = await fetch(`/api/admin/invites/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      })

      if (response.ok) {
        fetchInvites()
      } else {
        alert('Failed to deactivate invite link')
      }
    } catch (error) {
      console.error('Error deactivating invite:', error)
      alert('An error occurred')
    }
  }

  const handleReactivate = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/invites/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      })

      if (response.ok) {
        fetchInvites()
      } else {
        alert('Failed to reactivate invite link')
      }
    } catch (error) {
      console.error('Error reactivating invite:', error)
      alert('An error occurred')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invite link? This cannot be undone.')) return

    try {
      const response = await fetch(`/api/admin/invites/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        fetchInvites()
      } else {
        alert(data.error || 'Failed to delete invite link')
      }
    } catch (error) {
      console.error('Error deleting invite:', error)
      alert('An error occurred')
    }
  }

  const copyInviteUrl = (token: string) => {
    const inviteUrl = `${window.location.origin}/signup?invite=${token}`
    navigator.clipboard.writeText(inviteUrl)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Invite Links</h1>
            <p className="text-gray-600">Manage platform invite links for new members</p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cyan border-2 border-black font-bold uppercase text-sm neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
        >
          <Plus className="w-4 h-4" /> Generate Invite
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border-2 border-black p-4 neo-shadow">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-gray-600 uppercase tracking-wide">Total Links</p>
        </div>
        <div className="bg-white border-2 border-black p-4 neo-shadow">
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          <p className="text-xs text-gray-600 uppercase tracking-wide">Active</p>
        </div>
        <div className="bg-white border-2 border-black p-4 neo-shadow">
          <p className="text-2xl font-bold text-gray-400">{stats.inactive}</p>
          <p className="text-xs text-gray-600 uppercase tracking-wide">Inactive</p>
        </div>
        <div className="bg-white border-2 border-black p-4 neo-shadow">
          <p className="text-2xl font-bold text-cyan">{stats.totalSignups}</p>
          <p className="text-xs text-gray-600 uppercase tracking-wide">Total Signups</p>
        </div>
      </div>

      {/* Invites List */}
      <div className="bg-white border-2 border-black neo-shadow">
        <div className="px-6 py-4 border-b-2 border-black">
          <h2 className="font-display text-xl font-bold uppercase">All Invite Links</h2>
        </div>

        <div className="divide-y-2 divide-black">
          {invites.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <p>No invite links created yet.</p>
              <p className="text-sm">Click &quot;Generate Invite&quot; to create your first invite link.</p>
            </div>
          ) : (
            invites.map((invite) => (
              <div key={invite.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Token and Status */}
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 border border-gray-300 truncate">
                        {invite.token}
                      </code>
                      {invite.isActive ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold uppercase border border-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-bold uppercase border border-gray-300">
                          Inactive
                        </span>
                      )}
                      {isExpired(invite.expiresAt) && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold uppercase border border-red-700">
                          Expired
                        </span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>
                          {invite.usedCount} use{invite.usedCount !== 1 ? 's' : ''}
                          {invite.maxUses && ` / ${invite.maxUses}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Created {formatDate(invite.createdAt)}</span>
                      </div>
                      {invite.expiresAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Expires {formatDate(invite.expiresAt)}</span>
                        </div>
                      )}
                      <div>
                        by {invite.admin.member.firstName} {invite.admin.member.lastName}
                      </div>
                    </div>

                    {/* Notes */}
                    {invite.notes && (
                      <p className="mt-2 text-sm text-gray-500 italic">{invite.notes}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyInviteUrl(invite.token)}
                      className="p-2 bg-cyan border-2 border-black neo-shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                      title="Copy invite URL"
                    >
                      {copiedToken === invite.token ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    {invite.isActive ? (
                      <button
                        onClick={() => handleDeactivate(invite.id)}
                        className="p-2 bg-yellow border-2 border-black neo-shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                        title="Deactivate"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReactivate(invite.id)}
                        className="p-2 bg-green-400 border-2 border-black neo-shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                        title="Reactivate"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}

                    {invite.usedCount === 0 && (
                      <button
                        onClick={() => handleDelete(invite.id)}
                        className="p-2 bg-red-400 border-2 border-black neo-shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                        title="Delete"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-black neo-shadow-lg max-w-md w-full">
            <div className="px-6 py-4 border-b-2 border-black flex items-center justify-between">
              <h2 className="font-display text-xl font-bold uppercase">Generate Invite Link</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-gray-100 border-2 border-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvite} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase mb-2">
                  Expiration Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for no expiration</p>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase mb-2">
                  Max Uses (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
                  placeholder="Unlimited"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited uses</p>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan resize-none"
                  rows={3}
                  placeholder="Internal notes about this invite..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 border-2 border-black font-bold uppercase text-sm neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-cyan border-2 border-black font-bold uppercase text-sm neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
