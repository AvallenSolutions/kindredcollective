'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, ImagePlus, X, Loader2 } from 'lucide-react'

const POST_TYPES = [
  { value: 'DISCUSSION', label: 'Discussion', color: 'bg-cyan' },
  { value: 'QUESTION', label: 'Question', color: 'bg-coral' },
  { value: 'NEWS', label: 'News', color: 'bg-lime' },
  { value: 'SHOWCASE', label: 'Showcase', color: 'bg-purple-300' },
]

interface Category {
  id: string
  name: string
  slug: string
  color: string
}

export default function NewForumPostPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState('DISCUSSION')
  const [categoryId, setCategoryId] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/forum/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.categories) {
          setCategories(data.data.categories)
          if (data.data.categories.length > 0) {
            setCategoryId(data.data.categories[0].id)
          }
        }
      })
      .catch(() => {})
  }, [])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, WebP, or GIF image')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB')
      return
    }

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file)
    setImagePreview(localUrl)
    setError('')
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload?bucket=forum-images&folder=posts', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (data.success && data.url) {
        setImageUrl(data.url)
      } else {
        setError(data.error || 'Failed to upload image')
        setImagePreview(null)
        setImageUrl(null)
      }
    } catch {
      setError('Failed to upload image. Please try again.')
      setImagePreview(null)
      setImageUrl(null)
    } finally {
      setUploading(false)
    }
  }

  function removeImage() {
    setImageUrl(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, type, categoryId, imageUrl }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'Failed to create post')
        setSubmitting(false)
        return
      }

      router.push(`/community/forum/${data.data.post.id}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <section className="pt-32 pb-8 px-6 border-b-2 border-black bg-gray-100">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/community/forum"
            className="inline-flex items-center gap-2 text-sm font-bold uppercase mb-6 hover:text-coral transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Forum
          </Link>
          <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tighter leading-none">
            New Post
          </h1>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-coral/10 border-2 border-coral p-4 text-sm font-bold text-coral">
              {error}
            </div>
          )}

          {/* Post Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2">
              Post Type
            </label>
            <div className="flex flex-wrap gap-2">
              {POST_TYPES.map((pt) => (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => setType(pt.value)}
                  className={`px-4 py-2 border-2 border-black text-sm font-bold uppercase transition-colors ${
                    type === pt.value
                      ? `${pt.color} neo-shadow`
                      : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  {pt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 border-2 border-black bg-white font-bold focus:outline-none focus:border-coral transition-colors"
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full px-4 py-3 border-2 border-black bg-white font-bold text-lg focus:outline-none focus:border-coral transition-colors"
              required
              maxLength={200}
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2">
              Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your thoughts, questions, or news with the community..."
              rows={10}
              className="w-full px-4 py-3 border-2 border-black bg-white font-medium focus:outline-none focus:border-coral transition-colors resize-y"
              required
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2">
              Image <span className="text-gray-400 normal-case">(optional)</span>
            </label>

            {imagePreview ? (
              <div className="relative border-2 border-black bg-gray-50 p-2 inline-block">
                <img
                  src={imagePreview}
                  alt="Upload preview"
                  className="max-h-64 max-w-full object-contain"
                />
                {uploading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading...
                    </div>
                  </div>
                )}
                {!uploading && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-3 -right-3 w-7 h-7 bg-coral text-white border-2 border-black flex items-center justify-center hover:bg-black transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 px-6 py-4 border-2 border-dashed border-gray-400 hover:border-black bg-gray-50 hover:bg-gray-100 transition-colors w-full text-left group"
              >
                <div className="w-10 h-10 bg-gray-200 group-hover:bg-cyan border-2 border-black flex items-center justify-center transition-colors">
                  <ImagePlus className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">Add an image</p>
                  <p className="text-xs text-gray-500">JPG, PNG, WebP or GIF — max 5MB</p>
                </div>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={submitting || uploading || !title.trim() || !body.trim() || !categoryId}
              className="px-8 py-3 bg-coral border-2 border-black font-bold uppercase hover:bg-black hover:text-coral transition-colors neo-shadow neo-shadow-hover flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
              {submitting ? 'Posting...' : 'Post'}
            </button>
            <Link
              href="/community/forum"
              className="px-6 py-3 bg-white border-2 border-black font-bold uppercase hover:bg-gray-100 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
