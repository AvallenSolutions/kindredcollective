import { PrismaClient } from '@prisma/client'

/**
 * Seeds the prerequisites the WhatsApp import pipeline depends on:
 *  - a system User used as the author of imported resources
 *  - the KnowledgeCategory taxonomy for the "Ask the Collective" knowledge base
 *  - a "Community Links" ResourceCategory for imported links
 *
 * Idempotent: safe to run repeatedly (upserts by unique slug/email).
 */

const prisma = new PrismaClient()

const SYSTEM_USER_EMAIL = 'system@kindredcollective.co.uk'
const COMMUNITY_LINKS_CATEGORY_SLUG = 'community-links'

const KNOWLEDGE_CATEGORIES = [
  { slug: 'regulation-compliance', name: 'Regulation & Compliance', color: '#FF6B6B', order: 1 },
  { slug: 'route-to-market', name: 'Route to Market', color: '#00D9FF', order: 2 },
  { slug: 'production-packaging', name: 'Production & Packaging', color: '#A3E635', order: 3 },
  { slug: 'logistics-export', name: 'Logistics & Export', color: '#FBBF24', order: 4 },
  { slug: 'sales-marketing-pr', name: 'Sales, Marketing & PR', color: '#F472B6', order: 5 },
  { slug: 'funding-finance', name: 'Funding & Finance', color: '#34D399', order: 6 },
  { slug: 'sustainability', name: 'Sustainability', color: '#4ADE80', order: 7 },
  { slug: 'people-suppliers', name: 'People & Suppliers', color: '#818CF8', order: 8 },
  { slug: 'general', name: 'General', color: '#94A3B8', order: 9 },
]

async function main() {
  const systemUser = await prisma.user.upsert({
    where: { email: SYSTEM_USER_EMAIL },
    update: {},
    create: { email: SYSTEM_USER_EMAIL, role: 'ADMIN', emailVerified: new Date() },
  })
  console.log(`System user: ${systemUser.email}`)

  for (const cat of KNOWLEDGE_CATEGORIES) {
    await prisma.knowledgeCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, color: cat.color, order: cat.order },
      create: cat,
    })
  }
  console.log(`Seeded ${KNOWLEDGE_CATEGORIES.length} knowledge categories`)

  await prisma.resourceCategory.upsert({
    where: { slug: COMMUNITY_LINKS_CATEGORY_SLUG },
    update: {},
    create: {
      slug: COMMUNITY_LINKS_CATEGORY_SLUG,
      name: 'Community Links',
      description: 'Useful links shared by the community over the years.',
      color: '#00D9FF',
      order: 99,
    },
  })
  console.log('Seeded "Community Links" resource category')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
