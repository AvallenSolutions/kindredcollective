---
type: source
title: The LLM Wiki Pattern (Karpathy)
description: The founding idea file — how an LLM incrementally builds and maintains this wiki
tags: [meta, methodology]
updated: 2026-07-05
sources: [raw/llm-wiki-idea.md, "https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f"]
---

# The LLM Wiki Pattern (Karpathy)

**What this is:** Andrej Karpathy's idea file describing the pattern this vault implements — the bootstrap source for the wiki itself.

## Summary

Instead of RAG (re-deriving answers from raw documents on every query), the LLM **incrementally builds and maintains a persistent wiki**: a structured, interlinked set of markdown files sitting between the human and the raw sources. Knowledge is compiled once and kept current — cross-references already exist, contradictions are already flagged, and the synthesis compounds with every source added and every question asked.

Three layers: immutable **raw sources**, an LLM-owned **wiki** of markdown pages, and a **schema** file (`CLAUDE.md`) that makes the LLM a disciplined maintainer rather than a generic chatbot. Three operations: **ingest** (a source touches 10–15 pages in one pass), **query** (index-first routing, answers cited, good answers filed back as pages), and **lint** (health checks for contradictions, stale claims, orphans, gaps).

## Key takeaways applied here

- "The tedious part of maintaining a knowledge base is not the reading or the thinking — it's the bookkeeping." Humans abandon wikis because maintenance grows faster than value; LLMs make maintenance near-free.
- Division of labour: the human curates sources and asks questions; the LLM writes everything.
- `index.md` (content catalog) plus `log.md` (append-only timeline) outperform embedding infrastructure at moderate scale.
- Obsidian is the IDE; the LLM is the programmer; the wiki is the codebase.
- The business/team variant — a wiki fed by chat threads and documents — is exactly this vault's use case for [[kindred-collective]]: the WhatsApp group is the chat stream, and the [[community-knowledge-base]] concept describes how that knowledge is captured.

## Connections

- [[community-knowledge-base]] — Kindred's own version of turning community chatter into durable knowledge
- [[kindred-collective]] — the business this wiki serves
