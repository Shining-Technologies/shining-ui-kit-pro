'use client'

import { useEditorState } from '@tiptap/react'
import { useState } from 'react'
import { MergeFieldPicker } from '../merge-field-picker'
import { ColorPanel, LinkPanel, Tool } from '../toolbar'
import { resolveBrand, BRAND_COLOR_ATTRS, brandRef } from '../design'
import { BRAND_COLOR_LABELS } from './controls'
import { useEditorApi } from './context'
import { Icon } from './icons'
import type { FormatEditor } from './types'

type Panel = null | 'link' | 'color'

/**
 * The formatting controls for the heading or text block being edited: marks,
 * link, colour, lists and quotes (text only) and the merge-field picker. It
 * sits above the canvas and drives the block's own editor, so it never covers
 * the email.
 */
export function FormatBar({ target }: { target: FormatEditor }) {
  const { editor, kind } = target
  const api = useEditorApi()
  const [panel, setPanel] = useState<Panel>(null)
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      link: e.isActive('link'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      href: (e.getAttributes('link').href as string | undefined) ?? '',
    }),
  })
  const chain = () => editor.chain().focus()
  const colors = BRAND_COLOR_ATTRS.map((attr) => ({
    value: resolveBrand(brandRef(attr), api.brand),
    label: `Brand ${BRAND_COLOR_LABELS[attr].toLowerCase()}`,
  }))

  return (
    <div
      className="seb-format"
      // Floats over the canvas under the block, so it never pushes the email down.
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
    >
      <div className="seb-toolbar" role="toolbar" aria-label="Formatting">
        <div className="seb-group">
          <Tool label="Bold" active={state.bold} onClick={() => chain().toggleBold().run()}>
            <Icon name="bold" />
          </Tool>
          <Tool label="Italic" active={state.italic} onClick={() => chain().toggleItalic().run()}>
            <Icon name="italic" />
          </Tool>
          <Tool
            label="Underline"
            active={state.underline}
            onClick={() => chain().toggleUnderline().run()}
          >
            <Icon name="underline" />
          </Tool>
          <Tool
            label="Strikethrough"
            active={state.strike}
            onClick={() => chain().toggleStrike().run()}
          >
            <Icon name="strike" />
          </Tool>
          <Tool
            label="Text colour"
            active={panel === 'color'}
            onClick={() => setPanel((p) => (p === 'color' ? null : 'color'))}
          >
            <Icon name="palette" />
          </Tool>
          <Tool
            label="Link"
            active={state.link || panel === 'link'}
            onClick={() => setPanel((p) => (p === 'link' ? null : 'link'))}
          >
            <Icon name="link" />
          </Tool>
        </div>
        {kind === 'text' && (
          <div className="seb-group">
            <Tool
              label="Bulleted list"
              active={state.bullet}
              onClick={() => chain().toggleBulletList().run()}
            >
              <Icon name="list" />
            </Tool>
            <Tool
              label="Numbered list"
              active={state.ordered}
              onClick={() => chain().toggleOrderedList().run()}
            >
              <Icon name="list-ordered" />
            </Tool>
            <Tool
              label="Quote"
              active={state.quote}
              onClick={() => chain().toggleBlockquote().run()}
            >
              <Icon name="quote" />
            </Tool>
          </div>
        )}
        <div className="seb-group">
          <MergeFieldPicker
            fields={api.mergeFields}
            onSelect={(field, fallback) => chain().insertMergeField(field.key, fallback).run()}
          />
        </div>
      </div>
      {panel === 'link' && (
        <LinkPanel
          initial={state.href}
          onApply={(href) => {
            if (href) chain().extendMarkRange('link').setLink({ href }).run()
            setPanel(null)
          }}
          onRemove={() => {
            chain().extendMarkRange('link').unsetLink().run()
            setPanel(null)
          }}
          onCancel={() => setPanel(null)}
        />
      )}
      {panel === 'color' && (
        <ColorPanel
          colors={colors}
          onApply={(color) => {
            if (color) chain().setColor(color).run()
            else chain().unsetColor().run()
            setPanel(null)
          }}
          onCancel={() => setPanel(null)}
        />
      )}
    </div>
  )
}
