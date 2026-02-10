/**
 * Migration Script: Multi-Affiliation Support
 *
 * Run BEFORE the Prisma migration that removes Brand.userId and Supplier.userId.
 *
 * This script:
 * 1. Finds all Brand records with a userId but no linked Organisation
 * 2. Creates Organisation + OrganisationMember(OWNER) for each
 * 3. Finds all Supplier records with a userId but no linked Organisation
 * 4. Creates Organisation + OrganisationMember(OWNER) for each
 * 5. Creates Member profiles for any users missing one
 * 6. Updates all BRAND/SUPPLIER users to MEMBER role
 *
 * Usage: npx tsx scripts/migrate-to-multi-affiliation.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  console.log('=== Multi-Affiliation Migration ===\n')

  // Step 1: Find brands with userId but no Organisation
  console.log('Step 1: Migrating brands to organisations...')
  const { data: brands, error: brandsError } = await supabase
    .from('Brand')
    .select('id, name, slug, userId')

  if (brandsError) {
    console.error('Error fetching brands:', brandsError)
    return
  }

  const brandsWithUser = (brands || []).filter((b: any) => b.userId)
  console.log(`  Found ${brandsWithUser.length} brands with userId`)

  // Check which brands already have organisations
  const { data: existingBrandOrgs } = await supabase
    .from('Organisation')
    .select('brandId')
    .eq('type', 'BRAND')

  const existingBrandIds = new Set((existingBrandOrgs || []).map((o: any) => o.brandId))

  let brandsCreated = 0
  for (const brand of brandsWithUser) {
    if (existingBrandIds.has(brand.id)) {
      console.log(`  Skipping ${brand.name} (org already exists)`)
      continue
    }

    // Create Organisation
    const { data: org, error: orgError } = await supabase
      .from('Organisation')
      .insert({
        name: brand.name,
        slug: brand.slug,
        type: 'BRAND',
        brandId: brand.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single()

    if (orgError) {
      console.error(`  Error creating org for brand ${brand.name}:`, orgError)
      continue
    }

    // Create OrganisationMember
    const { error: memberError } = await supabase
      .from('OrganisationMember')
      .insert({
        organisationId: org.id,
        userId: brand.userId,
        role: 'OWNER',
        joinedAt: new Date().toISOString(),
      })

    if (memberError) {
      console.error(`  Error creating org member for brand ${brand.name}:`, memberError)
    } else {
      console.log(`  ✓ Created org for brand: ${brand.name}`)
      brandsCreated++
    }
  }
  console.log(`  Created ${brandsCreated} brand organisations\n`)

  // Step 2: Find suppliers with userId but no Organisation
  console.log('Step 2: Migrating suppliers to organisations...')
  const { data: suppliers, error: suppliersError } = await supabase
    .from('Supplier')
    .select('id, companyName, slug, userId')

  if (suppliersError) {
    console.error('Error fetching suppliers:', suppliersError)
    return
  }

  const suppliersWithUser = (suppliers || []).filter((s: any) => s.userId)
  console.log(`  Found ${suppliersWithUser.length} suppliers with userId`)

  // Check which suppliers already have organisations
  const { data: existingSupplierOrgs } = await supabase
    .from('Organisation')
    .select('supplierId')
    .eq('type', 'SUPPLIER')

  const existingSupplierIds = new Set((existingSupplierOrgs || []).map((o: any) => o.supplierId))

  let suppliersCreated = 0
  for (const supplier of suppliersWithUser) {
    if (existingSupplierIds.has(supplier.id)) {
      console.log(`  Skipping ${supplier.companyName} (org already exists)`)
      continue
    }

    const { data: org, error: orgError } = await supabase
      .from('Organisation')
      .insert({
        name: supplier.companyName,
        slug: supplier.slug,
        type: 'SUPPLIER',
        supplierId: supplier.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single()

    if (orgError) {
      console.error(`  Error creating org for supplier ${supplier.companyName}:`, orgError)
      continue
    }

    const { error: memberError } = await supabase
      .from('OrganisationMember')
      .insert({
        organisationId: org.id,
        userId: supplier.userId,
        role: 'OWNER',
        joinedAt: new Date().toISOString(),
      })

    if (memberError) {
      console.error(`  Error creating org member for supplier ${supplier.companyName}:`, memberError)
    } else {
      console.log(`  ✓ Created org for supplier: ${supplier.companyName}`)
      suppliersCreated++
    }
  }
  console.log(`  Created ${suppliersCreated} supplier organisations\n`)

  // Step 3: Create Member profiles for users missing them
  console.log('Step 3: Creating missing Member profiles...')
  const { data: users } = await supabase
    .from('User')
    .select('id, email, role')

  const { data: existingMembers } = await supabase
    .from('Member')
    .select('userId')

  const existingMemberIds = new Set((existingMembers || []).map((m: any) => m.userId))
  const usersWithoutMembers = (users || []).filter((u: any) => !existingMemberIds.has(u.id))

  let membersCreated = 0
  for (const user of usersWithoutMembers) {
    const emailName = user.email.split('@')[0]
    const parts = emailName.split(/[._-]/)
    const firstName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'User'
    const lastName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : ''

    const { error } = await supabase.from('Member').insert({
      userId: user.id,
      firstName,
      lastName,
      jobTitle: user.role === 'ADMIN' ? 'Admin' : null,
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    if (error) {
      console.error(`  Error creating member for ${user.email}:`, error)
    } else {
      console.log(`  ✓ Created member profile for: ${user.email}`)
      membersCreated++
    }
  }
  console.log(`  Created ${membersCreated} member profiles\n`)

  // Step 4: Update BRAND/SUPPLIER users to MEMBER role
  console.log('Step 4: Updating user roles...')
  const { data: updatedUsers, error: updateError } = await supabase
    .from('User')
    .update({ role: 'MEMBER', updatedAt: new Date().toISOString() })
    .in('role', ['BRAND', 'SUPPLIER'])
    .select('id, email')

  if (updateError) {
    console.error('  Error updating user roles:', updateError)
  } else {
    console.log(`  Updated ${(updatedUsers || []).length} users from BRAND/SUPPLIER to MEMBER\n`)
  }

  // Summary
  console.log('=== Migration Summary ===')
  console.log(`  Brand organisations created: ${brandsCreated}`)
  console.log(`  Supplier organisations created: ${suppliersCreated}`)
  console.log(`  Member profiles created: ${membersCreated}`)
  console.log(`  User roles updated: ${(updatedUsers || []).length}`)
  console.log('\nMigration complete! You can now run the Prisma migration to remove Brand.userId and Supplier.userId.')
}

main().catch(console.error)
