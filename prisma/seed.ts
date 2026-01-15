import { PrismaClient } from '@prisma/client'
import { suppliers } from './seed-data'

const prisma = new PrismaClient()

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function main() {
  console.log('🌱 Starting seed...')

  // Clear existing data
  console.log('Clearing existing suppliers...')
  await prisma.supplier.deleteMany()

  // Create a system user for suppliers (since suppliers need a userId)
  console.log('Creating system user...')
  let systemUser = await prisma.user.findFirst({
    where: { email: 'system@kindredcollective.co.uk' }
  })

  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        email: 'system@kindredcollective.co.uk',
        role: 'ADMIN',
      }
    })
  }

  // Seed suppliers
  console.log(`Seeding ${suppliers.length} suppliers...`)

  for (const supplier of suppliers) {
    // Create a placeholder user for each supplier
    const supplierUser = await prisma.user.create({
      data: {
        email: `${supplier.slug}@kindredcollective.co.uk`,
        role: 'SUPPLIER',
      }
    })

    await prisma.supplier.create({
      data: {
        userId: supplierUser.id,
        companyName: supplier.companyName,
        slug: supplier.slug,
        tagline: supplier.tagline,
        description: supplier.description,
        category: supplier.category,
        services: supplier.services,
        location: supplier.location,
        country: supplier.country,
        serviceRegions: supplier.serviceRegions,
        moqMin: supplier.moqMin,
        certifications: supplier.certifications || [],
        isVerified: supplier.isVerified,
        isPublic: true,
      }
    })
  }

  console.log('✅ Seed completed successfully!')
  console.log(`Created ${suppliers.length} suppliers`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
