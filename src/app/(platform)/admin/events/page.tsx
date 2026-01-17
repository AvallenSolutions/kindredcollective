'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Plus, Pencil, Trash2, Search, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui'

interface Event {
  id: string
  title: string
  slug: string
  type: string
  status: string
  startDate: string
  endDate: string | null
  city: string | null
  isVirtual: boolean
  createdAt: string
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })

  useEffect(() => {
    fetchEvents()
  }, [search, statusFilter, pagination.page])

  async function fetchEvents() {
    setLoading(true)
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: '20',
    })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)

    const res = await fetch(`/api/admin/events?${params}`)
    const data = await res.json()

    if (data.success) {
      setEvents(data.data.events || [])
      setPagination(prev => ({
        ...prev,
        total: data.data.pagination.total,
        totalPages: data.data.pagination.totalPages,
      }))
    }
    setLoading(false)
  }

  async function deleteEvent(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return

    const res = await fetch(`/api/admin/events/${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchEvents()
    } else {
      alert('Failed to delete event')
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="p-2 border-2 border-black hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Events</h1>
          <p className="text-gray-600">Manage platform events</p>
        </div>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-yellow border-2 border-black font-bold uppercase text-sm neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
        >
          <Plus className="w-4 h-4" /> Add Event
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Events Table */}
      <div className="bg-white border-2 border-black neo-shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-black">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">Event</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">Type</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">Date</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">Location</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No events found
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold">{event.title}</p>
                        <p className="text-sm text-gray-500">/{event.slug}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{event.type}</td>
                    <td className="px-6 py-4 text-sm">
                      {formatDate(event.startDate)}
                      {event.endDate && ` - ${formatDate(event.endDate)}`}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {event.isVirtual ? 'Virtual' : event.city || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-bold uppercase border-2 border-black ${
                          event.status === 'PUBLISHED'
                            ? 'bg-green-400'
                            : event.status === 'DRAFT'
                            ? 'bg-gray-200'
                            : 'bg-red-400 text-white'
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="p-2 border-2 border-black hover:bg-cyan transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => deleteEvent(event.id, event.title)}
                          className="p-2 border-2 border-black hover:bg-red-500 hover:text-white transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t-2 border-black flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
