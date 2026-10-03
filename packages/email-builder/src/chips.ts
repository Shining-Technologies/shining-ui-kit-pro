import { formatMergeTag, parseMergeTag } from './design'

const ANY_TAG = /\{\{[^{}]*\}\}/g

/**
 * Turn merge tags written as plain text (``{{ contact.first_name|there }}``) into
 * the editor's merge-field spans, so they load as chips.
 *
 * Designs made outside the editor — a project's seed data, a starter, an
 * import — carry their tags as text. The server reads both forms the same way;
 * only the editor needs the span to show a chip. Only text is touched: a tag
 * inside an attribute (a link's ``href``) stays as it is.
 */
export function chipMergeTags(html: string): string {
  if (!html.includes('{{') || typeof DOMParser === 'undefined') return html
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT)
  const texts: Text[] = []
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node as Text
    if (text.data.includes('{{') && !text.parentElement?.closest('[data-merge-field]'))
      texts.push(text)
  }
  let changed = false
  for (const text of texts) {
    const parts: (string | HTMLElement)[] = []
    let last = 0
    for (const match of text.data.matchAll(ANY_TAG)) {
      const parsed = parseMergeTag(match[0])
      const index = match.index ?? 0
      if (!parsed) continue
      parts.push(text.data.slice(last, index))
      const span = doc.createElement('span')
      span.setAttribute('data-merge-field', parsed.path)
      span.textContent = formatMergeTag(parsed.path, parsed.fallback)
      parts.push(span)
      last = index + match[0].length
    }
    if (last === 0) continue
    parts.push(text.data.slice(last))
    text.replaceWith(...parts.filter((part) => part !== ''))
    changed = true
  }
  return changed ? doc.body.innerHTML : html
}
