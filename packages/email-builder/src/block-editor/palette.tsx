'use client'

import { useDraggable } from '@dnd-kit/core'
import { useState, type PointerEventHandler, type ReactNode } from 'react'
import { BLOCK_TYPES, ROW_LAYOUTS, hasFooter, type BlockType, type LayoutId } from '../design'
import { BLOCKS } from './blocks'
import { useEditorApi } from './context'
import { paletteId } from './drop'
import { Icon } from './icons'
import type { SavedRow } from './types'

/**
 * A tile that drags with the pointer only: Space and Enter stay a plain click
 * that adds the block (keyboard users also have the cell shortcuts and the "+"
 * insertion points).
 */
function Tile({
  id,
  label,
  title,
  disabled,
  onAdd,
  children,
}: {
  id: string
  label: string
  title?: string
  disabled?: boolean
  onAdd: () => void
  children: ReactNode
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    disabled,
    data: {
      kind:
        id.split(':')[1] === 'block'
          ? 'palette-block'
          : id.split(':')[1] === 'layout'
            ? 'palette-layout'
            : 'palette-saved',
    },
  })
  return (
    <button
      ref={setNodeRef}
      type="button"
      className="seb-tile"
      aria-label={label}
      title={title ?? label}
      disabled={disabled}
      data-dragging={isDragging || undefined}
      aria-roledescription={attributes['aria-roledescription']}
      onPointerDown={listeners?.onPointerDown as PointerEventHandler<HTMLButtonElement> | undefined}
      onClick={onAdd}
    >
      {children}
    </button>
  )
}

function LayoutPreview({ widths }: { widths: number[] }) {
  return (
    <span className="seb-layout-preview" aria-hidden="true">
      {widths.map((width, index) => (
        <span key={index} style={{ flex: `${width} 1 0` }} />
      ))}
    </span>
  )
}

function SavedItem({ saved, onInsert }: { saved: SavedRow; onInsert: () => void }) {
  const api = useEditorApi()
  const [confirming, setConfirming] = useState(false)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: paletteId.saved(saved.id),
    data: { kind: 'palette-saved' },
  })
  return (
    <li className="seb-saved-item">
      <button
        ref={setNodeRef}
        type="button"
        className="seb-saved-main"
        data-dragging={isDragging || undefined}
        aria-roledescription={attributes['aria-roledescription']}
        onPointerDown={
          listeners?.onPointerDown as PointerEventHandler<HTMLButtonElement> | undefined
        }
        onClick={onInsert}
        title={`Insert “${saved.name}”`}
      >
        <Icon name="layout" />
        <span>{saved.name}</span>
      </button>
      {confirming ? (
        <span className="seb-saved-confirm">
          <button
            type="button"
            className="seb-action seb-action-danger"
            onClick={() => void api.savedRows.removeSaved(saved.id)}
          >
            Delete “{saved.name}”?
          </button>
          <button type="button" className="seb-action" onClick={() => setConfirming(false)}>
            Keep
          </button>
        </span>
      ) : (
        <button
          type="button"
          className="seb-icon-btn"
          aria-label={`Delete saved row ${saved.name}`}
          title="Delete saved row"
          onClick={() => setConfirming(true)}
        >
          <Icon name="trash" />
        </button>
      )}
    </li>
  )
}

/** Left pane: layouts, blocks and saved rows, to drag onto the canvas or click to add. */
export function Palette({
  onAddBlock,
  onAddLayout,
  onInsertSaved,
}: {
  onAddBlock: (type: BlockType) => void
  onAddLayout: (layout: LayoutId) => void
  onInsertSaved: (saved: SavedRow) => void
}) {
  const api = useEditorApi()
  const footerTaken = hasFooter(api.design)
  const saved = api.savedRows

  return (
    <div className="seb-palette">
      <section aria-label="Layouts" className="seb-palette-group">
        <h3 className="seb-section-title">Layouts</h3>
        <div className="seb-tiles seb-tiles-layouts">
          {ROW_LAYOUTS.map((layout) => (
            <Tile
              key={layout.id}
              id={paletteId.layout(layout.id)}
              label={`Layout ${layout.label}`}
              onAdd={() => onAddLayout(layout.id)}
            >
              <LayoutPreview widths={layout.widths} />
              <span>{layout.label}</span>
            </Tile>
          ))}
        </div>
      </section>

      <section aria-label="Blocks" className="seb-palette-group">
        <h3 className="seb-section-title">Blocks</h3>
        <div className="seb-tiles">
          {BLOCK_TYPES.map((type) => {
            const block = BLOCKS[type]
            const taken = type === 'footer' && footerTaken
            return (
              <Tile
                key={type}
                id={paletteId.block(type)}
                label={block.label}
                title={taken ? 'The email already has a footer' : block.label}
                disabled={taken}
                onAdd={() => onAddBlock(type)}
              >
                <Icon name={block.icon} width={20} height={20} />
                <span>{block.label}</span>
              </Tile>
            )
          })}
        </div>
      </section>

      {saved.enabled && (
        <section aria-label="Saved rows" className="seb-palette-group">
          <h3 className="seb-section-title">Saved rows</h3>
          {saved.status === 'loading' && <p className="seb-hint">Loading…</p>}
          {saved.status === 'error' && (
            <p className="seb-error" role="alert">
              {saved.error}{' '}
              <button type="button" className="seb-link-btn" onClick={saved.reload}>
                Try again
              </button>
            </p>
          )}
          {saved.status === 'ready' && saved.items.length === 0 && (
            <p className="seb-hint">
              No saved rows yet. Select a row and choose “Save as row” to keep it for later.
            </p>
          )}
          {saved.items.length > 0 && (
            <ul className="seb-saved-list">
              {saved.items.map((item) => (
                <SavedItem key={item.id} saved={item} onInsert={() => onInsertSaved(item)} />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
