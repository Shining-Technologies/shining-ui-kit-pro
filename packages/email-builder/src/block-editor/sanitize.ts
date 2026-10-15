import { chipMergeTags } from '../chips'
import type { MergeFieldDefinition } from '../design'

const TAGS = new Set([
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'del',
  'a',
  'ul',
  'ol',
  'li',
  'blockquote',
  'span',
])
const DROP = new Set(['script', 'style', 'iframe', 'object', 'embed', 'template', 'noscript'])
const SAFE_HREF = /^(https?:|mailto:|tel:|\{\{)/i

function escapeText(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Only ``color`` and ``text-align`` survive in a style attribute. */
function safeStyle(style: string): string {
  return style
    .split(';')
    .map((part) => part.trim())
    .filter((part) => {
      const [name, ...rest] = part.split(':')
      const value = rest.join(':').trim()
      if (!name || !value) return false
      const prop = name.trim().toLowerCase()
      if (prop === 'text-align') return /^(left|center|right)$/i.test(value)
      if (prop === 'color')
        return /^(#[0-9a-f]{3,8}|rgba?\([0-9.,%\s/]+\)|[a-z]{3,20})$/i.test(value)
      return false
    })
    .join('; ')
}

/**
 * The canvas shows a text block's HTML as it will read: merge fields as chips
 * with their labels, nothing that could run. This keeps a small allowlist of
 * tags and attributes (the editor's own output) and unwraps everything else.
 */
export function renderInline(html: string, fields: MergeFieldDefinition[]): string {
  if (!html) return ''
  if (typeof DOMParser === 'undefined') return escapeText(html.replace(/<[^>]*>/g, ''))
  const doc = new DOMParser().parseFromString(`<body>${chipMergeTags(html)}</body>`, 'text/html')
  const labels = new Map(fields.map((field) => [field.key, field.label]))

  const clean = (node: Node, into: HTMLElement) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === 3) {
        into.appendChild(doc.createTextNode(child.textContent ?? ''))
        return
      }
      if (child.nodeType !== 1) return
      const el = child as HTMLElement
      const tag = el.tagName.toLowerCase()
      if (DROP.has(tag)) return
      if (!TAGS.has(tag)) return clean(el, into)
      const path = el.getAttribute('data-merge-field')
      if (tag === 'span' && path) {
        const chip = doc.createElement('span')
        chip.className = 'seb-merge-chip'
        chip.textContent = labels.get(path) ?? path
        into.appendChild(chip)
        return
      }
      const copy = doc.createElement(tag)
      if (tag === 'a') {
        const href = el.getAttribute('href') ?? ''
        if (SAFE_HREF.test(href.trim())) copy.setAttribute('href', href.trim())
      }
      const style = safeStyle(el.getAttribute('style') ?? '')
      if (style) copy.setAttribute('style', style)
      clean(el, copy)
      into.appendChild(copy)
    })
  }

  const out = doc.createElement('div')
  clean(doc.body, out)
  return out.innerHTML
}

/** The words in some HTML, for labels and summaries. */
export function plainText(html: string, max = 60): string {
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}
