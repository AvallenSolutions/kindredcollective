---
type: concept
title: Supplier Marketplace
description: Kindred's flagship feature — searchable directory of verified drinks-industry suppliers
tags: [product, platform, suppliers]
updated: 2026-07-05
sources: [raw/kindred-collective-prd.md, raw/uk-packaging-epr-guidance.md]
---

# Supplier Marketplace

**What this is:** the flagship feature of [[kindred-collective]] — a searchable directory of verified suppliers serving independent drinks brands, defined in [[prd-website-rebuild]].

## Shape of the marketplace

- **Categories:** Packaging, Ingredients, Logistics, Co-Packing, Creative.
- **Supplier profiles** carry capabilities, service regions, MOQ, certifications (Organic, B-Corp, Plastic-Free, Fair Trade), a verification badge, and active member offers.
- **Search** is P0 in two forms: full-text with filters (category, location, MOQ, certifications) and AI natural-language search ("organic agave suppliers with low MOQs"), with an RFP system planned at P2.

## Regulation is becoming a search criterion

[[extended-producer-responsibility]] makes packaging recyclability a fee-modulated cost for brands, so "which packaging supplier" is now partly a compliance question. Marketplace signals that answer it — recyclability credentials, material data, Plastic-Free certification — are worth treating as first-class profile fields, not marketing garnish. Expect the same pattern from future regulation (e.g. deposit return schemes) — see [[uk-drinks-legislation-and-tax]].

## Community as the trust layer

Supplier discovery already happens informally in the WhatsApp group — recommendations, warnings, "who did your labels?" threads. The [[community-knowledge-base]] captures that stream; repeated member endorsements should accrete onto supplier entity pages here, giving the marketplace's verified badges a community-evidence counterpart. (The parent repo already mines endorsements from WhatsApp into the website — `scripts/whatsapp-import/`.)

## Connections

- [[prd-website-rebuild]] — feature definition
- [[extended-producer-responsibility]] — compliance pressure on packaging choice
- [[community-knowledge-base]] — informal recommendation stream
- [[kindred-collective]] — the platform
