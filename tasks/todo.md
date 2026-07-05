# Todo: Build the Karpathy LLM Wiki (per Nate Herk video + Karpathy gist)

Branch: `claude/quirky-hopper-q6at5s`
References:
- Karpathy's gist: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
- Video: https://www.youtube.com/watch?v=hQvwMj7IJe4 (Nate Herk — Obsidian vault + Claude Code as wiki maintainer)

## Decisions (confirmed by user 2026-07-05)

- [x] **Vault location**: `llm-wiki/` at the repo root; user opens it as an Obsidian vault locally
- [x] **Sources**: WhatsApp group exports are the main stream (user will upload); plus industry
      news — UK legislation, tax, business
- [x] **Scope**: Kindred Collective business knowledge (WhatsApp group + wider internet)

## Phase 1 — Vault scaffold + schema

- [x] Create `llm-wiki/` with `raw/` (incl. `raw/whatsapp/` + export how-to README) and `wiki/`
- [x] Write `llm-wiki/CLAUDE.md` schema: page types + frontmatter, wikilink rules, near-flat
      folder conventions, ingest/query/lint workflows, WhatsApp anonymisation + dedupe rules,
      index/log formats, British English style
- [x] Create `wiki/index.md` and `wiki/log.md`
- [x] Ingest Karpathy's gist (verbatim raw capture + source page)

## Phase 2 — First real ingests

- [x] PRD: extracted `Kindred-Collective-PRD.docx` → `raw/`, ingested into 5 pages
      (source, Kindred Collective, Avallen Solutions, supplier marketplace, community knowledge base)
- [x] Industry news #1: gov.uk alcohol duty rates → alcohol-duty concept, HMRC entity
- [x] Industry news #2: gov.uk packaging EPR guidance → EPR concept, Defra entity
- [x] Cross-source connection pages: no-lo-alcohol (PRD × duty bands),
      EPR × supplier marketplace, uk-drinks-legislation-and-tax topic hub with gap wish-list
- [x] index.md + log.md updated for every ingest

## Phase 3 — Verification

- [x] `llm-wiki/tools/lint.py` written and green: 15 pages, all wikilinks resolve, no orphans,
      all indexed, frontmatter complete (also caught+fixed a false positive on code-span links)
- [x] `grep "^## \[" wiki/log.md | tail -5` parses correctly
- [x] Query test: fresh-context agent, index-first routing, answered a cross-source question
      (0.5% ABV beer in glass at £1.5m turnover) citing 6 wiki pages; gaps matched the wish-list
- [x] Answer filed back as [[no-lo-launch-compliance]] — full ingest→query→compound loop shown
- [ ] User-side: open `llm-wiki/` as an Obsidian vault, confirm graph view (needs local Obsidian)

## Phase 4 — Ongoing workflow

- [x] "Add a source" runbooks documented in `llm-wiki/CLAUDE.md` (files + URLs + WhatsApp)
- [x] Lint cadence documented (every ~5 ingests); root `CLAUDE.md` routes business questions
      to the wiki index; `.obsidian/` gitignored
- [ ] First WhatsApp export ingest (blocked on user upload to `llm-wiki/raw/whatsapp/`)
- [ ] Optional stretch: single-file HTML visual explorer of the wiki graph

## Review

### What was built
A working Karpathy-pattern LLM wiki at `llm-wiki/`: immutable `raw/` layer (gist, PRD text,
two gov.uk captures, WhatsApp drop-folder), Claude-owned `wiki/` layer (15 pages: 5 sources,
4 entities, 6 concepts incl. one filed query answer, 1 topic hub, index, log), a vault-local
`CLAUDE.md` schema (ingest/query/lint, WhatsApp anonymisation), and `tools/lint.py`.

### Verification done
Lint green (all links resolve, no orphans, all indexed, frontmatter complete). Independent
fresh-context query agent successfully routed via the index and synthesised a correct
cross-source answer with citations; its identified gaps exactly matched the wiki's own
self-flagged gaps. Log format greps cleanly.

### Deliberate choices
- Wiki filenames kept globally unique (Obsidian resolves links by basename, ignoring folders).
- Raw WhatsApp exports will be committed (private repo; needed for cross-session durability) —
  but wiki pages are anonymised, and `raw/whatsapp/README.md` flags gitignoring if ever public.
- gov.uk figures are date-stamped everywhere; lint workflow prompts re-capture after Budgets.

### Next
User drops a WhatsApp export into `llm-wiki/raw/whatsapp/` and says "ingest" — the schema's
WhatsApp rules (anonymise, cluster by topic, date-stamp, dedupe) take it from there.
