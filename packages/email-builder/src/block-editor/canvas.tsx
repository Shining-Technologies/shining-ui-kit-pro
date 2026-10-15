'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, type SortingStrategy } from '@dnd-kit/sortable'
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import {
  BLOCK_TYPES,
  DEFAULT_ROW_GAP,
  ROW_LAYOUTS,
  hasFooter,
  layoutOf,
  resolveBrand,
  resolveFont,
  type Block,
  type Column,
  type HideOn,
  type Row,
} from '../design'
import { blockLabel, blockModule, blockSummary } from './blocks'
import { ColorInput, SelectInput } from './controls'
import { useEditorApi } from './context'
import { CANVAS_END } from './drop'
import { deviceWidth, isHiddenOn } from './devices'
import { FormatBar } from './format-bar'
import { Icon } from './icons'

/** Items do not shift while dragging: the drop line shows where the item lands. */
const noShift: SortingStrategy = () => null

const VALIGN = { top: 'flex-start', middle: 'center', bottom: 'flex-end' } as const

/* -- small pieces ------------------------------------------------------------ */

/** Above the element, or below it when the pane would clip it. */
function useToolbarSide() {
  const bar = useRef<HTMLDivElement | null>(null)
  const [side, setSide] = useState<'above' | 'below'>('above')
  useLayoutEffect(() => {
    const element = bar.current
    const host = element?.parentElement
    if (!element || !host) return
    const scrollers: HTMLElement[] = []
    let node: HTMLElement | null = element.parentElement
    for (; node; node = node.parentElement) {
      if (node.hasAttribute('data-canvas-scroll')) scrollers.push(node)
    }
    if (scrollers.length === 0) return
    const place = () => {
      const top = Math.max(...scrollers.map((s) => s.getBoundingClientRect().top))
      const room = host.getBoundingClientRect().top - top
      setSide(room < element.getBoundingClientRect().height + 4 ? 'below' : 'above')
    }
    place()
    scrollers.forEach((s) => s.addEventListener('scroll', place, { passive: true }))
    return () => scrollers.forEach((s) => s.removeEventListener('scroll', place))
  }, [])
  return { bar, side }
}

function IconButton({
  label,
  icon,
  onClick,
  disabled,
  danger,
  pressed,
}: {
  label: string
  icon: Parameters<typeof Icon>[0]['name']
  onClick?: () => void
  disabled?: boolean
  danger?: boolean
  pressed?: boolean
}) {
  return (
    <button
      type="button"
      className="seb-icon-btn"
      data-danger={danger || undefined}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon name={icon} />
    </button>
  )
}

function Popover({
  label,
  icon,
  children,
}: {
  label: string
  icon: Parameters<typeof Icon>[0]['name']
  children: (close: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [open])
  return (
    <div
      className="seb-popover-host"
      ref={root}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.stopPropagation()
          setOpen(false)
        }
      }}
    >
      <button
        type="button"
        className="seb-icon-btn"
        aria-label={label}
        title={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name={icon} />
      </button>
      {open && (
        <div className="seb-popover" role="dialog" aria-label={label}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

export function SaveRowForm({ rowId, onDone }: { rowId: string; onDone?: () => void }) {
  const api = useEditorApi()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <form
      className="seb-save-form"
      onSubmit={async (event) => {
        event.preventDefault()
        if (!name.trim()) return setError('Give the row a name')
        setBusy(true)
        setError('')
        const refused = await api.savedRows
          .saveRow(rowId, name.trim())
          .catch((caught: unknown) =>
            caught instanceof Error ? caught.message : 'The row could not be saved',
          )
        setBusy(false)
        if (refused) return setError(refused)
        setName('')
        onDone?.()
      }}
    >
      <label className="seb-field">
        <span>Name</span>
        <input
          className="seb-input"
          value={name}
          maxLength={120}
          placeholder="e.g. Signature"
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      {error && (
        <small className="seb-error" role="alert">
          {error}
        </small>
      )}
      <button type="submit" className="seb-action seb-action-primary" disabled={busy}>
        Save row
      </button>
    </form>
  )
}

/** A "+" between blocks and in an empty column, shown on hover or focus. */
function InsertPoint({
  columnId,
  index,
  where,
}: {
  columnId: string
  index: number
  where: 'before' | 'after' | 'empty'
}) {
  const api = useEditorApi()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [open])
  if (api.disabled) return null
  const footerTaken = hasFooter(api.design)
  return (
    <div
      className="seb-insert"
      data-where={where}
      data-open={open || undefined}
      ref={root}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.stopPropagation()
          setOpen(false)
        }
      }}
    >
      <button
        type="button"
        className="seb-insert-btn"
        aria-label="Add a block here"
        title="Add a block here"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="plus" width={14} height={14} />
      </button>
      {open && (
        <div className="seb-menu" role="menu" aria-label="Add a block">
          {BLOCK_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              role="menuitem"
              className="seb-menu-item"
              disabled={type === 'footer' && footerTaken}
              onClick={() => {
                setOpen(false)
                api.addBlockAt(type, columnId, index)
              }}
            >
              <Icon name={blockModule(type).icon} />
              {blockLabel(type)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function HiddenLabel({ hideOn }: { hideOn: Exclude<HideOn, null> }) {
  return (
    <span className="seb-hidden-label" role="note">
      Hidden on {hideOn}
    </span>
  )
}

/* -- blocks ---------------------------------------------------------------- */

function BlockToolbar({
  block,
  activatorRef,
  dragProps,
  first,
  last,
  gutter,
}: {
  block: Block
  activatorRef: (el: HTMLElement | null) => void
  dragProps: object
  first: boolean
  last: boolean
  /** Beside the block, in the margin, so it never covers the block above. */
  gutter: 'left' | 'right' | null
}) {
  const api = useEditorApi()
  const { bar, side } = useToolbarSide()
  return (
    <div
      ref={bar}
      className="seb-toolbar-float"
      data-side={side}
      data-gutter={gutter ?? undefined}
      role="toolbar"
      aria-label={`${blockLabel(block.type)} block actions`}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        ref={activatorRef}
        className="seb-icon-btn seb-grip"
        aria-label="Drag to reorder"
        title="Drag to reorder"
        {...dragProps}
      >
        <Icon name="grip" />
      </button>
      <IconButton
        label="Move up"
        icon="up"
        disabled={first}
        onClick={() => api.nudgeBlock(block.id, -1)}
      />
      <IconButton
        label="Move down"
        icon="down"
        disabled={last}
        onClick={() => api.nudgeBlock(block.id, 1)}
      />
      <IconButton
        label="Duplicate"
        icon="copy"
        disabled={block.type === 'footer'}
        onClick={() => api.duplicateBlock(block.id)}
      />
      <IconButton label="Delete" icon="trash" danger onClick={() => api.removeBlock(block.id)} />
    </div>
  )
}

function BlockCell({
  block,
  column,
  index,
  gutter,
}: {
  block: Block
  column: Column
  index: number
  gutter: 'left' | 'right' | null
}) {
  const api = useEditorApi()
  const mod = blockModule(block.type)
  const [frame, setFrame] = useState<HTMLElement | null>(null)
  const [live, setLive] = useState<number | null>(null)
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useSortable({
    id: block.id,
    disabled: api.disabled,
    data: { kind: 'block', columnId: column.id },
  })
  const selected = api.selection?.kind === 'block' && api.selection.id === block.id
  const hint = api.dropHint?.id === block.id ? api.dropHint.position : undefined
  const summary = blockSummary(block)

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter') {
      event.preventDefault()
      api.select({ kind: 'block', id: block.id }, 'end')
    } else if (api.disabled) {
      return
    } else if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault()
      api.nudgeBlock(block.id, event.key === 'ArrowUp' ? -1 : 1)
    } else if (event.altKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault()
      api.nudgeBlockSideways(block.id, event.key === 'ArrowLeft' ? -1 : 1)
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      api.removeBlock(block.id)
    }
  }

  const View = mod.View as (props: { block: Block; live?: number | null }) => ReactNode
  const Overlay = mod.Overlay as
    | ((props: {
        block: Block
        frame: HTMLElement | null
        onLive: (w: number | null) => void
      }) => ReactNode)
    | undefined

  return (
    <div
      ref={(el) => {
        setNodeRef(el)
        setFrame(el)
      }}
      className="seb-cell"
      data-block-id={block.id}
      data-type={block.type}
      data-selected={selected || undefined}
      data-dragging={isDragging || undefined}
      data-drop={hint}
      tabIndex={0}
      role="group"
      aria-label={`${blockLabel(block.type)} block${summary ? `: ${summary}` : ''}`}
      aria-current={selected ? 'true' : undefined}
      onClick={(event) => {
        event.stopPropagation()
        // A click inside the text being edited already placed the caret.
        if ((event.target as HTMLElement).closest('.ProseMirror, .seb-format')) return
        api.select(
          { kind: 'block', id: block.id },
          // The caret goes where the pointer was.
          { x: event.clientX, y: event.clientY },
        )
      }}
      onKeyDown={onKeyDown}
    >
      {index === 0 && <InsertPoint columnId={column.id} index={0} where="before" />}
      {selected && !api.disabled && (
        <BlockToolbar
          block={block}
          activatorRef={setActivatorNodeRef}
          dragProps={{ ...attributes, ...listeners }}
          first={index === 0}
          last={index === column.blocks.length - 1}
          gutter={gutter}
        />
      )}
      {selected &&
        !api.disabled &&
        api.formatEditor &&
        !api.formatEditor.editor.isDestroyed &&
        (block.type === 'text' || block.type === 'heading') && (
          <FormatBar target={api.formatEditor} />
        )}
      <View block={block} live={live} />
      {selected && !api.disabled && Overlay && (
        <Overlay block={block} frame={frame} onLive={setLive} />
      )}
      <InsertPoint columnId={column.id} index={index + 1} where="after" />
    </div>
  )
}

/* -- columns and rows ------------------------------------------------------ */

function ColumnView({ column, gutter }: { column: Column; gutter: 'left' | 'right' | null }) {
  const api = useEditorApi()
  const { setNodeRef } = useDroppable({ id: column.id, data: { kind: 'column' } })
  const selected = api.selection?.kind === 'column' && api.selection.id === column.id
  const hidden = isHiddenOn(column.hide_on, api.device)
  const hint = api.dropHint?.id === column.id ? api.dropHint.position : undefined
  const mobile = api.device === 'mobile'
  const pad = column.padding ?? [0, 0, 0, 0]
  return (
    <div
      ref={setNodeRef}
      className="seb-col"
      data-column-id={column.id}
      data-selected={selected || undefined}
      data-hidden={hidden || undefined}
      data-drop={hint}
      style={{
        flex: mobile ? '0 0 auto' : `${column.width} 1 0%`,
        width: mobile ? '100%' : undefined,
        background: resolveBrand(column.background, api.brand) || undefined,
      }}
      onClick={(event) => {
        event.stopPropagation()
        api.select({ kind: 'column', id: column.id })
      }}
    >
      {hidden && column.hide_on && <HiddenLabel hideOn={column.hide_on} />}
      <SortableContext items={column.blocks.map((b) => b.id)} strategy={noShift} id={column.id}>
        <div
          className="seb-col-inner"
          style={{
            padding: pad.map((side) => `${side}px`).join(' '),
            justifyContent: VALIGN[column.valign],
          }}
        >
          {column.blocks.map((block, index) => (
            <BlockCell key={block.id} block={block} column={column} index={index} gutter={gutter} />
          ))}
          {column.blocks.length === 0 && (
            <div className="seb-col-empty">
              <span>Drop a block here</span>
              <InsertPoint columnId={column.id} index={0} where="empty" />
            </div>
          )}
        </div>
      </SortableContext>
      <span className="seb-col-tag" aria-hidden="true">
        {column.width}%
      </span>
    </div>
  )
}

function RowToolbar({
  row,
  activatorRef,
  dragProps,
  index,
  count,
}: {
  row: Row
  activatorRef: (el: HTMLElement | null) => void
  dragProps: object
  index: number
  count: number
}) {
  const api = useEditorApi()
  const { bar, side } = useToolbarSide()
  const current = layoutOf(row)
  return (
    <div
      ref={bar}
      className="seb-toolbar-float seb-row-toolbar"
      data-side={side}
      role="toolbar"
      aria-label={`Row ${index + 1} actions`}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        ref={activatorRef}
        className="seb-icon-btn seb-grip"
        aria-label="Drag row to reorder"
        title="Drag row to reorder"
        {...dragProps}
      >
        <Icon name="grip" />
      </button>
      <IconButton
        label="Move row up"
        icon="up"
        disabled={index === 0}
        onClick={() => api.nudgeRow(row.id, -1)}
      />
      <IconButton
        label="Move row down"
        icon="down"
        disabled={index === count - 1}
        onClick={() => api.nudgeRow(row.id, 1)}
      />
      <Popover label="Row layout" icon="layout">
        {(close) => (
          <div className="seb-layout-choices">
            {ROW_LAYOUTS.map((layout) => (
              <button
                key={layout.id}
                type="button"
                className="seb-tile"
                aria-label={`Change to ${layout.label}`}
                aria-pressed={current === layout.id}
                onClick={() => {
                  api.setLayout(row.id, layout.id)
                  close()
                }}
              >
                <span className="seb-layout-preview" aria-hidden="true">
                  {layout.widths.map((width, i) => (
                    <span key={i} style={{ flex: `${width} 1 0` }} />
                  ))}
                </span>
                <span>{layout.label}</span>
              </button>
            ))}
          </div>
        )}
      </Popover>
      <Popover label="Row background" icon="paint">
        {() => (
          <ColorInput
            label="Row background"
            value={row.background}
            brand={api.brand}
            clearable
            onChange={(background) => api.updateRow(row.id, { background })}
          />
        )}
      </Popover>
      <Popover label="Row visibility" icon="eye">
        {() => (
          <SelectInput
            label="Hide this row on"
            value={row.hide_on ?? 'none'}
            options={[
              { value: 'none', label: 'Nothing (show everywhere)' },
              { value: 'mobile', label: 'Mobile' },
              { value: 'desktop', label: 'Desktop' },
            ]}
            onChange={(value) =>
              api.updateRow(row.id, { hide_on: value === 'none' ? null : value })
            }
          />
        )}
      </Popover>
      {api.savedRows.enabled && (
        <Popover label="Save as row" icon="save">
          {(close) => <SaveRowForm rowId={row.id} onDone={close} />}
        </Popover>
      )}
      <IconButton label="Duplicate row" icon="copy" onClick={() => api.duplicateRow(row.id)} />
      <IconButton label="Delete row" icon="trash" danger onClick={() => api.removeRow(row.id)} />
    </div>
  )
}

function RowView({ row, index, count }: { row: Row; index: number; count: number }) {
  const api = useEditorApi()
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useSortable({
    id: row.id,
    disabled: api.disabled,
    data: { kind: 'row' },
  })
  const selected = api.selection?.kind === 'row' && api.selection.id === row.id
  const hidden = isHiddenOn(row.hide_on, api.device)
  const hint = api.dropHint?.id === row.id ? api.dropHint.position : undefined
  const mobile = api.device === 'mobile'

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter') {
      event.preventDefault()
      api.select({ kind: 'row', id: row.id })
    } else if (api.disabled) {
      return
    } else if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault()
      api.nudgeRow(row.id, event.key === 'ArrowUp' ? -1 : 1)
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      api.removeRow(row.id)
    }
  }

  return (
    <div
      ref={setNodeRef}
      className="seb-row"
      data-row-id={row.id}
      data-selected={selected || undefined}
      data-hidden={hidden || undefined}
      data-dragging={isDragging || undefined}
      data-drop={hint}
      tabIndex={0}
      role="group"
      aria-label={`Row ${index + 1}`}
      aria-current={selected ? 'true' : undefined}
      onClick={(event) => {
        event.stopPropagation()
        api.select({ kind: 'row', id: row.id })
      }}
      onKeyDown={onKeyDown}
    >
      {hidden && row.hide_on && <HiddenLabel hideOn={row.hide_on} />}
      {selected && !api.disabled && (
        <RowToolbar
          row={row}
          activatorRef={setActivatorNodeRef}
          dragProps={{ ...attributes, ...listeners }}
          index={index}
          count={count}
        />
      )}
      <div
        className="seb-row-inner"
        style={{
          padding: row.padding.map((side) => `${side}px`).join(' '),
          background: resolveBrand(row.background, api.brand) || undefined,
        }}
      >
        <div
          className="seb-columns"
          data-stacked={mobile || undefined}
          style={{ gap: mobile ? 0 : (row.gap ?? DEFAULT_ROW_GAP) }}
        >
          {row.columns.map((column, i) => (
            <ColumnView
              key={column.id}
              column={column}
              // The first column's toolbar hangs in the left margin, the last one's in the right.
              gutter={
                row.columns.length === 1 || i === row.columns.length - 1
                  ? 'right'
                  : i === 0
                    ? 'left'
                    : null
              }
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* -- the canvas ------------------------------------------------------------ */

/** Centre pane: a client-side approximation of the email at the device's real width. */
export function Canvas() {
  const api = useEditorApi()
  const { design, brand, device } = api
  const { settings } = design
  const { setNodeRef } = useDroppable({ id: CANVAS_END, data: { kind: 'canvas-end' } })
  const hint = api.dropHint?.id === CANVAS_END
  const width = deviceWidth(device, settings.width)
  const logo = brand.logo_url
  const [top, right, bottom, left] = settings.padding

  return (
    <div
      className="seb-canvas"
      data-canvas-scroll
      style={{ background: resolveBrand(settings.background, brand) }}
      onClick={() => api.select(null)}
    >
      <div
        className="seb-email"
        data-device={device}
        style={{
          width,
          background: resolveBrand(settings.content_background, brand),
          fontFamily: resolveFont(settings.font, brand),
          color: resolveBrand('brand.text_color', brand),
          padding: `${top}px ${right}px ${bottom}px ${left}px`,
        }}
      >
        {logo && (
          <div
            className="seb-logo"
            style={{ textAlign: (brand.logo_alignment as 'left') || 'center' }}
          >
            <img
              src={logo}
              alt={brand.logo_alt ?? ''}
              width={brand.logo_width ?? 160}
              draggable={false}
            />
          </div>
        )}
        <SortableContext items={design.rows.map((row) => row.id)} strategy={noShift}>
          {design.rows.map((row, index) => (
            <RowView key={row.id} row={row} index={index} count={design.rows.length} />
          ))}
        </SortableContext>
        <div
          ref={setNodeRef}
          className="seb-end"
          data-empty={design.rows.length === 0 || undefined}
          data-drop={hint ? 'inside' : undefined}
        >
          {design.rows.length === 0 ? (
            <>
              <strong>This email is empty</strong>
              <span>
                {api.disabled
                  ? 'Nothing has been added yet.'
                  : 'Drag a layout or block here, or click one in the palette to add it.'}
              </span>
            </>
          ) : (
            !api.disabled && <span>Drop here to add at the end</span>
          )}
        </div>
      </div>
    </div>
  )
}
