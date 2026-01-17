'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui'

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    role: 'BRAND',
  })

  useEffect(() => {
    fetchUser()
  }, [userId])

  async function fetchUser() {
    const res = await fetch(`/api/admin/users/${userId}`)
    const data = await res.json()

    if (data.success) {
      setFormData({
        email: data.data.email,
        role: data.data.role,
      })
    } else {
      setError('Failed to load user')
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: formData.role }),
    })

    const data = await res.json()

    if (data.success) {
      router.push('/admin/users')
    } else {
      setError(data.error || 'Failed to update user')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/users" className="p-2 border-2 border-black hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Edit User</h1>
          <p className="text-gray-600">{formData.email}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white border-2 border-black neo-shadow p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-100 border-2 border-red-500 text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-bold uppercase tracking-wide mb-2">
            Email Address
          </label>
          <input
            type="email"
            disabled
            value={formData.email}
            className="w-full px-4 py-2 border-2 border-gray-300 bg-gray-100 text-gray-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Email cannot be changed
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold uppercase tracking-wide mb-2">
            Role *
          </label>
          <select
            required
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
          >
            <option value="BRAND">Brand</option>
            <option value="SUPPLIER">Supplier</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
            className="flex-1"
          >
            {saving ? 'Saving...' : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
          <Link href="/admin/users">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
