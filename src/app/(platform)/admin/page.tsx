import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { Shield, Users, Building2, Store, Calendar, Gift } from 'lucide-react'

export default async function AdminPage() {
  const session = await getSession()

  if (!session.isAdmin) {
    redirect('/dashboard')
  }

  const supabase = await createClient()

  // Fetch counts for dashboard stats
  const [usersResult, brandsResult, suppliersResult, eventsResult, offersResult] = await Promise.all([
    supabase.from('User').select('*', { count: 'exact', head: true }),
    supabase.from('Brand').select('*', { count: 'exact', head: true }),
    supabase.from('Supplier').select('*', { count: 'exact', head: true }),
    supabase.from('Event').select('*', { count: 'exact', head: true }),
    supabase.from('Offer').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { name: 'Total Users', value: usersResult.count || 0, icon: Users, color: 'bg-cyan' },
    { name: 'Brands', value: brandsResult.count || 0, icon: Building2, color: 'bg-yellow' },
    { name: 'Suppliers', value: suppliersResult.count || 0, icon: Store, color: 'bg-magenta' },
    { name: 'Events', value: eventsResult.count || 0, icon: Calendar, color: 'bg-green-400' },
    { name: 'Offers', value: offersResult.count || 0, icon: Gift, color: 'bg-orange-400' },
  ]

  // Fetch recent users
  const { data: recentUsers } = await supabase
    .from('User')
    .select('id, email, role, createdAt')
    .order('createdAt', { ascending: false })
    .limit(10)

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-magenta text-white flex items-center justify-center border-2 border-black neo-shadow">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, content, and platform settings</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white border-2 border-black p-4 neo-shadow"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${stat.color} flex items-center justify-center border-2 border-black`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-gray-600 uppercase tracking-wide">{stat.name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Users */}
      <div className="bg-white border-2 border-black neo-shadow">
        <div className="px-6 py-4 border-b-2 border-black">
          <h2 className="font-display text-xl font-bold uppercase">Recent Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-black">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">Email</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">Role</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentUsers?.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{user.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-bold uppercase border-2 border-black ${
                        user.role === 'ADMIN'
                          ? 'bg-magenta text-white'
                          : user.role === 'BRAND'
                          ? 'bg-yellow'
                          : 'bg-cyan'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {(!recentUsers || recentUsers.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
