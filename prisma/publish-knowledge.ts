import { PrismaClient } from '@prisma/client'

/**
 * Publishes imported, anonymised content so it appears on the public site:
 *  - KnowledgeEntry: those at/above a confidence threshold become PUBLISHED
 *  - SupplierEndorsement: those matched to a real supplier become visible
 *
 * Unmatched endorsements (supplierId = null) are intentionally left hidden.
 *
 * Usage:
 *   npm run publish:knowledge                 # default threshold 0.5
 *   PUBLISH_MIN_CONFIDENCE=0.7 npm run publish:knowledge
 */

const prisma = new PrismaClient()
const MIN_CONFIDENCE = Number(process.env.PUBLISH_MIN_CONFIDENCE || 0.5)

async function main() {
  const knowledge = await prisma.knowledgeEntry.updateMany({
    where: {
      isPublished: false,
      OR: [{ confidence: { gte: MIN_CONFIDENCE } }, { confidence: null }],
    },
    data: { isPublished: true, status: 'PUBLISHED' },
  })

  const endorsements = await prisma.supplierEndorsement.updateMany({
    where: { isPublished: false, supplierId: { not: null } },
    data: { isPublished: true },
  })

  const totalPublished = await prisma.knowledgeEntry.count({
    where: { isPublished: true, status: 'PUBLISHED' },
  })
  const stillHidden = await prisma.knowledgeEntry.count({ where: { isPublished: false } })
  const unmatched = await prisma.supplierEndorsement.count({ where: { supplierId: null } })

  console.log('=== PUBLISH COMPLETE ===')
  console.log(`Knowledge entries published this run: ${knowledge.count} (confidence >= ${MIN_CONFIDENCE})`)
  console.log(`Supplier endorsements made visible:   ${endorsements.count}`)
  console.log(`Total live knowledge entries:         ${totalPublished}`)
  console.log(`Knowledge entries still below threshold/hidden: ${stillHidden}`)
  console.log(`Unmatched supplier mentions (kept hidden for review): ${unmatched}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
