import React from 'react'

/**
 * Minimal, dependency-free Markdown renderer for knowledge answers.
 * Supports: paragraphs, unordered/ordered lists, ### headings, and **bold**.
 * Builds React elements (no dangerouslySetInnerHTML) so it's injection-safe.
 */

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/)
    if (bold) return <strong key={`${keyPrefix}-${i}`}>{bold[1]}</strong>
    return <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>
  })
}

export function MarkdownLite({ text }: { text: string }) {
  const lines = (text || '').split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0
  let key = 0

  const isUl = (l: string) => /^\s*[-*•]\s+/.test(l)
  const isOl = (l: string) => /^\s*\d+\.\s+/.test(l)

  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) {
      i++
      continue
    }

    const heading = line.match(/^#{1,3}\s+(.*)$/)
    if (heading) {
      blocks.push(
        <h3 key={key++} className="font-display font-bold uppercase text-xl mt-6 mb-2">
          {renderInline(heading[1], `h${key}`)}
        </h3>
      )
      i++
      continue
    }

    if (isUl(line)) {
      const items: string[] = []
      while (i < lines.length && isUl(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*•]\s+/, ''))
        i++
      }
      blocks.push(
        <ul key={key++} className="list-disc pl-6 space-y-2 my-4 text-lg leading-relaxed">
          {items.map((it, j) => (
            <li key={j}>{renderInline(it, `ul${key}-${j}`)}</li>
          ))}
        </ul>
      )
      continue
    }

    if (isOl(line)) {
      const items: string[] = []
      while (i < lines.length && isOl(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''))
        i++
      }
      blocks.push(
        <ol key={key++} className="list-decimal pl-6 space-y-2 my-4 text-lg leading-relaxed">
          {items.map((it, j) => (
            <li key={j}>{renderInline(it, `ol${key}-${j}`)}</li>
          ))}
        </ol>
      )
      continue
    }

    const para: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !isUl(lines[i]) &&
      !isOl(lines[i]) &&
      !/^#{1,3}\s+/.test(lines[i])
    ) {
      para.push(lines[i])
      i++
    }
    blocks.push(
      <p key={key++} className="text-lg leading-relaxed my-4">
        {renderInline(para.join(' '), `p${key}`)}
      </p>
    )
  }

  return <>{blocks}</>
}
