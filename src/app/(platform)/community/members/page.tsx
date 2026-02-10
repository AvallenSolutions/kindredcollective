import { Users } from 'lucide-react'
import { Badge } from '@/components/ui'
import { createAdminClient } from '@/lib/supabase/admin'
import { MembersDirectory } from './members-directory'

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

      await supabase.from('Member').insert({
        userId: user.id,
        firstName,
        lastName,
        jobTitle: user.role === 'ADMIN' ? 'Admin' : null,
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
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

    // Fetch organisation affiliations via OrganisationMember (replaces old Brand.userId / Supplier.userId)
    const userIds = members.map((m) => m.userId)
    const { data: orgMemberships } = await supabase
      .from('OrganisationMember')
      .select(`
        userId,
        role,
        organisation:Organisation(
          id, name, slug, type,
          brand:Brand(id, name, slug),
          supplier:Supplier(id, companyName, slug)
        )
      `)
      .in('userId', userIds)

    // Build a map of userId -> primary affiliation
    const affiliationMap = new Map<string, { company: string, companyType: 'BRAND' | 'SUPPLIER' }>()

    if (orgMemberships) {
      for (const membership of orgMemberships as any[]) {
        const org = Array.isArray(membership.organisation) ? membership.organisation[0] : membership.organisation
        if (!org) continue

        const brand = org.brand ? (Array.isArray(org.brand) ? org.brand[0] : org.brand) : null
        const supplier = org.supplier ? (Array.isArray(org.supplier) ? org.supplier[0] : org.supplier) : null
        const companyName = brand?.name || supplier?.companyName || org.name

        // Use first affiliation found as primary (don't overwrite)
        if (!affiliationMap.has(membership.userId)) {
          affiliationMap.set(membership.userId, {
            company: companyName,
            companyType: org.type as 'BRAND' | 'SUPPLIER',
          })
        }
      }
    }

    return members.map((member) => {
      const affiliation = affiliationMap.get(member.userId)
      return {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        jobTitle: member.jobTitle,
        bio: member.bio,
        avatarUrl: member.avatarUrl,
        linkedinUrl: member.linkedinUrl,
        location: null as string | null,
        company: affiliation?.company || '',
        companyType: (affiliation?.companyType || 'BRAND') as 'BRAND' | 'SUPPLIER',
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
