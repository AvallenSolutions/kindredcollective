import { Wine } from 'lucide-react'
import { Badge } from '@/components/ui'
import { createAdminClient } from '@/lib/supabase/admin'
import { BrandsDirectory } from './brands-directory'

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getBrands() {
  try {
    const supabase = createAdminClient()

    const { data: brands, error } = await supabase
      .from('Brand')
      .select('id, name, slug, tagline, description, logoUrl, heroImageUrl, category, subcategories, yearFounded, location, country, isVerified, isPublic, createdAt')
      .eq('isPublic', true)
      .order('isVerified', { ascending: false })
      .order('createdAt', { ascending: false })

    if (error || !brands) {
      console.error('Error fetching brands:', error)
      return []
    }

    return brands
  } catch (err) {
    console.error('Failed to fetch brands:', err)
    return []
  }
}

export default async function BrandsPage() {
  const brands = await getBrands()

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-purple-500 text-white py-12 border-b-4 border-black">
        <div className="section-container">
          <Badge className="mb-4 bg-white text-purple-500 border-white">
            <Wine className="w-3 h-3 mr-1" />
            {brands.length} Brands
          </Badge>
          <h1 className="font-display text-display-sm lg:text-display-md mb-4">
            Brand Directory
          </h1>
          <p className="text-lg text-white/80 max-w-2xl">
            Discover independent drinks brands from across the UK and beyond.
            From craft gin to alcohol-free alternatives.
          </p>
        </div>
      </section>

      <BrandsDirectory brands={brands} />
    </div>
  )
}
