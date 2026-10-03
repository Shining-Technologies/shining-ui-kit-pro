/**
 * The design JSON shining-email stores (its PRD §7.7) and the merge-tag text
 * format, with no React and no editor: safe to import from server code.
 *
 * The design is the source of truth, never HTML. In rich-text mode it holds
 * one HTML fragment the server sanitises on every save; the email itself is
 * always rendered by the server.
 */

export const DESIGN_VERSION = 1

export interface RichTextDesign {
  version: typeof DESIGN_VERSION
  mode: 'richtext'
  settings: Record<string, unknown>
  html: string
}

/** Block mode arrives with shining-email 0.2; v0.1 editors refuse it. */
export interface BlockDesign {
  version: typeof DESIGN_VERSION
  mode: 'blocks'
  settings: Record<string, unknown>
  rows: unknown[]
}

export type EmailDesign = RichTextDesign | BlockDesign

/** What `GET merge-fields/` returns, one per field. */
export interface MergeFieldDefinition {
  key: string
  label: string
  group?: string
  sample?: string
}

export function emptyDesign(html = ''): RichTextDesign {
  return { version: DESIGN_VERSION, mode: 'richtext', settings: {}, html }
}

export function isRichTextDesign(value: unknown): value is RichTextDesign {
  if (!value || typeof value !== 'object') return false
  const design = value as Partial<RichTextDesign>
  return (
    (design.mode === undefined || design.mode === 'richtext') &&
    (design.version === undefined || design.version === DESIGN_VERSION) &&
    (design.html === undefined || typeof design.html === 'string')
  )
}

/** A stored or partial design as a full rich-text design. Anything else — a
 * block design, a newer version — is ``null``: the caller must not edit it. */
export function toRichTextDesign(value: unknown): RichTextDesign | null {
  if (value === null || value === undefined) return emptyDesign()
  if (!isRichTextDesign(value)) return null
  return {
    version: DESIGN_VERSION,
    mode: 'richtext',
    settings: { ...(value.settings ?? {}) },
    html: value.html ?? '',
  }
}

/** A path is dot-separated segments that each start with a letter (the
 * server's rule: anything else stays literal text). */
export const MERGE_PATH = /^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)*$/

const TAG = /\{\{\s*([A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)*)\s*(?:\|\s*(?:default\s*:\s*)?([^}]*?))?\s*\}\}/g

export function isMergePath(path: string): boolean {
  return MERGE_PATH.test(path)
}

/** ``{{ path }}`` or ``{{ path|fallback }}``. A ``}`` cannot appear in a
 * fallback, so it is dropped. */
export function formatMergeTag(path: string, fallback = ''): string {
  if (!isMergePath(path)) throw new Error(`Not a merge field path: ${path}`)
  const clean = fallback.replace(/[{}]/g, '').trim()
  return clean ? `{{ ${path}|${clean} }}` : `{{ ${path} }}`
}

export interface ParsedMergeTag {
  path: string
  fallback: string
}

/** The first merge tag in ``text``, or ``null``. Reads nexus's
 * ``{{ path | default:"x" }}`` form too. */
export function parseMergeTag(text: string): ParsedMergeTag | null {
  TAG.lastIndex = 0
  const match = TAG.exec(text)
  if (!match || !match[1]) return null
  let fallback = (match[2] ?? '').trim()
  if (fallback.length >= 2 && fallback[0] === fallback[fallback.length - 1] && `"'`.includes(fallback[0]!)) {
    fallback = fallback.slice(1, -1)
  }
  return { path: match[1], fallback }
}

/** Every merge-field path used in ``texts``, first seen first — the same list
 * the server records as ``merge_fields_used``. */
export function mergeFieldsIn(...texts: string[]): string[] {
  const seen: string[] = []
  for (const text of texts) {
    TAG.lastIndex = 0
    for (const match of text.matchAll(TAG)) {
      if (match[1] && !seen.includes(match[1])) seen.push(match[1])
    }
  }
  return seen
}

/** Paths in ``used`` that ``known`` does not list. ``brand.*`` is always known:
 * it is the whole brand kit, not only the listed keys. */
export function unknownMergeFields(used: string[], known: MergeFieldDefinition[]): string[] {
  const keys = new Set(known.map((field) => field.key))
  return used.filter((path) => !keys.has(path) && !path.startsWith('brand.'))
}

/** Insert ``text`` at the caret of a subject or preheader input, keeping the
 * caret after it. Returns the new value; the caller sets its state. */
export function insertAtCursor(
  input: { value: string; selectionStart: number | null; selectionEnd: number | null },
  text: string,
): { value: string; caret: number } {
  const start = input.selectionStart ?? input.value.length
  const end = input.selectionEnd ?? start
  const value = input.value.slice(0, start) + text + input.value.slice(end)
  return { value, caret: start + text.length }
}
