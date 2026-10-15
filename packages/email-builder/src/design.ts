/**
 * The design JSON shining-email stores (its PRD §7.7) and the merge-tag text
 * format, with no React and no editor: safe to import from server code.
 *
 * The design is the source of truth, never HTML. In rich-text mode it holds
 * one HTML fragment the server sanitises on every save; in block mode
 * (shining-email 0.3) it holds a tree of rows, columns and blocks. The email
 * itself is always rendered by the server.
 */

export const DESIGN_VERSION = 1

export interface RichTextDesign {
  version: typeof DESIGN_VERSION
  mode: 'richtext'
  settings: Record<string, unknown>
  html: string
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

const TAG =
  /\{\{\s*([A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)*)\s*(?:\|\s*(?:default\s*:\s*)?([^}]*?))?\s*\}\}/g

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
  if (
    fallback.length >= 2 &&
    fallback[0] === fallback[fallback.length - 1] &&
    `"'`.includes(fallback[0]!)
  ) {
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

/* ------------------------------------------------------------------------- *
 * Block mode (shining-email 0.3, its PRD §7.8)
 *
 * The schema below is the contract with the server's `validate_blocks`; the
 * server stays the authority. `validateBlockDesign` mirrors its limits for UI
 * hints only.
 * ------------------------------------------------------------------------- */

export type Align = 'left' | 'center' | 'right'
/** The device a row or column is hidden on. */
export type HideOn = 'mobile' | 'desktop' | null
export type VAlign = 'top' | 'middle' | 'bottom'
/** Top, right, bottom, left, in pixels. */
export type Padding = [number, number, number, number]

/** A colour or font: a literal (``#1a73e8``) or a ``brand.<attr>`` reference
 * the renderer resolves against the live brand kit. */
export type BrandRef = string

export interface BlockSettings {
  /** 480–700. */
  width: number
  background: BrandRef
  content_background: BrandRef
  font: BrandRef
  padding: Padding
}

/** The style every block may carry (§1a). Every field is optional, and ``null``
 * means inherit. Paddings are 0–80 a side; colours are a literal or a
 * ``brand.<attr>``; ``font`` is ``brand.<attr>`` or a key of `FONT_STACKS`. */
export interface BlockStyle {
  padding?: Padding | null
  background?: BrandRef | null
  color?: BrandRef | null
  font?: string | null
  /** 12–32. */
  font_size?: number | null
  font_weight?: 'normal' | 'bold' | null
}

/** The html block takes only ``padding``. */
export interface HtmlStyle {
  padding?: Padding | null
}

export interface HeadingBlock {
  id: string
  type: 'heading'
  style?: BlockStyle
  level: 1 | 2 | 3
  /** Inline marks and merge fields only. */
  html: string
  align: Align
  color: BrandRef
}

export interface TextBlock {
  id: string
  type: 'text'
  style?: BlockStyle
  /** The rich-text allowlist; buttons and images are separate blocks. */
  html: string
  align: Align
}

export interface ImageBlock {
  id: string
  type: 'image'
  style?: BlockStyle
  /** 0–40, the corner radius in pixels. */
  radius?: number | null
  src: string
  asset_id?: string
  alt: string
  /** Pixels (at most the column's width) or ``"full"``. */
  width: number | 'full'
  align: Align
  /** Omitted when the image is not a link. */
  link?: string
}

/** The button's ``style`` is the shared style plus its own props. A missing
 * background or text colour inherits the brand kit's button colours. */
export interface ButtonStyle extends BlockStyle {
  /** 0–40; defaults to 6. */
  radius?: number
  /** 0–40; defaults to 12. */
  padding_y?: number
  /** 0–100; defaults to 24. */
  padding_x?: number
  /** For outline buttons. */
  border_color?: BrandRef | null
  /** 0–4; defaults to 0. */
  border_width?: number | null
}

export interface ButtonBlock {
  id: string
  type: 'button'
  label: string
  url: string
  align: Align
  full_width: boolean
  style: ButtonStyle
}

export interface DividerBlock {
  id: string
  type: 'divider'
  style?: BlockStyle
  color: BrandRef
  /** 1–8. */
  thickness: number
  /** 10–100, a percentage. */
  width: number
}

export interface SpacerBlock {
  id: string
  type: 'spacer'
  style?: BlockStyle
  /** 4–120. */
  height: number
}

export interface SocialLink {
  network: string
  url: string
}

export interface SocialBlock {
  id: string
  type: 'social'
  style?: BlockStyle
  /** ``"brand"`` reads the brand kit's ``social_links``. */
  source: 'brand' | 'custom'
  /** Only with ``source: 'custom'``. */
  links?: SocialLink[]
  align: Align
}

export interface VideoThumbnail {
  src: string
  asset_id?: string
}

export interface VideoBlock {
  id: string
  type: 'video'
  style?: BlockStyle
  url: string
  /** Filled by the server for a YouTube address; required otherwise. */
  thumbnail?: VideoThumbnail | null
  alt: string
  caption: string
}

export interface FooterBlock {
  id: string
  type: 'footer'
  style?: BlockStyle
  show_business: boolean
  show_address: boolean
  show_social: boolean
  html?: string
}

export type AvatarShape = 'circle' | 'rounded' | 'square'

/** A sender's picture, for signatures. */
export interface AvatarBlock {
  id: string
  type: 'avatar'
  style?: BlockStyle
  src: string
  asset_id?: string
  alt: string
  /** 24–128 pixels. */
  size: number
  shape: AvatarShape
  align: Align
}

export interface HtmlBlock {
  id: string
  type: 'html'
  style?: HtmlStyle
  html: string
}

export type Block =
  | HeadingBlock
  | TextBlock
  | ImageBlock
  | AvatarBlock
  | ButtonBlock
  | DividerBlock
  | SpacerBlock
  | SocialBlock
  | VideoBlock
  | FooterBlock
  | HtmlBlock

export type BlockType = Block['type']

export interface Column {
  id: string
  /** Gives the column a background box without nesting. */
  background?: BrandRef | null
  /** 0–80 a side. */
  padding?: Padding | null
  /** An integer percentage; the columns of a row add up to 100. */
  width: number
  hide_on: HideOn
  valign: VAlign
  blocks: Block[]
}

export interface Row {
  id: string
  /** 0–40 pixels between columns. */
  gap?: number | null
  padding: Padding
  background: BrandRef | null
  hide_on: HideOn
  /** 1–3 columns. */
  columns: Column[]
}

export interface BlockDesign {
  version: typeof DESIGN_VERSION
  mode: 'blocks'
  settings: BlockSettings
  rows: Row[]
}

export const BLOCK_TYPES: readonly BlockType[] = [
  'heading',
  'text',
  'image',
  'avatar',
  'button',
  'divider',
  'spacer',
  'social',
  'video',
  'footer',
  'html',
]

export const MAX_ROWS = 50
export const MAX_BLOCKS = 300
export const MAX_DESIGN_BYTES = 256 * 1024
export const MIN_WIDTH = 480
export const MAX_WIDTH = 700

const ID_PATTERN = /^[a-z0-9_-]{1,40}$/

/** A fresh id, e.g. ``b_k3j9x0a1pq``: lower-case, within the server's id rule. */
export function newId(prefix = 'b'): string {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'
  const bytes = new Uint8Array(10)
  const crypto = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } })
    .crypto
  if (crypto?.getRandomValues) crypto.getRandomValues(bytes)
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  let out = ''
  for (const byte of bytes) out += alphabet[byte % alphabet.length]
  return `${
    prefix
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .slice(0, 8) || 'b'
  }_${out}`
}

/* -- brand ---------------------------------------------------------------- */

/** The font stacks shining-email's brand kit offers, by key. */
export const FONT_STACKS: Record<string, string> = {
  arial: 'Arial, Helvetica, sans-serif',
  georgia: "Georgia, 'Times New Roman', serif",
  verdana: 'Verdana, Geneva, sans-serif',
  trebuchet: "'Trebuchet MS', Helvetica, sans-serif",
  tahoma: 'Tahoma, Verdana, sans-serif',
  system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
}

/** The brand attributes a colour may refer to as ``brand.<attr>``. */
export const BRAND_COLOR_ATTRS = [
  'primary_color',
  'text_color',
  'muted_text_color',
  'link_color',
  'background_color',
  'content_background_color',
  'button_text_color',
] as const
export const BRAND_FONT_ATTRS = ['heading_font', 'body_font'] as const
export type BrandColorAttr = (typeof BRAND_COLOR_ATTRS)[number]
export type BrandFontAttr = (typeof BRAND_FONT_ATTRS)[number]

/** What `GET brand/` returns, in part: the editor draws its approximation of
 * the email from these. Every field is optional; a missing one falls back to
 * the brand kit's own default. */
export interface BrandPreview {
  primary_color?: string
  text_color?: string
  muted_text_color?: string
  link_color?: string
  background_color?: string
  content_background_color?: string
  button_text_color?: string
  /** A font key (``"georgia"``) or a CSS font stack. */
  heading_font?: string
  body_font?: string
  logo_url?: string
  logo_width?: number
  logo_alignment?: string
  logo_alt?: string
  business_name?: string
  business_address?: string
  phone?: string
  website?: string
  social_links?: SocialLink[]
}

const BRAND_DEFAULTS: Record<BrandColorAttr | BrandFontAttr, string> = {
  primary_color: '#2563eb',
  text_color: '#1f2937',
  muted_text_color: '#6b7280',
  link_color: '#2563eb',
  background_color: '#f3f4f6',
  content_background_color: '#ffffff',
  button_text_color: '#ffffff',
  heading_font: FONT_STACKS.arial!,
  body_font: FONT_STACKS.arial!,
}

export function isBrandRef(value: unknown): boolean {
  return typeof value === 'string' && /^brand\.[a-z_]+$/.test(value)
}

export function brandRef(attr: BrandColorAttr | BrandFontAttr): string {
  return `brand.${attr}`
}

function isKnownBrandAttr(attr: string): attr is BrandColorAttr | BrandFontAttr {
  return (
    (BRAND_COLOR_ATTRS as readonly string[]).includes(attr) ||
    (BRAND_FONT_ATTRS as readonly string[]).includes(attr)
  )
}

/** A font key or stack as a CSS ``font-family`` value. */
export function fontStack(value: string | undefined): string {
  if (!value) return ''
  return FONT_STACKS[value.trim().toLowerCase()] ?? value
}

/**
 * A colour or font as a literal CSS value. ``brand.<attr>`` is read from
 * ``brand`` (the kit's default when the brand does not carry it); anything
 * else is returned as it is. ``null``, ``undefined`` and ``''`` give ``''``.
 */
export function resolveBrand(
  value: string | null | undefined,
  brand?: BrandPreview | null,
): string {
  if (!value) return ''
  if (!isBrandRef(value)) return value
  const attr = value.slice('brand.'.length)
  if (!isKnownBrandAttr(attr)) return ''
  const raw = brand?.[attr]
  const chosen = typeof raw === 'string' && raw.trim() ? raw : BRAND_DEFAULTS[attr]
  return attr === 'heading_font' || attr === 'body_font' ? fontStack(chosen) : chosen
}

/** A font value (``brand.<attr>``, a key of `FONT_STACKS`, or a stack) as a CSS
 * ``font-family``. */
export function resolveFont(value: string | null | undefined, brand?: BrandPreview | null): string {
  if (!value) return ''
  return isBrandRef(value) ? resolveBrand(value, brand) : fontStack(value)
}

/** The video id of a YouTube address (watch, share, embed, shorts, live, v), or
 * ``null``; the host is matched without regard to case, as the server does. */
export function youtubeId(address: string): string | null {
  const parts = /^https?:\/\/([^/?#]*)([^?#]*)(?:\?([^#]*))?/i.exec(address.trim())
  if (!parts) return null
  const host = parts[1]!
    .replace(/^.*@/, '')
    .replace(/:\d*$/, '')
    .toLowerCase()
    .replace(/^www\./, '')
    .replace(/^m\./, '')
  const path = parts[2] ?? ''
  const segments = path.split('/').filter(Boolean)
  let candidate: string | undefined
  if (host === 'youtu.be') candidate = segments[0]
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (path === '/watch') {
      candidate = (parts[3] ?? '')
        .split('&')
        .map((pair) => pair.split('='))
        .find(([key]) => key === 'v')?.[1]
    } else if (segments.length >= 2 && ['embed', 'shorts', 'live', 'v'].includes(segments[0]!)) {
      candidate = segments[1]
    }
  }
  return candidate && /^[A-Za-z0-9_-]{11}$/.test(candidate) ? candidate : null
}

/** The thumbnail YouTube serves for a video address, or ``''``. */
export function youtubeThumbnail(address: string): string {
  const id = youtubeId(address)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : ''
}

/* -- defaults ------------------------------------------------------------- */

export const DEFAULT_BLOCK_SETTINGS: BlockSettings = {
  width: 600,
  background: 'brand.background_color',
  content_background: 'brand.content_background_color',
  font: 'brand.body_font',
  padding: [24, 24, 24, 24],
}

export const DEFAULT_ROW_PADDING: Padding = [16, 24, 16, 24]
/** The gap a new row gets; a stored row without ``gap`` has none. */
export const DEFAULT_ROW_GAP = 16

/** The padding a block has when its ``style.padding`` is not set. */
export const DEFAULT_BLOCK_PADDING: Record<BlockType, Padding> = {
  heading: [8, 0, 8, 0],
  text: [8, 0, 8, 0],
  image: [8, 0, 8, 0],
  avatar: [8, 0, 8, 0],
  button: [8, 0, 8, 0],
  divider: [8, 0, 8, 0],
  spacer: [0, 0, 0, 0],
  social: [8, 0, 8, 0],
  video: [8, 0, 8, 0],
  footer: [0, 0, 0, 0],
  html: [0, 0, 0, 0],
}

/** Button sizes and shapes: editor presets that write ``padding_y``/``padding_x``
 * and ``radius`` (no schema change). */
export const BUTTON_SIZES = [
  { id: 'x-small', label: 'Extra small', padding_y: 6, padding_x: 12 },
  { id: 'small', label: 'Small', padding_y: 8, padding_x: 16 },
  { id: 'medium', label: 'Medium', padding_y: 12, padding_x: 24 },
  { id: 'large', label: 'Large', padding_y: 16, padding_x: 32 },
] as const
export const BUTTON_SHAPES = [
  { id: 'rectangle', label: 'Rectangle', radius: 0 },
  { id: 'rounded', label: 'Rounded', radius: 6 },
  { id: 'pill', label: 'Pill', radius: 40 },
] as const

/** The preset a button's style matches, or ``null`` for custom values. */
export function buttonSizeOf(style: Pick<ButtonStyle, 'padding_y' | 'padding_x'>): string | null {
  const y = style.padding_y ?? 12
  const x = style.padding_x ?? 24
  return BUTTON_SIZES.find((s) => s.padding_y === y && s.padding_x === x)?.id ?? null
}
export function buttonShapeOf(style: Pick<ButtonStyle, 'radius'>): string | null {
  const radius = style.radius ?? 6
  return BUTTON_SHAPES.find((s) => s.radius === radius)?.id ?? null
}

export function emptyBlockDesign(): BlockDesign {
  return {
    version: DESIGN_VERSION,
    mode: 'blocks',
    settings: { ...DEFAULT_BLOCK_SETTINGS, padding: [...DEFAULT_BLOCK_SETTINGS.padding] },
    rows: [],
  }
}

/* -- the schema tables ------------------------------------------------------
 *
 * Every level is described by a table of props, as the server's
 * `rendering/blocks.py` does: a prop is `{ check, default }`, and a prop with
 * no default is required. `validateBlockDesign`, `withDefaults`, `createBlock`
 * and the allowed keys all read these tables, so a new prop or block type is a
 * table entry, not new control flow. Unknown keys are refused at every level.
 */

export interface BlockDesignIssue {
  /** Where, as the server reports it: ``rows[2].columns[0].blocks[1].url``. */
  path: string
  message: string
  /** ``error``: the server refuses it. ``warning``: the server refuses it too,
   * but the email is only unfinished (an image with no picture, a button with
   * no link), so the editor lets the author carry on. */
  severity: 'error' | 'warning'
}

interface Ctx {
  issues: BlockDesignIssue[]
  ids: Set<string>
  rows: number
  blocks: number
  footers: number
  width: number
  colPx: number
}
type Check = (value: unknown, path: string, ctx: Ctx) => void
interface PropDef {
  check: Check
  required?: boolean
  /** Filled in when the prop is missing; ``null`` means inherit (not filled). */
  default?: unknown
  /** For an object prop, its own table. */
  sub?: Record<string, PropDef>
}

const fail = (ctx: Ctx, path: string, message: string) =>
  ctx.issues.push({ path, message, severity: 'error' })
const unfinished = (ctx: Ctx, path: string, message: string) =>
  ctx.issues.push({ path, message, severity: 'warning' })
const join = (base: string, key: string) => (base ? `${base}.${key}` : key)
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v)

const optional = (check: Check, def: unknown = null): PropDef => ({ check, default: def })
const required = (check: Check): PropDef => ({ check, required: true })

const integer =
  (min: number, max: number, label = 'Value'): Check =>
  (v, p, c) => {
    if (!isInt(v) || v < min || v > max)
      fail(c, p, `${label} must be a whole number from ${min} to ${max}`)
  }
const boolean: Check = (v, p, c) => {
  if (typeof v !== 'boolean') fail(c, p, 'Must be true or false')
}
const oneOf =
  (...options: string[]): Check =>
  (v, p, c) => {
    if (typeof v !== 'string' || !options.includes(v)) fail(c, p, `Must be ${options.join(', ')}`)
  }
const hideOn: Check = oneOf('mobile', 'desktop')
/** Text, at most ``max`` characters; an empty required text is only unfinished. */
const text =
  (max: number, what = 'Text', blankIsUnfinished = false): Check =>
  (v, p, c) => {
    if (typeof v !== 'string') return fail(c, p, `${what} must be text`)
    if (v.length > max) fail(c, p, `${what} must be at most ${max} characters`)
    else if (blankIsUnfinished && !v.trim()) unfinished(c, p, `${what} is empty`)
  }

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
const color: Check = (v, p, c) => {
  if (typeof v !== 'string')
    return fail(c, p, 'Must be a colour (#rrggbb) or a brand.<name> reference')
  if (isBrandRef(v)) {
    if (!(BRAND_COLOR_ATTRS as readonly string[]).includes(v.slice('brand.'.length)))
      fail(c, p, `${v} is not a brand colour`)
  } else if (!HEX.test(v))
    fail(c, p, `${v} is not a colour: use #rrggbb or a brand.<name> reference`)
}
const font: Check = (v, p, c) => {
  if (typeof v !== 'string') return fail(c, p, 'Must be a font')
  if (isBrandRef(v)) {
    if (!(BRAND_FONT_ATTRS as readonly string[]).includes(v.slice('brand.'.length)))
      fail(c, p, `${v} is not a brand font`)
  } else if (!Object.prototype.hasOwnProperty.call(FONT_STACKS, v))
    fail(c, p, `${v} is not one of ${Object.keys(FONT_STACKS).join(', ')}`)
}
const padding =
  (max: number): Check =>
  (v, p, c) => {
    if (
      !Array.isArray(v) ||
      v.length !== 4 ||
      !v.every((side) => isInt(side) && side >= 0 && side <= max)
    )
      fail(c, p, `Padding must be four whole numbers from 0 to ${max} (top, right, bottom, left)`)
  }

const WEB = ['http', 'https']
const LINK = ['http', 'https', 'mailto', 'tel']
/** The server's merge tag (`merge.TAG_RE`), with the default form. */
const TAG_SOURCE =
  '\\{\\{\\s*([A-Za-z][A-Za-z0-9_]*(?:\\.[A-Za-z][A-Za-z0-9_]*)*)\\s*(?:\\|\\s*(?:default\\s*:\\s*)?([^}]*?))?\\s*\\}\\}'
/** What may not appear in a URL outside a merge tag (the server's `_URL_UNSAFE`). */
// eslint-disable-next-line no-control-regex -- the control characters are the point
const URL_UNSAFE = /[\s\u0000-\u001f\u007f"<>\\]/

/**
 * Why ``value`` is not an acceptable URL, or ``null``: a port of the server's
 * `url_problem`. Each merge tag is set aside and the rest is checked as a URL:
 * an allowed scheme, and no whitespace, control characters, quotes, angle
 * brackets or backslashes. A tag may stand for the whole URL, start it (followed
 * by ``/``, ``?`` or ``#``), or sit anywhere later. At most 2000 characters.
 */
export function urlProblem(
  value: unknown,
  schemes: readonly string[],
  maximum = 2000,
): string | null {
  if (typeof value !== 'string') return 'must be a web address'
  const text = value.trim()
  if (!text || [...text].length > maximum) return 'must be a valid address'
  const sticky = new RegExp(TAG_SOURCE, 'y')
  let position = 0
  let leading = false
  for (;;) {
    sticky.lastIndex = position
    const tag = sticky.exec(text)
    if (!tag) break
    position = sticky.lastIndex
    leading = true
  }
  const probe = text.slice(position).replace(new RegExp(TAG_SOURCE, 'g'), 'x')
  if (URL_UNSAFE.test(probe)) return 'must be a valid address'
  if (leading) {
    return probe && !'/?#'.includes(probe[0]!)
      ? 'must be a whole merge field, or one followed by /, ? or #'
      : null
  }
  const scheme = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(probe)?.[1]?.toLowerCase()
  if (!scheme || !schemes.includes(scheme))
    return `must start with ${[...schemes]
      .sort()
      .map((x) => `${x}:`)
      .join(', ')}`
  return null
}

/** An address with one of ``schemes`` (see `urlProblem`). A required address
 * left empty is only unfinished. */
const address =
  (schemes: string[], what: string, mustHave = false): Check =>
  (v, p, c) => {
    if (typeof v !== 'string') return fail(c, p, `${what} must be a web address`)
    if (!v.trim()) {
      return mustHave
        ? unfinished(c, p, `${what} is empty`)
        : fail(c, p, `${what} must be a valid address`)
    }
    const problem = urlProblem(v, schemes)
    if (problem) fail(c, p, `${what} ${problem}`)
  }

/** An object checked against a table: unknown keys are refused, a missing
 * required prop is an error, ``null`` means the default. */
function checkProps(
  value: unknown,
  defs: Record<string, PropDef>,
  path: string,
  ctx: Ctx,
  extraKeys: string[] = [],
): value is Record<string, unknown> {
  if (!isRecord(value)) {
    fail(ctx, path, 'Must be an object')
    return false
  }
  for (const key of Object.keys(value)) {
    if (!(key in defs) && !extraKeys.includes(key))
      fail(ctx, join(path, key), 'Is not a known property')
  }
  for (const [key, def] of Object.entries(defs)) {
    const v = value[key]
    if (v === undefined || v === null) {
      if (def.required) fail(ctx, join(path, key), 'Is required')
      continue
    }
    def.check(v, join(path, key), ctx)
  }
  return true
}

const objectOf =
  (defs: Record<string, PropDef>): Check =>
  (v, p, c) => {
    checkProps(v, defs, p, c)
  }

const GAP: Padding = [8, 0, 8, 0]
const FLUSH: Padding = [0, 0, 0, 0]

/** The ``style`` every block shares (§1a). Only ``padding`` has a default (per
 * type); the rest is ``null``, which means inherit. */
function styleDefs(
  defaultPadding: Padding,
  { onlyPadding = false, extra = {} as Record<string, PropDef> } = {},
): Record<string, PropDef> {
  return {
    padding: optional(padding(80), defaultPadding),
    ...(onlyPadding
      ? {}
      : {
          background: optional(color),
          color: optional(color),
          font: optional(font),
          font_size: optional(integer(12, 32, 'Font size')),
          font_weight: optional(oneOf('normal', 'bold')),
        }),
    ...extra,
  }
}
function styleProp(defs: Record<string, PropDef>): PropDef {
  return { check: objectOf(defs), default: defaultsOf(defs), sub: defs }
}

const BUTTON_EXTRA: Record<string, PropDef> = {
  radius: optional(integer(0, 40, 'Radius'), 6),
  padding_y: optional(integer(0, 40, 'Padding'), 12),
  padding_x: optional(integer(0, 100, 'Padding'), 24),
  border_color: optional(color),
  border_width: optional(integer(0, 4, 'Border width'), 0),
}

const SOCIAL_LINK: Record<string, PropDef> = {
  network: required(text(50, 'The network', true)),
  url: required(address(WEB, 'The link', true)),
}
const socialLinks: Check = (v, p, c) => {
  if (!Array.isArray(v) || v.length > 12) return fail(c, p, 'Must be a list of at most 12 links')
  v.forEach((link, i) => checkProps(link, SOCIAL_LINK, `${p}[${i}]`, c))
}
/** The social block's ``style`` was the string ``"pill"``; the server still
 * reads it, as the default style. */
function socialStyle(defs: Record<string, PropDef>): PropDef {
  const inner = objectOf(defs)
  return {
    check: (v, p, c) => (v === 'pill' ? undefined : inner(v, p, c)),
    default: defaultsOf(defs),
    sub: defs,
  }
}

const THUMBNAIL: Record<string, PropDef> = {
  src: required(address(WEB, 'The thumbnail address', true)),
  asset_id: optional(text(64, 'The asset id')),
}

const html = (what: string): Check => text(100_000, what)

/** Per block type: the props the schema allows, with their defaults. */
const BLOCK_PROPS: Record<BlockType, Record<string, PropDef>> = {
  heading: {
    level: optional(integer(1, 3, 'Level'), 2),
    html: optional(html('The heading'), ''),
    align: optional(oneOf('left', 'center', 'right'), 'left'),
    color: optional(color, 'brand.text_color'),
    style: styleProp(styleDefs(GAP)),
  },
  text: {
    html: optional(html('The text'), ''),
    align: optional(oneOf('left', 'center', 'right'), 'left'),
    style: styleProp(styleDefs(GAP)),
  },
  image: {
    src: required(address(WEB, 'The image address', true)),
    asset_id: optional(text(64, 'The asset id')),
    alt: optional(text(500, 'The description'), ''),
    width: {
      default: 'full',
      check: (v, p, c) => {
        if (v === 'full') return
        if (!isInt(v) || v < 1 || v > Math.max(c.colPx, 1))
          fail(
            c,
            p,
            `Width must be "full" or a whole number of pixels up to the column width (${c.colPx})`,
          )
      },
    },
    align: optional(oneOf('left', 'center', 'right'), 'left'),
    link: optional(address(LINK, 'The link')),
    radius: optional(integer(0, 40, 'Radius'), 0),
    style: styleProp(styleDefs(GAP)),
  },
  avatar: {
    src: required(address(WEB, 'The picture address', true)),
    asset_id: optional(text(64, 'The asset id')),
    alt: optional(text(500, 'The description'), ''),
    size: optional(integer(24, 128, 'Size'), 64),
    shape: optional(oneOf('circle', 'rounded', 'square'), 'circle'),
    align: optional(oneOf('left', 'center', 'right'), 'left'),
    style: styleProp(styleDefs(GAP)),
  },
  button: {
    label: required(text(120, 'The label', true)),
    url: required(address(LINK, 'The button link', true)),
    align: optional(oneOf('left', 'center', 'right'), 'left'),
    full_width: optional(boolean, false),
    style: styleProp(styleDefs(GAP, { extra: BUTTON_EXTRA })),
  },
  divider: {
    color: optional(color, 'brand.muted_text_color'),
    thickness: optional(integer(1, 8, 'Thickness'), 1),
    width: optional(integer(10, 100, 'Width'), 100),
    style: styleProp(styleDefs(GAP)),
  },
  spacer: {
    height: optional(integer(4, 120, 'Height'), 24),
    style: styleProp(styleDefs(FLUSH)),
  },
  social: {
    source: optional(oneOf('brand', 'custom'), 'brand'),
    links: optional(socialLinks, []),
    align: optional(oneOf('left', 'center', 'right'), 'left'),
    style: socialStyle(styleDefs(GAP)),
  },
  video: {
    url: required(address(WEB, 'The video address', true)),
    thumbnail: optional(objectOf(THUMBNAIL)),
    alt: optional(text(500, 'The description'), ''),
    caption: optional(text(200, 'The caption'), 'Watch the video'),
    style: styleProp(styleDefs(GAP)),
  },
  footer: {
    show_business: optional(boolean, true),
    show_address: optional(boolean, true),
    show_social: optional(boolean, true),
    html: optional(html('The extra text'), ''),
    style: styleProp(styleDefs(FLUSH)),
  },
  html: {
    html: optional(html('The HTML'), ''),
    style: styleProp(styleDefs(FLUSH, { onlyPadding: true })),
  },
}

/** What a block has to satisfy beyond its props. */
const BLOCK_POST: Partial<
  Record<BlockType, (block: Record<string, unknown>, path: string, ctx: Ctx) => void>
> = {
  social: (block, path, ctx) => {
    if (block.source === 'custom' && !(Array.isArray(block.links) && block.links.length))
      unfinished(ctx, join(path, 'links'), 'Custom social links need at least one link')
  },
  video: (block, path, ctx) => {
    if (
      !block.thumbnail &&
      typeof block.url === 'string' &&
      block.url.trim() &&
      !youtubeId(block.url)
    )
      unfinished(
        ctx,
        join(path, 'thumbnail'),
        'A thumbnail is needed unless the video is a YouTube link',
      )
  },
}

function defaultsOf(defs: Record<string, PropDef>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, def] of Object.entries(defs)) {
    if (def.default === undefined || def.default === null) continue
    out[key] = JSON.parse(JSON.stringify(def.default))
  }
  return out
}

const ROW_PROPS: Record<string, PropDef> = {
  padding: optional(padding(100), DEFAULT_ROW_PADDING),
  background: optional(color),
  hide_on: optional(hideOn),
  gap: optional(integer(0, 40, 'Gap'), DEFAULT_ROW_GAP),
}
const COLUMN_PROPS: Record<string, PropDef> = {
  width: required(integer(1, 100, 'Width')),
  hide_on: optional(hideOn),
  valign: optional(oneOf('top', 'middle', 'bottom'), 'top'),
  background: optional(color),
  padding: optional(padding(80), [0, 0, 0, 0]),
}
const SETTINGS_PROPS: Record<string, PropDef> = {
  width: optional(integer(MIN_WIDTH, MAX_WIDTH, 'Width'), 600),
  background: optional(color, 'brand.background_color'),
  content_background: optional(color, 'brand.content_background_color'),
  font: optional(font, 'brand.body_font'),
  padding: optional(padding(100), [24, 24, 24, 24]),
}

/** Per block type, in one place: the keys the schema allows, the defaults
 * filled on read, and a new block's starting content. */
export const BLOCK_SPECS: {
  [T in BlockType]: {
    keys: readonly string[]
    defaults: () => Record<string, unknown>
    create: (id: string) => Extract<Block, { type: T }>
  }
} = {
  heading: {
    keys: ['id', 'type', ...Object.keys(BLOCK_PROPS.heading)],
    defaults: () => defaultsOf(BLOCK_PROPS.heading),
    create: (id) => ({
      id,
      type: 'heading',
      level: 2,
      html: 'Heading',
      align: 'left',
      color: 'brand.text_color',
    }),
  },
  text: {
    keys: ['id', 'type', ...Object.keys(BLOCK_PROPS.text)],
    defaults: () => defaultsOf(BLOCK_PROPS.text),
    create: (id) => ({ id, type: 'text', html: '<p>Write something here.</p>', align: 'left' }),
  },
  image: {
    keys: ['id', 'type', ...Object.keys(BLOCK_PROPS.image)],
    defaults: () => defaultsOf(BLOCK_PROPS.image),
    create: (id) => ({ id, type: 'image', src: '', alt: '', width: 'full', align: 'center' }),
  },
  avatar: {
    keys: ['id', 'type', ...Object.keys(BLOCK_PROPS.avatar)],
    defaults: () => defaultsOf(BLOCK_PROPS.avatar),
    create: (id) => ({
      id,
      type: 'avatar',
      src: '',
      alt: '',
      size: 64,
      shape: 'circle',
      align: 'left',
    }),
  },
  button: {
    keys: ['id', 'type', ...Object.keys(BLOCK_PROPS.button)],
    defaults: () => defaultsOf(BLOCK_PROPS.button),
    create: (id) => ({
      id,
      type: 'button',
      label: 'Click here',
      url: '',
      align: 'center',
      full_width: false,
      style: { radius: 6, padding_y: 12, padding_x: 24 },
    }),
  },
  divider: {
    keys: ['id', 'type', ...Object.keys(BLOCK_PROPS.divider)],
    defaults: () => defaultsOf(BLOCK_PROPS.divider),
    create: (id) => ({
      id,
      type: 'divider',
      color: 'brand.muted_text_color',
      thickness: 1,
      width: 100,
    }),
  },
  spacer: {
    keys: ['id', 'type', ...Object.keys(BLOCK_PROPS.spacer)],
    defaults: () => defaultsOf(BLOCK_PROPS.spacer),
    create: (id) => ({ id, type: 'spacer', height: 24 }),
  },
  social: {
    keys: ['id', 'type', ...Object.keys(BLOCK_PROPS.social)],
    defaults: () => defaultsOf(BLOCK_PROPS.social),
    create: (id) => ({ id, type: 'social', source: 'brand', align: 'center' }),
  },
  video: {
    keys: ['id', 'type', ...Object.keys(BLOCK_PROPS.video)],
    defaults: () => defaultsOf(BLOCK_PROPS.video),
    create: (id) => ({ id, type: 'video', url: '', alt: '', caption: 'Watch the video' }),
  },
  footer: {
    keys: ['id', 'type', ...Object.keys(BLOCK_PROPS.footer)],
    defaults: () => defaultsOf(BLOCK_PROPS.footer),
    create: (id) => ({
      id,
      type: 'footer',
      show_business: true,
      show_address: true,
      show_social: true,
    }),
  },
  html: {
    keys: ['id', 'type', ...Object.keys(BLOCK_PROPS.html)],
    defaults: () => defaultsOf(BLOCK_PROPS.html),
    create: (id) => ({ id, type: 'html', html: '' }),
  },
}

/** A new block of ``type`` with sensible starting content. A blank address
 * (image source, button link, video link) is for the author to fill in;
 * `validateBlockDesign` flags it as a warning. */
export function createBlock(type: BlockType, id: string = newId('b')): Block {
  return BLOCK_SPECS[type].create(id)
}

/* -- layouts -------------------------------------------------------------- */

export type LayoutId = '100' | '50-50' | '33-67' | '67-33' | '33-34-33'

export interface RowLayout {
  id: LayoutId
  label: string
  widths: number[]
}

export const ROW_LAYOUTS: readonly RowLayout[] = [
  { id: '100', label: '100', widths: [100] },
  { id: '50-50', label: '50 / 50', widths: [50, 50] },
  { id: '33-67', label: '33 / 67', widths: [33, 67] },
  { id: '67-33', label: '67 / 33', widths: [67, 33] },
  { id: '33-34-33', label: '33 / 34 / 33', widths: [33, 34, 33] },
]

export function layoutWidths(layout: LayoutId): number[] {
  return [...(ROW_LAYOUTS.find((preset) => preset.id === layout)?.widths ?? [100])]
}

/** The preset a row's column widths match, or ``null`` for custom widths. */
export function layoutOf(row: Row): LayoutId | null {
  const widths = row.columns.map((column) => column.width).join(',')
  return ROW_LAYOUTS.find((preset) => preset.widths.join(',') === widths)?.id ?? null
}

export function createColumn(width = 100, blocks: Block[] = []): Column {
  return { id: newId('c'), width, hide_on: null, valign: 'top', blocks }
}

/** A new row in ``layout``, with ``blocks`` in its first column. */
export function createRow(layout: LayoutId = '100', blocks: Block[] = []): Row {
  return {
    id: newId('r'),
    padding: [...DEFAULT_ROW_PADDING],
    background: null,
    hide_on: null,
    gap: DEFAULT_ROW_GAP,
    columns: layoutWidths(layout).map((width, index) =>
      createColumn(width, index === 0 ? blocks : []),
    ),
  }
}

/**
 * ``row`` in another layout. Columns that stay keep their blocks and settings;
 * new ones are empty; when there are fewer columns, the blocks of the columns
 * that go are appended, in order, to the last one that stays. No block is lost.
 */
export function relayoutRow(row: Row, layout: LayoutId): Row {
  const widths = layoutWidths(layout)
  const kept = row.columns.slice(0, widths.length).map((column, index) => ({
    ...column,
    width: widths[index]!,
    blocks: [...column.blocks],
  }))
  for (let index = kept.length; index < widths.length; index++) {
    kept.push(createColumn(widths[index]!))
  }
  const last = kept[kept.length - 1]!
  for (const column of row.columns.slice(widths.length)) last.blocks.push(...column.blocks)
  return { ...row, columns: kept }
}

/* -- reading and the tree ------------------------------------------------- */

export interface BlockLocation {
  block: Block
  row: Row
  column: Column
  rowIndex: number
  columnIndex: number
  blockIndex: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** The structure of a block design: the right mode and version and a tree of
 * rows, columns and blocks. Field values are `validateBlockDesign`'s job. */
export function isBlockDesign(value: unknown): value is BlockDesign {
  if (!isRecord(value) || value.mode !== 'blocks' || value.version !== DESIGN_VERSION) return false
  if (value.settings !== undefined && !isRecord(value.settings)) return false
  if (!Array.isArray(value.rows)) return false
  return value.rows.every(
    (row) =>
      isRecord(row) &&
      Array.isArray(row.columns) &&
      row.columns.every(
        (column) =>
          isRecord(column) &&
          Array.isArray(column.blocks) &&
          column.blocks.every((block) => isRecord(block) && typeof block.type === 'string'),
      ),
  )
}

/** A stored or partial value as a full block design (missing settings get the
 * defaults). ``null``/``undefined`` is an empty design; anything that is not a
 * block design is ``null``: the caller must not edit it. */
export function toBlockDesign(value: unknown): BlockDesign | null {
  if (value === null || value === undefined) return emptyBlockDesign()
  if (!isBlockDesign(value)) return null
  return withDefaults(value)
}

/**
 * Defaults on read (§1a): the server stores designs compact (a prop equal to
 * its default is dropped), so what a stored design leaves out is filled in
 * here with the same defaults. Props whose absence means "inherit" (a colour,
 * a font, a link) are left alone. The legacy ``style: "pill"`` of a social block
 * becomes the default style. Idempotent.
 */
export function withDefaults(design: BlockDesign): BlockDesign {
  const fill = (defaults: Record<string, unknown>, value: object) => ({ ...defaults, ...value })
  return {
    ...design,
    settings: fill(defaultsOf(SETTINGS_PROPS), design.settings ?? {}) as unknown as BlockSettings,
    rows: (design.rows ?? []).map((row) => ({
      ...fill({ ...defaultsOf(ROW_PROPS), background: null, hide_on: null }, row),
      columns: row.columns.map((column) => ({
        ...fill({ ...defaultsOf(COLUMN_PROPS), background: null, hide_on: null }, column),
        blocks: column.blocks.map((block) => {
          const props = BLOCK_PROPS[block.type as BlockType]
          if (!props) return block
          const filled: Record<string, unknown> = fill(BLOCK_SPECS[block.type].defaults(), block)
          const sub = props.style?.sub
          const style = filled.style
          if (sub) {
            filled.style = fill(defaultsOf(sub), isRecord(style) ? style : {})
          }
          if (block.type === 'video' && !filled.thumbnail) {
            // The server fills a YouTube video's thumbnail; so do we.
            const own = youtubeThumbnail(String(filled.url ?? ''))
            if (own) filled.thumbnail = { src: own }
          }
          return filled as unknown as Block
        }),
      })),
    })) as Row[],
  }
}

export function allBlocks(design: BlockDesign): Block[] {
  return design.rows.flatMap((row) => row.columns.flatMap((column) => column.blocks))
}

export function countBlocks(design: BlockDesign): number {
  return allBlocks(design).length
}

export function hasFooter(design: BlockDesign): boolean {
  return allBlocks(design).some((block) => block.type === 'footer')
}

export function findBlock(design: BlockDesign, id: string): BlockLocation | null {
  for (let rowIndex = 0; rowIndex < design.rows.length; rowIndex++) {
    const row = design.rows[rowIndex]!
    for (let columnIndex = 0; columnIndex < row.columns.length; columnIndex++) {
      const column = row.columns[columnIndex]!
      const blockIndex = column.blocks.findIndex((block) => block.id === id)
      if (blockIndex >= 0) {
        return { block: column.blocks[blockIndex]!, row, column, rowIndex, columnIndex, blockIndex }
      }
    }
  }
  return null
}

export function findRow(design: BlockDesign, id: string): { row: Row; index: number } | null {
  const index = design.rows.findIndex((row) => row.id === id)
  return index >= 0 ? { row: design.rows[index]!, index } : null
}

export function findColumn(
  design: BlockDesign,
  id: string,
): { column: Column; row: Row; rowIndex: number; columnIndex: number } | null {
  for (let rowIndex = 0; rowIndex < design.rows.length; rowIndex++) {
    const row = design.rows[rowIndex]!
    const columnIndex = row.columns.findIndex((column) => column.id === id)
    if (columnIndex >= 0) return { column: row.columns[columnIndex]!, row, rowIndex, columnIndex }
  }
  return null
}

function mapColumns(design: BlockDesign, change: (column: Column) => Column): BlockDesign {
  return {
    ...design,
    rows: design.rows.map((row) => ({ ...row, columns: row.columns.map(change) })),
  }
}

function insertAt<T>(items: T[], index: number, item: T): T[] {
  const at = Math.max(0, Math.min(items.length, index))
  return [...items.slice(0, at), item, ...items.slice(at)]
}

/** ``patch`` merged into the block ``id`` (or a function from the block to the
 * next one). An unknown id leaves the design as it is. */
export function updateBlock<T extends Block = Block>(
  design: BlockDesign,
  id: string,
  patch: Partial<T> | ((block: T) => T),
): BlockDesign {
  if (!findBlock(design, id)) return design
  return mapColumns(design, (column) => {
    if (!column.blocks.some((block) => block.id === id)) return column
    return {
      ...column,
      blocks: column.blocks.map((block) => {
        if (block.id !== id) return block
        return typeof patch === 'function'
          ? patch(block as T)
          : ({ ...block, ...patch, id: block.id, type: block.type } as Block)
      }),
    }
  })
}

export function removeBlock(design: BlockDesign, id: string): BlockDesign {
  if (!findBlock(design, id)) return design
  return mapColumns(design, (column) =>
    column.blocks.some((block) => block.id === id)
      ? { ...column, blocks: column.blocks.filter((block) => block.id !== id) }
      : column,
  )
}

/** Insert ``block`` into the column ``columnId`` at ``index`` (the end when
 * omitted). An unknown column leaves the design as it is. */
export function insertBlock(
  design: BlockDesign,
  block: Block,
  columnId: string,
  index?: number,
): BlockDesign {
  if (!findColumn(design, columnId)) return design
  const placed = mapColumns(design, (column) =>
    column.id === columnId
      ? { ...column, blocks: insertAt(column.blocks, index ?? column.blocks.length, block) }
      : column,
  )
  // A block moved to a narrower column keeps within it.
  return fitColumns(placed, [columnId])
}

/** The most an image may be wide in ``column``: its share of the design width. */
export function columnPixels(design: BlockDesign, column: Pick<Column, 'width'>): number {
  return Math.max(1, Math.floor((design.settings.width * column.width) / 100))
}

/** ``column`` with any image wider than the column sends back to full width,
 * which the server would otherwise refuse. */
function fitImages(design: BlockDesign, column: Column): Column {
  const limit = columnPixels(design, column)
  if (
    !column.blocks.some((b) => b.type === 'image' && typeof b.width === 'number' && b.width > limit)
  )
    return column
  return {
    ...column,
    blocks: column.blocks.map((block) =>
      block.type === 'image' && typeof block.width === 'number' && block.width > limit
        ? { ...block, width: 'full' as const }
        : block,
    ),
  }
}

function fitColumns(design: BlockDesign, ids: string[]): BlockDesign {
  return mapColumns(design, (column) =>
    ids.includes(column.id) ? fitImages(design, column) : column,
  )
}

/** Move the block ``id`` into column ``columnId`` at ``index``, counted after
 * the block has left its old place (so within a column, the index is where it
 * ends up). Works within and across columns and rows. */
export function moveBlock(
  design: BlockDesign,
  id: string,
  to: { columnId: string; index?: number },
): BlockDesign {
  const found = findBlock(design, id)
  if (!found || !findColumn(design, to.columnId)) return design
  const without = removeBlock(design, id)
  return insertBlock(without, found.block, to.columnId, to.index)
}

/** A copy of a block with a new id. */
export function cloneBlockWithNewId(block: Block): Block {
  return { ...JSON.parse(JSON.stringify(block)), id: newId('b') } as Block
}

/** Copy the block ``id`` (new id) right after it. A second footer is refused:
 * the design is returned as it is. */
export function duplicateBlock(design: BlockDesign, id: string): BlockDesign {
  const found = findBlock(design, id)
  if (!found || found.block.type === 'footer') return design
  return insertBlock(
    design,
    cloneBlockWithNewId(found.block),
    found.column.id,
    found.blockIndex + 1,
  )
}

/** A deep copy of ``row`` with a new id for the row, each column and each block. */
export function cloneRowWithNewIds(row: Row): Row {
  const copy = JSON.parse(JSON.stringify(row)) as Row
  return {
    ...copy,
    id: newId('r'),
    columns: copy.columns.map((column) => ({
      ...column,
      id: newId('c'),
      blocks: column.blocks.map((block) => ({ ...block, id: newId('b') }) as Block),
    })),
  }
}

/** Insert ``row`` at ``index`` (the end when omitted). */
export function insertRow(design: BlockDesign, row: Row, index?: number): BlockDesign {
  const placed = { ...design, rows: insertAt(design.rows, index ?? design.rows.length, row) }
  // A saved row made for a wider email keeps within this one.
  return fitColumns(
    placed,
    row.columns.map((c) => c.id),
  )
}

export function removeRow(design: BlockDesign, id: string): BlockDesign {
  return { ...design, rows: design.rows.filter((row) => row.id !== id) }
}

/** Move the row ``id`` so it ends up at ``toIndex``. */
export function moveRow(design: BlockDesign, id: string, toIndex: number): BlockDesign {
  const from = design.rows.findIndex((row) => row.id === id)
  if (from < 0) return design
  const row = design.rows[from]!
  const rest = design.rows.filter((_, index) => index !== from)
  return { ...design, rows: insertAt(rest, toIndex, row) }
}

/** Copy the row ``id`` (new ids all through) right after it. */
export function duplicateRow(design: BlockDesign, id: string): BlockDesign {
  const found = findRow(design, id)
  if (!found) return design
  const copy = cloneRowWithNewIds(found.row)
  copy.columns = copy.columns.map((column) => ({
    ...column,
    blocks: column.blocks.filter((block) => block.type !== 'footer'),
  }))
  return insertRow(design, copy, found.index + 1)
}

export function updateRow(
  design: BlockDesign,
  id: string,
  patch: Partial<Omit<Row, 'id' | 'columns'>>,
): BlockDesign {
  return { ...design, rows: design.rows.map((row) => (row.id === id ? { ...row, ...patch } : row)) }
}

export function updateColumn(
  design: BlockDesign,
  id: string,
  patch: Partial<Omit<Column, 'id' | 'width' | 'blocks'>>,
): BlockDesign {
  return mapColumns(design, (column) => (column.id === id ? { ...column, ...patch } : column))
}

/** Change a row's layout, keeping every block (see `relayoutRow`). An image
 * wider than its new column goes back to full width, which the server would
 * otherwise refuse. */
export function setRowLayout(design: BlockDesign, id: string, layout: LayoutId): BlockDesign {
  const target = design.rows.find((row) => row.id === id)
  if (!target) return design
  const next = relayoutRow(target, layout)
  const placed = { ...design, rows: design.rows.map((row) => (row.id === id ? next : row)) }
  return fitColumns(
    placed,
    next.columns.map((c) => c.id),
  )
}

export function updateSettings(design: BlockDesign, patch: Partial<BlockSettings>): BlockDesign {
  return { ...design, settings: { ...design.settings, ...patch } }
}

/* -- validation ----------------------------------------------------------- */

/** The design as Python's ``json.dumps(ensure_ascii=False)`` writes it (``", "``
 * and ``": "`` separators), which is what the server's size limit counts. */
function pythonJson(value: unknown): string {
  if (value === null || value === undefined) return 'null'
  if (Array.isArray(value)) return `[${value.map(pythonJson).join(', ')}]`
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, v]) => v !== undefined,
    )
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}: ${pythonJson(v)}`).join(', ')}}`
  }
  return JSON.stringify(value)
}

function jsonBytes(value: unknown): number {
  const text = pythonJson(value)
  return typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(text).length : text.length
}

/**
 * The server's rules (`rendering/blocks.py`) as a list of problems with their
 * paths: no errors means nothing the server would refuse. A client mirror for
 * UI hints; the server stays the authority.
 *
 * An unfinished block (an image with no picture, a button with no link) is a
 * ``warning``: the server refuses it too, but the editor lets the author carry
 * on and the host shows the server's message, with `issueTarget` to find the
 * block.
 */
export function validateBlockDesign(value: unknown): BlockDesignIssue[] {
  const ctx: Ctx = {
    issues: [],
    ids: new Set(),
    rows: 0,
    blocks: 0,
    footers: 0,
    width: 600,
    colPx: 600,
  }
  if (!isRecord(value)) {
    fail(ctx, '', 'A design is an object')
    return ctx.issues
  }
  if (value.version !== DESIGN_VERSION) fail(ctx, 'version', `Version must be ${DESIGN_VERSION}`)
  if (value.mode !== 'blocks') fail(ctx, 'mode', 'Mode must be "blocks"')

  if (value.settings === undefined || value.settings === null) {
    // The server fills every setting.
  } else if (checkProps(value.settings, SETTINGS_PROPS, 'settings', ctx)) {
    const width = (value.settings as Record<string, unknown>).width
    if (isInt(width)) ctx.width = ctx.colPx = width
  }

  const checkId = (id: unknown, path: string) => {
    if (typeof id !== 'string' || !ID_PATTERN.test(id))
      return fail(ctx, path, 'An id is 1–40 lower-case letters, digits, "_" or "-"')
    if (ctx.ids.has(id)) fail(ctx, path, `The id "${id}" is used twice`)
    ctx.ids.add(id)
  }

  const checkBlock = (block: unknown, path: string) => {
    if (!isRecord(block)) return fail(ctx, path, 'Must be an object')
    const type = block.type
    if (typeof type !== 'string' || !(BLOCK_TYPES as readonly string[]).includes(type))
      return fail(ctx, join(path, 'type'), `Is not a known block type (${BLOCK_TYPES.join(', ')})`)
    if (++ctx.blocks === MAX_BLOCKS + 1)
      fail(ctx, path, `A design may have at most ${MAX_BLOCKS} blocks`)
    if (type === 'footer' && ++ctx.footers === 2)
      fail(ctx, path, 'A design may have only one footer block')
    checkId(block.id, join(path, 'id'))
    if (checkProps(block, BLOCK_PROPS[type as BlockType], path, ctx, ['id', 'type']))
      BLOCK_POST[type as BlockType]?.(block, path, ctx)
  }

  const checkColumns = (columns: unknown, path: string) => {
    if (!Array.isArray(columns) || columns.length < 1 || columns.length > 3)
      return fail(ctx, path, 'Must be a list of 1 to 3 columns')
    const widths = columns.map((c) => (isRecord(c) ? c.width : undefined))
    if (widths.every(isInt)) {
      const total = (widths as number[]).reduce((a, b) => a + b, 0)
      if (total !== 100)
        fail(ctx, path, `Column widths must add up to 100 (they add up to ${total})`)
    }
    columns.forEach((column, index) => {
      const here = `${path}[${index}]`
      const w = widths[index]
      ctx.colPx = isInt(w) ? Math.floor((ctx.width * w) / 100) : ctx.width
      if (checkProps(column, COLUMN_PROPS, here, ctx, ['id', 'blocks'])) {
        checkId(column.id, join(here, 'id'))
        if (!Array.isArray(column.blocks) && column.blocks !== undefined && column.blocks !== null)
          fail(ctx, join(here, 'blocks'), 'Must be a list')
        else if (Array.isArray(column.blocks))
          column.blocks.forEach((block, i) => checkBlock(block, `${join(here, 'blocks')}[${i}]`))
      }
    })
    ctx.colPx = ctx.width
  }

  const rows = value.rows
  if (rows === undefined) {
    // No rows is an empty email.
  } else if (!Array.isArray(rows)) fail(ctx, 'rows', 'Must be a list')
  else {
    rows.forEach((row, index) => {
      const path = `rows[${index}]`
      if (++ctx.rows === MAX_ROWS + 1) fail(ctx, path, `A design may have at most ${MAX_ROWS} rows`)
      if (checkProps(row, ROW_PROPS, path, ctx, ['id', 'columns'])) {
        checkId(row.id, join(path, 'id'))
        if (row.columns === undefined || row.columns === null)
          fail(ctx, join(path, 'columns'), 'Is required')
        else checkColumns(row.columns, join(path, 'columns'))
      }
    })
  }
  if (jsonBytes(value) > MAX_DESIGN_BYTES)
    fail(ctx, '', `The design is larger than ${MAX_DESIGN_BYTES / 1024} KB`)
  return ctx.issues
}

/** The problems the server would refuse (no warnings). */
export function blockDesignErrors(value: unknown): BlockDesignIssue[] {
  return validateBlockDesign(value).filter((issue) => issue.severity === 'error')
}

export interface IssueTarget {
  kind: 'block' | 'column' | 'row' | 'settings' | 'design'
  /** The id of the block, column or row the path points into (``null`` for
   * the settings and the design as a whole). */
  id: string | null
  /** The block's id when the path points into a block, else ``null``. */
  blockId: string | null
}

/**
 * Where a server error points. The server reports
 * ``rows[0].columns[0].blocks[1].url: must be …``; this maps the path (the
 * whole message is fine, only its leading path is read) to the block, column or
 * row, so the host can select or highlight it.
 */
export function issueTarget(design: BlockDesign, message: string): IssueTarget | null {
  const path = /^[^\s:]*/.exec(message.trim())?.[0] ?? ''
  if (/^settings(\.|\[|$)/.test(path)) return { kind: 'settings', id: null, blockId: null }
  const match = /^rows\[(\d+)\](?:\.columns\[(\d+)\](?:\.blocks\[(\d+)\])?)?/.exec(path)
  if (!match)
    return path === '' || /^(version|mode|rows)$/.test(path)
      ? { kind: 'design', id: null, blockId: null }
      : null
  const row = design.rows[Number(match[1])]
  if (!row) return null
  if (match[2] === undefined) return { kind: 'row', id: row.id, blockId: null }
  const column = row.columns[Number(match[2])]
  if (!column) return { kind: 'row', id: row.id, blockId: null }
  if (match[3] === undefined) return { kind: 'column', id: column.id, blockId: null }
  const block = column.blocks[Number(match[3])]
  return block
    ? { kind: 'block', id: block.id, blockId: block.id }
    : { kind: 'column', id: column.id, blockId: null }
}

/** The id of the block a server error points into, or ``null``. */
export function blockIdForPath(design: BlockDesign, message: string): string | null {
  return issueTarget(design, message)?.blockId ?? null
}
