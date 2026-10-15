import { useMemo } from 'react'
import { resolveBrand, type TextBlock } from '../../design'
import { AlignInput, Section } from '../controls'
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

function View({ block }: ViewProps<TextBlock>) {
  const api = useEditorApi()
  const selected = api.selection?.kind === 'block' && api.selection.id === block.id
  const style = sharedStyleOf(block)
  const text = {
    textAlign: block.align,
    color: resolveBrand(style.color || 'brand.text_color', api.brand),
    fontSize: style.font_size ?? 16,
    lineHeight: 1.6,
  } as const
  const html = useMemo(
    () => renderInline(block.html, api.mergeFields),
    [block.html, api.mergeFields],
  )
  return (
    <div className="seb-b seb-b-text" style={boxStyle(block, api.brand)}>
      {selected && !api.disabled ? (
        <InlineText
          block={block}
          kind="text"
          className="seb-rt"
          style={text}
          placeholder="Write your text…"
        />
      ) : (
        <div
          className="seb-rt"
          style={text}
          dangerouslySetInnerHTML={{ __html: html || '<p>&nbsp;</p>' }}
        />
      )}
    </div>
  )
}

function Inspector({ block }: InspectorProps<TextBlock>) {
  const { set } = useBlockEdit(block)
  return (
    <>
      <Section title="Text">
        <p className="seb-hint">
          Edit the words on the canvas. Buttons and images are separate blocks.
        </p>
        <AlignInput value={block.align} onChange={(align) => set({ align })} />
      </Section>
      <StyleSection block={block} fields={text.style} />
    </>
  )
}

export const text: BlockModule<TextBlock> = {
  type: 'text',
  label: 'Text',
  icon: 'text',
  summary: (block) => plainText(block.html) || 'empty',
  View,
  Inspector,
  style: ['padding', 'background', 'color', 'font', 'font_size', 'font_weight'],
}
