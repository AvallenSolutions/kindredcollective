'use client'

import { useState, useMemo } from 'react'
import { Search, Users, X } from 'lucide-react'
import { Badge, Button, Input } from '@/components/ui'
import { MemberCard } from '@/components/members'
import { members } from '../../../../../prisma/seed-members'
import { cn } from '@/lib/utils'

// Transform seed data
const memberData = members.map((m, index) => ({
  id: `member-${index}`,
  ...m,
  avatarUrl: null,
}))

type MemberType = 'all' | 'BRAND' | 'SUPPLIER'

export default function MembersPage() {
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState<MemberType>('all')

  const filteredMembers = useMemo(() => {
    return memberData.filter((member) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesSearch =
          member.firstName.toLowerCase().includes(searchLower) ||
          member.lastName.toLowerCase().includes(searchLower) ||
          member.company.toLowerCase().includes(searchLower) ||
          member.jobTitle?.toLowerCase().includes(searchLower) ||
          member.location?.toLowerCase().includes(searchLower)

        if (!matchesSearch) return false
      }

      // Type filter
      if (selectedType !== 'all' && member.companyType !== selectedType) {
        return false
      }

      return true
    })
  }, [search, selectedType])

  const brandCount = memberData.filter((m) => m.companyType === 'BRAND').length
  const supplierCount = memberData.filter((m) => m.companyType === 'SUPPLIER').length

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-pink-500 text-white py-12 border-b-4 border-black">
        <div className="section-container">
          <Badge className="mb-4 bg-white text-pink-500 border-white">
            <Users className="w-3 h-3 mr-1" />
            {memberData.length} Members
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

      {/* Filters */}
      <section className="bg-white border-b-3 border-black sticky top-16 lg:top-20 z-40">
        <div className="section-container py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, company, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-black" />
                </button>
              )}
            </div>

            {/* Type Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedType('all')}
                className={cn(
                  'px-4 py-2 text-sm font-bold border-2 transition-colors',
                  selectedType === 'all'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-gray-200 hover:border-black'
                )}
              >
                All ({memberData.length})
              </button>
              <button
                onClick={() => setSelectedType('BRAND')}
                className={cn(
                  'px-4 py-2 text-sm font-bold border-2 transition-colors',
                  selectedType === 'BRAND'
                    ? 'bg-cyan text-black border-black'
                    : 'bg-white text-black border-gray-200 hover:border-black'
                )}
              >
                Brands ({brandCount})
              </button>
              <button
                onClick={() => setSelectedType('SUPPLIER')}
                className={cn(
                  'px-4 py-2 text-sm font-bold border-2 transition-colors',
                  selectedType === 'SUPPLIER'
                    ? 'bg-coral text-white border-black'
                    : 'bg-white text-black border-gray-200 hover:border-black'
                )}
              >
                Suppliers ({supplierCount})
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="section-container py-8 lg:py-12">
        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            Showing <span className="font-bold text-black">{filteredMembers.length}</span> members
            {search && <span> for &quot;{search}&quot;</span>}
          </p>
        </div>

        {/* Members Grid */}
        {filteredMembers.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white border-3 border-black">
            <div className="w-16 h-16 bg-gray-100 border-3 border-black mx-auto mb-4 flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-display text-xl font-bold mb-2">No members found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filters
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearch('')
                setSelectedType('all')
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </section>

      {/* Join CTA */}
      <section className="bg-lime border-y-4 border-black py-12">
        <div className="section-container text-center">
          <h2 className="font-display text-2xl lg:text-3xl font-bold mb-4">
            Join the Community
          </h2>
          <p className="text-gray-700 mb-6 max-w-xl mx-auto">
            Create your profile and connect with drinks industry professionals across the UK.
          </p>
          <Button size="lg" className="bg-black text-white hover:bg-gray-800">
            Create Your Profile
          </Button>
        </div>
      </section>
    </div>
  )
}
