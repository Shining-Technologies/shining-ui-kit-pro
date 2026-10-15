import type { ComponentType, CSSProperties } from 'react'
import {
  DEFAULT_BLOCK_PADDING,
  resolveBrand,
  resolveFont,
  type Block,
  type BlockStyle,
  type BrandPreview,
  type SocialLink,
} from '../../design'
import { ColorInput, FontInput, NumberInput, PaddingInput, Section, Segmented } from '../controls'
import { useEditorApi, type EditResult } from '../context'
import type { IconName } from '../icons'

/** Which of the shared ``style`` fields a block type offers in its inspector. */
export type StyleField = 'padding' | 'background' | 'color' | 'font' | 'font_size' | 'font_weight'

export interface ViewProps<B extends Block> {
  block: B
  /** A width being dragged on the canvas, in pixels (images). */
  live?: number | null
}

export interface InspectorProps<B extends Block> {
  block: B
}

export interface OverlayProps<B extends Block> {
  block: B
  /** The positioned element the handles are drawn in. */
  frame: HTMLElement | null
  onLive: (width: number | null) => void
}

/**
 * Everything the editor knows about one block type, in one place: its palette
 * entry, how the canvas draws it, and its inspector. A new prop for a type is
 * added to its module (and to `BLOCK_SPECS` in `design.ts`).
 */
export interface BlockModule<B extends Block = Block> {
  type: B['type']
  label: string
  icon: IconName
  /** A few words of the block's content, for labels and announcements. */
  summary: (block: B) => string
  View: ComponentType<ViewProps<B>>
  Inspector: ComponentType<InspectorProps<B>>
  /** Which shared style fields the inspector offers. */
  style: StyleField[]
  /** Drawn over the selected block (the image's resize handles). */
  Overlay?: ComponentType<OverlayProps<B>>
}

export function sharedStyleOf(block: Block): BlockStyle {
  const style = (block as { style?: unknown }).style
  return style && typeof style === 'object' ? (style as BlockStyle) : {}
}

/** The text size a block has when ``style.font_size`` is not set: a heading's comes from its level. */
export function defaultFontSize(block: Block): number {
  if (block.type === 'heading') return { 1: 32, 2: 24, 3: 20 }[block.level]
  if (block.type === 'table') return 14
  return block.type === 'footer' ? 12 : 16
}

/** The box a block is drawn in: the shared ``style`` over the type's defaults. */
export function boxStyle(block: Block, brand: BrandPreview): CSSProperties {
  const style = sharedStyleOf(block)
  const padding = style.padding ?? DEFAULT_BLOCK_PADDING[block.type]
  const css: CSSProperties = { padding: padding.map((side) => `${side}px`).join(' ') }
  const background = resolveBrand(style.background, brand)
  if (background) css.background = background
  const color = resolveBrand(style.color, brand)
  if (color) css.color = color
  const font = resolveFont(style.font, brand)
  if (font) css.fontFamily = font
  if (style.font_size) css.fontSize = style.font_size
  if (style.font_weight) css.fontWeight = style.font_weight === 'bold' ? 700 : 400
  return css
}

const NETWORKS: Record<string, string> = {
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  x: 'X',
  twitter: 'X',
  facebook: 'Facebook',
  instagram: 'Instagram',
  pinterest: 'Pinterest',
  whatsapp: 'WhatsApp',
}

export function pillLabel(link: SocialLink): string {
  const name = link.network.trim() || 'Link'
  return NETWORKS[name.toLowerCase()] ?? name.charAt(0).toUpperCase() + name.slice(1)
}

/** Edits for one block: ``set`` merges a patch, ``setStyle`` merges the shared style. */
export function useBlockEdit<B extends Block>(block: B) {
  const api = useEditorApi()
  const set = (patch: Partial<B>, key?: string): EditResult =>
    api.updateBlock(block.id, patch as Partial<Block>, key ? `${block.id}:${key}` : undefined)
  const setStyle = (patch: Partial<BlockStyle>, key?: string): EditResult => {
    const merged: Record<string, unknown> = { ...sharedStyleOf(block), ...patch }
    for (const name of Object.keys(merged)) if (merged[name] == null) delete merged[name]
    return api.updateBlock(
      block.id,
      { style: Object.keys(merged).length ? merged : undefined } as Partial<Block>,
      key ? `${block.id}:style.${key}` : undefined,
    )
  }
  return { api, set, setStyle }
}

/** The shared style fields (§1a) a block type offers. */
export function StyleSection({ block, fields }: { block: Block; fields: StyleField[] }) {
  const { api, setStyle } = useBlockEdit(block)
  if (fields.length === 0) return null
  const style = sharedStyleOf(block)
  const has = (field: StyleField) => fields.includes(field)
  return (
    <Section title="Style">
      {has('padding') && (
        <PaddingInput
          value={style.padding}
          fallback={DEFAULT_BLOCK_PADDING[block.type]}
          max={80}
          nullable
          onChange={(padding) => setStyle({ padding })}
        />
      )}
      {has('background') && (
        <ColorInput
          label="Background"
          value={style.background}
          brand={api.brand}
          clearable
          onChange={(background) => setStyle({ background })}
        />
      )}
      {has('color') && (
        <ColorInput
          label="Text colour"
          value={style.color}
          brand={api.brand}
          clearable
          onChange={(color) => setStyle({ color })}
        />
      )}
      {has('font') && (
        <FontInput
          value={style.font}
          clearable
          onChange={(font) => {
            setStyle({ font })
          }}
        />
      )}
      {has('font_size') && (
        <NumberInput
          label="Font size"
          value={style.font_size ?? defaultFontSize(block)}
          min={12}
          max={32}
          unit="px"
          onChange={(font_size) => setStyle({ font_size }, 'font_size')}
        />
      )}
      {has('font_weight') && (
        <Segmented
          label="Weight"
          value={style.font_weight ?? null}
          options={[
            { value: 'normal', label: 'Normal' },
            { value: 'bold', label: 'Bold' },
          ]}
          onChange={(font_weight) => setStyle({ font_weight })}
        />
      )}
    </Section>
  )
}
