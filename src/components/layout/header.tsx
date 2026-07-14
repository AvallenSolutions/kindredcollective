'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { Menu, X, LogOut, Shield, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface HeaderProps {
  user?: {
    email: string
    role: string
    firstName?: string | null
    lastName?: string | null
  } | null
}

type NavChild = {
  name: string
  href: string
  publicHref: string
}

type NavGroup = {
  name: string
  publicHref: string
  children: NavChild[]
}

const navigation: NavGroup[] = [
  {
    name: 'Marketplace',
    publicHref: '/members/marketplace',
    children: [
      { name: 'Explore', href: '/explore', publicHref: '/members/marketplace' },
      { name: 'Requests', href: '/requests', publicHref: '/members/marketplace' },
      { name: 'Offers', href: '/offers', publicHref: '/members/marketplace' },
    ],
  },
  {
    name: 'Community',
    publicHref: '/members/community',
    children: [
      { name: 'Forum', href: '/community', publicHref: '/members/community' },
      { name: 'Events', href: '/events', publicHref: '/members/community' },
      { name: 'News', href: '/news', publicHref: '/members/community' },
    ],
  },
  {
    name: 'Knowledge',
    publicHref: '/members/knowledge',
    children: [
      { name: 'Wiki', href: '/wiki', publicHref: '/members/knowledge' },
      { name: 'Resources', href: '/community/resources', publicHref: '/members/knowledge' },
    ],
  },
]

const adminNavigation = [{ name: 'Admin', href: '/admin' }]

export function Header({ user }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [openMobileSection, setOpenMobileSection] = useState<string | null>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="fixed w-full z-50 top-0 bg-white border-b-2 border-black">
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between" aria-label="Global">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 flex items-center justify-center">
            <Image src="/kindred-logo.png" alt="Kindred Collective logo" width={40} height={40} className="w-10 h-10" />
          </div>
          <span className="font-display font-bold text-lg sm:text-2xl tracking-tighter uppercase">Kindred Collective</span>
        </Link>

        {/* Desktop Menu */}
        <div ref={navRef} className="hidden md:flex items-center gap-6">
          {navigation.map((group) => (
            <div key={group.name} className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === group.name ? null : group.name)}
                className="flex items-center gap-1 text-sm font-bold uppercase tracking-wide hover:underline decoration-2 underline-offset-4"
              >
                {group.name}
                <ChevronDown
                  className={cn('w-4 h-4 transition-transform duration-200', openDropdown === group.name && 'rotate-180')}
                />
              </button>
              {openDropdown === group.name && (
                <div className="absolute top-full left-0 mt-2 w-44 bg-white border-2 border-black neo-shadow">
                  {group.children.map((item) => (
                    <Link
                      key={item.name}
                      href={user ? item.href : item.publicHref}
                      onClick={() => setOpenDropdown(null)}
                      className="block px-4 py-3 text-sm font-bold uppercase tracking-wide hover:bg-cyan border-b-2 border-black last:border-b-0 transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
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
                className="bg-black text-white px-3 sm:px-6 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wide neo-shadow hover:bg-cyan hover:text-black neo-shadow-hover transition-all border-2 border-black"
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
          mobileMenuOpen ? 'max-h-[600px]' : 'max-h-0 border-b-0'
        )}
      >
        <div className="px-6 py-4 space-y-1">
          {navigation.map((group) => (
            <div key={group.name}>
              <button
                onClick={() => setOpenMobileSection(openMobileSection === group.name ? null : group.name)}
                className="w-full flex items-center justify-between py-3 px-4 font-display text-base font-bold uppercase tracking-wide text-black border-2 border-black hover:bg-gray-50 transition-colors"
              >
                {group.name}
                <ChevronDown
                  className={cn('w-4 h-4 transition-transform duration-200', openMobileSection === group.name && 'rotate-180')}
                />
              </button>
              {openMobileSection === group.name && (
                <div className="border-l-2 border-cyan ml-4">
                  {group.children.map((item) => (
                    <Link
                      key={item.name}
                      href={user ? item.href : item.publicHref}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2.5 px-4 text-sm font-bold uppercase tracking-wide hover:bg-cyan transition-colors border-b border-black/10 last:border-b-0"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
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
