# WhatsApp exports go here

Drop Kindred Collective WhatsApp group exports into this folder, then ask Claude to ingest.

**How to export from WhatsApp:** open the group → ⋮ menu → More → Export chat → *Without media* → save/share the resulting `.txt` (it will be named like `WhatsApp Chat with Kindred Collective.txt`, or arrive zipped — either is fine to drop here).

**Naming:** keep one file per export, ideally suffixed with the export date, e.g. `kindred-group-2026-07-05.txt`. Later exports overlap earlier ones — the ingest workflow dedupes by message timestamp+author, so overlapping exports are safe.

**Privacy:** raw exports contain real names and phone numbers. This folder is the immutable raw layer and keeps them as-is, but nothing personal may cross into `wiki/` — see the anonymisation rules in `llm-wiki/CLAUDE.md`. If this repo ever becomes public, this folder must be gitignored first.
