import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { ArrowLeft, UserPlus, Mail } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function JoinRequestsPage() {
  const session = await getSession()

  if (!session.isAdmin) {
    redirect('/dashboard')
  }

  const supabase = createAdminClient()

  const { data: requests } = await supabase
    .from('InviteRequest')
    .select('id, name, email, company, type, message, createdAt, reviewed')
    .order('createdAt', { ascending: false })

  const pending = (requests || []).filter((r) => !r.reviewed)
  const reviewed = (requests || []).filter((r) => r.reviewed)

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin"
          className="text-sm font-bold uppercase text-gray-500 hover:text-black flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Admin
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan flex items-center justify-center border-2 border-black neo-shadow">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Membership Requests</h1>
            <p className="text-gray-600 text-sm">{pending.length} pending review</p>
          </div>
        </div>
      </div>

      {(requests || []).length === 0 ? (
        <div className="bg-white border-2 border-black neo-shadow p-12 text-center">
          <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h2 className="font-display text-xl font-bold mb-2">No requests yet</h2>
          <p className="text-gray-600">Membership requests submitted via the join page will appear here.</p>
        </div>
      ) : (
        <>
          {/* Pending */}
          {pending.length > 0 && (
            <div className="mb-8">
              <h2 className="font-display text-lg font-bold uppercase mb-4">
                Pending ({pending.length})
              </h2>
              <div className="bg-white border-2 border-black neo-shadow overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-cyan border-b-2 border-black">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Company</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Message</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pending.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 font-medium text-sm">{req.name}</td>
                        <td className="px-4 py-4 text-sm">
                          <a href={`mailto:${req.email}`} className="text-cyan hover:underline flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {req.email}
                          </a>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">{req.company || '—'}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-bold uppercase border-2 border-black bg-lime">
                            {req.type}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 max-w-xs">
                          <p className="truncate">{req.message || '—'}</p>
                        </td>
                        <td className="px-4 py-4 text-xs text-gray-500">
                          {new Date(req.createdAt).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-4 py-4">
                          <Link
                            href={`/admin/invites?prefill=${encodeURIComponent(req.email)}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white text-xs font-bold uppercase hover:bg-cyan hover:text-black transition-colors border border-black"
                          >
                            Send Invite
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reviewed */}
          {reviewed.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-bold uppercase mb-4 text-gray-500">
                Reviewed ({reviewed.length})
              </h2>
              <div className="bg-white border-2 border-black neo-shadow overflow-x-auto opacity-60">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b-2 border-black">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Company</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reviewed.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-sm">{req.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{req.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{req.company || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-0.5 text-xs font-bold uppercase border border-gray-300 bg-gray-100">
                            {req.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {new Date(req.createdAt).toLocaleDateString('en-GB')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
