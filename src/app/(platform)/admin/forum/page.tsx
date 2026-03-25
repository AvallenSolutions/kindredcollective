import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { MessageSquare, Pin, Trash2, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { ForumAdminActions } from '@/components/forum/admin-actions'

export const dynamic = 'force-dynamic'

export default async function AdminForumPage() {
  const session = await getSession()
  if (!session.isAdmin) redirect('/dashboard')

  const supabase = createAdminClient()

  // Fetch all posts (including removed) for admin
  const { data: posts } = await supabase
    .from('ForumPost')
    .select(`
      id, title, type, status, isPinned, viewCount, createdAt,
      category:ForumCategory(id, name, slug),
      author:User!authorId(
        id, email,
        member:Member(firstName, lastName)
      ),
      comments:ForumComment(count)
    `)
    .order('createdAt', { ascending: false })
    .limit(50)

  // Fetch categories for management
  const { data: categories } = await supabase
    .from('ForumCategory')
    .select('id, name, slug, description, color, order')
    .order('order', { ascending: true })

  const formattedPosts = (posts || []).map((post: any) => {
    const member = Array.isArray(post.author?.member) ? post.author.member[0] : post.author?.member
    const categoryData = Array.isArray(post.category) ? post.category[0] : post.category
    return {
      id: post.id,
      title: post.title,
      type: post.type,
      status: post.status,
      isPinned: post.isPinned,
      viewCount: post.viewCount,
      createdAt: post.createdAt,
      commentCount: post.comments?.[0]?.count || 0,
      category: categoryData?.name || 'Uncategorized',
      authorName: member ? `${member.firstName} ${member.lastName}` : post.author?.email || 'Unknown',
      authorEmail: post.author?.email,
    }
  })

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-coral text-white flex items-center justify-center border-2 border-black neo-shadow">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Forum Management</h1>
            <p className="text-gray-600">Moderate posts, manage categories, pin announcements</p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white border-2 border-black neo-shadow mb-8">
        <div className="px-6 py-4 border-b-2 border-black flex items-center justify-between">
          <h2 className="font-display text-xl font-bold uppercase">Categories</h2>
        </div>
        <div className="p-6">
          {categories && categories.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="px-4 py-2 border-2 border-black flex items-center gap-2"
                  style={{ backgroundColor: cat.color + '33' }}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-black"
                    style={{ backgroundColor: cat.color }}
                  ></span>
                  <span className="font-bold text-sm uppercase">{cat.name}</span>
                  {cat.description && (
                    <span className="text-xs text-gray-500">- {cat.description}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              No categories yet. Add them via the database or API to get started.
            </p>
          )}
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white border-2 border-black neo-shadow">
        <div className="px-6 py-4 border-b-2 border-black">
          <h2 className="font-display text-xl font-bold uppercase">All Posts ({formattedPosts.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-black">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Post</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Author</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Category</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Stats</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Date</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {formattedPosts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {post.isPinned && <Pin className="w-3 h-3 text-amber-500" />}
                      <Link
                        href={`/community/forum/${post.id}`}
                        className="text-sm font-bold hover:text-coral transition-colors truncate max-w-[250px] block"
                      >
                        {post.title}
                      </Link>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-gray-400">{post.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold">{post.authorName}</p>
                    <p className="text-[10px] text-gray-400">{post.authorEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold uppercase">{post.category}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase border border-black ${
                      post.status === 'PUBLISHED' ? 'bg-green-200' : 'bg-red-200'
                    }`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.viewCount}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{post.commentCount}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(post.createdAt)}</td>
                  <td className="px-4 py-3">
                    <ForumAdminActions
                      postId={post.id}
                      isPinned={post.isPinned}
                      status={post.status}
                    />
                  </td>
                </tr>
              ))}
              {formattedPosts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No forum posts yet
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
