import { createAdminClient } from '@/lib/supabase/admin'
import { ExploreContent } from './explore-content'

// Force dynamic rendering to always fetch fresh data from Supabase
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getSuppliers() {
  try {
    const supabase = createAdminClient()

    const { data: suppliers, error } = await supabase
      .from('Supplier')
      .select('id, companyName, slug, tagline, description, logoUrl, category, services, location, country, isVerified, isPublic, createdAt')
      .eq('isPublic', true)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching suppliers:', error)
      return []
    }

    return suppliers || []
  } catch (err) {
    console.error('Failed to connect to Supabase:', err)
    return []
  }
}

export default async function ExplorePage() {
  const suppliers = await getSuppliers()

  return <ExploreContent suppliers={suppliers} />
}
