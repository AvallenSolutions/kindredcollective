# Log — Kindred Collective LLM Wiki

Append-only. Entry prefix format: `## [YYYY-MM-DD] operation | Title`
(`grep "^## \[" wiki/log.md | tail -5` shows recent activity.)

## [2026-07-05] setup | Wiki initialised

- Vault created at `llm-wiki/` per Karpathy's LLM wiki pattern (schema in `CLAUDE.md`)
- Layout: `raw/` (immutable sources, `raw/whatsapp/` for group exports) + `wiki/` (sources/entities/concepts/topics) + this log + the index
- Scope set: Kindred Collective business knowledge from the WhatsApp group and industry news (legislation, tax, business)

## [2026-07-05] ingest | LLM Wiki idea file (Karpathy gist)

- Raw: `raw/llm-wiki-idea.md` (verbatim gist capture)
- Created: [[llm-wiki-pattern]]; linked into [[community-knowledge-base]]

## [2026-07-05] ingest | Kindred Collective PRD v1.0 (website rebuild)

- Raw: `raw/kindred-collective-prd.md` (text extracted from `Kindred-Collective-PRD.docx` at repo root)
- Created: [[prd-website-rebuild]], [[kindred-collective]], [[avallen-solutions]], [[supplier-marketplace]], [[community-knowledge-base]]
- Key routing: PRD's industry news feed has a "regulations" filter → linked to [[uk-drinks-legislation-and-tax]]

## [2026-07-05] ingest | UK Alcohol Duty Rates (gov.uk)

- Raw: `raw/uk-alcohol-duty-rates-2026.md` (captured from gov.uk, rates as of 1 Feb 2026)
- Created: [[gov-uk-alcohol-duty-rates]], [[alcohol-duty]], [[hmrc]], [[uk-drinks-legislation-and-tax]]
- Cross-source connection: duty's £0 / £9.96 low-ABV bands × PRD's No/Lo brand category → [[no-lo-alcohol]]

## [2026-07-05] ingest | UK Packaging EPR guidance (gov.uk)

- Raw: `raw/uk-packaging-epr-guidance.md` (captured from gov.uk)
- Created: [[gov-uk-packaging-epr]], [[extended-producer-responsibility]], [[defra]]
- Cross-source connections: "own-brand packaged goods" qualifying activity applies to every Kindred brand member; fee modulation makes recyclability a [[supplier-marketplace]] selection criterion
- Flag: final modulated fees pending from Defra — re-capture when published

## [2026-07-05] lint | Initial pass

- `tools/lint.py`: all wikilinks resolve, no orphan pages, all pages indexed, frontmatter complete
- Data gaps recorded as source wish-list in [[uk-drinks-legislation-and-tax]] (DRS, licensing, labelling, advertising codes, producer approvals)

## [2026-07-05] query | 0.5% ABV beer in glass at £1.5m turnover — tax & packaging implications

- Verification query run by a fresh-context agent following the schema's query workflow
- Routing: index → [[uk-drinks-legislation-and-tax]] → [[alcohol-duty]], [[no-lo-alcohol]], [[extended-producer-responsibility]] → source pages for exact figures; index alone was sufficient to route
- Answer filed back as [[no-lo-launch-compliance]]; gaps confirmed as already on the wish-list (labelling descriptors, DRS)

## [2026-07-13] ingest | WhatsApp archives — Kindred Spirits (2018–2025) + KC General (2025–2026)

- Raw: `raw/whatsapp/kindred-spirits-2018-05-to-2025-04.txt` (~37,500 msgs) and `raw/whatsapp/kc-general-2025-03-to-2026-06.txt` (~6,000 msgs)
- Method: 16 chunked extraction passes (date-aligned, ~410KB each), anonymised at extraction (members → roles; company names kept; sensitive personal matters omitted), then synthesised
- Created 14 pages: sources [[whatsapp-kindred-spirits]], [[whatsapp-kc-general]]; hub [[supplier-intelligence]]; concepts [[glass-supply]], [[fulfilment-and-3pl]], [[rtd-canning]], [[route-to-market]], [[scam-warnings]], [[hmrc-compliance]], [[deposit-return-scheme]], [[finance-and-ops-benchmarks]]; entities [[albatrans]], [[law-distribution]], [[enotria]]
- Updated 7 pages: [[alcohol-duty]] (community timeline; Feb 2026 rates corroborate gov.uk capture), [[extended-producer-responsibility]] (glass-tonnage analysis VALIDATED by members; passthrough disputes), [[uk-drinks-legislation-and-tax]] (DRS + licensing gaps now covered), [[kindred-collective]] (full 2018→2026 history), [[avallen-solutions]], [[community-knowledge-base]] (status: ingest complete), [[supplier-marketplace]]
- Coverage boundary: nothing after 2026-06-08 — future exports dedupe from there

## [2026-07-13] ingest | DHSC no/lo labelling consultation (gov.uk)

- Raw: `raw/uk-no-lo-labelling-consultation.md` (captured from gov.uk)
- Created: [[gov-uk-no-lo-labelling]]; resolved the wiki's longest-standing gap — "alcohol-free" is ≤0.05% ABV only; 0.5% products label "de-alcoholised"/"low alcohol"; 0.5%-threshold reform stalled at the 2024 election
- Updated: [[no-lo-alcohol]] (tax/labelling mismatch section), [[no-lo-launch-compliance]] (unknown → answered), [[uk-drinks-legislation-and-tax]]
- Watch: promised DHSC re-consultation (2025+) — relabelling opportunity if 0.5% lands

## [2026-07-13] ingest | Scotland Minimum Unit Pricing (gov.scot)

- Raw: `raw/scotland-minimum-unit-pricing.md` (captured from gov.scot)
- Created: [[gov-scot-minimum-unit-pricing]], [[minimum-unit-pricing]] (incl. Wales 50p, promo-floor analysis)
- Cross-source connection: archive members' Feb 2024 "~30% rise" expectation matches the confirmed 50p→65p change exactly
- Updated: [[uk-drinks-legislation-and-tax]] (gap closed; wish-list now DRS SIs, DHSC re-consultation, EPR final fees)
