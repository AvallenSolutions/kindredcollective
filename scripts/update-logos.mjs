import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function updateLogos() {
  // Read the scraped suppliers data
  const scrapedData = JSON.parse(
    fs.readFileSync(join(__dirname, 'scraped-suppliers.json'), 'utf8')
  )

  console.log(`Updating ${scrapedData.length} supplier logos...`)

  let successCount = 0
  let errorCount = 0
  let notFoundCount = 0

  for (const supplier of scrapedData) {
    if (!supplier.logoUrl) continue

    const { data, error } = await supabase
      .from('Supplier')
      .update({ logoUrl: supplier.logoUrl })
      .eq('slug', supplier.slug)
      .select()

    if (error) {
      console.error(`Failed to update ${supplier.slug}:`, error.message)
      errorCount++
    } else if (!data || data.length === 0) {
      console.log(`Not found in DB: ${supplier.slug}`)
      notFoundCount++
    } else {
      console.log(`Updated: ${supplier.companyName}`)
      successCount++
    }
  }

  console.log(`\nDone! Updated ${successCount} suppliers, ${notFoundCount} not found, ${errorCount} errors.`)
}

updateLogos().catch(console.error)
