'use client'

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cn } from '../../lib/cn'
import { toneClass, type AccentTone } from '../../lib/tone'

export interface KanbanColumn {
  id: string
  title: ReactNode
  /** Text for announcements when `title` is not a string. */
  textValue?: string
  /** A dot of colour beside the title. */
  tone?: AccentTone
  /** A work-in-progress limit: the count reads `4 / 5`, and turns to a warning over it. */
  limit?: number
}

export interface KanbanMove {
  itemId: string
  fromColumnId: string
  toColumnId: string
  /** Position in the source column before the move. */
  fromIndex: number
  /** Position in the target column once the item is in it. */
  toIndex: number
}

export interface KanbanBoardProps<T>
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onDragEnd'> {
  columns: KanbanColumn[]
  /** Every card on the board, in display order. Each column shows its own, in this order. */
  items: readonly T[]
  getItemId: (item: T) => string
  getColumnId: (item: T) => string
  /** The card's content. The board draws the card around it. */
  renderItem: (item: T, state: { dragging: boolean }) => ReactNode
  /**
   * Called when a card is dropped somewhere new. Update `items` in response;
   * the board holds no copy of its own. Without it the board is read-only.
   */
  onMove?: (move: KanbanMove) => void
  /** Names a card in announcements ("Picked up INV-204"). Defaults to its id. */
  getItemLabel?: (item: T) => string
  /** Extra controls at the end of a column's header — an Add button. */
  renderColumnActions?: (column: KanbanColumn) => ReactNode
  /** Shown in a column with no cards. `'No items'` by default. */
  emptyText?: ReactNode
  /** Names the board. `'Board'` by default. */
  'aria-label'?: string
}

interface Grab {
  itemId: string
  origin: { columnId: string; index: number }
}

/**
 * Cards in columns, moved between them as work progresses: a sales pipeline,
 * a support queue, a hiring funnel, a sprint.
 *
 * The board owns no data. It reports a `KanbanMove` and renders whatever
 * `items` says next, so the change can be saved, validated or refused.
 *
 * Cards move with the pointer (drag and drop) or the keyboard: Space or Enter
 * picks the focused card up, the arrow keys move it — Left and Right between
 * columns, Up and Down within one — Space or Enter drops it, and Escape puts
 * it back where it started. Every step is announced.
 */
export function KanbanBoard<T>({
  className,
  columns,
  items,
  getItemId,
  getColumnId,
  renderItem,
  onMove,
  getItemLabel,
  renderColumnActions,
  emptyText = 'No items',
  'aria-label': label = 'Board',
  ...props
}: KanbanBoardProps<T>) {
  const baseId = useId()
  const movable = Boolean(onMove)

  const byColumn = useMemo(() => {
    const map = new Map<string, T[]>(columns.map((column) => [column.id, []]))
    for (const item of items) map.get(getColumnId(item))?.push(item)
    return map
  }, [columns, items, getColumnId])

  const [grab, setGrab] = useState<Grab | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{ columnId: string; index: number } | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const cards = useRef(new Map<string, HTMLLIElement>())

  const itemLabel = (item: T) => getItemLabel?.(item) ?? getItemId(item)
  const columnLabel = (id: string) => {
    const column = columns.find((entry) => entry.id === id)
    if (!column) return id
    return column.textValue ?? (typeof column.title === 'string' ? column.title : column.id)
  }

  /** Where an item is now: its column and its index in that column. */
  const locate = (itemId: string) => {
    for (const [columnId, list] of byColumn) {
      const index = list.findIndex((item) => getItemId(item) === itemId)
      if (index !== -1) return { columnId, index, item: list[index]!, size: list.length }
    }
    return null
  }

  // A moved card is re-rendered in another list, which drops focus; put it back.
  useEffect(() => {
    if (!grab) return
    const element = cards.current.get(grab.itemId)
    if (element && element.ownerDocument.activeElement !== element) element.focus()
  })

  const move = (itemId: string, toColumnId: string, toIndex: number) => {
    const from = locate(itemId)
    if (!from || !onMove) return
    if (from.columnId === toColumnId && from.index === toIndex) return
    onMove({
      itemId,
      fromColumnId: from.columnId,
      toColumnId,
      fromIndex: from.index,
      toIndex,
    })
  }

  const handleCardKeyDown = (event: KeyboardEvent<HTMLLIElement>, itemId: string) => {
    // Keys pressed on a button or link inside the card are theirs.
    if (!movable || event.target !== event.currentTarget) return
    const where = locate(itemId)
    if (!where) return
    const name = itemLabel(where.item)

    // A grab left behind on another card (the user clicked away) is abandoned.
    const active = grab?.itemId === itemId ? grab : null

    if (!active) {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        setGrab({ itemId, origin: { columnId: where.columnId, index: where.index } })
        setAnnouncement(
          `Picked up ${name}. ${columnLabel(where.columnId)}, position ${where.index + 1} of ${where.size}. ` +
            'Use the arrow keys to move, Space to drop, Escape to cancel.',
        )
      }
      return
    }

    const columnIndex = columns.findIndex((column) => column.id === where.columnId)
    const sizeOf = (columnId: string) => byColumn.get(columnId)?.length ?? 0
    let target: { columnId: string; index: number } | null = null

    switch (event.key) {
      case 'ArrowUp':
        if (where.index > 0) target = { columnId: where.columnId, index: where.index - 1 }
        break
      case 'ArrowDown':
        if (where.index < where.size - 1) target = { columnId: where.columnId, index: where.index + 1 }
        break
      case 'ArrowLeft':
      case 'ArrowRight': {
        const next = columns[columnIndex + (event.key === 'ArrowLeft' ? -1 : 1)]
        if (next) target = { columnId: next.id, index: Math.min(where.index, sizeOf(next.id)) }
        break
      }
      case ' ':
      case 'Enter':
        event.preventDefault()
        setGrab(null)
        setAnnouncement(
          `Dropped ${name} in ${columnLabel(where.columnId)}, position ${where.index + 1} of ${where.size}.`,
        )
        return
      case 'Escape':
        event.preventDefault()
        move(itemId, active.origin.columnId, active.origin.index)
        setGrab(null)
        setAnnouncement(`Move cancelled. ${name} returned to ${columnLabel(active.origin.columnId)}.`)
        return
      case 'Tab':
        // Leaving the card drops it where it is, rather than stranding the grab.
        setGrab(null)
        return
      default:
        return
    }

    event.preventDefault()
    if (!target) return
    move(itemId, target.columnId, target.index)
    const size = sizeOf(target.columnId) + (target.columnId === where.columnId ? 0 : 1)
    setAnnouncement(
      `${name} moved to ${columnLabel(target.columnId)}, position ${target.index + 1} of ${size}.`,
    )
  }

  /** The drop index under the pointer: before the first card whose middle is below it. */
  const indexAt = (event: DragEvent<HTMLElement>, columnId: string) => {
    const list = (byColumn.get(columnId) ?? []).filter((item) => getItemId(item) !== dragging)
    let index = list.length
    for (let position = 0; position < list.length; position++) {
      const element = cards.current.get(getItemId(list[position]!))
      if (!element) continue
      const rect = element.getBoundingClientRect()
      if (event.clientY < rect.top + rect.height / 2) {
        index = position
        break
      }
    }
    return index
  }

  const instructionsId = `${baseId}-instructions`

  return (
    <div
      role="group"
      aria-label={label}
      data-slot="kanban"
      className={cn('sui-kanban', className)}
      {...props}
      onPointerDownCapture={(event) => {
        props.onPointerDownCapture?.(event)
        // A click anywhere but the grabbed card ends the keyboard grab, so the
        // board never pulls focus back to a card the user has moved on from.
        if (grab && !cards.current.get(grab.itemId)?.contains(event.target as Node)) setGrab(null)
      }}
    >
      {movable ? (
        <p id={instructionsId} className="sui-sr-only">
          Press Space or Enter to pick up a card. Use the arrow keys to move it, Space or Enter to
          drop it, and Escape to cancel.
        </p>
      ) : null}
      <p className="sui-sr-only" aria-live="assertive">
        {announcement}
      </p>

      {columns.map((column) => {
        const list = byColumn.get(column.id) ?? []
        const headingId = `${baseId}-${column.id}`
        const over = column.limit !== undefined && list.length > column.limit
        const target = dropTarget?.columnId === column.id ? dropTarget.index : null
        const visible = list.filter((item) => getItemId(item) !== dragging || target === null)
        const placeholder = <li key="__drop" className="sui-kanban__drop" aria-hidden="true" />

        return (
          <section
            key={column.id}
            aria-labelledby={headingId}
            data-slot="kanban-column"
            data-drop-target={target !== null || undefined}
            className="sui-kanban__column"
            onDragOver={
              movable
                ? (event) => {
                    if (!dragging) return
                    event.preventDefault()
                    event.dataTransfer.dropEffect = 'move'
                    const index = indexAt(event, column.id)
                    if (dropTarget?.columnId !== column.id || dropTarget.index !== index)
                      setDropTarget({ columnId: column.id, index })
                  }
                : undefined
            }
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null))
                setDropTarget((current) => (current?.columnId === column.id ? null : current))
            }}
            onDrop={(event) => {
              if (!dragging || !movable) return
              event.preventDefault()
              move(dragging, column.id, indexAt(event, column.id))
              setDragging(null)
              setDropTarget(null)
            }}
          >
            <header className="sui-kanban__header">
              {column.tone ? (
                <span
                  className={cn('sui-kanban__tone', toneClass(column.tone))}
                  aria-hidden="true"
                />
              ) : null}
              <h3 id={headingId} className="sui-kanban__title">
                {column.title}
              </h3>
              <span
                className="sui-kanban__count"
                data-over={over || undefined}
                aria-label={
                  column.limit !== undefined
                    ? `${list.length} of ${column.limit} allowed`
                    : `${list.length} ${list.length === 1 ? 'item' : 'items'}`
                }
              >
                {column.limit !== undefined ? `${list.length} / ${column.limit}` : list.length}
              </span>
              {renderColumnActions ? (
                <span className="sui-kanban__actions">{renderColumnActions(column)}</span>
              ) : null}
            </header>

            <ul className="sui-kanban__list">
              {visible.length === 0 && target === null ? (
                <li className="sui-kanban__empty">{emptyText}</li>
              ) : null}
              {visible.flatMap((item, index) => {
                const id = getItemId(item)
                const isDragging = dragging === id
                const isGrabbed = grab?.itemId === id
                const card = (
                  <li
                    key={id}
                    ref={(element) => {
                      if (element) cards.current.set(id, element)
                      else cards.current.delete(id)
                    }}
                    data-slot="kanban-card"
                    data-dragging={isDragging || undefined}
                    data-grabbed={isGrabbed || undefined}
                    className={cn('sui-kanban__card', movable && 'sui-kanban__card--movable')}
                    tabIndex={0}
                    draggable={movable}
                    aria-roledescription={movable ? 'Draggable card' : undefined}
                    aria-describedby={movable ? instructionsId : undefined}
                    onKeyDown={(event) => handleCardKeyDown(event, id)}
                    onDragStart={(event) => {
                      if (!movable) return
                      event.dataTransfer.effectAllowed = 'move'
                      event.dataTransfer.setData('text/plain', id)
                      setDragging(id)
                    }}
                    onDragEnd={() => {
                      setDragging(null)
                      setDropTarget(null)
                    }}
                  >
                    {renderItem(item, { dragging: isDragging || isGrabbed })}
                  </li>
                )
                return target === index ? [placeholder, card] : [card]
              })}
              {target !== null && target >= visible.length ? placeholder : null}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
