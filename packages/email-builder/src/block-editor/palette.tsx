'use client'

import { useDraggable } from '@dnd-kit/core'
import { useEffect, useRef, useState, type PointerEventHandler, type ReactNode } from 'react'
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
            : id.split(':')[1] === 'shared'
              ? 'palette-shared'
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

function SavedItem({
  saved,
  onInsert,
  shared = false,
}: {
  saved: SavedRow
  onInsert: () => void
  /** A shared block: inserted as a placeholder, with the number of templates that use it. */
  shared?: boolean
}) {
  const api = useEditorApi()
  const [confirming, setConfirming] = useState(false)
  // Why the last delete was refused, shown under the row where the palette is.
  const [refusal, setRefusal] = useState('')
  // True while `remove` is pending, so the question cannot be confirmed twice.
  const [removing, setRemoving] = useState(false)
  const deleteButton = useRef<HTMLButtonElement>(null)
  // The confirm button unmounts when a delete is refused; keep keyboard focus on the row.
  useEffect(() => {
    if (refusal) deleteButton.current?.focus()
  }, [refusal])
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: shared ? paletteId.shared(saved.id) : paletteId.saved(saved.id),
    data: { kind: shared ? 'palette-shared' : 'palette-saved' },
  })
  const noun = shared ? 'shared block' : 'saved row'
  const used = saved.usageCount
  return (
    <li className="seb-saved-item" data-confirming={confirming || undefined}>
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
        title={shared ? `Insert “${saved.name}” as a shared block` : `Insert “${saved.name}”`}
      >
        <Icon name={shared ? 'link' : 'layout'} />
        <span>{saved.name}</span>
        {shared && typeof used === 'number' && (
          <small className="seb-saved-count">
            <span aria-hidden="true">{used}</span>
            <span className="seb-sr-only">{`, used in ${used} ${used === 1 ? 'template' : 'templates'}`}</span>
          </small>
        )}
      </button>
      {!(shared ? api.sharedRows.canRemove : api.savedRows.canRemove) ? null : confirming ? (
        <span className="seb-saved-confirm">
          <button
            type="button"
            className="seb-action seb-action-danger"
            title={`Delete “${saved.name}”?`}
            disabled={removing}
            onClick={() => {
              if (removing) return
              setRemoving(true)
              void api.savedRows.removeSaved(saved.id).then((reason) => {
                setRemoving(false)
                // A refused delete closes the question and says why; a deleted row unmounts.
                if (reason === null) return
                setConfirming(false)
                setRefusal(reason)
              })
            }}
          >
            Delete “{saved.name}”?
          </button>
          <button type="button" className="seb-action" onClick={() => setConfirming(false)}>
            Keep
          </button>
        </span>
      ) : (
        <button
          ref={deleteButton}
          type="button"
          className="seb-icon-btn"
          aria-label={`Delete ${noun} ${saved.name}`}
          title={`Delete ${noun}`}
          onClick={() => {
            setRefusal('')
            setConfirming(true)
          }}
        >
          <Icon name="trash" />
        </button>
      )}
      {refusal && <p className="seb-saved-refusal">{refusal}</p>}
    </li>
  )
}

/** Left pane: layouts, blocks and saved rows, to drag onto the canvas or click to add. */
export function Palette({
  onAddBlock,
  onAddLayout,
  onInsertSaved,
  onInsertShared,
}: {
  onAddBlock: (type: BlockType) => void
  onAddLayout: (layout: LayoutId) => void
  onInsertSaved: (saved: SavedRow) => void
  onInsertShared: (id: SavedRow['id']) => void
}) {
  const api = useEditorApi()
  const footerTaken = hasFooter(api.design, api.sharedRows.rowOf)
  const saved = api.savedRows
  const shared = api.sharedRows
  // A shared block is one row, so it has no layouts to add.
  const singleRow = api.constraints.singleRow === true
  const showShared = shared.enabled && api.constraints.allowShared !== false
  const types = BLOCK_TYPES.filter((type) => type !== 'table' || api.dataSources.length > 0)

  return (
    <div className="seb-palette">
      {!singleRow && (
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
                <span className="seb-tile-label">{layout.label.replace(/ /g, '')}</span>
              </Tile>
            ))}
          </div>
        </section>
      )}

      <section aria-label="Blocks" className="seb-palette-group">
        <h3 className="seb-section-title">Blocks</h3>
        <div className="seb-tiles">
          {types.map((type) => {
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

      {saved.enabled && !singleRow && (
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
              {saved.canSave
                ? 'No saved rows yet. Select a row and choose “Save as row” to keep it for later.'
                : 'No saved rows yet.'}
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

      {showShared && !singleRow && (
        <section aria-label="Shared blocks" className="seb-palette-group">
          <h3 className="seb-section-title">Shared blocks</h3>
          {saved.status === 'loading' && shared.items.length === 0 && (
            <p className="seb-hint">Loading…</p>
          )}
          {saved.status === 'ready' && shared.items.length === 0 && (
            <p className="seb-hint">
              {shared.canShare
                ? 'No shared blocks yet. Select a row and choose “Save as shared block” to use it in many emails and change it in one place.'
                : 'No shared blocks yet.'}
            </p>
          )}
          {shared.items.length > 0 && (
            <ul className="seb-saved-list">
              {shared.items.map((item) => (
                <SavedItem
                  key={item.id}
                  saved={item}
                  shared
                  onInsert={() => onInsertShared(item.id)}
                />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
