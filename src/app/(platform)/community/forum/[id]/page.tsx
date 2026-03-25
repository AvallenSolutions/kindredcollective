import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pin, Eye, Clock } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSession } from '@/lib/auth/session'
import { formatDate, getInitials } from '@/lib/utils'
import { ForumVoteButton } from '@/components/forum/vote-button'
import { ForumCommentSection } from '@/components/forum/comment-section'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const POST_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  DISCUSSION: { label: 'Discussion', color: 'bg-cyan' },
  QUESTION: { label: 'Question', color: 'bg-coral' },
  NEWS: { label: 'News', color: 'bg-lime' },
  SHOWCASE: { label: 'Showcase', color: 'bg-purple-300' },
}

async function getPostData(postId: string, userId: string) {
  const supabase = createAdminClient()

  const { data: post, error } = await supabase
    .from('ForumPost')
    .select(`
      id, title, body, type, status, isPinned, viewCount, createdAt, updatedAt,
      category:ForumCategory(id, name, slug, color),
      author:User!authorId(
        id, email,
        member:Member(firstName, lastName, avatarUrl, jobTitle, company)
      ),
      votes:ForumVote(value, userId)
    `)
    .eq('id', postId)
    .eq('status', 'PUBLISHED')
    .single()

  if (error || !post) return null

  // Increment view count
  supabase
    .from('ForumPost')
    .update({ viewCount: (post.viewCount || 0) + 1 })
    .eq('id', postId)
    .then(() => {})

  // Fetch comments
  const { data: comments } = await supabase
    .from('ForumComment')
    .select(`
      id, body, parentId, createdAt, updatedAt,
      author:User!authorId(
        id, email,
        member:Member(firstName, lastName, avatarUrl, jobTitle, company)
      ),
      votes:ForumVote(value, userId)
    `)
    .eq('postId', postId)
    .order('createdAt', { ascending: true })

  const postData = post as any
  const voteScore = (postData.votes || []).reduce((sum: number, v: any) => sum + v.value, 0)
  const userVote = (postData.votes || []).find((v: any) => v.userId === userId)?.value || 0

  const author = Array.isArray(postData.author) ? postData.author[0] : postData.author
  const member = Array.isArray(author?.member) ? author.member[0] : author?.member
  const categoryData = Array.isArray(postData.category) ? postData.category[0] : postData.category

  const commentsWithScores = (comments || []).map((c: any) => {
    const cAuthor = Array.isArray(c.author) ? c.author[0] : c.author
    const cMember = Array.isArray(cAuthor?.member) ? cAuthor.member[0] : cAuthor?.member
    const commentVoteScore = (c.votes || []).reduce((sum: number, v: any) => sum + v.value, 0)
    const commentUserVote = (c.votes || []).find((v: any) => v.userId === userId)?.value || 0
    return {
      id: c.id,
      body: c.body,
      parentId: c.parentId,
      createdAt: c.createdAt,
      voteScore: commentVoteScore,
      userVote: commentUserVote,
      author: {
        id: cAuthor?.id,
        name: cMember ? `${cMember.firstName} ${cMember.lastName}` : 'Unknown',
        avatarUrl: cMember?.avatarUrl,
        jobTitle: cMember?.jobTitle,
      },
    }
  })

  return {
    post: {
      id: postData.id,
      title: postData.title,
      body: postData.body,
      type: postData.type,
      isPinned: postData.isPinned,
      viewCount: postData.viewCount,
      createdAt: postData.createdAt,
      updatedAt: postData.updatedAt,
      voteScore,
      userVote,
      category: categoryData,
      author: {
        id: author?.id,
        name: member ? `${member.firstName} ${member.lastName}` : 'Unknown',
        avatarUrl: member?.avatarUrl,
        jobTitle: member?.jobTitle,
        company: member?.company,
      },
    },
    comments: commentsWithScores,
  }
}

export default async function ForumPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session.isAuthenticated || !session.user) redirect('/login')

  const { id } = await params
  const data = await getPostData(id, session.user.id)

  if (!data) notFound()

  const { post, comments } = data
  const typeInfo = POST_TYPE_LABELS[post.type] || POST_TYPE_LABELS.DISCUSSION

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <section className="pt-32 pb-8 px-6 border-b-2 border-black bg-gray-100">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/community/forum"
            className="inline-flex items-center gap-2 text-sm font-bold uppercase mb-6 hover:text-coral transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Forum
          </Link>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Post */}
        <article className="bg-white border-2 border-black neo-shadow p-6 md:p-8">
          <div className="flex gap-4 md:gap-6">
            {/* Votes */}
            <div className="hidden sm:block">
              <ForumVoteButton
                targetType="post"
                targetId={post.id}
                initialScore={post.voteScore}
                initialUserVote={post.userVote}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
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

              {/* Title */}
              <h1 className="font-display text-2xl md:text-4xl font-bold uppercase tracking-tight leading-tight mb-4">
                {post.title}
              </h1>

              {/* Author info */}
              <div className="flex items-center gap-3 mb-6 pb-6 border-b-2 border-gray-200">
                <div className="w-10 h-10 rounded-full border-2 border-black bg-cyan flex items-center justify-center overflow-hidden">
                  {post.author.avatarUrl ? (
                    <img src={post.author.avatarUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="text-sm font-bold">{getInitials(post.author.name)}</span>
                  )}
                </div>
                <div>
                  <p className="font-bold text-sm">{post.author.name}</p>
                  <p className="text-xs text-gray-500">
                    {[post.author.jobTitle, post.author.company].filter(Boolean).join(' at ')}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(post.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {post.viewCount}
                  </span>
                </div>
              </div>

              {/* Mobile votes */}
              <div className="sm:hidden mb-4">
                <ForumVoteButton
                  targetType="post"
                  targetId={post.id}
                  initialScore={post.voteScore}
                  initialUserVote={post.userVote}
                  horizontal
                />
              </div>

              {/* Body */}
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-800 leading-relaxed">
                {post.body}
              </div>
            </div>
          </div>
        </article>

        {/* Comments */}
        <ForumCommentSection
          postId={post.id}
          comments={comments}
        />
      </div>
    </div>
  )
}
