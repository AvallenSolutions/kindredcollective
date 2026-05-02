import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Eye, Clock, FileText, Video, Link2,
  ExternalLink, Tag,
} from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSession } from '@/lib/auth/session'
import { formatDate, getInitials } from '@/lib/utils'
import { getVideoEmbed } from '@/lib/resources/video-embed'
import { ResourceDownloadButton } from '@/components/resources/download-button'
import { ResourceDeleteButton } from '@/components/resources/delete-button'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const TYPE_META: Record<string, { label: string; color: string; Icon: typeof FileText }> = {
  FILE: { label: 'File', color: 'bg-cyan', Icon: FileText },
  VIDEO: { label: 'Video', color: 'bg-coral', Icon: Video },
  LINK: { label: 'Link', color: 'bg-lime', Icon: Link2 },
}

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

async function getResource(resourceId: string) {
  const supabase = createAdminClient()

  const { data: resource, error } = await supabase
    .from('Resource')
    .select(`
      id, title, description, type, status, fileUrl, fileName, fileSize, fileMime,
      url, tags, viewCount, downloadCount, createdAt, updatedAt, authorId,
      category:ResourceCategory(id, name, slug, color),
      author:User!authorId(
        id, email,
        member:Member(firstName, lastName, avatarUrl, jobTitle, company)
      )
    `)
    .eq('id', resourceId)
    .eq('status', 'PUBLISHED')
    .single()

  if (error || !resource) return null

  // Increment view count
  supabase
    .from('Resource')
    .update({ viewCount: ((resource as any).viewCount || 0) + 1 })
    .eq('id', resourceId)
    .then(() => {})

  return resource
}

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session.isAuthenticated || !session.user) redirect('/login')

  const { id } = await params
  const resource = await getResource(id)
  if (!resource) notFound()

  const r = resource as any
  const author = Array.isArray(r.author) ? r.author[0] : r.author
  const member = Array.isArray(author?.member) ? author.member[0] : author?.member
  const category = Array.isArray(r.category) ? r.category[0] : r.category
  const authorName = member ? `${member.firstName} ${member.lastName}` : (author?.email || 'Unknown')
  const typeMeta = TYPE_META[r.type] || TYPE_META.LINK
  const TypeIcon = typeMeta.Icon
  const isOwner = session.user.id === r.authorId
  const canEdit = isOwner || session.user.role === 'ADMIN'
  const videoEmbed = r.type === 'VIDEO' && r.url ? getVideoEmbed(r.url) : null

  return (
    <div className="min-h-screen bg-white text-black">
      <section className="pt-32 pb-8 px-6 border-b-2 border-black bg-gray-100">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/community/resources"
            className="inline-flex items-center gap-2 text-sm font-bold uppercase mb-6 hover:text-coral transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Resources
          </Link>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${typeMeta.color} border border-black text-[10px] font-bold uppercase`}>
              <TypeIcon className="w-3 h-3" />
              {typeMeta.label}
            </span>
            {category && (
              <Link
                href={`/community/resources?category=${category.slug}`}
                className="px-2 py-0.5 border border-black text-[10px] font-bold uppercase hover:bg-black hover:text-white transition-colors"
                style={{ backgroundColor: (category.color as string) + '33' }}
              >
                {category.name}
              </Link>
            )}
          </div>

          <h1 className="font-display text-3xl md:text-5xl font-bold uppercase tracking-tighter leading-tight mb-4">
            {r.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full border border-black bg-cyan flex items-center justify-center overflow-hidden">
                {member?.avatarUrl ? (
                  <img src={member.avatarUrl} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="text-[10px] font-bold">{getInitials(authorName)}</span>
                )}
              </span>
              <span className="font-bold">{authorName}</span>
              {member?.jobTitle && member?.company && (
                <span className="text-gray-400 hidden sm:inline">· {member.jobTitle} at {member.company}</span>
              )}
            </span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(r.createdAt)}</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{r.viewCount} views</span>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Resource body */}
        <div className="bg-white border-2 border-black neo-shadow p-6 md:p-8">
          <p className="text-base md:text-lg leading-relaxed whitespace-pre-wrap mb-6">
            {r.description}
          </p>

          {r.type === 'FILE' && r.fileUrl && (
            <div className="border-2 border-black p-5 bg-gray-50">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-cyan border-2 border-black flex items-center justify-center shrink-0">
                  <FileText className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{r.fileName}</p>
                  <p className="text-xs text-gray-500">
                    {formatBytes(r.fileSize)} · {r.downloadCount} downloads
                  </p>
                </div>
              </div>
              <ResourceDownloadButton resourceId={r.id} />
            </div>
          )}

          {r.type === 'VIDEO' && (
            <div className="space-y-3">
              {videoEmbed ? (
                <div className="aspect-video border-2 border-black bg-black">
                  <iframe
                    src={videoEmbed.embedUrl}
                    title={r.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="border-2 border-coral bg-coral/10 p-4 text-sm font-bold text-coral">
                  Could not embed this video. Open the link below to view it.
                </div>
              )}
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-black font-bold uppercase text-sm hover:bg-gray-100 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open original
              </a>
            </div>
          )}

          {r.type === 'LINK' && r.url && (
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block border-2 border-black p-5 bg-lime hover:bg-black hover:text-lime transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white border-2 border-black flex items-center justify-center shrink-0 group-hover:bg-lime transition-colors">
                  <Link2 className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold uppercase">Open link</p>
                  <p className="text-sm font-mono truncate">{r.url}</p>
                </div>
                <ExternalLink className="w-5 h-5 shrink-0" />
              </div>
            </a>
          )}
        </div>

        {/* Tags */}
        {r.tags && r.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="w-4 h-4 text-gray-400" />
            {(r.tags as string[]).map((t) => (
              <Link
                key={t}
                href={`/community/resources?tag=${encodeURIComponent(t)}`}
                className="px-2 py-0.5 bg-gray-100 border border-gray-300 text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors"
              >
                #{t}
              </Link>
            ))}
          </div>
        )}

        {/* Owner / admin actions */}
        {canEdit && (
          <div className="flex items-center gap-3 pt-4 border-t-2 border-gray-200">
            <ResourceDeleteButton resourceId={r.id} isAdminAction={!isOwner} />
          </div>
        )}
      </div>
    </div>
  )
}
