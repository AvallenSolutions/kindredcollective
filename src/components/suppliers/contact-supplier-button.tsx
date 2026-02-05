'use client'

import { useState } from 'react'
import { Mail, X } from 'lucide-react'
import { Button } from '@/components/ui'

interface ContactSupplierButtonProps {
  supplierSlug: string
  supplierName: string
  variant?: 'default' | 'full'
  className?: string
}

export function ContactSupplierButton({
  supplierSlug,
  supplierName,
  variant = 'default',
  className = ''
}: ContactSupplierButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/suppliers/${supplierSlug}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (data.success) {
        setSuccess(true)
        setFormData({ subject: '', message: '' })
        setTimeout(() => {
          setIsOpen(false)
          setSuccess(false)
        }, 2000)
      } else {
        setError(data.error || 'Failed to send message')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size={variant === 'full' ? 'default' : 'lg'}
        className={variant === 'full' ? 'w-full' : className}
      >
        <Mail className="w-4 h-4 mr-2" />
        {variant === 'full' ? 'Send Message' : 'Contact Supplier'}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-black neo-shadow max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b-2 border-black flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold uppercase">
                Contact {supplierName}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 border-2 border-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-4 bg-red-100 border-2 border-red-500 text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-100 border-2 border-green-500 text-green-700">
                  Message sent successfully!
                </div>
              )}

              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
                  placeholder="What would you like to discuss?"
                />
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">
                  Message *
                </label>
                <textarea
                  required
                  rows={6}
                  minLength={20}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan"
                  placeholder="Tell them about your project or inquiry (minimum 20 characters)..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.message.length} / 20 characters minimum
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || success}
                  className="flex-1"
                >
                  {loading ? 'Sending...' : success ? 'Sent!' : 'Send Message'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
