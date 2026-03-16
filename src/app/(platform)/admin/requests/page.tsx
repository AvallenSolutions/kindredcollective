import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { Zap, ArrowLeft, ExternalLink } from 'lucide-react'
import { SUPPLIER_CATEGORY_LABELS } from '@/types/database'
import type { SupplierCategory } from '@prisma/client'

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-lime border-lime-700 text-lime-900',
  CLOSED: 'bg-gray-100 border-gray-300 text-gray-600',
  AWARDED: 'bg-cyan border-black',
  DRAFT: 'bg-yellow-100 border-yellow-500 text-yellow-800',
}

export default async function AdminRequestsPage() {
  const session = await getSession()
  if (!session.isAdmin) redirect('/dashboard')

  const supabase = createAdminClient()

  const { data: rfps } = await supabase
    .from('RFP')
    .select(`
      id, title, category, status, createdAt,
      brand:Brand(id, name, slug),
      responses:RFPResponse(count)
    `)
    .order('createdAt', { ascending: false })
    .limit(100)

  const counts = {
    total: rfps?.length || 0,
    open: rfps?.filter(r => r.status === 'OPEN').length || 0,
    closed: rfps?.filter(r => r.status === 'CLOSED').length || 0,
    awarded: rfps?.filter(r => r.status === 'AWARDED').length || 0,
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-sm font-bold hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Admin
        </Link>
      </div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-cyan flex items-center justify-center border-2 border-black neo-shadow">
          <Zap className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Requests for Proposal</h1>
          <p className="text-gray-600">Monitor and moderate all brand RFPs</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: counts.total, color: 'bg-white' },
          { label: 'Open', value: counts.open, color: 'bg-lime' },
          { label: 'Awarded', value: counts.awarded, color: 'bg-cyan' },
          { label: 'Closed', value: counts.closed, color: 'bg-gray-100' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.color} border-2 border-black p-4 neo-shadow`}>
            <p className="text-3xl font-display font-bold">{stat.value}</p>
            <p className="text-xs text-gray-600 uppercase tracking-wide">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border-2 border-black neo-shadow">
        <div className="px-6 py-4 border-b-2 border-black">
          <h2 className="font-display text-xl font-bold uppercase">All Requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-black">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">Title</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">Brand</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">Category</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">Responses</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">Posted</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rfps?.map(rfp => {
                const brand = Array.isArray(rfp.brand) ? rfp.brand[0] : rfp.brand
                const responseCount = rfp.responses?.[0]
                  ? (typeof rfp.responses[0] === 'object' && 'count' in rfp.responses[0]
                      ? (rfp.responses[0] as any).count : 0) : 0
                return (
                  <tr key={rfp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium max-w-xs">
                      <span className="line-clamp-2">{rfp.title}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {brand?.name || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {SUPPLIER_CATEGORY_LABELS[rfp.category as SupplierCategory] || rfp.category}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-bold uppercase border ${STATUS_STYLES[rfp.status] || ''}`}>
                        {rfp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-center">{responseCount}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(rfp.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/requests/${rfp.id}`} target="_blank">
                        <ExternalLink className="w-4 h-4 text-gray-400 hover:text-black" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {(!rfps || rfps.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
