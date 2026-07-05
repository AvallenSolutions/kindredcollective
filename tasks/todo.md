# Todo: Build the Karpathy LLM Wiki (per Nate Herk video + Karpathy gist)

Branch: `claude/quirky-hopper-q6at5s`
References:
- Karpathy's gist: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
- Video: https://www.youtube.com/watch?v=hQvwMj7IJe4 (Nate Herk — Obsidian vault + Claude Code as wiki maintainer)

## What we're building

A self-maintaining knowledge base with three layers:
1. **`raw/`** — immutable source documents (PDFs, transcripts, articles). Claude reads, never edits.
2. **`wiki/`** — Claude-owned markdown pages: one summary page per source, plus entity/concept
   pages synthesised *across* sources, all cross-linked with `[[wikilinks]]`, catalogued in
   `index.md`, with every operation appended to `log.md`.
3. **Schema (`CLAUDE.md` in the vault)** — the rules that turn Claude into a disciplined wiki
   maintainer: page types, frontmatter, naming, and the ingest / query / lint workflows.

Obsidian is the front end (graph view + backlinks); the vault is just a folder of markdown,
so it stays tool-agnostic.

## Decisions (confirm before build)

- [ ] **Vault location**: proposed `llm-wiki/` at the repo root (version-controlled; user opens
      that folder as an Obsidian vault locally after pulling). Alternative: standalone desktop
      vault as in the video — but then it can't be built from this session.
- [ ] **First ingest sources**: proposed (a) `Kindred-Collective-PRD.docx` already in the repo,
      (b) one URL article of the user's choice — mirroring the video's PDF + URL demo.
- [ ] **Wiki topic/scope**: Kindred Collective business knowledge (PRD, plans, articles) vs.
      general research topics. Structure conventions depend on this.

## Phase 1 — Vault scaffold + schema

- [ ] Create `llm-wiki/` with `raw/` and `wiki/` folders
- [ ] Write `llm-wiki/CLAUDE.md` schema:
  - Page types: `summary` (one per source), `entity` (people/orgs/products/tools),
    `concept` (cross-source ideas/techniques), `overview`
  - YAML frontmatter: `type, title, description, tags, timestamp, sources`
  - Cross-linking: Obsidian `[[wikilinks]]`; every page must have inbound + outbound links
  - Naming: kebab-case filenames; folders `wiki/sources/`, `wiki/entities/`, `wiki/concepts/`
    (start near-flat; let structure evolve as data demands — per the video, flat beats deep
    until the content justifies subfolders)
  - Workflows: **ingest** (read raw → summary page → split into 5–15 entity/concept pages →
    cross-link → update index → append log), **query** (index-first routing, cite pages,
    file high-value answers back as pages), **lint** (contradictions, orphans, stale claims,
    missing links)
- [ ] Create `wiki/index.md` (content-oriented catalog, one line + link per page, grouped by category)
- [ ] Create `wiki/log.md` (append-only, `## [YYYY-MM-DD] <operation> | <title>` format)
- [ ] Ingest Karpathy's gist itself as the first raw doc (as the video does) — proves the loop works

## Phase 2 — First real ingests (PDF/docx + URL, as demonstrated)

- [ ] Convert/copy `Kindred-Collective-PRD.docx` into `llm-wiki/raw/` and ingest it:
      summary page + entity pages (Kindred Collective, suppliers, members…) + concept pages
      (community knowledge base, endorsements…), all cross-linked
- [ ] Ingest one URL article (user to supply, or default to a relevant industry article)
- [ ] Update `index.md` + `log.md` for both ingests

## Phase 3 — Verification (CLAUDE.md rule 4)

- [ ] Every `[[wikilink]]` resolves to an existing page (scripted check, no orphan links)
- [ ] Every wiki page appears in `index.md`; every operation has a `log.md` entry
- [ ] Cross-source connection exists (a page linking both sources — the "worth having a wiki" test)
- [ ] Query test: ask a question answerable only by combining sources; answer must cite wiki pages
- [ ] User-side: open `llm-wiki/` as an Obsidian vault, confirm graph view shows the connected map

## Phase 4 — Ongoing workflow (documented in the vault CLAUDE.md)

- [ ] "Add a source" runbook: drop file in `raw/` (or paste URL) → prompt "ingest" → review
- [ ] Periodic lint sweep instruction
- [ ] Optional stretch: single-file HTML visual explorer of the wiki graph (like the video's
      beginner-friendly clickable map)

## Review

_(to be filled in after implementation)_
