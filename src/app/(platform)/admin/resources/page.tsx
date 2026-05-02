import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { FileText, Eye, Download } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { ResourceAdminActions } from '@/components/resources/admin-actions'
import { ResourceCategoryManager } from '@/components/resources/category-manager'

export const dynamic = 'force-dynamic'

export default async function AdminResourcesPage() {
  const session = await getSession()
  if (!session.isAdmin) redirect('/dashboard')

  const supabase = createAdminClient()

  const { data: resources } = await supabase
    .from('Resource')
    .select(`
      id, title, type, status, viewCount, downloadCount, createdAt,
      category:ResourceCategory(id, name, slug),
      author:User!authorId(
        id, email,
        member:Member(firstName, lastName)
      )
    `)
    .order('createdAt', { ascending: false })
    .limit(50)

  const { data: categories } = await supabase
    .from('ResourceCategory')
    .select('id, name, slug, description, color, order')
    .order('order', { ascending: true })

  const formatted = (resources || []).map((r: any) => {
    const member = Array.isArray(r.author?.member) ? r.author.member[0] : r.author?.member
    const categoryData = Array.isArray(r.category) ? r.category[0] : r.category
    return {
      id: r.id,
      title: r.title,
      type: r.type,
      status: r.status,
      viewCount: r.viewCount,
      downloadCount: r.downloadCount,
      createdAt: r.createdAt,
      category: categoryData?.name || 'Uncategorized',
      authorName: member ? `${member.firstName} ${member.lastName}` : r.author?.email || 'Unknown',
      authorEmail: r.author?.email,
    }
  })

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-cyan flex items-center justify-center border-2 border-black neo-shadow">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Resources Management</h1>
            <p className="text-gray-600">Moderate uploads and manage categories</p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white border-2 border-black neo-shadow mb-8">
        <div className="px-6 py-4 border-b-2 border-black flex items-center justify-between">
          <h2 className="font-display text-xl font-bold uppercase">
            Categories ({(categories || []).length})
          </h2>
        </div>
        <div className="p-6">
          <ResourceCategoryManager categories={categories || []} />
        </div>
      </div>

      {/* Resources Table */}
      <div className="bg-white border-2 border-black neo-shadow">
        <div className="px-6 py-4 border-b-2 border-black">
          <h2 className="font-display text-xl font-bold uppercase">All Resources ({formatted.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-black">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Resource</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Author</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Category</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Stats</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Date</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {formatted.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/community/resources/${r.id}`}
                      className="text-sm font-bold hover:text-coral transition-colors truncate max-w-[250px] block"
                    >
                      {r.title}
                    </Link>
                    <span className="text-[10px] font-bold uppercase text-gray-400">{r.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold">{r.authorName}</p>
                    <p className="text-[10px] text-gray-400">{r.authorEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold uppercase">{r.category}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase border border-black ${
                      r.status === 'PUBLISHED' ? 'bg-green-200' : 'bg-red-200'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{r.viewCount}</span>
                      <span className="flex items-center gap-1"><Download className="w-3 h-3" />{r.downloadCount}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <ResourceAdminActions resourceId={r.id} status={r.status} />
                  </td>
                </tr>
              ))}
              {formatted.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No resources yet
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
