import Link from 'next/link'
import { PawPrint, ArrowLeft, Plus } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Deterministic rotations — no Math.random() to avoid hydration mismatch
const ROTATIONS = [
  '-rotate-3',
  'rotate-2',
  '-rotate-1',
  'rotate-3',
  '-rotate-2',
  'rotate-1',
  '-rotate-4',
  'rotate-4',
]

interface Pet {
  id: string
  firstName: string
  petName: string | null
  petType: string | null
  petPhotoUrl: string
}

function PolaroidCard({ pet, index }: { pet: Pet; index: number }) {
  const rotation = ROTATIONS[index % ROTATIONS.length]

  return (
    <div className={`relative inline-block w-full transform ${rotation} hover:rotate-0 hover:scale-105 hover:z-10 transition-all duration-200 cursor-default`}>
      {/* Pin */}
      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-coral border-2 border-black shadow-brutal-sm z-10" />

      {/* Polaroid card */}
      <div className="bg-white border-2 border-black p-3 pb-8 shadow-brutal">
        {/* Photo */}
        <div className="aspect-square w-full overflow-hidden border-2 border-black bg-gray-100">
          <img
            src={pet.petPhotoUrl}
            alt={pet.petName || `${pet.firstName}'s pet`}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Caption */}
        <div className="mt-4 text-center space-y-0.5">
          <p className="font-display font-bold text-base leading-tight">
            {pet.petName || 'Unknown'}
          </p>
          <p className="text-xs text-gray-500">
            {pet.petType && <span className="mr-1">{pet.petType} ·</span>}
            {pet.firstName}&apos;s
          </p>
        </div>
      </div>
    </div>
  )
}

async function getPets(): Promise<Pet[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('Member')
    .select('id, firstName, petName, petType, petPhotoUrl')
    .eq('isPublic', true)
    .eq('petPhotoPublic', true)
    .not('petPhotoUrl', 'is', null)
    .order('updatedAt', { ascending: false })

  if (error) {
    console.error('[PetPhotoboard] Error fetching pets:', error)
    return []
  }

  return (data || []).filter((m): m is Pet => !!m.petPhotoUrl)
}

export default async function PetPhotoboardPage() {
  const pets = await getPets()

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <section className="bg-white border-b-3 border-black">
        <div className="section-container py-8">
          <Link
            href="/community"
            className="inline-flex items-center text-sm font-bold mb-4 hover:text-cyan"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Community
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <PawPrint className="w-8 h-8" />
              <div>
                <h1 className="font-display text-3xl font-black uppercase tracking-tight">
                  The Pet Photoboard
                </h1>
                <p className="text-gray-600 mt-1">Our community&apos;s most important members</p>
              </div>
            </div>

            <Link href="/dashboard/settings">
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add your pet
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Board */}
      <section className="section-container py-12">
        {pets.length === 0 ? (
          <div className="text-center py-24">
            <PawPrint className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold mb-2">No pets yet!</h2>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Be the first to add your pet. Head to your profile settings, upload a photo, and turn on &ldquo;Share on Pet Photoboard&rdquo;.
            </p>
            <Link href="/dashboard/settings">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add your pet
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-8 text-center">
              {pets.length} {pets.length === 1 ? 'furry friend' : 'furry friends'} and counting
            </p>
            <div className="columns-2 md:columns-3 lg:columns-4 gap-8 space-y-8">
              {pets.map((pet, index) => (
                <div key={pet.id} className="break-inside-avoid mb-8">
                  <PolaroidCard pet={pet} index={index} />
                </div>
              ))}
            </div>

            {/* CTA at bottom */}
            <div className="mt-16 text-center">
              <p className="text-sm text-gray-500 mb-3">Want to add your pet?</p>
              <Link href="/dashboard/settings">
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add your pet
                </Button>
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
