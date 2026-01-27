import { Search, Users } from 'lucide-react'
import { Badge } from '@/components/ui'
import { createAdminClient } from '@/lib/supabase/admin'
import { MembersDirectory } from './members-directory'
import crypto from 'crypto'

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Ensure all users have Member records (auto-seeds missing ones)
async function ensureMemberRecords() {
  try {
    const supabase = createAdminClient()

    const { data: users } = await supabase
      .from('User')
      .select('id, email, role')

    if (!users || users.length === 0) return

    const { data: existingMembers } = await supabase
      .from('Member')
      .select('userId')

    const existingUserIds = new Set(existingMembers?.map((m) => m.userId) || [])
    const usersWithoutMembers = users.filter((u) => !existingUserIds.has(u.id))

    for (const user of usersWithoutMembers) {
      const emailName = user.email.split('@')[0]
      const parts = emailName.split(/[._-]/)
      const firstName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'User'
      const lastName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : ''

      const { error } = await supabase.from('Member').insert({
        id: crypto.randomUUID(),
        userId: user.id,
        firstName,
        lastName,
        jobTitle: user.role === 'ADMIN' ? 'Admin' : null,
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      if (error) console.error('Failed to insert member for user:', user.id, error)
    }
  } catch (err) {
    console.error('Error ensuring member records:', err)
  }
}

async function getMembers() {
  try {
    const supabase = createAdminClient()

    // Auto-create Member records for any users missing them
    await ensureMemberRecords()

    const { data: members, error } = await supabase
      .from('Member')
      .select(`
        id,
        firstName,
        lastName,
        jobTitle,
        bio,
        avatarUrl,
        linkedinUrl,
        isPublic,
        userId,
        createdAt
      `)
      .eq('isPublic', true)
      .order('createdAt', { ascending: false })

    if (error || !members) {
      console.error('Error fetching members:', error)
      return []
    }

    // Fetch associated user data to get role and company info
    const userIds = members.map((m) => m.userId)
    const { data: users } = await supabase
      .from('User')
      .select('id, role')
      .in('id', userIds)

    const { data: brands } = await supabase
      .from('Brand')
      .select('userId, name, slug')
      .in('userId', userIds)

    const { data: suppliers } = await supabase
      .from('Supplier')
      .select('userId, companyName, slug')
      .in('userId', userIds)

    const userMap = new Map(users?.map((u) => [u.id, u]) || [])
    const brandMap = new Map(brands?.map((b) => [b.userId, b]) || [])
    const supplierMap = new Map(suppliers?.map((s) => [s.userId, s]) || [])

    return members.map((member) => {
      const user = userMap.get(member.userId)
      const brand = brandMap.get(member.userId)
      const supplier = supplierMap.get(member.userId)
      const companyType = (user?.role === 'BRAND' || user?.role === 'SUPPLIER') ? user.role : 'BRAND'
      const company = brand?.name || supplier?.companyName || ''

      return {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        jobTitle: member.jobTitle,
        bio: member.bio,
        avatarUrl: member.avatarUrl,
        linkedinUrl: member.linkedinUrl,
        location: null as string | null,
        company,
        companyType: companyType as 'BRAND' | 'SUPPLIER',
      }
    })
  } catch (err) {
    console.error('Failed to fetch members:', err)
    return []
  }
}

export default async function MembersPage() {
  const members = await getMembers()

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-pink-500 text-white py-12 border-b-4 border-black">
        <div className="section-container">
          <Badge className="mb-4 bg-white text-pink-500 border-white">
            <Users className="w-3 h-3 mr-1" />
            {members.length} Members
          </Badge>
          <h1 className="font-display text-display-sm lg:text-display-md mb-4">
            Member Directory
          </h1>
          <p className="text-lg text-white/80 max-w-2xl">
            Connect with fellow drinks industry professionals. Find founders, marketers,
            distillers, and specialists across the Kindred community.
          </p>
        </div>
      </section>

      <MembersDirectory members={members} />
    </div>
  )
}
