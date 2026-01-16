'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, User, LogOut, Zap, Shield } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface HeaderProps {
  user?: {
    email: string
    role: string
  } | null
}

const navigation = [
  { name: 'Explore', href: '/explore', badge: null },
  { name: 'Events', href: '/events', badge: 'NEW' },
  { name: 'Community', href: '/community', badge: null },
]

const adminNavigation = [
  { name: 'Admin', href: '/admin', badge: null },
]

export function Header({ user }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isAdmin = user?.role === 'ADMIN'

  return (
    <header className="fixed w-full z-50 top-0 bg-white border-b-2 border-black">
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between" aria-label="Global">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-none neo-border border-black group-hover:bg-cyan group-hover:text-black transition-colors">
            <Zap className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tighter uppercase">Kindred.</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-bold uppercase tracking-wide hover:underline decoration-2 underline-offset-4 flex items-center gap-1"
            >
              {item.name}
              {item.badge && (
                <span className="bg-cyan text-[10px] px-1 py-0.5 border border-black leading-none rounded-sm">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
          {isAdmin && adminNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-bold uppercase tracking-wide hover:underline decoration-2 underline-offset-4 flex items-center gap-1 text-magenta"
            >
              <Shield className="w-4 h-4" />
              {item.name}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/dashboard" className="hidden md:block text-sm font-bold uppercase hover:underline decoration-2 underline-offset-4">
                Dashboard
              </Link>
              <form action="/api/auth/signout" method="post">
                <Button variant="ghost" size="sm" type="submit" className="hidden md:flex">
                  <LogOut className="w-4 h-4" />
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden md:block text-sm font-bold uppercase hover:underline decoration-2 underline-offset-4">
                Log in
              </Link>
              <Link
                href="/signup"
                className="bg-black text-white px-6 py-2.5 text-sm font-bold uppercase tracking-wide neo-shadow hover:bg-cyan hover:text-black neo-shadow-hover transition-all border-2 border-black"
              >
                Get Started
              </Link>
            </>
          )}
          <button
            className="md:hidden text-2xl border-2 border-black p-1 neo-shadow active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div
        className={cn(
          'md:hidden overflow-hidden transition-all duration-300 ease-in-out bg-white border-b-2 border-black',
          mobileMenuOpen ? 'max-h-[500px]' : 'max-h-0 border-b-0'
        )}
      >
        <div className="px-6 py-4 space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="block py-3 px-4 font-display text-base font-bold uppercase tracking-wide text-black hover:bg-cyan transition-colors border-2 border-black"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.name}
              {item.badge && (
                <span className="ml-2 bg-cyan text-[10px] px-1 py-0.5 border border-black leading-none rounded-sm">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
          {isAdmin && adminNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="block py-3 px-4 font-display text-base font-bold uppercase tracking-wide text-magenta hover:bg-magenta hover:text-white transition-colors border-2 border-magenta"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              {item.name}
            </Link>
          ))}
          <div className="pt-4 space-y-2">
            {user ? (
              <>
                <Link href="/dashboard" className="block">
                  <Button variant="outline" size="md" className="w-full">
                    Dashboard
                  </Button>
                </Link>
                <form action="/api/auth/signout" method="post">
                  <Button variant="ghost" size="md" type="submit" className="w-full flex items-center justify-center gap-2">
                    <LogOut className="w-4 h-4" />
                    Log out
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="block">
                  <Button variant="outline" size="md" className="w-full">
                    Log in
                  </Button>
                </Link>
                <Link href="/signup" className="block">
                  <Button variant="primary" size="md" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
