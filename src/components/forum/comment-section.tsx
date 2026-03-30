'use client'

import { useState, useRef } from 'react'
import { MessageSquare, Reply, Send, ImagePlus, X } from 'lucide-react'
import { formatDate, getInitials } from '@/lib/utils'
import { ForumVoteButton } from './vote-button'

interface Comment {
  id: string
  body: string
  imageUrl: string | null
  parentId: string | null
  createdAt: string
  voteScore: number
  userVote: number
  author: {
    id: string
    name: string
    avatarUrl: string | null
    jobTitle: string | null
  }
}

interface ForumCommentSectionProps {
  postId: string
  comments: Comment[]
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function ForumCommentSection({ postId, comments: initialComments }: ForumCommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Image upload state for top-level comment
  const [topImage, setTopImage] = useState<File | null>(null)
  const [topImagePreview, setTopImagePreview] = useState<string | null>(null)
  const topFileRef = useRef<HTMLInputElement>(null!)

  // Image upload state for reply
  const [replyImage, setReplyImage] = useState<File | null>(null)
  const [replyImagePreview, setReplyImagePreview] = useState<string | null>(null)
  const replyFileRef = useRef<HTMLInputElement>(null!)

  // Build threaded structure
  const topLevel = comments.filter(c => !c.parentId)
  const replies = comments.filter(c => c.parentId)
  const replyMap = new Map<string, Comment[]>()
  for (const reply of replies) {
    const arr = replyMap.get(reply.parentId!) || []
    arr.push(reply)
    replyMap.set(reply.parentId!, arr)
  }

  function handleFileSelect(file: File | undefined, setImage: (f: File | null) => void, setPreview: (s: string | null) => void) {
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('Please upload a JPG, PNG, WebP, or GIF image.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      alert('Image must be under 5MB.')
      return
    }

    setImage(file)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  function clearImage(setImage: (f: File | null) => void, setPreview: (s: string | null) => void, fileRef: React.RefObject<HTMLInputElement>) {
    setImage(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function uploadImage(file: File): Promise<string | null> {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30_000)

      const res = await fetch('/api/upload?bucket=forum-images&folder=comments', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (!res.ok) return null
      const data = await res.json()
      return data.success ? data.url : null
    } catch {
      return null
    }
  }

  async function submitComment(body: string, parentId?: string, imageFile?: File | null) {
    setSubmitting(true)
    try {
      let imageUrl: string | null = null
      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
        if (!imageUrl) {
          setError('Failed to upload image. Please try again.')
          setSubmitting(false)
          return
        }
      }

      const res = await fetch(`/api/forum/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: body || ' ', parentId: parentId || null, imageUrl }),
      })

      const data = await res.json()
      if (data.success && data.data?.comment) {
        setError(null)
        setComments(prev => [...prev, data.data.comment])
        setNewComment('')
        setReplyTo(null)
        setReplyText('')
        clearImage(setTopImage, setTopImagePreview, topFileRef)
        clearImage(setReplyImage, setReplyImagePreview, replyFileRef)
      }
    } catch {
      // Silently fail
    } finally {
      setSubmitting(false)
    }
  }

  function handleSubmitTopLevel(e: React.FormEvent) {
    e.preventDefault()
    if (newComment.trim() || topImage) submitComment(newComment.trim(), undefined, topImage)
  }

  function handleSubmitReply(e: React.FormEvent, parentId: string) {
    e.preventDefault()
    if (replyText.trim() || replyImage) submitComment(replyText.trim(), parentId, replyImage)
  }

  function renderImageUpload(
    preview: string | null,
    fileRef: React.RefObject<HTMLInputElement>,
    setImage: (f: File | null) => void,
    setPreview: (s: string | null) => void,
    compact: boolean = false,
  ) {
    return (
      <>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0], setImage, setPreview)}
        />
        {preview && (
          <div className="relative inline-block mt-2 mb-1">
            <img
              src={preview}
              alt="Upload preview"
              className={`border-2 border-black object-cover ${compact ? 'max-h-32' : 'max-h-48'}`}
            />
            <button
              type="button"
              onClick={() => clearImage(setImage, setPreview, fileRef)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center hover:bg-coral transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </>
    )
  }

  function renderComment(comment: Comment, depth: number = 0) {
    const commentReplies = replyMap.get(comment.id) || []
    const maxDepth = 3

    return (
      <div key={comment.id} className={depth > 0 ? 'ml-6 md:ml-10 border-l-2 border-gray-200 pl-4' : ''}>
        <div className="py-4">
          <div className="flex gap-3">
            {/* Vote */}
            <div className="hidden sm:block pt-1">
              <ForumVoteButton
                targetType="comment"
                targetId={comment.id}
                initialScore={comment.voteScore}
                initialUserVote={comment.userVote}
              />
            </div>

            <div className="flex-1 min-w-0">
              {/* Author */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full border border-black bg-cyan flex items-center justify-center overflow-hidden">
                  {comment.author.avatarUrl ? (
                    <img src={comment.author.avatarUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="text-[8px] font-bold">{getInitials(comment.author.name)}</span>
                  )}
                </div>
                <span className="font-bold text-sm">{comment.author.name}</span>
                <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
              </div>

              {/* Body */}
              <p className="text-sm text-gray-800 whitespace-pre-wrap mb-2">{comment.body}</p>

              {/* Comment image */}
              {comment.imageUrl && (
                <div className="mb-3 border-2 border-black overflow-hidden bg-gray-50 inline-block">
                  <img
                    src={comment.imageUrl}
                    alt="Comment image"
                    className="max-h-[300px] max-w-full object-contain cursor-pointer"
                    onClick={() => window.open(comment.imageUrl!, '_blank')}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                <div className="sm:hidden">
                  <ForumVoteButton
                    targetType="comment"
                    targetId={comment.id}
                    initialScore={comment.voteScore}
                    initialUserVote={comment.userVote}
                    horizontal
                  />
                </div>
                {depth < maxDepth && (
                  <button
                    onClick={() => {
                      setReplyTo(replyTo === comment.id ? null : comment.id)
                      setReplyText('')
                      clearImage(setReplyImage, setReplyImagePreview, replyFileRef)
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold uppercase text-gray-500 hover:text-coral transition-colors"
                  >
                    <Reply className="w-3 h-3" />
                    Reply
                  </button>
                )}
              </div>

              {/* Reply form */}
              {replyTo === comment.id && (
                <form onSubmit={(e) => handleSubmitReply(e, comment.id)} className="mt-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    rows={3}
                    className="w-full px-3 py-2 border-2 border-black bg-white text-sm focus:outline-none focus:border-coral transition-colors resize-y"
                    autoFocus
                  />
                  {renderImageUpload(replyImagePreview, replyFileRef, setReplyImage, setReplyImagePreview, true)}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="submit"
                      disabled={submitting || (!replyText.trim() && !replyImage)}
                      className="px-4 py-1.5 bg-coral border-2 border-black text-xs font-bold uppercase hover:bg-black hover:text-coral transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      {submitting ? 'Sending...' : 'Reply'}
                    </button>
                    <button
                      type="button"
                      onClick={() => replyFileRef.current?.click()}
                      className="px-3 py-1.5 border-2 border-black text-xs font-bold uppercase hover:bg-gray-100 transition-colors flex items-center gap-1"
                    >
                      <ImagePlus className="w-3 h-3" />
                      Image
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTo(null)
                        clearImage(setReplyImage, setReplyImagePreview, replyFileRef)
                      }}
                      className="px-4 py-1.5 border-2 border-black text-xs font-bold uppercase hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Nested replies */}
        {commentReplies.map(reply => renderComment(reply, depth + 1))}
      </div>
    )
  }

  return (
    <section className="mt-8">
      <div className="bg-white border-2 border-black neo-shadow">
        {/* Header */}
        <div className="px-6 py-4 bg-black text-white font-bold uppercase flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </div>

        {/* New comment form */}
        <div className="p-6 border-b-2 border-gray-200">
          {error && (
            <div className="mb-3 bg-red-50 border-2 border-red-300 text-red-700 px-4 py-2 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmitTopLevel}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Join the discussion..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-black bg-white font-medium focus:outline-none focus:border-coral transition-colors resize-y"
            />
            {renderImageUpload(topImagePreview, topFileRef, setTopImage, setTopImagePreview)}
            <div className="flex items-center gap-2 mt-3">
              <button
                type="submit"
                disabled={submitting || (!newComment.trim() && !topImage)}
                className="px-6 py-2.5 bg-coral border-2 border-black font-bold uppercase text-sm hover:bg-black hover:text-coral transition-colors neo-shadow disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Posting...' : 'Comment'}
              </button>
              <button
                type="button"
                onClick={() => topFileRef.current?.click()}
                className="px-4 py-2.5 border-2 border-black font-bold uppercase text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <ImagePlus className="w-4 h-4" />
                Add Image
              </button>
            </div>
          </form>
        </div>

        {/* Comments list */}
        <div className="px-6 divide-y divide-gray-100">
          {topLevel.length > 0 ? (
            topLevel.map(comment => renderComment(comment))
          ) : (
            <div className="py-12 text-center text-gray-400 text-sm">
              No comments yet. Be the first to share your thoughts!
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
