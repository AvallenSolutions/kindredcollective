# Todo: WhatsApp Mining → Website Tools

Plan: `/root/.claude/plans/root-claude-uploads-4faf6148-7b2c-5372-stateless-frog.md`
Branch: `claude/hopeful-meitner-am26gf`

## Phase 0 — Pipeline + schema (foundation)
- [ ] Add `@anthropic-ai/sdk` dep + `import:whatsapp` script to package.json
- [ ] Exclude `scripts/` from app tsconfig; add `scripts/**` to vitest include
- [ ] Prisma schema: `KnowledgeCategory`, `KnowledgeEntry`, `SupplierEndorsement`, `KnowledgeStatus` enum, `Supplier.endorsements` back-relation
- [ ] `scripts/whatsapp-import/`: types, config, parse, anonymise, chunk, anthropic, classify, synthesise, normalise, persist, index
- [ ] `prisma/seed-knowledge.ts` (system User + KnowledgeCategory + "Community Links" ResourceCategory)
- [ ] Unit tests: parse, anonymise, normalise (+ idempotency persist test)
- [ ] gitignore the AI disk cache

## Phase 1 — "Ask the Collective" Knowledge Base
- [ ] `/api/knowledge` route (mirror suppliers route)
- [ ] `/knowledge` public list page
- [ ] `/knowledge/[slug]` detail page (JSON-LD, helpful control)
- [ ] `/api/knowledge/[slug]/helpful` POST
- [ ] `KnowledgeCard` component + nav link

## Phase 2 — Community Recommendations
- [ ] Extend `/api/suppliers` select with endorsement count
- [ ] `community-endorsements.tsx` + supplier card badge + detail section

## Phase 3 — Resource / link library
- [ ] Extract `resource-card.tsx`; imported links surface in existing resources page

## Verification
- [ ] `npm test` green (parse/anonymise/normalise/idempotency)
- [ ] `npx tsc --noEmit` / `next build` clean
- [ ] `--dry-run` writes nothing; manual QA checklist

## Review

### What was built
**Phase 0 — repeatable mining pipeline + schema**
- `scripts/whatsapp-import/`: parse → anonymise → chunk → classify (Haiku) → cluster → synthesise (Opus) → normalise → persist. CLI with `--input/--dry-run/--limit/--since`. Idempotent (deterministic message hashes; upsert-by-sourceHash; convergent counts). Disk cache + `MAX_SPEND_USD` guard.
- Schema (additive): `KnowledgeCategory`, `KnowledgeEntry`, `SupplierEndorsement`, `KnowledgeStatus` enum, `Supplier.endorsements` back-relation. `@anthropic-ai/sdk` added; `prisma/seed-knowledge.ts` seeds system user + categories. `scripts/` excluded from app tsc; pipeline tests added to vitest.

**Phase 1 — "Ask the Collective" knowledge base (public)**
- `/api/knowledge` + `/api/knowledge/[slug]/helpful`; public `/knowledge` list and `/knowledge/[slug]` detail (JSON-LD QAPage, SEO metadata, helpful counter). Placed under `(marketing)` so it's public (not auth-gated). `KnowledgeCard` + `HelpfulButton` + nav link.

**Phase 2 — community recommendations**
- `/api/suppliers` returns published `mentionCount` (bounded extra query, not a fragile join). `SupplierCard` badge + `CommunityEndorsements` section on supplier detail.

**Phase 3 — link library**
- Imported `LINK` resources surface automatically in the existing `/community/resources` page via the seeded "Community Links" category (no new route). Card-extraction refactor intentionally skipped (no behaviour change).

### Verification done
- 16 pipeline unit tests (parse/anonymise/normalise) + full suite **52/52 pass**.
- `tsc --noEmit`: **no new errors** (one pre-existing error in `onboarding-page.test.tsx`, unrelated).
- ESLint clean on new files.
- Offline stages run on the **real archive**: 38,967 messages parsed, 243 chunks, **0 messages still flagged with PII** after anonymisation (names→[member], company names preserved).

### Follow-ups for the deploying environment (need DB/API key — not available here)
- Run `npx prisma migrate dev --name add_knowledge_and_endorsements` (additive) then `npm run seed:knowledge`.
- Set `ANTHROPIC_API_KEY`, then `npm run import:whatsapp -- --dry-run --limit 50 --input <file>` to sanity-check before the full run.
- Imported records default UNPUBLISHED — review & publish in admin before they appear publicly.
