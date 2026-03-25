import Link from 'next/link'
import { MessageSquare, ArrowBigUp, Eye, Plus, Pin, Filter } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { formatDate, getInitials } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const POST_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  DISCUSSION: { label: 'Discussion', color: 'bg-cyan' },
  QUESTION: { label: 'Question', color: 'bg-coral' },
  NEWS: { label: 'News', color: 'bg-lime' },
  SHOWCASE: { label: 'Showcase', color: 'bg-purple-300' },
}

async function getForumData(category?: string, sort?: string) {
  const supabase = createAdminClient()

  // Fetch categories
  const { data: categories } = await supabase
    .from('ForumCategory')
    .select('id, name, slug, description, color, order')
    .order('order', { ascending: true })

  // Build posts query
  let query = supabase
    .from('ForumPost')
    .select(`
      id, title, body, type, isPinned, viewCount, createdAt, updatedAt,
      category:ForumCategory(id, name, slug, color),
      author:User!authorId(
        id, email,
        member:Member(firstName, lastName, avatarUrl, jobTitle, company)
      ),
      comments:ForumComment(count),
      votes:ForumVote(value)
    `, { count: 'exact' })
    .eq('status', 'PUBLISHED')
    .order('isPinned', { ascending: false })

  if (category) {
    // Look up category ID by slug
    const cat = (categories || []).find(c => c.slug === category)
    if (cat) query = query.eq('categoryId', cat.id)
  }

  if (sort === 'oldest') {
    query = query.order('createdAt', { ascending: true })
  } else {
    query = query.order('createdAt', { ascending: false })
  }

  query = query.range(0, 29) // 30 posts per page

  const { data: posts, count } = await query

  const postsWithScores = (posts || []).map((post: any) => {
    const voteScore = (post.votes || []).reduce((sum: number, v: any) => sum + v.value, 0)
    const commentCount = post.comments?.[0]?.count || 0
    const member = Array.isArray(post.author?.member) ? post.author.member[0] : post.author?.member
    const categoryData = Array.isArray(post.category) ? post.category[0] : post.category
    return {
      id: post.id,
      title: post.title,
      body: post.body,
      type: post.type,
      isPinned: post.isPinned,
      viewCount: post.viewCount,
      createdAt: post.createdAt,
      voteScore,
      commentCount,
      category: categoryData,
      author: {
        id: post.author?.id,
        name: member ? `${member.firstName} ${member.lastName}` : 'Unknown',
        avatarUrl: member?.avatarUrl,
        jobTitle: member?.jobTitle,
        company: member?.company,
      },
    }
  })

  return {
    categories: categories || [],
    posts: postsWithScores,
    totalPosts: count || 0,
  }
}

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>
}) {
  const session = await getSession()
  if (!session.isAuthenticated) redirect('/login')

  const { category, sort } = await searchParams
  const { categories, posts, totalPosts } = await getForumData(category, sort)

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <section className="pt-32 pb-12 px-6 border-b-2 border-black bg-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="w-3 h-3 bg-coral rounded-full border border-black"></span>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Community Forum</span>
              </div>
              <h1 className="font-display text-5xl md:text-7xl font-bold uppercase tracking-tighter leading-none mb-4">
                Forum
              </h1>
              <p className="text-xl font-medium text-gray-600 max-w-xl">
                Discuss, share, and connect with the indie drinks community.
              </p>
            </div>
            <Link
              href="/community/forum/new"
              className="px-6 py-3 bg-coral border-2 border-black font-bold uppercase hover:bg-black hover:text-coral transition-colors neo-shadow flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Post
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Categories */}
          <aside className="lg:w-64 shrink-0">
            <div className="bg-white border-2 border-black neo-shadow sticky top-28">
              <div className="px-4 py-3 bg-black text-white font-bold uppercase text-sm flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Categories
              </div>
              <div className="p-2">
                <Link
                  href="/community/forum"
                  className={`block px-3 py-2 text-sm font-bold uppercase hover:bg-gray-100 transition-colors ${
                    !category ? 'bg-gray-100 border-l-4 border-black' : ''
                  }`}
                >
                  All Posts
                  <span className="text-gray-400 ml-1">({totalPosts})</span>
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/community/forum?category=${cat.slug}`}
                    className={`block px-3 py-2 text-sm font-bold uppercase hover:bg-gray-100 transition-colors ${
                      category === cat.slug ? 'bg-gray-100 border-l-4 border-black' : ''
                    }`}
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full border border-black mr-2"
                      style={{ backgroundColor: cat.color }}
                    ></span>
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content - Post List */}
          <div className="flex-1 min-w-0">
            {/* Sort Controls */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs font-bold uppercase text-gray-500">Sort:</span>
              <Link
                href={`/community/forum${category ? `?category=${category}` : ''}`}
                className={`px-3 py-1 text-xs font-bold uppercase border-2 border-black transition-colors ${
                  sort !== 'oldest' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
                }`}
              >
                Newest
              </Link>
              <Link
                href={`/community/forum?sort=oldest${category ? `&category=${category}` : ''}`}
                className={`px-3 py-1 text-xs font-bold uppercase border-2 border-black transition-colors ${
                  sort === 'oldest' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
                }`}
              >
                Oldest
              </Link>
            </div>

            {/* Posts */}
            {posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => {
                  const typeInfo = POST_TYPE_LABELS[post.type] || POST_TYPE_LABELS.DISCUSSION
                  return (
                    <Link key={post.id} href={`/community/forum/${post.id}`}>
                      <div className="group bg-white border-2 border-black p-4 md:p-5 flex gap-4 hover:bg-gray-50 transition-colors neo-shadow-hover cursor-pointer mb-0">
                        {/* Vote Score */}
                        <div className="hidden sm:flex flex-col items-center justify-start pt-1 min-w-[50px]">
                          <ArrowBigUp className="w-6 h-6 text-gray-400" />
                          <span className="font-display font-bold text-lg leading-none">{post.voteScore}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {post.isPinned && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-400 border border-black text-[10px] font-bold uppercase">
                                <Pin className="w-3 h-3" /> Pinned
                              </span>
                            )}
                            <span className={`px-2 py-0.5 ${typeInfo.color} border border-black text-[10px] font-bold uppercase`}>
                              {typeInfo.label}
                            </span>
                            {post.category && (
                              <span
                                className="px-2 py-0.5 border border-black text-[10px] font-bold uppercase"
                                style={{ backgroundColor: post.category.color + '33' }}
                              >
                                {post.category.name}
                              </span>
                            )}
                          </div>

                          <h3 className="font-display font-bold text-lg md:text-xl uppercase leading-tight mb-2 group-hover:text-coral transition-colors truncate">
                            {post.title}
                          </h3>

                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {post.body.length > 200 ? post.body.slice(0, 200) + '...' : post.body}
                          </p>

                          {/* Meta */}
                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <div className="w-5 h-5 rounded-full border border-black bg-cyan flex items-center justify-center overflow-hidden">
                                {post.author.avatarUrl ? (
                                  <img src={post.author.avatarUrl} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <span className="text-[8px] font-bold">{getInitials(post.author.name)}</span>
                                )}
                              </div>
                              <span className="font-bold">{post.author.name}</span>
                            </span>
                            <span>{formatDate(post.createdAt)}</span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {post.commentCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {post.viewCount}
                            </span>
                            <span className="sm:hidden flex items-center gap-1">
                              <ArrowBigUp className="w-3 h-3" />
                              {post.voteScore}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 border-2 border-black">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium mb-4">No posts yet. Start the conversation!</p>
                <Link
                  href="/community/forum/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-coral border-2 border-black font-bold uppercase hover:bg-black hover:text-coral transition-colors neo-shadow"
                >
                  <Plus className="w-5 h-5" />
                  Create First Post
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
