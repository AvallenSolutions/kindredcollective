import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import BottleBreaker from '@/components/games/bottle-breaker'
import ArcadeScoreboard from '@/components/games/arcade-scoreboard'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-6 py-12">
      <div className="text-center max-w-md mb-10">
        <div className="inline-block mb-6 px-4 py-2 bg-cyan border-2 border-black neo-shadow rotate-[-2deg]">
          <span className="text-xs font-bold uppercase tracking-widest">404</span>
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-bold uppercase tracking-tighter mb-4">
          Not Found
        </h1>
        <p className="text-gray-600 font-medium mb-6">
          This page doesn&apos;t exist — but since you&apos;re here, fancy a game?
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold uppercase border-2 border-black neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      <BottleBreaker />

      {/* Arcade-style highscore board */}
      <div className="w-full max-w-[540px] mx-auto mt-12">
        <ArcadeScoreboard />
      </div>
    </div>
  )
}
