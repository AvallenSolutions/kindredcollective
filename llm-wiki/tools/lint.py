#!/usr/bin/env python3
"""Structural lint for the LLM wiki. Run from anywhere: python3 tools/lint.py

Checks:
  1. every [[wikilink]] in wiki/ resolves to an existing wiki page
  2. no orphan pages (every page reachable via at least one inbound link or the index)
  3. every page is listed in wiki/index.md
  4. every page has complete frontmatter (type, title, description, updated)
  5. filenames are unique across the vault (Obsidian resolves links by basename)

Exit code 0 = healthy, 1 = problems found.
"""
import re
import sys
from pathlib import Path

VAULT = Path(__file__).resolve().parent.parent
WIKI = VAULT / "wiki"
SPECIAL = {"index", "log"}
REQUIRED_FRONTMATTER = ("type", "title", "description", "updated")
WIKILINK = re.compile(r"\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]")


def main():
    problems = []
    pages = {p.stem: p for p in WIKI.rglob("*.md")}

    # 5. basename uniqueness across the whole vault
    seen = {}
    for p in VAULT.rglob("*.md"):
        if p.stem in seen and (p.stem in pages or seen[p.stem] in pages.values()):
            problems.append(f"duplicate basename '{p.stem}': {seen[p.stem].relative_to(VAULT)} and {p.relative_to(VAULT)}")
        seen.setdefault(p.stem, p)

    index_text = (WIKI / "index.md").read_text() if (WIKI / "index.md").exists() else ""
    inbound = set()

    for stem, path in sorted(pages.items()):
        text = path.read_text()
        # wikilinks inside code fences or inline code are examples, not links
        text = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
        text = re.sub(r"`[^`\n]*`", "", text)
        rel = path.relative_to(VAULT)

        # 1. links resolve
        for target in WIKILINK.findall(text):
            target = target.strip()
            if target not in pages:
                problems.append(f"{rel}: broken link [[{target}]]")
            elif stem != target:
                inbound.add(target)

        if stem in SPECIAL:
            continue

        # 3. indexed
        if f"[[{stem}]]" not in index_text:
            problems.append(f"{rel}: not listed in wiki/index.md")

        # 4. frontmatter
        m = re.match(r"\A---\n(.*?)\n---\n", text, re.DOTALL)
        if not m:
            problems.append(f"{rel}: missing frontmatter block")
        else:
            for key in REQUIRED_FRONTMATTER:
                if not re.search(rf"^{key}:\s*\S", m.group(1), re.MULTILINE):
                    problems.append(f"{rel}: frontmatter missing '{key}'")

    # 2. orphans (index counts as inbound; log does not)
    log_stems = {s for s in pages if s in SPECIAL}
    for stem, path in sorted(pages.items()):
        if stem in SPECIAL:
            continue
        if stem not in inbound:
            problems.append(f"{path.relative_to(VAULT)}: orphan (no inbound links, not in index)")

    n_pages = len(pages) - len(log_stems)
    if problems:
        print(f"LINT: {len(problems)} problem(s) across {n_pages} pages\n")
        for p in problems:
            print(f"  - {p}")
        return 1
    print(f"LINT: healthy — {n_pages} pages, all links resolve, all indexed, no orphans")
    return 0


if __name__ == "__main__":
    sys.exit(main())
