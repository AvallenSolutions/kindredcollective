import fs from 'fs'
import path from 'path'

const WIKI_DIR = path.join(process.cwd(), 'llm-wiki', 'wiki')

export interface WikiPage {
  slug: string
  type: 'source' | 'entity' | 'concept' | 'topic'
  title: string
  description: string
  tags: string[]
  updated: string
  sources: string[]
  body: string
}

function parseFrontmatter(content: string): { meta: Record<string, unknown>; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) return { meta: {}, body: content }

  const meta: Record<string, unknown> = {}
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const val = line.slice(colonIdx + 1).trim()
    if (!key) continue
    if (val.startsWith('[') && val.endsWith(']')) {
      meta[key] = val
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    } else {
      meta[key] = val
    }
  }

  return { meta, body: match[2] }
}

const SUBDIRS = ['topics', 'concepts', 'entities', 'sources'] as const

export function getAllWikiPages(): WikiPage[] {
  const pages: WikiPage[] = []

  for (const subdir of SUBDIRS) {
    const dir = path.join(WIKI_DIR, subdir)
    if (!fs.existsSync(dir)) continue
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.md')) continue
      const content = fs.readFileSync(path.join(dir, file), 'utf-8')
      const { meta, body } = parseFrontmatter(content)
      pages.push({
        slug: file.replace(/\.md$/, ''),
        type: (meta.type as WikiPage['type']) || 'concept',
        title: (meta.title as string) || file.replace(/\.md$/, '').replace(/-/g, ' '),
        description: (meta.description as string) || '',
        tags: Array.isArray(meta.tags) ? (meta.tags as string[]) : [],
        updated: (meta.updated as string) || '',
        sources: Array.isArray(meta.sources) ? (meta.sources as string[]) : [],
        body,
      })
    }
  }

  return pages.sort((a, b) => a.title.localeCompare(b.title))
}

export function getWikiPage(slug: string): WikiPage | null {
  for (const subdir of SUBDIRS) {
    const filePath = path.join(WIKI_DIR, subdir, `${slug}.md`)
    if (!fs.existsSync(filePath)) continue
    const content = fs.readFileSync(filePath, 'utf-8')
    const { meta, body } = parseFrontmatter(content)
    return {
      slug,
      type: (meta.type as WikiPage['type']) || 'concept',
      title: (meta.title as string) || slug.replace(/-/g, ' '),
      description: (meta.description as string) || '',
      tags: Array.isArray(meta.tags) ? (meta.tags as string[]) : [],
      updated: (meta.updated as string) || '',
      sources: Array.isArray(meta.sources) ? (meta.sources as string[]) : [],
      body,
    }
  }
  return null
}

export function getBacklinks(slug: string, allPages: WikiPage[]): WikiPage[] {
  const pattern = `[[${slug}]]`
  return allPages.filter((p) => p.slug !== slug && p.body.includes(pattern))
}

function htmlEsc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

type InlinePattern = {
  re: RegExp
  fn: (m: RegExpMatchArray) => string
}

function inlineFormat(text: string, slugToTitle: Map<string, string>): string {
  const patterns: InlinePattern[] = [
    {
      re: /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/,
      fn: (m) => {
        const slug = m[1]
        const alias = m[2]
        const display = alias || slugToTitle.get(slug) || slug.replace(/-/g, ' ')
        return `<a href="/wiki/${encodeURIComponent(slug)}" class="wiki-link">${htmlEsc(display)}</a>`
      },
    },
    {
      re: /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/,
      fn: (m) =>
        `<a href="${htmlEsc(m[2])}" class="external-link" target="_blank" rel="noopener noreferrer">${htmlEsc(m[1])}</a>`,
    },
    {
      re: /\*\*([^*]+)\*\*/,
      fn: (m) => `<strong>${htmlEsc(m[1])}</strong>`,
    },
    {
      re: /\*([^*\n]+)\*/,
      fn: (m) => `<em>${htmlEsc(m[1])}</em>`,
    },
    {
      re: /`([^`]+)`/,
      fn: (m) => `<code>${htmlEsc(m[1])}</code>`,
    },
  ]

  let result = ''
  let remaining = text

  while (remaining.length > 0) {
    let earliest: { idx: number; match: RegExpMatchArray; fn: (m: RegExpMatchArray) => string } | null = null

    for (const { re, fn } of patterns) {
      const m = remaining.match(re)
      if (m && m.index !== undefined) {
        if (!earliest || m.index < earliest.idx) {
          earliest = { idx: m.index, match: m, fn }
        }
      }
    }

    if (!earliest) {
      result += htmlEsc(remaining)
      break
    }

    result += htmlEsc(remaining.slice(0, earliest.idx))
    result += earliest.fn(earliest.match)
    remaining = remaining.slice(earliest.idx + earliest.match[0].length)
  }

  return result
}

export function renderMarkdownToHtml(md: string, slugToTitle: Map<string, string>): string {
  const lines = md.split('\n')
  const parts: string[] = []
  let inList = false
  let inCodeBlock = false
  let codeLines: string[] = []
  let skippedFirstH1 = false

  const closeList = () => {
    if (inList) {
      parts.push('</ul>')
      inList = false
    }
  }

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        closeList()
        inCodeBlock = true
        codeLines = []
      } else {
        inCodeBlock = false
        parts.push(`<pre><code>${htmlEsc(codeLines.join('\n'))}</code></pre>`)
      }
      continue
    }

    if (inCodeBlock) {
      codeLines.push(line)
      continue
    }

    if (line.startsWith('### ')) {
      closeList()
      parts.push(`<h3>${inlineFormat(line.slice(4), slugToTitle)}</h3>`)
      continue
    }

    if (line.startsWith('## ')) {
      closeList()
      parts.push(`<h2>${inlineFormat(line.slice(3), slugToTitle)}</h2>`)
      continue
    }

    if (line.startsWith('# ')) {
      if (!skippedFirstH1) {
        skippedFirstH1 = true
        continue // title is shown from frontmatter
      }
      closeList()
      parts.push(`<h1>${inlineFormat(line.slice(2), slugToTitle)}</h1>`)
      continue
    }

    if (/^---+$/.test(line.trim())) {
      closeList()
      parts.push('<hr />')
      continue
    }

    if (/^[*-] /.test(line)) {
      if (!inList) {
        parts.push('<ul>')
        inList = true
      }
      parts.push(`<li>${inlineFormat(line.slice(2), slugToTitle)}</li>`)
      continue
    }

    if (line.trim() === '') {
      closeList()
      continue
    }

    closeList()
    parts.push(`<p>${inlineFormat(line, slugToTitle)}</p>`)
  }

  closeList()
  return parts.join('\n')
}
