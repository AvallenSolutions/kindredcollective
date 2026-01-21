import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface ScrapedSupplier {
  companyName: string
  slug: string
  tagline: string
  description: string
  category: string
  logoUrl: string
}

async function updateLogos() {
  // Read the scraped suppliers data
  const scrapedData = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'scraped-suppliers.json'), 'utf8')
  ) as ScrapedSupplier[]

  console.log(`Updating ${scrapedData.length} supplier logos...`)

  let successCount = 0
  let errorCount = 0

  for (const supplier of scrapedData) {
    if (!supplier.logoUrl) continue

    const { error } = await supabase
      .from('Supplier')
      .update({ logoUrl: supplier.logoUrl })
      .eq('slug', supplier.slug)

    if (error) {
      console.error(`Failed to update ${supplier.slug}:`, error.message)
      errorCount++
    } else {
      console.log(`Updated: ${supplier.companyName}`)
      successCount++
    }
  }

  console.log(`\nDone! Updated ${successCount} suppliers, ${errorCount} errors.`)
}

updateLogos().catch(console.error)
