'use client'

import { useEditorState } from '@tiptap/react'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { MergeFieldPicker } from '../merge-field-picker'
import { ColorPanel, LinkPanel, Tool } from '../toolbar'
import { resolveBrand, BRAND_COLOR_ATTRS, brandRef } from '../design'
import { BRAND_COLOR_LABELS } from './controls'
import { useEditorApi } from './context'
import { Icon } from './icons'
import type { FormatEditor } from './types'

type Panel = null | 'link' | 'color'

const BAR_MAX = 480
const EDGE = 4

/**
 * Where the bar goes, as the cell's own coordinates: inside the canvas's visible width (wrapping
 * to a narrower bar when the canvas is narrow), never under the block's toolbar in the margin,
 * and above the block when the scroll area has room for it, else below. Written straight to the
 * element, so scrolling does not re-render.
 */
function usePlacement(gutter: 'left' | 'right' | null) {
  const bar = useRef<HTMLDivElement | null>(null)
  const [side, setSide] = useState<'above' | 'below'>('below')
  const place = useCallback(() => {
    const element = bar.current
    const cell = element?.parentElement
    const scroller = element?.closest<HTMLElement>('[data-canvas-scroll]')
    if (!element || !cell || !scroller) return
    const view = scroller.getBoundingClientRect()
    const viewLeft = view.left + scroller.clientLeft + EDGE
    const viewRight = view.left + scroller.clientLeft + scroller.clientWidth - EDGE
    const box = cell.getBoundingClientRect()

    // Horizontal: the block's toolbar hangs in the left or right margin, so the bar stays
    // between the block's edges on that side.
    const minX = gutter === 'left' ? Math.max(viewLeft, box.left) : viewLeft
    const maxX = gutter === 'right' ? Math.min(viewRight, box.right) : viewRight
    element.style.maxWidth = `${Math.max(160, Math.min(BAR_MAX, maxX - minX))}px`
    const width = element.offsetWidth
    const x = Math.max(minX, Math.min(box.left + EDGE, maxX - width))
    element.style.left = `${x - box.left}px`

    // Vertical: above when it fits under the top of the scroll area, else below. In a middle
    // column the block's own toolbar is above or below, so the bar takes the other side.
    const height = element.offsetHeight
    let next: 'above' | 'below' = box.top - view.top >= height + 2 * EDGE ? 'above' : 'below'
    if (gutter === null) {
      const toolbar = cell.querySelector<HTMLElement>(':scope > .seb-toolbar-float')
      if (toolbar) {
        const toolbarAbove = box.top - view.top >= toolbar.offsetHeight + EDGE
        next = toolbarAbove ? 'below' : 'above'
      }
    }
    setSide(next)
  }, [gutter])

  useLayoutEffect(() => {
    const element = bar.current
    const scroller = element?.closest<HTMLElement>('[data-canvas-scroll]')
    place()
    if (!element || !scroller) return
    scroller.addEventListener('scroll', place, { passive: true })
    window.addEventListener('resize', place)
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(place) : null
    observer?.observe(scroller)
    observer?.observe(element)
    return () => {
      scroller.removeEventListener('scroll', place)
      window.removeEventListener('resize', place)
      observer?.disconnect()
    }
  }, [place])
  return { bar, side }
}

/**
 * The formatting controls for the heading or text block being edited: marks,
 * link, colour, lists and quotes (text only) and the merge-field picker. It
 * sits above the canvas and drives the block's own editor, so it never covers
 * the email.
 */
export function FormatBar({
  target,
  gutter = null,
}: {
  target: FormatEditor
  /** Which margin the block's toolbar hangs in, so the bar keeps clear of it. */
  gutter?: 'left' | 'right' | null
}) {
  const { editor, kind } = target
  const api = useEditorApi()
  const [panel, setPanel] = useState<Panel>(null)
  const { bar, side } = usePlacement(gutter)
  const colorTrigger = useRef<HTMLButtonElement | null>(null)
  const linkTrigger = useRef<HTMLButtonElement | null>(null)
  /** Close a panel without applying anything; focus goes back to the button that opened it. */
  const cancel = (trigger: { current: HTMLButtonElement | null }) => {
    setPanel(null)
    trigger.current?.focus()
  }
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
      ref={bar}
      className="seb-format"
      data-side={side}
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
            buttonRef={colorTrigger}
            active={panel === 'color'}
            onClick={() => setPanel((p) => (p === 'color' ? null : 'color'))}
          >
            <Icon name="palette" />
          </Tool>
          <Tool
            label="Link"
            buttonRef={linkTrigger}
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
          onCancel={() => cancel(linkTrigger)}
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
          onCancel={() => cancel(colorTrigger)}
        />
      )}
    </div>
  )
}
