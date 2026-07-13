---
type: source
title: Kindred Collective PRD — Website Rebuild (v1.0)
description: Product requirements for the kindredcollective.co.uk rebuild — users, features, metrics
tags: [product, platform, strategy]
updated: 2026-07-05
sources: [raw/kindred-collective-prd.md]
---

# Kindred Collective PRD — Website Rebuild (v1.0)

**What this is:** the Product Requirements Document (January 2026, authored by Tim of [[avallen-solutions]]) for the complete rebuild of kindredcollective.co.uk, "The Independent Drinks Ecosystem".

## Summary

[[kindred-collective]] is positioned as the UK's leading marketplace connecting independent drinks brands with suppliers, manufacturers and service providers. The rebuild supports two user types — **Brands** (spirits, beer, wine, RTD, [[no-lo-alcohol]]) and **Suppliers** (packaging, ingredients, logistics, co-packing, creative) — plus admin. Mission: "empower independent drinks makers with the tools, connections, and resources they need to build exceptional products and thriving businesses."

## Core features (by priority)

- **[[supplier-marketplace]]** (P0): searchable, filterable directory with AI-powered natural-language search ("organic agave suppliers with low MOQs"), verified badges, favourites; RFP system at P2.
- **Brand directory** (P0): rich profiles, category filters, team member links.
- **Discounts & offers hub** (P0): member-exclusive supplier deals with claim tracking.
- **Events & meetups** (P0): listings, RSVP, attendee visibility.
- **Member directory** (P0): profiles with WhatsApp/LinkedIn/email contact links — the platform's tie-in to the WhatsApp group behind the [[community-knowledge-base]].
- **Industry news feed** (P1): RSS aggregation with category filters including *regulations* — the feature this wiki's legislation stream ([[uk-drinks-legislation-and-tax]]) directly supports.
- **AI-powered search** (P0/P1): natural language, smart matching, recommendations.

## Technical and business notes

- Full migration of existing suppliers, brands, users, events, offers and media.
- Architecture targets 10,000+ profiles; AI/LLM API (OpenAI/Anthropic) for search.
- Success metrics: 5,000+ MAU within 6 months, 3,000+ verified suppliers, 1,000+ brands, 500+ monthly offer claims, AI search ≥30% of all searches.
- Neo-Brutalist design language: Space Grotesk + Inter, cyan #00D9FF / coral #FF5D5D / lime #CCFF00.

## Connections

- [[kindred-collective]] — the business and platform this PRD defines
- [[supplier-marketplace]] — the flagship feature
- [[community-knowledge-base]] — community knowledge features this wiki feeds
- [[no-lo-alcohol]] — a first-class brand category in the PRD
- [[uk-drinks-legislation-and-tax]] — the news feed's "regulations" filter is served by this theme
