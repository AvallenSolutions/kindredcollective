# Kindred Collective LLM Wiki — Schema

You are the maintainer of this wiki. It is a persistent, compounding knowledge base of
**Kindred Collective business knowledge** — the UK independent drinks ecosystem — built from
two source streams:

1. **The Kindred Collective WhatsApp group** (the main stream): member questions, answers,
   recommendations and discussions.
2. **Industry news from the wider internet**: UK legislation, tax/duty, packaging regulation,
   and business topics affecting independent drinks brands and their suppliers.

The pattern is Karpathy's LLM wiki (see `raw/llm-wiki-idea.md`): humans curate sources and ask
questions; you do all the writing, cross-referencing and bookkeeping. Obsidian is the front end —
the vault root is this folder (`llm-wiki/`).

## The three layers

- **`raw/`** — immutable source documents. Read them; NEVER modify or delete them.
  WhatsApp exports live in `raw/whatsapp/`.
- **`wiki/`** — markdown pages you own entirely. Create, update, refactor freely.
- **`CLAUDE.md`** (this file) — the schema. Co-evolves with the wiki: when the user corrects
  a convention, update this file so the correction sticks.

## Wiki layout

```
wiki/
├── index.md        # catalog of every page, grouped by category — update on EVERY ingest
├── log.md          # append-only operations record — append on EVERY operation
├── sources/        # one summary page per ingested source
├── entities/       # organisations, regulators, tools, suppliers, venues
├── concepts/       # ideas, regulations, techniques synthesised ACROSS sources
└── topics/         # hub pages that route a whole theme (e.g. legislation & tax)
```

Keep the structure this flat. Do not add subfolders until a category exceeds ~40 pages and a
natural split is obvious — flat is easier for both AI search and human browsing.

## Page conventions

- **Filenames**: kebab-case, unique across the whole vault (Obsidian resolves `[[wikilinks]]`
  by filename, ignoring folders). E.g. `alcohol-duty.md`, `kindred-collective.md`.
- **Frontmatter** (every page):

  ```yaml
  ---
  type: source | entity | concept | topic
  title: Human Readable Title
  description: One line, used verbatim in index.md
  tags: [tax, packaging, whatsapp, ...]
  updated: YYYY-MM-DD
  sources: [raw/filename.md, https://...]
  ---
  ```

- **Linking**: Obsidian-style `[[wikilinks]]` (filename without folder or `.md`). Every page
  must link to at least one other page, and after each ingest every new page must be reachable
  from `index.md`. Link entities and concepts on first mention in a page, not every mention.
- **Body shape**: a `#` title, a short "What this is" opening, then sections as the content
  demands. Source pages end with a **Connections** section listing the entity/concept pages
  they feed. Keep pages meaty — merge a stub into its parent rather than leaving a 3-line page.

## Operations

### Ingest

Trigger: a new file appears in `raw/` or the user gives a URL.

1. Read the source in full. For URLs, first save a captured copy into `raw/` with a header
   noting origin URL and capture date (raw stays self-contained even if links die).
2. Write one summary page in `wiki/sources/`.
3. Split the substance into entity/concept pages: update existing pages where the subject
   already exists (never fork a duplicate), create new ones where warranted. A typical source
   touches 5–15 pages. **Always look for cross-source connections** — where a new source
   confirms, contradicts or extends an existing page, say so explicitly on that page with
   both sources cited. Contradictions are flagged, not silently overwritten.
4. Update `index.md` (add new pages, revise descriptions that changed).
5. Append a `log.md` entry.
6. Run the lint tool: `python3 tools/lint.py` — fix anything it reports before finishing.

### Ingest — WhatsApp exports (extra rules)

- **Anonymise.** Real names, phone numbers and personal details must never appear in `wiki/`.
  Refer to people as "a member", "a packaging supplier member", "the group admin", etc.
  Company names and public businesses ARE kept — they're the useful knowledge.
  (Same policy as `scripts/whatsapp-import/anonymise.ts` in the parent repo.)
- **Cluster by topic, not by message.** One wiki page per recurring theme (e.g. a concept page
  on contract bottling MOQs), never per message or per day. Q&A threads become concept pages;
  repeated supplier recommendations accrete onto that supplier's entity page.
- **Date-stamp claims.** Group chat knowledge goes stale — write "as discussed in the group
  (May 2026)" so later lint passes can spot superseded advice.
- **Dedupe across exports.** Later exports overlap earlier ones. Check `log.md` for the last
  ingested export's date range and only process newer messages.

### Query

1. Read `wiki/index.md` first and route from there — do not grep the whole vault as a first
   resort, and never answer from `raw/` when a wiki page covers it.
2. Read the relevant pages, follow `[[wikilinks]]` as needed, and answer **with page citations**.
3. If the answer required real synthesis (a comparison, an analysis, a discovered connection),
   file it back as a new wiki page and log it — explorations compound too.

### Lint

On request, or roughly every 5 ingests:

- Run `python3 tools/lint.py` (broken links, orphans, index/frontmatter gaps).
- Read for: contradictions between pages, stale claims superseded by newer sources
  (duty rates and EPR fees change at fiscal events — check `updated:` dates), concepts
  mentioned ≥3 times without their own page, and data gaps worth a web search.
- Log the pass and fix or report findings.

## log.md format

Append-only. Never edit or delete previous entries.

```
## [YYYY-MM-DD] ingest | Source Title
## [YYYY-MM-DD] query | Question asked
## [YYYY-MM-DD] lint | Findings summary
```

Under each heading: 1–5 bullet lines (pages created/updated, key connections found).
The prefix format is load-bearing: `grep "^## \[" wiki/log.md | tail -5` must always work.

## Style

- British English (this is a UK business).
- Factual and specific: keep real numbers (duty rates, thresholds, deadlines, MOQs) — they are
  the value. Always note the as-of date next to figures that change.
- No filler. A page that says nothing a reader couldn't guess should not exist.
