import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession, getUserBrands, getUserSuppliers } from '@/lib/auth/session'
import { Settings, Building2, Store, Calendar, Gift, Users, ArrowRight } from 'lucide-react'

export default async function SettingsPage() {
  const session = await getSession()
  if (!session.isAuthenticated || !session.user) {
    redirect('/login')
  }

  const brands = await getUserBrands(session.user.id)
  const suppliers = await getUserSuppliers(session.user.id)

  const hasBrand = brands.length > 0
  const hasSupplier = suppliers.length > 0

  const settingsLinks = [
    ...(hasBrand
      ? [{ name: 'Brand Profile', description: 'Edit your brand details, logo, and images', icon: Building2, href: '/settings/brand', color: 'bg-yellow' }]
      : []),
    ...(hasSupplier
      ? [{ name: 'Supplier Profile', description: 'Edit your supplier details and listings', icon: Store, href: '/settings/supplier', color: 'bg-magenta' }]
      : []),
    { name: 'Team Management', description: 'Manage team members and roles', icon: Users, href: '/settings/team', color: 'bg-cyan' },
    { name: 'Events', description: 'Create and manage your events', icon: Calendar, href: '/settings/events', color: 'bg-green-400' },
    ...(hasSupplier
      ? [{ name: 'Offers', description: 'Create and manage your offers and deals', icon: Gift, href: '/settings/offers', color: 'bg-orange-400' }]
      : []),
  ]

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-cyan text-black flex items-center justify-center border-2 border-black neo-shadow">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Settings</h1>
          <p className="text-gray-600">Manage your profile, team, and content</p>
        </div>
      </div>

      {/* Settings Links */}
      <div className="space-y-4">
        {settingsLinks.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center gap-4 p-4 bg-white border-2 border-black neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            <div className={`w-10 h-10 ${item.color} flex items-center justify-center border-2 border-black shrink-0`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold uppercase text-sm">{item.name}</p>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
