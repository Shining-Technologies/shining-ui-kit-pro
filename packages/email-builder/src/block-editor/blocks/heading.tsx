import { useMemo } from 'react'
import { resolveBrand, resolveFont, type HeadingBlock } from '../../design'
import { AlignInput, ColorInput, Segmented, Section } from '../controls'
import { InlineText } from '../inline-text'
import { useEditorApi } from '../context'
import { plainText, renderInline } from '../sanitize'
import {
  boxStyle,
  sharedStyleOf,
  StyleSection,
  useBlockEdit,
  type BlockModule,
  type InspectorProps,
  type ViewProps,
} from './shared'

const SIZES = { 1: 32, 2: 24, 3: 20 } as const

function View({ block }: ViewProps<HeadingBlock>) {
  const api = useEditorApi()
  const selected = api.selection?.kind === 'block' && api.selection.id === block.id
  const style = sharedStyleOf(block)
  const text = {
    margin: 0,
    textAlign: block.align,
    color: resolveBrand(block.color, api.brand),
    fontFamily: resolveFont(style.font, api.brand) || resolveBrand('brand.heading_font', api.brand),
    fontSize: style.font_size ?? SIZES[block.level],
    fontWeight: style.font_weight === 'normal' ? 400 : 700,
    lineHeight: 1.25,
  } as const
  const html = useMemo(
    () => renderInline(block.html, api.mergeFields),
    [block.html, api.mergeFields],
  )
  return (
    <div className="seb-b seb-b-heading" style={boxStyle(block, api.brand)}>
      {selected && !api.disabled ? (
        <InlineText block={block} kind="heading" style={text} placeholder="Heading" />
      ) : (
        <div
          role="heading"
          aria-level={block.level}
          style={text}
          dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }}
        />
      )}
    </div>
  )
}

function Inspector({ block }: InspectorProps<HeadingBlock>) {
  const { api, set } = useBlockEdit(block)
  return (
    <>
      <Section title="Heading">
        <p className="seb-hint">Edit the words on the canvas.</p>
        <Segmented
          label="Level"
          value={block.level}
          options={[
            { value: 1, label: 'H1' },
            { value: 2, label: 'H2' },
            { value: 3, label: 'H3' },
          ]}
          onChange={(level) => set({ level: level as 1 | 2 | 3 })}
        />
        <AlignInput value={block.align} onChange={(align) => set({ align })} />
        <ColorInput
          label="Colour"
          value={block.color}
          brand={api.brand}
          onChange={(color) => set({ color: color ?? 'brand.text_color' })}
        />
      </Section>
      <StyleSection block={block} fields={heading.style} />
    </>
  )
}

export const heading: BlockModule<HeadingBlock> = {
  type: 'heading',
  label: 'Heading',
  icon: 'heading',
  summary: (block) => plainText(block.html) || 'empty',
  View,
  Inspector,
  style: ['padding', 'background', 'font', 'font_size', 'font_weight'],
}
