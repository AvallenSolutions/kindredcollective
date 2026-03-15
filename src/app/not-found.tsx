import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="inline-block mb-8 px-4 py-2 bg-cyan border-2 border-black neo-shadow rotate-[-2deg]">
          <span className="text-xs font-bold uppercase tracking-widest">404</span>
        </div>
        <h1 className="font-display text-6xl md:text-8xl font-bold uppercase tracking-tighter mb-6">
          Not Found
        </h1>
        <p className="text-lg text-gray-600 font-medium mb-10">
          This page doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold uppercase border-2 border-black neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  )
}
