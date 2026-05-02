'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Sparkles } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  order: number
}

const COLOR_OPTIONS = [
  { value: '#00D9FF', label: 'Cyan' },
  { value: '#FF5D5D', label: 'Coral' },
  { value: '#CCFF00', label: 'Lime' },
  { value: '#A78BFA', label: 'Purple' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#10B981', label: 'Green' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#F97316', label: 'Orange' },
]

export function ResourceCategoryManager({ categories: initialCategories }: { categories: Category[] }) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#00D9FF')
  const [submitting, setSubmitting] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSeedDefaults() {
    setSeeding(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/admin/resources/categories/seed', { method: 'POST' })
      const data = await res.json()

      if (data.success) {
        setSuccess(data.data.message)
        router.refresh()
      } else {
        setError(data.error || 'Failed to seed categories')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setSeeding(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/admin/resources/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          color,
          order: categories.length + 1,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setName('')
        setDescription('')
        setColor('#00D9FF')
        setShowForm(false)
        setSuccess(`Created "${name}"`)
        router.refresh()
      } else {
        setError(data.error || 'Failed to create category')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string, catName: string) {
    if (!confirm(`Delete "${catName}"? This cannot be undone.`)) return

    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/admin/resources/categories?id=${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        setCategories(prev => prev.filter(c => c.id !== id))
        setSuccess(`Deleted "${catName}"`)
        router.refresh()
      } else {
        setError(data.error || 'Failed to delete category')
      }
    } catch {
      setError('Something went wrong')
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 bg-coral/10 border-2 border-coral p-3 text-sm font-bold text-coral">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border-2 border-green-500 p-3 text-sm font-bold text-green-700">
          {success}
        </div>
      )}

      {categories.length > 0 ? (
        <div className="space-y-2 mb-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between px-4 py-3 border-2 border-black group hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-4 h-4 rounded-full border-2 border-black shrink-0"
                  style={{ backgroundColor: cat.color }}
                ></span>
                <div>
                  <span className="font-bold text-sm uppercase">{cat.name}</span>
                  {cat.description && (
                    <p className="text-xs text-gray-500">{cat.description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(cat.id, cat.name)}
                className="opacity-0 group-hover:opacity-100 p-1.5 border border-black bg-white hover:bg-red-100 transition-all"
                title="Delete category"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 mb-6 bg-gray-50 border-2 border-dashed border-gray-300">
          <p className="text-gray-500 text-sm font-medium mb-4">No categories yet</p>
          <button
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="inline-flex items-center gap-2 px-6 py-3 bg-coral text-white border-2 border-black font-bold uppercase text-sm neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {seeding ? 'Seeding...' : 'Seed Default Categories'}
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {categories.length > 0 && (
          <button
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 border-2 border-black font-bold uppercase text-xs hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {seeding ? 'Seeding...' : 'Seed Missing Defaults'}
          </button>
        )}
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cyan border-2 border-black font-bold uppercase text-xs hover:bg-black hover:text-cyan transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {showForm ? 'Cancel' : 'Add Custom Category'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mt-6 p-4 border-2 border-black bg-gray-50 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Packaging Templates"
              className="w-full px-3 py-2 border-2 border-black bg-white text-sm font-bold focus:outline-none focus:border-coral"
              required
              maxLength={50}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of what belongs here"
              className="w-full px-3 py-2 border-2 border-black bg-white text-sm focus:outline-none focus:border-coral"
              maxLength={120}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setColor(opt.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === opt.value ? 'border-black scale-110 neo-shadow' : 'border-gray-300 hover:border-black'
                  }`}
                  style={{ backgroundColor: opt.value }}
                  title={opt.label}
                />
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="px-6 py-2 bg-coral border-2 border-black font-bold uppercase text-sm text-white hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {submitting ? 'Creating...' : 'Create Category'}
          </button>
        </form>
      )}
    </div>
  )
}
