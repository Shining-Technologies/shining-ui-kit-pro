'use client'

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  cloneRowWithNewIds,
  duplicateBlock as duplicateBlockIn,
  duplicateRow as duplicateRowIn,
  findBlock,
  findColumn,
  findRow,
  removeBlock as removeBlockIn,
  removeRow as removeRowIn,
  setRowLayout,
  toBlockDesign,
  updateBlock as updateBlockIn,
  updateColumn as updateColumnIn,
  updateRow as updateRowIn,
  updateSettings as updateSettingsIn,
  validateBlockDesign,
  ROW_LAYOUTS,
  type Block,
  type BlockDesign,
  type BlockType,
  type LayoutId,
} from '../design'
import {
  addBlock,
  addBlockAt,
  addLayout,
  applyDrop,
  insertSavedRow,
  neighbourOf,
  nudgeBlock,
  nudgeBlockSideways,
  nudgeRow,
  rowInsertionIndex,
} from './actions'
import { buildAnnouncements } from './announcements'
import { blockLabel, blockModule, blockSummary } from './blocks'
import { Canvas } from './canvas'
import { EditorContext, type EditorApi, type EditResult } from './context'
import { DEVICES, type Device } from './devices'
import { parsePaletteId, resolveDrop } from './drop'
import { FormatBar } from './format-bar'
import { shortcutFor, useHistory } from './history'
import { Icon } from './icons'
import { Palette } from './palette'
import { Properties } from './properties'
import type {
  ActionResult,
  BlockEditorProps,
  DropHint,
  DropResolution,
  FormatEditor,
  SavedRow,
  SavedRowsState,
  Selection,
} from './types'

/** True at 1024px and above; below it the side panes become sheets. */
function useIsDesktop(): boolean {
  const query = '(min-width: 1024px)'
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : true,
  )
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const list = window.matchMedia(query)
    const onChange = () => setMatches(list.matches)
    onChange()
    list.addEventListener?.('change', onChange)
    return () => list.removeEventListener?.('change', onChange)
  }, [])
  return matches
}

/** The first problem `next` has that `previous` did not, or ``null``. */
function newProblem(previous: BlockDesign, next: BlockDesign): string | null {
  const known = new Set(
    validateBlockDesign(previous)
      .filter((issue) => issue.severity === 'error')
      .map((issue) => `${issue.path}|${issue.message}`),
  )
  const fresh = validateBlockDesign(next).find(
    (issue) => issue.severity === 'error' && !known.has(`${issue.path}|${issue.message}`),
  )
  return fresh ? fresh.message : null
}

/** Rows and layouts are placed by the row under the pointer; blocks by the block or column. */
const collisionDetection: CollisionDetection = (args) => {
  const kind = String(args.active.data.current?.kind ?? '')
  const only = (...kinds: string[]) =>
    args.droppableContainers.filter((c) => kinds.includes(String(c.data.current?.kind)))
  if (kind === 'row' || kind === 'palette-layout' || kind === 'palette-saved') {
    return closestCenter({ ...args, droppableContainers: only('row', 'canvas-end') })
  }
  const targets = only('block', 'column', 'canvas-end')
  const within = pointerWithin({ ...args, droppableContainers: targets })
  if (within.length) {
    const rank = (id: unknown) => {
      const found = targets.find((c) => c.id === id)
      return found?.data.current?.kind === 'block'
        ? 0
        : found?.data.current?.kind === 'column'
          ? 1
          : 2
    }
    return [...within].sort((a, b) => rank(a.id) - rank(b.id))
  }
  return closestCenter({ ...args, droppableContainers: targets })
}

function Sheet({
  side,
  title,
  onClose,
  children,
}: {
  side: 'left' | 'right'
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const close = useRef<HTMLButtonElement>(null)
  useEffect(() => close.current?.focus(), [])
  return (
    <div
      className="seb-sheet-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className="seb-sheet"
        data-side={side}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation()
            onClose()
          }
        }}
      >
        <header className="seb-sheet-head">
          <h2>{title}</h2>
          <button
            ref={close}
            type="button"
            className="seb-icon-btn"
            aria-label={`Close ${title}`}
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </header>
        <div className="seb-sheet-body">{children}</div>
      </div>
    </div>
  )
}

function Workspace({
  design,
  onChange,
  mergeFields,
  brand,
  onUploadImage,
  savedRows: adapter,
  device: deviceProp,
  onDeviceChange,
  disabled = false,
  className,
  'aria-label': ariaLabel = 'Email builder',
}: BlockEditorProps & { design: BlockDesign }) {
  const root = useRef<HTMLDivElement>(null)
  const isDesktop = useIsDesktop()
  const history = useHistory(design, onChange)
  const { commit, latest } = history

  const [rawSelection, setRawSelection] = useState<Selection>(null)
  const [focusTextId, setFocusTextId] = useState<string | null>(null)
  const [formatEditor, setFormatEditor] = useState<FormatEditor | null>(null)
  const [notice, setNotice] = useState('')
  const [ownDevice, setOwnDevice] = useState<Device>('desktop')
  const [sheet, setSheet] = useState<null | 'palette' | 'properties'>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dropHint, setDropHint] = useState<DropHint | null>(null)
  const device = deviceProp ?? ownDevice

  const selection = useMemo<Selection>(() => {
    if (!rawSelection) return null
    const { kind, id } = rawSelection
    const exists =
      kind === 'row'
        ? findRow(design, id)
        : kind === 'column'
          ? findColumn(design, id)
          : findBlock(design, id)
    return exists ? rawSelection : null
  }, [rawSelection, design])
  const selectionRef = useRef(selection)
  selectionRef.current = selection

  const fieldsRef = useRef(mergeFields)
  fieldsRef.current = mergeFields

  /* -- saved rows ---------------------------------------------------------- */

  const adapterRef = useRef(adapter)
  adapterRef.current = adapter
  const enabled = Boolean(adapter)
  const [saved, setSaved] = useState<SavedRowsState>({ status: 'idle', items: [], error: '' })
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const reloadSaved = useCallback(() => {
    const current = adapterRef.current
    if (!current) return
    setSaved((state) => ({ ...state, status: 'loading', error: '' }))
    current
      .list()
      .then((items) => mounted.current && setSaved({ status: 'ready', items, error: '' }))
      .catch((caught: unknown) => {
        if (mounted.current)
          setSaved((state) => ({
            ...state,
            status: 'error',
            error: caught instanceof Error ? caught.message : 'Saved rows could not be loaded.',
          }))
      })
  }, [])
  useEffect(() => {
    if (enabled) reloadSaved()
  }, [enabled, reloadSaved])

  /* -- applying changes ---------------------------------------------------- */

  const pendingFocus = useRef<string | null>(null)
  useLayoutEffect(() => {
    const id = pendingFocus.current
    if (!id) return
    const el = root.current?.querySelector<HTMLElement>(`[data-block-id="${CSS.escape(id)}"]`)
    if (el) {
      pendingFocus.current = null
      el.focus()
    }
  }, [design])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 6000)
    return () => clearTimeout(timer)
  }, [notice])

  const select = useCallback((next: Selection, focusText = false) => {
    setRawSelection(next)
    setFocusTextId(focusText && next?.kind === 'block' ? next.id : null)
  }, [])

  const apply = useCallback(
    (result: ActionResult, coalesceKey?: string) => {
      setNotice(result.notice ?? '')
      if (result.design !== latest.current) commit(result.design, coalesceKey)
      if (result.selection !== undefined) select(result.selection)
      if (result.focusId) pendingFocus.current = result.focusId
    },
    [commit, latest, select],
  )

  const edit = useCallback(
    (change: (d: BlockDesign) => BlockDesign, key?: string): EditResult => {
      const current = latest.current
      const next = change(current)
      if (next === current) return null
      const problem = newProblem(current, next)
      if (problem) return problem
      setNotice('')
      commit(next, key)
      return null
    },
    [commit, latest],
  )

  // Properties open by themselves on small screens, except while typing in a text block.
  useEffect(() => {
    if (isDesktop || !selection) return
    const block = selection.kind === 'block' ? findBlock(latest.current, selection.id) : null
    if (block && (block.block.type === 'text' || block.block.type === 'heading')) return
    setSheet('properties')
  }, [isDesktop, selection, latest])

  const api: EditorApi = {
    design,
    selection,
    select,
    device,
    disabled,
    brand,
    mergeFields,
    getMergeFields: () => fieldsRef.current,
    onUploadImage,
    dropHint,
    focusTextId,
    setFormatEditor,
    edit,
    updateBlock: (id, patch, key) => edit((d) => updateBlockIn<Block>(d, id, patch), key),
    updateRow: (id, patch, key) => edit((d) => updateRowIn(d, id, patch), key),
    updateColumn: (id, patch, key) => edit((d) => updateColumnIn(d, id, patch), key),
    updateSettings: (patch, key) => edit((d) => updateSettingsIn(d, patch), key),
    addBlockAt: (type, columnId, index) => apply(addBlockAt(latest.current, type, columnId, index)),
    nudgeBlock: (id, delta) => {
      pendingFocus.current = id
      apply({ design: nudgeBlock(latest.current, id, delta) })
    },
    nudgeBlockSideways: (id, delta) => {
      pendingFocus.current = id
      apply({ design: nudgeBlockSideways(latest.current, id, delta) })
    },
    duplicateBlock: (id) => {
      const before = latest.current
      const next = duplicateBlockIn(before, id)
      if (next === before) return
      const found = findBlock(next, id)
      const copy = found ? found.column.blocks[found.blockIndex + 1] : undefined
      apply({ design: next, selection: copy ? { kind: 'block', id: copy.id } : undefined })
      if (copy) pendingFocus.current = copy.id
    },
    removeBlock: (id) => {
      const before = latest.current
      const neighbour = neighbourOf(before, id)
      const column = findBlock(before, id)?.column.id
      apply({
        design: removeBlockIn(before, id),
        selection: neighbour
          ? { kind: 'block', id: neighbour }
          : column
            ? { kind: 'column', id: column }
            : null,
      })
      if (neighbour) pendingFocus.current = neighbour
    },
    setLayout: (rowId, layout: LayoutId) =>
      apply({ design: setRowLayout(latest.current, rowId, layout) }),
    nudgeRow: (id, delta) => apply({ design: nudgeRow(latest.current, id, delta) }),
    duplicateRow: (id) => {
      const before = latest.current
      const next = duplicateRowIn(before, id)
      const at = findRow(before, id)
      const copy = at ? next.rows[at.index + 1] : undefined
      apply({ design: next, selection: copy ? { kind: 'row', id: copy.id } : undefined })
    },
    removeRow: (id) => apply({ design: removeRowIn(latest.current, id), selection: null }),
    savedRows: {
      ...saved,
      enabled,
      reload: reloadSaved,
      saveRow: async (rowId, name) => {
        const current = adapterRef.current
        const found = findRow(latest.current, rowId)
        if (!current || !found) return 'The row could not be saved'
        try {
          const row = await current.save(name, cloneRowWithNewIds(found.row))
          if (mounted.current) {
            setSaved((state) => ({ ...state, status: 'ready', items: [...state.items, row] }))
            setNotice(`Saved the row as “${name}”.`)
          }
          return null
        } catch (caught) {
          return caught instanceof Error ? caught.message : 'The row could not be saved'
        }
      },
      removeSaved: async (id) => {
        const current = adapterRef.current
        if (!current) return
        try {
          await current.remove(id)
          if (mounted.current)
            setSaved((state) => ({ ...state, items: state.items.filter((item) => item.id !== id) }))
        } catch (caught) {
          if (mounted.current)
            setNotice(
              caught instanceof Error ? caught.message : 'The saved row could not be deleted.',
            )
        }
      },
    },
  }

  /* -- palette clicks ------------------------------------------------------ */

  const onAddBlock = (type: BlockType) => {
    apply(addBlock(latest.current, type, selectionRef.current))
    if (!isDesktop) setSheet(null)
  }
  const onAddLayout = (layout: LayoutId) => {
    apply(addLayout(latest.current, layout, selectionRef.current))
    if (!isDesktop) setSheet(null)
  }
  const onInsertSaved = (row: SavedRow) => {
    apply(
      insertSavedRow(
        latest.current,
        row.row,
        rowInsertionIndex(latest.current, selectionRef.current),
      ),
    )
    if (!isDesktop) setSheet(null)
  }

  /* -- undo, redo and shortcuts -------------------------------------------- */

  useEffect(() => {
    if (disabled) return
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as Node | null
      const inside =
        target === document.body ||
        target === document.documentElement ||
        (target && root.current?.contains(target))
      if (!inside) return
      const action = shortcutFor(event)
      if (!action) return
      event.preventDefault()
      if (action === 'undo') history.undo()
      else history.redo()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [disabled, history.undo, history.redo, history])

  /* -- drag and drop ------------------------------------------------------- */

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const resolve = (event: DragMoveEvent | DragEndEvent): DropResolution | null => {
    const over = event.over
    if (!over) return null
    const moved = event.active.rect.current.translated
    const after = moved
      ? moved.top + moved.height / 2 > over.rect.top + over.rect.height / 2
      : false
    return resolveDrop(latest.current, String(event.active.id), String(over.id), after)
  }

  const onDragStart = (event: DragStartEvent) => setDragging(String(event.active.id))
  const onDragMove = (event: DragMoveEvent) => {
    const hint = resolve(event)?.hint ?? null
    setDropHint((prev) =>
      prev && hint && prev.id === hint.id && prev.position === hint.position ? prev : hint,
    )
  }
  const onDragEnd = (event: DragEndEvent) => {
    const resolution = resolve(event)
    setDragging(null)
    setDropHint(null)
    if (!resolution) return
    apply(
      applyDrop(
        latest.current,
        String(event.active.id),
        resolution.drop,
        (id) => saved.items.find((item) => String(item.id) === id)?.row,
      ),
    )
  }
  const onDragCancel = () => {
    setDragging(null)
    setDropHint(null)
  }

  const announcements = useMemo(
    () =>
      buildAnnouncements(design, (id) => saved.items.find((item) => String(item.id) === id)?.name),
    [design, saved.items],
  )

  const overlay = (() => {
    if (!dragging) return null
    const palette = parsePaletteId(dragging)
    if (palette?.kind === 'palette-block')
      return { icon: blockModule(palette.type).icon, text: `${blockLabel(palette.type)} block` }
    if (palette?.kind === 'palette-layout') {
      const layout = ROW_LAYOUTS.find((l) => l.id === palette.layout)
      return { icon: 'layout' as const, text: `${layout?.label ?? ''} row` }
    }
    if (palette?.kind === 'palette-saved') {
      const row = saved.items.find((item) => String(item.id) === palette.id)
      return { icon: 'layout' as const, text: row ? `Saved row “${row.name}”` : 'Saved row' }
    }
    const block = findBlock(design, dragging)
    if (block) {
      const summary = blockSummary(block.block)
      return {
        icon: blockModule(block.block.type).icon,
        text: `${blockLabel(block.block.type)}${summary ? ` · ${summary}` : ''}`,
      }
    }
    const row = findRow(design, dragging)
    return row ? { icon: 'layout' as const, text: `Row ${row.index + 1}` } : null
  })()

  const chooseDevice = (next: Device) => {
    if (deviceProp === undefined) setOwnDevice(next)
    onDeviceChange?.(next)
  }

  const showFormat = formatEditor && !formatEditor.editor.isDestroyed && !disabled

  return (
    <EditorContext.Provider value={api}>
      <div
        ref={root}
        className={['seb-editor', 'seb-blocks', className].filter(Boolean).join(' ')}
        role="group"
        aria-label={ariaLabel}
        data-disabled={disabled || undefined}
        data-layout={isDesktop ? 'wide' : 'narrow'}
      >
        <DndContext
          sensors={sensors}
          accessibility={{ announcements }}
          collisionDetection={collisionDetection}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          onDragCancel={onDragCancel}
        >
          <div className="seb-workspace" data-palette={isDesktop && !disabled ? 'on' : 'off'}>
            {isDesktop && !disabled && (
              <aside className="seb-pane seb-pane-palette" aria-label="Add to the email">
                <Palette
                  onAddBlock={onAddBlock}
                  onAddLayout={onAddLayout}
                  onInsertSaved={onInsertSaved}
                />
              </aside>
            )}

            <section className="seb-stage" aria-label="Email canvas">
              <div className="seb-stage-bar">
                <div className="seb-stage-actions">
                  {!isDesktop && !disabled && (
                    <button
                      type="button"
                      className="seb-action"
                      onClick={() => setSheet('palette')}
                    >
                      <Icon name="plus" /> Add
                    </button>
                  )}
                  {!disabled && (
                    <>
                      <button
                        type="button"
                        className="seb-icon-btn"
                        aria-label="Undo"
                        title="Undo"
                        disabled={!history.canUndo}
                        onClick={history.undo}
                      >
                        <Icon name="undo" />
                      </button>
                      <button
                        type="button"
                        className="seb-icon-btn"
                        aria-label="Redo"
                        title="Redo"
                        disabled={!history.canRedo}
                        onClick={history.redo}
                      >
                        <Icon name="redo" />
                      </button>
                    </>
                  )}
                </div>
                <div className="seb-segmented" role="tablist" aria-label="Canvas width">
                  {DEVICES.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="tab"
                      aria-selected={device === option.value}
                      className="seb-segment"
                      onClick={() => chooseDevice(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {!isDesktop && (
                  <button
                    type="button"
                    className="seb-action"
                    onClick={() => setSheet('properties')}
                  >
                    Properties
                  </button>
                )}
              </div>
              {showFormat && <FormatBar target={formatEditor} />}
              {notice && (
                <p className="seb-flash" role="status">
                  {notice}
                </p>
              )}
              <Canvas />
            </section>

            {isDesktop && (
              <aside className="seb-pane seb-pane-props" aria-label="Properties">
                <Properties />
              </aside>
            )}
          </div>

          {!isDesktop && sheet === 'palette' && !disabled && (
            <Sheet side="left" title="Add to the email" onClose={() => setSheet(null)}>
              <Palette
                onAddBlock={onAddBlock}
                onAddLayout={onAddLayout}
                onInsertSaved={onInsertSaved}
              />
            </Sheet>
          )}
          {!isDesktop && sheet === 'properties' && (
            <Sheet side="right" title="Properties" onClose={() => setSheet(null)}>
              <Properties />
            </Sheet>
          )}

          <DragOverlay>
            {overlay ? (
              <div className="seb-overlay">
                <Icon name={overlay.icon} />
                {overlay.text}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </EditorContext.Provider>
  )
}

/**
 * The drag-and-drop block editor for shining-email's block designs
 * (`{ version: 1, mode: 'blocks', settings, rows }`).
 *
 * Controlled: ``value`` is the design JSON, ``onChange`` receives the next
 * one. Three panes: a palette (layouts, blocks, saved rows), a canvas that
 * approximates the email at a real desktop or mobile width, and properties
 * for the selection or, with nothing selected, the email's own settings.
 * Below 1024px the side panes become sheets. The server renders the real
 * email: use `EmailPreview` with its preview endpoint.
 */
export function BlockEditor(props: BlockEditorProps) {
  const design = useMemo(() => toBlockDesign(props.value), [props.value])
  if (design === null) {
    return (
      <div className={['seb-editor', props.className].filter(Boolean).join(' ')}>
        <p className="seb-notice" role="status">
          This email was written as rich text, which BlockEditor cannot change. Open it with
          EmailEditor, or convert it to blocks first.
        </p>
      </div>
    )
  }
  return <Workspace {...props} design={design} />
}
