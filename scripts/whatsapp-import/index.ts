import { readFileSync } from 'fs'
import { PrismaClient } from '@prisma/client'
import { parseExport } from './parse'
import { anonymiseMessages, buildNameSet, containsPII, scrubOutput } from './anonymise'
import { chunkMessages } from './chunk'
import { classifyChunk } from './classify'
import { clusterQuestions, matchSupplier, slugify, canonicaliseUrl, type SupplierRef } from './normalise'
import { synthesiseCluster, clusterIdHash } from './synthesise'
import {
  loadPersistContext,
  persistEndorsements,
  persistKnowledge,
  persistLinks,
  type PreparedEndorsement,
  type PreparedKnowledge,
  type PreparedLink,
} from './persist'
import { getSpend } from './anthropic'
import type { ChunkClassification, StructuredMessage, SupplierCategory } from './types'

/**
 * CLI orchestrator for the WhatsApp → website mining pipeline.
 *
 *   npm run import:whatsapp -- --input <file> [--dry-run] [--limit N] [--since ISO]
 *
 * --dry-run runs parse → anonymise → classify on a sample and prints JSON,
 * writing NOTHING to the database (no synthesis, minimal spend).
 */

interface Args {
  input: string
  dryRun: boolean
  limit?: number
  since?: Date
}

function parseArgs(argv: string[]): Args {
  const args: Partial<Args> = { dryRun: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--input') args.input = argv[++i]
    else if (a === '--dry-run') args.dryRun = true
    else if (a === '--limit') args.limit = Number(argv[++i])
    else if (a === '--since') args.since = new Date(argv[++i])
  }
  if (!args.input) {
    throw new Error('Usage: import:whatsapp -- --input <file> [--dry-run] [--limit N] [--since ISO]')
  }
  return args as Args
}

function aggregate(results: ChunkClassification[]): ChunkClassification {
  return {
    recommendations: results.flatMap((r) => r.recommendations),
    linkMentions: results.flatMap((r) => r.linkMentions),
    questionCandidates: results.flatMap((r) => r.questionCandidates),
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const raw = readFileSync(args.input, 'utf8')

  // Stage 1: parse
  let messages: StructuredMessage[] = parseExport(raw)
  if (args.since) messages = messages.filter((m) => m.timestamp >= args.since!)
  if (args.limit) messages = messages.slice(0, args.limit)
  console.log(`Parsed ${messages.length} messages`)

  // Stage 1.5: anonymise. Name set = chat senders (+ DB members in a full run).
  const senders = Array.from(new Set(messages.map((m) => m.sender)))
  let extraNames: string[] = []
  let prisma: PrismaClient | null = null
  let suppliers: SupplierRef[] = []

  if (!args.dryRun) {
    prisma = new PrismaClient()
    const members = await prisma.member.findMany({ select: { firstName: true, lastName: true } })
    const supplierContacts = await prisma.supplier.findMany({ select: { contactName: true } })
    extraNames = [
      ...members.flatMap((m) => [m.firstName, m.lastName, `${m.firstName} ${m.lastName}`]),
      ...supplierContacts.map((s) => s.contactName ?? ''),
    ].filter(Boolean)
    suppliers = await prisma.supplier.findMany({ select: { id: true, companyName: true, slug: true } })
  }

  const nameSet = buildNameSet(senders, extraNames)
  const anonymised = anonymiseMessages(messages, nameSet)

  // Stage 2a/2b: chunk + classify
  const chunks = chunkMessages(anonymised)
  console.log(`Classifying ${chunks.length} chunks (${args.dryRun ? 'DRY RUN' : 'full'})…`)
  const classifications: ChunkClassification[] = []
  let failedChunks = 0
  for (let i = 0; i < chunks.length; i++) {
    try {
      classifications.push(await classifyChunk(chunks[i]))
    } catch (err) {
      failedChunks++
      console.warn(`  ! chunk ${i + 1} skipped (extraction error): ${(err as Error).message.split('\n')[0]}`)
    }
    if ((i + 1) % 10 === 0) console.log(`  …${i + 1}/${chunks.length} chunks ($${getSpend().toFixed(2)})`)
  }
  if (failedChunks > 0) console.log(`  (${failedChunks} chunk(s) skipped due to extraction errors)`)
  const agg = aggregate(classifications)
  console.log(
    `Extracted: ${agg.recommendations.length} recommendations, ${agg.linkMentions.length} links, ${agg.questionCandidates.length} question candidates`
  )

  // Stage 3: cluster questions
  const clusters = clusterQuestions(agg.questionCandidates)
  console.log(`Clustered into ${clusters.length} knowledge candidates`)

  if (args.dryRun) {
    console.log('\n=== DRY RUN OUTPUT (no DB writes) ===')
    console.log(
      JSON.stringify(
        {
          sampleRecommendations: agg.recommendations.slice(0, 10),
          sampleLinks: agg.linkMentions.slice(0, 10),
          sampleClusters: clusters.slice(0, 10).map((c) => ({ topic: c.topic, questions: c.questions.slice(0, 5) })),
        },
        null,
        2
      )
    )
    console.log(`\nEstimated spend so far: $${getSpend().toFixed(2)}`)
    return
  }

  // Stage 2c: synthesise answers (strong model) per cluster.
  const knowledge: PreparedKnowledge[] = []
  let synthDone = 0
  let synthFailed = 0
  for (const cluster of clusters) {
    if (cluster.questions.length === 0) continue
    let synth
    try {
      synth = await synthesiseCluster(cluster)
    } catch (err) {
      synthFailed++
      console.warn(`  ! cluster skipped (synthesis error): ${(err as Error).message.split('\n')[0]}`)
      continue
    }
    if ((++synthDone) % 25 === 0) console.log(`  …synthesised ${synthDone}/${clusters.length} ($${getSpend().toFixed(2)})`)
    if (synth.confidence < 0.4) continue // drop low-confidence entries
    // Post-filter: drop anything that still leaks PII.
    if (containsPII(synth.canonicalQuestion, nameSet) || containsPII(synth.synthesisedAnswer, nameSet)) {
      console.warn(`Dropped a synthesised entry that contained residual PII (topic: ${cluster.topic})`)
      continue
    }
    knowledge.push({
      question: scrubOutput(synth.canonicalQuestion, nameSet),
      answer: scrubOutput(synth.synthesisedAnswer, nameSet),
      slug: slugify(synth.canonicalQuestion),
      topicTags: synth.topicTags.map((t) => t.toLowerCase()).slice(0, 8),
      categorySlug: synth.categorySlug,
      sourceHash: clusterIdHash(cluster),
      sourceCount: cluster.sourceMessageHashes.length,
      confidence: synth.confidence,
    })
  }

  if (synthFailed > 0) console.log(`  (${synthFailed} cluster(s) skipped due to synthesis errors)`)

  // Prepare endorsements (match to existing suppliers; else unmatched mention).
  const endorsements: PreparedEndorsement[] = agg.recommendations
    .filter((r) => !containsPII(r.quoteSnippet, nameSet))
    .map((r) => ({
      supplierId: matchSupplier(r.rawSupplierName, suppliers),
      rawSupplierName: r.rawSupplierName.slice(0, 200),
      category: r.category as SupplierCategory,
      quoteSnippet: scrubOutput(r.quoteSnippet, nameSet),
      sentiment: r.sentiment,
      sourceMessageHash: r.sourceMessageHashes[0] ?? clusterIdHash({ topic: r.rawSupplierName, questions: [], sourceMessageHashes: r.sourceMessageHashes }),
    }))

  // Prepare links (canonicalise + dedup within batch).
  const seenUrls = new Set<string>()
  const links: PreparedLink[] = []
  for (const l of agg.linkMentions) {
    const url = canonicaliseUrl(l.url)
    if (!/^https?:\/\//.test(url) || seenUrls.has(url)) continue
    seenUrls.add(url)
    links.push({ url, title: l.contextTitle, description: l.contextTitle, tags: [l.suggestedCategorySlug] })
  }

  // Stage 4: persist
  const ctx = await loadPersistContext(prisma!)
  const k = await persistKnowledge(prisma!, ctx, knowledge)
  const e = await persistEndorsements(prisma!, endorsements)
  const ln = await persistLinks(prisma!, ctx, links)

  console.log('\n=== IMPORT COMPLETE ===')
  console.log(`Knowledge entries:   ${k.created} created, ${k.updated} updated`)
  console.log(`Endorsements:        ${e.created} created, ${e.skipped} skipped (dupes)`)
  console.log(`Links:               ${ln.created} created, ${ln.skipped} skipped (dupes)`)
  console.log(`Estimated spend:     $${getSpend().toFixed(2)}`)
  console.log('All imported records are UNPUBLISHED — review and publish in the admin area.')

  await prisma!.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
