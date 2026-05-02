'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, FileUp, X, Loader2, FileText, Video, Link2 } from 'lucide-react'
import { isSupportedVideoUrl } from '@/lib/resources/video-embed'

const RESOURCE_TYPES = [
  { value: 'FILE', label: 'File', Icon: FileText, color: 'bg-cyan' },
  { value: 'VIDEO', label: 'Video URL', Icon: Video, color: 'bg-coral' },
  { value: 'LINK', label: 'Link', Icon: Link2, color: 'bg-lime' },
] as const

const ALLOWED_DOC_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'text/markdown',
]
const ALLOWED_DOC_EXT = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.md'
const MAX_DOC_SIZE = 25 * 1024 * 1024

interface Category {
  id: string
  name: string
  slug: string
  color: string
}

interface UploadedFile {
  url: string
  path: string
  name: string
  size: number
  mime: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function NewResourcePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [type, setType] = useState<'FILE' | 'VIDEO' | 'LINK'>('FILE')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [url, setUrl] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/resources/categories')
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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_DOC_MIME.includes(file.type)) {
      setError('Unsupported file type. Allowed: PDF, Word, Excel, PowerPoint, CSV, TXT, Markdown.')
      return
    }
    if (file.size > MAX_DOC_SIZE) {
      setError('File must be under 25MB.')
      return
    }

    setError('')
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload?bucket=resource-files&folder=resources', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (data.success && data.url) {
        setUploadedFile({
          url: data.url,
          path: data.path,
          name: data.name || file.name,
          size: data.size || file.size,
          mime: data.mime || file.type,
        })
      } else {
        setError(data.error || 'Failed to upload file')
      }
    } catch {
      setError('Failed to upload file. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function removeFile() {
    setUploadedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (type === 'FILE' && !uploadedFile) {
      setError('Please upload a file')
      return
    }
    if (type !== 'FILE' && !url.trim()) {
      setError('Please enter a URL')
      return
    }
    if (type === 'VIDEO' && !isSupportedVideoUrl(url.trim())) {
      setError('Video URL must be a YouTube or Vimeo link')
      return
    }

    setSubmitting(true)

    try {
      const payload: Record<string, unknown> = {
        title,
        description,
        type,
        categoryId,
        tags: tagsInput,
      }

      if (type === 'FILE' && uploadedFile) {
        payload.fileUrl = uploadedFile.url
        payload.filePath = uploadedFile.path
        payload.fileName = uploadedFile.name
        payload.fileSize = uploadedFile.size
        payload.fileMime = uploadedFile.mime
      } else {
        payload.url = url.trim()
      }

      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'Failed to create resource')
        setSubmitting(false)
        return
      }

      router.push(`/community/resources/${data.data.resource.id}`)
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
            href="/community/resources"
            className="inline-flex items-center gap-2 text-sm font-bold uppercase mb-6 hover:text-coral transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Resources
          </Link>
          <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tighter leading-none">
            Add Resource
          </h1>
          <p className="text-gray-600 mt-3 max-w-xl">Share a document, video, or useful link with the rest of the collective.</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-coral/10 border-2 border-coral p-4 text-sm font-bold text-coral">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2">
              Resource Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {RESOURCE_TYPES.map((rt) => (
                <button
                  key={rt.value}
                  type="button"
                  onClick={() => {
                    setType(rt.value)
                    setError('')
                  }}
                  className={`flex flex-col items-center gap-2 px-4 py-4 border-2 border-black text-sm font-bold uppercase transition-colors ${
                    type === rt.value ? `${rt.color} neo-shadow` : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  <rt.Icon className="w-6 h-6" />
                  {rt.label}
                </button>
              ))}
            </div>
          </div>

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
              {categories.length === 0 && <option value="">Loading categories...</option>}
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="A clear, descriptive title"
              className="w-full px-4 py-3 border-2 border-black bg-white font-bold text-lg focus:outline-none focus:border-coral transition-colors"
              required
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this resource is and why it's useful..."
              rows={5}
              className="w-full px-4 py-3 border-2 border-black bg-white font-medium focus:outline-none focus:border-coral transition-colors resize-y"
              required
            />
          </div>

          {type === 'FILE' ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-2">
                File
              </label>
              {uploadedFile ? (
                <div className="relative border-2 border-black bg-gray-50 p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyan border-2 border-black flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{uploadedFile.name}</p>
                    <p className="text-xs text-gray-500">{formatBytes(uploadedFile.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="w-8 h-8 bg-coral text-white border-2 border-black flex items-center justify-center hover:bg-black transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-3 px-6 py-4 border-2 border-dashed border-gray-400 hover:border-black bg-gray-50 hover:bg-gray-100 transition-colors w-full text-left group disabled:opacity-50"
                >
                  <div className="w-10 h-10 bg-gray-200 group-hover:bg-cyan border-2 border-black flex items-center justify-center transition-colors">
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileUp className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{uploading ? 'Uploading...' : 'Upload a file'}</p>
                    <p className="text-xs text-gray-500">PDF, Word, Excel, PowerPoint, CSV, TXT, Markdown — max 25MB</p>
                  </div>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_DOC_EXT}
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-2">
                {type === 'VIDEO' ? 'Video URL' : 'URL'}
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={type === 'VIDEO' ? 'https://youtube.com/watch?v=…' : 'https://…'}
                className="w-full px-4 py-3 border-2 border-black bg-white font-medium focus:outline-none focus:border-coral transition-colors"
                required
              />
              {type === 'VIDEO' && (
                <p className="text-xs text-gray-500 mt-1">Supports YouTube and Vimeo links.</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2">
              Tags <span className="text-gray-400 normal-case">(comma-separated, optional)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. branding, packaging, b2b"
              className="w-full px-4 py-3 border-2 border-black bg-white font-medium focus:outline-none focus:border-coral transition-colors"
              maxLength={200}
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={
                submitting ||
                uploading ||
                !title.trim() ||
                !description.trim() ||
                !categoryId ||
                (type === 'FILE' ? !uploadedFile : !url.trim())
              }
              className="px-8 py-3 bg-cyan border-2 border-black font-bold uppercase hover:bg-black hover:text-cyan transition-colors neo-shadow neo-shadow-hover flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
              {submitting ? 'Sharing...' : 'Share Resource'}
            </button>
            <Link
              href="/community/resources"
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
