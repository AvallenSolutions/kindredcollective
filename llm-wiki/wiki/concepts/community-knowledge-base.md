---
type: concept
title: Community Knowledge Base
description: Turning the Kindred WhatsApp group's accumulated Q&A into durable, searchable knowledge
tags: [community, whatsapp, methodology]
updated: 2026-07-05
sources: [raw/kindred-collective-prd.md, raw/llm-wiki-idea.md]
---

# Community Knowledge Base

**What this is:** the idea that the [[kindred-collective]] WhatsApp group — hundreds of members answering each other's questions about suppliers, regulation, tax and running a drinks business — is a knowledge asset, and the mechanisms for capturing it.

## The problem

Group-chat knowledge is high-value and unretrievable: the same questions ("who does short-run canning?", "do I need to register for EPR?") get re-asked and re-answered because chat history doesn't accumulate into anything. This is exactly the failure mode Karpathy's [[llm-wiki-pattern]] addresses — knowledge re-derived on every query instead of compiled once and kept current.

## Two capture mechanisms

1. **This wiki** — WhatsApp exports dropped into `raw/whatsapp/` are ingested topic-by-topic: Q&A threads become concept pages, repeated supplier recommendations accrete onto entity pages, and regulation discussions link into [[uk-drinks-legislation-and-tax]]. Anonymisation rules in the vault schema keep member identities out of the wiki.
2. **The website pipeline** — the parent repo's `scripts/whatsapp-import/` already mines the same archive into public-facing features: an "Ask the Collective" knowledge base, community supplier endorsements, and a link library. The PRD's member directory (with WhatsApp contact links) is the platform end of the same loop.

The two are complementary: the wiki is the internal, connected, queryable brain; the pipeline extracts polished public artefacts. Both depend on the same raw exports.

## Status

Awaiting the first WhatsApp export ingest (see `raw/whatsapp/README.md` for the export procedure). This page should be substantially rewritten after that ingest, with links to the topic pages it produces.

## Connections

- [[llm-wiki-pattern]] — the methodology this applies
- [[kindred-collective]] — whose community this is
- [[supplier-marketplace]] — where community recommendations meet the product
- [[prd-website-rebuild]] — member directory and platform tie-ins
