/**
 * Scrape suppliers from kindredcollective.co.uk and generate import SQL
 *
 * Usage: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/scrape-suppliers.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import * as http from 'http'

// All supplier slugs from the collection page
const SUPPLIER_SLUGS = [
  'addition',
  'aitch-creates',
  'am-distilling-ltd',
  'anderson-cole-group',
  'astute-beverages',
  'avallen-solutions',
  'b2c-group-ltd',
  'bb-comms',
  'bbj-k',
  'berlin-packaging',
  'bien-venue-ltd-venue-finders',
  'bobbys-gin-distribution-bv',
  'bostocap-srl',
  'bottled-and-canned',
  'bowimi',
  'buddy-creative',
  'burlington-bottling-co',
  'cleverdrinks-photography',
  'clyde-presentation-packaging',
  'cocktail-connoisseurs',
  'cone-accounting-limited',
  'cooper-parry',
  'crate-pr',
  'cutlass-communications',
  'diglis-consulting',
  'dimax-digital',
  'drincx-ltd',
  'easy-chew',
  'eventism-ltd',
  'flourish-creative',
  'frederick-wilkinson',
  'giraffe-distillers-ltd',
  'graceful-monkey',
  'greenbox-designs',
  'halo-business-support-ltd',
  'hensol-castle-distillery',
  'highspirit-agency',
  'iconic-distro-company-ltd',
  'jamie-prowse-freelance',
  'kind-community',
  'label-apeel-ltd',
  'london-city-bond-ltd',
  'lucie-rhoades-comms',
  'maffeo-drinks-s-r-o',
  'mariller',
  'marillier-consulting',
  'midday-studio',
  'nightcap-brands',
  'nolen-consultancy',
  'on-a-plate-growth',
  'orange-by-marmalade',
  'partner-up',
  'pear-sons-production-studio',
  'propak-uk',
  'red-distillery',
  'saverglass',
  'sbp-events-ltd',
  'scale-drinks',
  'seven-sages',
  'smurfit-westrock-saxon',
  'soho-drinks-ltd',
  'spirited-marketing',
  'supplychain21-ltd',
  'the-advocate-group',
  'the-brand-weaver',
  'the-custom-spirit-co',
  'this-is-undefined',
  'tortuga',
  'verallia',
]

// Category mapping based on supplier descriptions
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'PACKAGING': ['packaging', 'bottle', 'cap', 'closure', 'label', 'glass', 'package'],
  'DESIGN': ['design', 'creative', 'branding', 'brand identity', 'visual', 'graphic'],
  'MARKETING': ['marketing', 'social media', 'digital marketing'],
  'PR': ['pr', 'public relations', 'press', 'communications', 'comms'],
  'CONSULTING': ['consulting', 'consultancy', 'advisory', 'strategy', 'advice', 'coach'],
  'DISTRIBUTION': ['distribution', 'distro', 'logistics', 'supply chain', 'warehouse', 'bond', 'fulfilment'],
  'PHOTOGRAPHY': ['photography', 'photo', 'video', 'production studio', 'videography'],
  'INGREDIENTS': ['ingredient', 'flavour', 'botanical', 'flavouring'],
  'CO_PACKING': ['bottling', 'co-pack', 'copacking', 'contract', 'filling', 'canning'],
  'EQUIPMENT': ['equipment', 'machinery', 'distilling equipment', 'distillery equipment'],
  'LEGAL': ['legal', 'law', 'lawyer'],
  'FINANCE': ['finance', 'accounting', 'financial', 'accounts', 'accountant', 'tax'],
  'SOFTWARE': ['software', 'digital platform', 'tech', 'platform', 'app', 'saas'],
  'RECRUITMENT': ['recruitment', 'talent', 'hiring', 'jobs'],
  'SUSTAINABILITY': ['sustainability', 'sustainable', 'green', 'eco', 'environmental'],
  'WEB_DEVELOPMENT': ['web development', 'website', 'web design', 'developer'],
}

interface ShopifyProduct {
  product: {
    id: number
    title: string
    body_html: string
    handle: string
    images: Array<{
      src: string
      alt: string | null
    }>
    image?: {
      src: string
    }
  }
}

interface SupplierData {
  companyName: string
  slug: string
  tagline: string
  description: string
  category: string
  logoUrl: string | null
  services: string[]
}

// Fetch JSON from URL
function fetchJson(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    protocol.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(e)
        }
      })
    }).on('error', reject)
  })
}

// Determine category from description
function determineCategory(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase()

  // Check for specific patterns first
  if (text.includes('distillery') && text.includes('equipment')) return 'EQUIPMENT'
  if (text.includes('distillery') && !text.includes('equipment')) return 'CO_PACKING'
  if (text.includes('co-pack') || text.includes('contract') && text.includes('bottl')) return 'CO_PACKING'
  if (text.includes('event') && (text.includes('planning') || text.includes('management'))) return 'CONSULTING'

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return category
      }
    }
  }

  return 'OTHER'
}

// Extract tagline from HTML description (first sentence/line)
function extractTagline(bodyHtml: string): string {
  const text = bodyHtml
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r?\n/g, ' ')
    .trim()

  // Get first sentence or first 150 characters
  const firstSentence = text.split(/[.!?]/)[0]?.trim() || text
  return firstSentence.length > 150 ? firstSentence.slice(0, 147) + '...' : firstSentence
}

// Clean description HTML
function cleanDescription(bodyHtml: string): string {
  return bodyHtml
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function main() {
  console.log('🚀 Starting supplier scrape from kindredcollective.co.uk\n')

  const suppliers: SupplierData[] = []

  console.log(`📦 Fetching ${SUPPLIER_SLUGS.length} suppliers...\n`)

  // Fetch all supplier data
  for (const slug of SUPPLIER_SLUGS) {
    try {
      const url = `https://kindredcollective.co.uk/products/${slug}.json`
      const data = await fetchJson(url) as ShopifyProduct

      if (!data.product) {
        console.log(`⚠️  ${slug}: No product data found`)
        continue
      }

      const product = data.product
      const tagline = extractTagline(product.body_html || '')
      const description = cleanDescription(product.body_html || '')
      const category = determineCategory(product.title, description)
      const imageUrl = product.images?.[0]?.src || product.image?.src || null

      const supplier: SupplierData = {
        companyName: product.title,
        slug: product.handle,
        tagline,
        description,
        category,
        logoUrl: imageUrl,
        services: [],
      }

      suppliers.push(supplier)
      console.log(`✅ ${product.title} [${category}]`)

      // Small delay to be polite to the server
      await new Promise(resolve => setTimeout(resolve, 150))

    } catch (error) {
      console.error(`❌ ${slug}: Failed to fetch`, error)
    }
  }

  console.log('\n📝 Generating SQL import script...\n')

  // Generate SQL
  const sqlStatements: string[] = []

  sqlStatements.push('-- Kindred Collective Supplier Import')
  sqlStatements.push('-- Generated from scraping kindredcollective.co.uk')
  sqlStatements.push(`-- Date: ${new Date().toISOString()}`)
  sqlStatements.push(`-- Total suppliers: ${suppliers.length}`)
  sqlStatements.push('')
  sqlStatements.push('-- First, delete existing suppliers')
  sqlStatements.push('DELETE FROM "SavedSupplier";')
  sqlStatements.push('DELETE FROM "Offer";')
  sqlStatements.push('DELETE FROM "SupplierReview";')
  sqlStatements.push('DELETE FROM "Supplier";')
  sqlStatements.push('')
  sqlStatements.push('-- Insert scraped suppliers')

  for (const supplier of suppliers) {
    const escapedName = supplier.companyName.replace(/'/g, "''")
    const escapedTagline = supplier.tagline.replace(/'/g, "''")
    const escapedDescription = supplier.description.replace(/'/g, "''")
    const logoUrl = supplier.logoUrl ? `'${supplier.logoUrl.replace(/'/g, "''")}'` : 'NULL'

    sqlStatements.push(`
INSERT INTO "Supplier" (
  id,
  "companyName",
  slug,
  tagline,
  description,
  category,
  services,
  "logoUrl",
  "isPublic",
  "isVerified",
  "claimStatus",
  "viewCount",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  '${escapedName}',
  '${supplier.slug}',
  '${escapedTagline}',
  '${escapedDescription}',
  '${supplier.category}',
  '{}',
  ${logoUrl},
  true,
  false,
  'UNCLAIMED',
  0,
  NOW(),
  NOW()
);`)
  }

  sqlStatements.push('')
  sqlStatements.push('-- Done!')

  // Write SQL file
  const sqlPath = path.join(__dirname, 'import-suppliers.sql')
  fs.writeFileSync(sqlPath, sqlStatements.join('\n'))
  console.log(`✅ SQL file written to: ${sqlPath}`)

  // Also create a JSON file with the data for reference
  const jsonPath = path.join(__dirname, 'scraped-suppliers.json')
  fs.writeFileSync(jsonPath, JSON.stringify(suppliers, null, 2))
  console.log(`✅ JSON file written to: ${jsonPath}`)

  // Summary by category
  console.log('\n📊 Category breakdown:')
  const categoryCounts: Record<string, number> = {}
  for (const supplier of suppliers) {
    categoryCounts[supplier.category] = (categoryCounts[supplier.category] || 0) + 1
  }
  for (const [category, count] of Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${category}: ${count}`)
  }

  console.log(`\n🎉 Done! Scraped ${suppliers.length} suppliers`)
  console.log('\nTo import, run the SQL in your Supabase SQL editor')
}

main().catch(console.error)
