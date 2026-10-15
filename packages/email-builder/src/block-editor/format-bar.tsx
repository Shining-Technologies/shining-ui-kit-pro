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
 * Where the bar goes, as the cell's own coordinates: inside the canvas's visible region
 * (wrapping to a narrower bar when the canvas is narrow), never under the block's toolbar in the
 * margin, and above the block when the scroll area has room for it, else below. In a middle
 * column the block's toolbar is above or below too; the bar takes the other side, or, when
 * neither side has room, stacks under the toolbar. Written straight to the element, once a
 * frame, so scrolling does not re-render.
 */
function usePlacement(gutter: 'left' | 'right' | null, kind: string) {
  const bar = useRef<HTMLDivElement | null>(null)
  const [side, setSide] = useState<'above' | 'below'>('below')
  const natural = useRef<{ kind: string; width: number } | null>(null)
  const applied = useRef({ maxWidth: '', left: '', top: '' })

  const place = useCallback(() => {
    const element = bar.current
    const cell = element?.parentElement
    const scroller = element?.closest<HTMLElement>('[data-canvas-scroll]')
    if (!element || !cell || !scroller) return

    // The bar's width without any limit, measured once per kind of block (it only changes then).
    if (natural.current?.kind !== kind) {
      element.style.maxWidth = `${BAR_MAX}px`
      natural.current = { kind, width: element.offsetWidth }
      applied.current.maxWidth = element.style.maxWidth
    }

    // Reads first ...
    const view = scroller.getBoundingClientRect()
    const viewLeft = view.left + scroller.clientLeft + EDGE
    const viewRight = view.left + scroller.clientLeft + scroller.clientWidth - EDGE
    const viewTop = view.top + scroller.clientTop + EDGE
    const viewBottom = view.top + scroller.clientTop + scroller.clientHeight - EDGE
    const box = cell.getBoundingClientRect()
    const toolbar =
      gutter === null ? cell.querySelector<HTMLElement>(':scope > .seb-toolbar-float') : null
    const toolbarHeight = toolbar ? toolbar.offsetHeight : 0

    // ... then writes. The block's toolbar hangs in the left or right margin, so the bar stays
    // between the block's edges on that side.
    const minX = gutter === 'left' ? Math.max(viewLeft, box.left) : viewLeft
    const maxX = gutter === 'right' ? Math.min(viewRight, box.right) : viewRight
    const maxWidth = `${Math.max(160, Math.min(BAR_MAX, maxX - minX))}px`
    const width = Math.min(natural.current.width, Number.parseFloat(maxWidth))
    const left = `${Math.max(minX, Math.min(box.left + EDGE, maxX - width)) - box.left}px`
    if (applied.current.maxWidth !== maxWidth) element.style.maxWidth = maxWidth
    if (applied.current.left !== left) element.style.left = left
    applied.current.maxWidth = maxWidth
    applied.current.left = left

    // Vertical, with the height the bar has at that width (one layout for the frame).
    const height = element.offsetHeight
    const roomAbove = box.top - viewTop
    const toolbarAbove = Boolean(toolbar) && roomAbove >= toolbarHeight + EDGE
    const fitsAbove = roomAbove >= height + EDGE
    let next: 'above' | 'below'
    let top: number // viewport coordinates
    if (fitsAbove && !toolbarAbove) {
      next = 'above'
      top = box.top - height - EDGE + 1
    } else if (toolbar && !toolbarAbove) {
      // The toolbar is below the block and the bar has no room above: stack it under the toolbar.
      next = 'below'
      top = box.bottom + 3 + toolbarHeight + EDGE
    } else {
      next = 'below'
      top = box.bottom + 3
    }
    // Always inside the visible region, even beside a block that runs past it.
    top = Math.max(viewTop, Math.min(top, viewBottom - height))
    const topValue = `${top - box.top}px`
    if (applied.current.top !== topValue) element.style.top = topValue
    applied.current.top = topValue
    setSide(next)
  }, [gutter, kind])

  useLayoutEffect(() => {
    const element = bar.current
    const cell = element?.parentElement
    const scroller = element?.closest<HTMLElement>('[data-canvas-scroll]')
    place()
    if (!element || !cell || !scroller) return
    let frame = 0
    const later = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        place()
      })
    }
    scroller.addEventListener('scroll', later, { passive: true })
    window.addEventListener('resize', later)
    // The scroll area, the block (a device or width change moves it) and the bar itself.
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(later) : null
    observer?.observe(scroller)
    observer?.observe(cell)
    observer?.observe(element)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      scroller.removeEventListener('scroll', later)
      window.removeEventListener('resize', later)
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
  const { bar, side } = usePlacement(gutter, kind)
  // Which way the open panel drops, decided when it opens from the room in the scroll area.
  const [panelDir, setPanelDir] = useState<'down' | 'up'>('down')
  useLayoutEffect(() => {
    const element = bar.current
    const panelElement = element?.querySelector<HTMLElement>('.seb-inline-panel')
    const scroller = element?.closest<HTMLElement>('[data-canvas-scroll]')
    if (!element || !panelElement || !scroller) return
    const view = scroller.getBoundingClientRect()
    const box = element.getBoundingClientRect()
    const need = panelElement.offsetHeight + EDGE * 2
    const below = view.top + scroller.clientTop + scroller.clientHeight - box.bottom
    const above = box.top - (view.top + scroller.clientTop)
    // Away from the block when there is room (up from a bar above it, down from one below),
    // else the other way, else wherever there is more.
    const prefer = side === 'above' ? 'up' : 'down'
    const room = { up: above, down: below }
    const other = prefer === 'up' ? 'down' : 'up'
    setPanelDir(
      room[prefer] >= need
        ? prefer
        : room[other] >= need
          ? other
          : room.up > room.down
            ? 'up'
            : 'down',
    )
    // Only when a panel opens: it must not jump while it is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel])
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
      data-panel={panel ? panelDir : undefined}
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
