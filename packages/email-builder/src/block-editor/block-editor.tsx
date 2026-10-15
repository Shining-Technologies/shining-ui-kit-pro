'use client'

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
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
  detachSharedRow,
  duplicateBlock as duplicateBlockIn,
  duplicateRow as duplicateRowIn,
  findBlock,
  findColumn,
  findRow,
  isSharedRowRef,
  issueTarget,
  removeBlock as removeBlockIn,
  removeRow as removeRowIn,
  replaceRowWithSharedRef,
  rowWithDefaults,
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
  type Row,
} from '../design'
import {
  addBlock,
  addBlockAt,
  addLayout,
  applyDrop,
  constraintRefusal,
  footerCount,
  insertSavedRow,
  insertSharedRow,
  neighbourOf,
  nudgeBlock,
  nudgeBlockSideways,
  nudgeRow,
  rowInsertionIndex,
} from './actions'
import { buildAnnouncements, describeItem, describePlace } from './announcements'
import { blockLabel, blockModule, blockSummary } from './blocks'
import { Canvas } from './canvas'
import { EditorContext, type EditorApi, type EditResult, type SharedLookup } from './context'
import { DEVICES, type Device } from './devices'
import { parsePaletteId, resolveDrop } from './drop'
import { shortcutFor, useHistory } from './history'
import { Icon } from './icons'
import { canonicalRef } from './refs'
import { Palette } from './palette'
import { Properties } from './properties'
import { SharedRowDialog } from './shared-row-dialog'
import {
  SharedRowInUseError,
  type ActionResult,
  type BlockEditorProps,
  type DropHint,
  type DropResolution,
  type EditorConstraints,
  type FocusRequest,
  type FormatEditor,
  type SavedRow,
  type SavedRowsState,
  type Selection,
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

/** A shared block's saved row as the editor draws it: the server stores rows compact (a prop
 * equal to its default is left out), so fill the defaults in, once, when it is stored here. */
function readShared(item: SavedRow): SavedRow {
  return item.shared ? { ...item, row: rowWithDefaults(item.row) } : item
}

/** The first problem `next` has that `previous` did not, or ``null``. */
function newProblem(
  previous: BlockDesign,
  next: BlockDesign,
  constraints: EditorConstraints = {},
): string | null {
  const refused = constraintRefusal(next, constraints)
  if (refused) return refused
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

type HighlightTarget =
  | { kind: 'block'; id: string }
  | { kind: 'column'; id: string }
  | { kind: 'row'; id: string }
  | { kind: 'settings' }
  | { kind: 'design' }

interface ActiveHighlight {
  key: string
  target: HighlightTarget
  /** The target as it was when the error was shown; a different value means it was edited. */
  json: string
}

/** The block, column or row an error points at; the settings or the whole design otherwise. */
function resolveHighlight(
  design: BlockDesign,
  highlight: NonNullable<BlockEditorProps['highlight']>,
): HighlightTarget {
  if (highlight.blockId && findBlock(design, highlight.blockId))
    return { kind: 'block', id: highlight.blockId }
  const found = highlight.path ? issueTarget(design, highlight.path) : null
  if (found?.kind === 'settings') return { kind: 'settings' }
  if ((found?.kind === 'block' || found?.kind === 'column' || found?.kind === 'row') && found.id)
    return { kind: found.kind, id: found.id }
  return { kind: 'design' }
}

function snapshotOf(design: BlockDesign, target: HighlightTarget): string {
  if (target.kind === 'settings') return JSON.stringify(design.settings)
  if (target.kind === 'design') return JSON.stringify(design)
  const found =
    target.kind === 'block'
      ? findBlock(design, target.id)?.block
      : target.kind === 'column'
        ? findColumn(design, target.id)?.column
        : findRow(design, target.id)?.row
  return found ? JSON.stringify(found) : '(removed)'
}

/** Rows and layouts are placed by the row under the pointer; blocks by the block or column. */
const collisionDetection: CollisionDetection = (args) => {
  const kind = String(args.active.data.current?.kind ?? '')
  const only = (...kinds: string[]) =>
    args.droppableContainers.filter((c) => kinds.includes(String(c.data.current?.kind)))
  if (
    kind === 'row' ||
    kind === 'palette-layout' ||
    kind === 'palette-saved' ||
    kind === 'palette-shared'
  ) {
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

const FOCUSABLE =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

/** A modal sheet: focus moves in, Tab stays inside, Escape closes, and focus returns to where it was. */
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
  const panel = useRef<HTMLDivElement>(null)
  const close = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    close.current?.focus()
    return () => {
      if (opener && opener.isConnected) opener.focus()
    }
  }, [])
  return (
    <div
      className="seb-sheet-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={panel}
        className="seb-sheet"
        data-side={side}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation()
            onClose()
            return
          }
          if (event.key !== 'Tab' || !panel.current) return
          const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE))
          if (items.length === 0) return
          const first = items[0]!
          const last = items[items.length - 1]!
          const active = document.activeElement
          if (event.shiftKey && (active === first || !panel.current.contains(active))) {
            event.preventDefault()
            last.focus()
          } else if (!event.shiftKey && (active === last || !panel.current.contains(active))) {
            event.preventDefault()
            first.focus()
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
  dataSources,
  constraints: constraintsProp,
  device: deviceProp,
  onDeviceChange,
  disabled = false,
  highlight,
  onHighlightClear,
  className,
  'aria-label': ariaLabel = 'Email builder',
}: BlockEditorProps & { design: BlockDesign }) {
  const root = useRef<HTMLDivElement>(null)
  const isDesktop = useIsDesktop()
  const history = useHistory(design, onChange)
  const { commit, latest } = history

  const [rawSelection, setRawSelection] = useState<Selection>(null)
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null)
  const [formatEditor, setFormatEditor] = useState<FormatEditor | null>(null)
  const [notice, setNotice] = useState('')
  const [ownDevice, setOwnDevice] = useState<Device>('desktop')
  const [sheet, setSheet] = useState<null | 'palette' | 'properties'>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dropHint, setDropHint] = useState<DropHint | null>(null)
  const [live, setLive] = useState('')
  const [editingShared, setEditingShared] = useState<string | null>(null)
  const device = deviceProp ?? ownDevice
  const constraints = useMemo<EditorConstraints>(() => constraintsProp ?? {}, [constraintsProp])
  const constraintsRef = useRef(constraints)
  constraintsRef.current = constraints
  const sources = useMemo(() => dataSources ?? [], [dataSources])
  const sourcesRef = useRef(sources)
  sourcesRef.current = sources

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
  /* -- a server error shown on the canvas ----------------------------------- */

  const highlightKey = highlight
    ? JSON.stringify([highlight.path ?? '', highlight.blockId ?? '', highlight.message])
    : ''
  const [dismissedKey, setDismissedKey] = useState('')
  const shown = highlight && highlightKey !== dismissedKey ? highlight : null
  const shownKey = shown ? highlightKey : ''
  const shownRef = useRef(shown)
  shownRef.current = shown
  const clearRef = useRef(onHighlightClear)
  clearRef.current = onHighlightClear
  const [active, setActive] = useState<ActiveHighlight | null>(null)

  const dismissHighlight = useCallback(() => {
    setDismissedKey(highlightKey)
    setActive(null)
    clearRef.current?.()
  }, [highlightKey])

  // Once the host drops the highlight, the same error may be shown again later.
  useEffect(() => {
    if (!highlightKey) setDismissedKey('')
  }, [highlightKey])

  useEffect(() => {
    const current = shownRef.current
    if (!current) {
      setActive(null)
      return
    }
    const target = resolveHighlight(latest.current, current)
    setActive({ key: shownKey, target, json: snapshotOf(latest.current, target) })
    setRawSelection(
      target.kind === 'block' || target.kind === 'column' || target.kind === 'row'
        ? { kind: target.kind, id: target.id }
        : null,
    )
    setFocusRequest(null)
  }, [shownKey, latest])

  useEffect(() => {
    if (!active || active.key !== shownKey) return
    const { target } = active
    if (target.kind !== 'block' && target.kind !== 'column' && target.kind !== 'row') return
    const attr = target.kind === 'block' ? 'data-block-id' : `data-${target.kind}-id`
    const element = root.current?.querySelector<HTMLElement>(`[${attr}="${CSS.escape(target.id)}"]`)
    const scroller = element?.closest<HTMLElement>('[data-canvas-scroll]')
    if (!element || !scroller || typeof scroller.scrollTo !== 'function') return
    // Scroll the canvas alone (scrollIntoView would move every ancestor, the page included).
    const view = scroller.getBoundingClientRect()
    const box = element.getBoundingClientRect()
    const top = scroller.scrollTop + (box.top - view.top) - (scroller.clientHeight - box.height) / 2
    const left =
      scroller.scrollLeft + (box.left - view.left) - (scroller.clientWidth - box.width) / 2
    scroller.scrollTo({ top: Math.max(0, top), left: Math.max(0, left), behavior: 'smooth' })
  }, [active, shownKey])

  // Editing what the error points at drops it (so does removing it).
  useEffect(() => {
    if (!active || active.key !== shownKey) return
    if (snapshotOf(design, active.target) !== active.json) dismissHighlight()
  }, [design, active, shownKey, dismissHighlight])

  const selectionRef = useRef(selection)
  selectionRef.current = selection

  const fieldsRef = useRef(mergeFields)
  fieldsRef.current = mergeFields

  /* -- saved rows ---------------------------------------------------------- */

  const adapterRef = useRef(adapter)
  adapterRef.current = adapter
  const enabled = Boolean(adapter)
  const [saved, setSaved] = useState<SavedRowsState>({ status: 'idle', items: [], error: '' })
  // Shared blocks `get` failed for, until the saved rows are loaded again.
  const [failed, setFailed] = useState<Record<string, true>>({})
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
    // A new load is a new chance for a shared block that could not be fetched.
    setFailed({})
    current
      .list()
      .then(
        (items) =>
          mounted.current && setSaved({ status: 'ready', items: items.map(readShared), error: '' }),
      )
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

  /* -- shared blocks -------------------------------------------------------- */

  const savedRef = useRef(saved)
  savedRef.current = saved
  // Shared blocks the list does not hold (a composer may not list them all) are fetched one by one.
  const [fetched, setFetched] = useState<Record<string, SavedRow | 'missing'>>({})
  const fetching = useRef(new Set<string>())
  const sharedKey = canonicalRef
  const listedShared = (ref: string) =>
    savedRef.current.items.find(
      (item) => item.shared && sharedKey(String(item.id)) === sharedKey(ref),
    )
  const resolveShared = (ref: string): SharedLookup => {
    const listed = saved.items.find(
      (item) => item.shared && sharedKey(String(item.id)) === sharedKey(ref),
    )
    if (listed) return listed
    const cached = fetched[sharedKey(ref)]
    if (cached) return cached
    if (!adapter) return 'missing'
    if (failed[sharedKey(ref)]) return 'unavailable'
    if (saved.status === 'idle' || saved.status === 'loading') return 'loading'
    if (adapter.get) return 'loading'
    // Without `get`, a list that failed says nothing about whether the block exists.
    return saved.status === 'error' ? 'unavailable' : 'missing'
  }
  const rowOfShared = (ref: string): Row | undefined => {
    const found = resolveShared(ref)
    return typeof found === 'string' ? undefined : found.row
  }
  useEffect(() => {
    const get = adapterRef.current?.get
    if (!get || saved.status === 'idle' || saved.status === 'loading') return
    for (const row of design.rows) {
      if (!isSharedRowRef(row)) continue
      const key = sharedKey(row.ref)
      if (listedShared(row.ref) || fetched[key] || failed[key] || fetching.current.has(key))
        continue
      fetching.current.add(key)
      get(row.ref)
        .then((found) => (found ? readShared({ ...found, shared: true }) : ('missing' as const)))
        .then(
          (result) => {
            fetching.current.delete(key)
            if (mounted.current) setFetched((state) => ({ ...state, [key]: result }))
          },
          () => {
            // Not cached as gone: only a new load of the saved rows tries again.
            fetching.current.delete(key)
            if (mounted.current) setFailed((state) => ({ ...state, [key]: true }))
          },
        )
    }
    // `listedShared` reads the latest list through a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design.rows, saved.status, saved.items, fetched, failed])

  /* -- applying changes ---------------------------------------------------- */

  const pendingFocus = useRef<string | null>(null)
  useLayoutEffect(() => {
    const id = pendingFocus.current
    if (!id) return
    // A focus request lasts for one change of the design, however it ends.
    pendingFocus.current = null
    const safe = CSS.escape(id)
    root.current
      ?.querySelector<HTMLElement>(`[data-block-id="${safe}"], [data-row-id="${safe}"]`)
      ?.focus()
  }, [design])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 6000)
    return () => clearTimeout(timer)
  }, [notice])

  const select = useCallback<EditorApi['select']>((next, focusText = false) => {
    setRawSelection(next)
    // A request lasts for one selection: a new one replaces it, none clears it.
    setFocusRequest(focusText && next?.kind === 'block' ? { id: next.id, at: focusText } : null)
  }, [])
  const clearFocusRequest = useCallback(() => setFocusRequest(null), [])

  /** Apply an action's result. Nothing happens, and no focus is requested,
   * unless the design changes; a change that would add a problem the server
   * refuses is turned down with the reason. Returns whether it was applied. */
  const apply = useCallback(
    (result: ActionResult, coalesceKey?: string): boolean => {
      if (result.design === latest.current) {
        setNotice(result.notice ?? '')
        return false
      }
      const problem = newProblem(latest.current, result.design, constraintsRef.current)
      if (problem) {
        setNotice(problem)
        return false
      }
      setNotice(result.notice ?? '')
      pendingFocus.current = result.focusId ?? null
      commit(result.design, coalesceKey)
      if (result.selection !== undefined) select(result.selection)
      return true
    },
    [commit, latest, select],
  )

  const edit = useCallback(
    (change: (d: BlockDesign) => BlockDesign, key?: string): EditResult => {
      const current = latest.current
      const next = change(current)
      if (next === current) return null
      const problem = newProblem(current, next, constraintsRef.current)
      if (problem) return problem
      setNotice('')
      pendingFocus.current = null
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

  /** A keyboard move: applied if it changes anything, and spoken either way. */
  const moveAnnounced = (id: string, next: BlockDesign) => {
    const before = latest.current
    if (next === before) {
      setLive(`${describeItem(before, id)} cannot move any further that way.`)
    } else if (apply({ design: next, focusId: id })) {
      setLive(`Moved ${describeItem(next, id)} to ${describePlace(next, id)}.`)
    }
  }

  /** What the add actions need to know about tables and shared blocks. */
  const actionContext = () => ({ dataSources: sources, resolveShared: rowOfShared })

  const sharedItems = saved.items.filter((item) => item.shared)
  const plainItems = saved.items.filter((item) => !item.shared)
  const hasUpdate = Boolean(adapter?.update)

  const insertShared = (id: SavedRow['id']) => {
    const found = saved.items.find((item) => item.shared && String(item.id) === String(id))
    if (!found) return
    apply(
      insertSharedRow(
        latest.current,
        String(found.id),
        found.row,
        rowInsertionIndex(latest.current, selectionRef.current),
        actionContext(),
      ),
    )
    if (!isDesktop) setSheet(null)
  }

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
    dataSources: sources,
    constraints,
    dropHint,
    highlight:
      active &&
      active.key === shownKey &&
      (active.target.kind === 'block' ||
        active.target.kind === 'column' ||
        active.target.kind === 'row')
        ? { kind: active.target.kind, id: active.target.id }
        : null,
    focusRequest,
    clearFocusRequest,
    formatEditor,
    setFormatEditor,
    edit,
    updateBlock: (id, patch, key) => edit((d) => updateBlockIn<Block>(d, id, patch), key),
    updateRow: (id, patch, key) => edit((d) => updateRowIn(d, id, patch), key),
    updateColumn: (id, patch, key) => edit((d) => updateColumnIn(d, id, patch), key),
    updateSettings: (patch, key) => edit((d) => updateSettingsIn(d, patch), key),
    addBlockAt: (type, columnId, index) => {
      const result = addBlockAt(latest.current, type, columnId, index, actionContext())
      // The "+" menu closes, so focus goes to the new block.
      apply({
        ...result,
        focusId: result.selection?.kind === 'block' ? result.selection.id : undefined,
      })
    },
    nudgeBlock: (id, delta) => moveAnnounced(id, nudgeBlock(latest.current, id, delta)),
    nudgeBlockSideways: (id, delta) =>
      moveAnnounced(id, nudgeBlockSideways(latest.current, id, delta)),
    duplicateBlock: (id) => {
      const before = latest.current
      const next = duplicateBlockIn(before, id)
      if (next === before) return
      const found = findBlock(next, id)
      const copy = found ? found.column.blocks[found.blockIndex + 1] : undefined
      apply({
        design: next,
        selection: copy ? { kind: 'block', id: copy.id } : undefined,
        focusId: copy?.id,
      })
    },
    removeBlock: (id) => {
      const before = latest.current
      const neighbour = neighbourOf(before, id)
      const found = findBlock(before, id)
      const column = found?.column.id
      apply({
        design: removeBlockIn(before, id),
        selection: neighbour
          ? { kind: 'block', id: neighbour }
          : column
            ? { kind: 'column', id: column }
            : null,
        // The next block, or when the column is empty, the row it was in.
        focusId: neighbour ?? found?.row.id,
      })
    },
    setLayout: (rowId, layout: LayoutId) =>
      apply({ design: setRowLayout(latest.current, rowId, layout) }),
    nudgeRow: (id, delta) => {
      const before = latest.current
      const next = nudgeRow(before, id, delta)
      const from = findRow(before, id)?.index ?? 0
      if (next === before) {
        setLive(`Row ${from + 1} cannot move ${delta < 0 ? 'up' : 'down'} any further.`)
      } else if (apply({ design: next, focusId: id })) {
        setLive(`Moved row ${from + 1} to position ${findRow(next, id)!.index + 1}.`)
      }
    },
    duplicateRow: (id) => {
      const before = latest.current
      const at = findRow(before, id)
      if (at && isSharedRowRef(at.row)) {
        const shared = rowOfShared(at.row.ref)
        if (!shared) {
          // Its content is not known (yet), so a footer in it could not be checked for.
          setNotice(
            'The shared block is not loaded yet, so it cannot be copied. Try again in a moment.',
          )
          return
        }
        // Two placeholders for a shared footer would give the email two footers.
        if (shared.columns.some((c) => c.blocks.some((b) => b.type === 'footer'))) {
          setNotice('This shared block has a footer, and an email can have only one footer.')
          return
        }
      }
      const next = duplicateRowIn(before, id)
      const copy = at ? next.rows[at.index + 1] : undefined
      apply({
        design: next,
        selection: copy ? { kind: 'row', id: copy.id } : undefined,
        focusId: copy?.id,
      })
    },
    removeRow: (id) => {
      const before = latest.current
      const at = findRow(before, id)
      const neighbour = at ? (before.rows[at.index + 1] ?? before.rows[at.index - 1]) : undefined
      apply({
        design: removeRowIn(before, id),
        selection: neighbour ? { kind: 'row', id: neighbour.id } : null,
        focusId: neighbour?.id,
      })
    },
    sharedRows: {
      items: sharedItems,
      enabled,
      canShare: Boolean(adapter?.save) && constraints.allowShared !== false,
      canEditShared: hasUpdate,
      canRemove: Boolean(adapter?.remove),
      resolve: resolveShared,
      rowOf: rowOfShared,
      retry: (ref) =>
        setFailed((state) => {
          const { [sharedKey(ref)]: _gone, ...rest } = state
          return rest
        }),
      insertShared,
      saveAsShared: async (rowId, name) => {
        const current = adapterRef.current
        const found = findRow(latest.current, rowId)
        if (!current?.save || !found || isSharedRowRef(found.row))
          return 'The row could not be saved'
        // What is being saved: the placeholder replaces the row only if it is still this.
        const snapshot = JSON.stringify(found.row)
        try {
          const created = await current.save(
            name,
            cloneRowWithNewIds(found.row),
            latest.current.settings.width,
            { shared: true },
          )
          const entry = readShared({
            ...created,
            shared: true,
            usageCount: created.usageCount ?? 0,
          })
          if (mounted.current)
            setSaved((state) => ({ ...state, status: 'ready', items: [...state.items, entry] }))
          // The row stays a normal row if it was changed or removed while the request ran.
          const now = findRow(latest.current, rowId)
          if (now && JSON.stringify(now.row) !== snapshot) {
            const message = `Saved “${name}” as a shared block from the earlier version of this row. The row was changed meanwhile, so it was left as it is; use the shared block from the palette to replace it.`
            setNotice(message)
            setLive(message)
          } else if (now) {
            apply({
              design: replaceRowWithSharedRef(latest.current, rowId, String(entry.id)),
              selection: { kind: 'row', id: rowId },
              notice: `Saved “${name}” as a shared block. This row now uses it.`,
            })
            setLive(`Saved “${name}” as a shared block.`)
          } else if (mounted.current) {
            setNotice(`Saved “${name}” as a shared block.`)
          }
          return null
        } catch (caught) {
          return caught instanceof Error ? caught.message : 'The row could not be saved'
        }
      },
      detach: (rowId) => {
        const before = latest.current
        const found = findRow(before, rowId)
        if (!found || !isSharedRowRef(found.row)) return
        const looked = resolveShared(found.row.ref)
        if (typeof looked === 'string') {
          setNotice(
            looked === 'loading'
              ? 'The shared block is still loading. Try again in a moment.'
              : 'The shared block cannot be copied because it is not available.',
          )
          return
        }
        const next = detachSharedRow(before, rowId, looked.row)
        const copy = next.rows[found.index]
        if (
          apply({
            design: next,
            selection: copy ? { kind: 'row', id: copy.id } : null,
            focusId: copy?.id,
            notice: `Made a copy of “${looked.name}” that you can edit here.`,
          })
        )
          setLive(`Detached “${looked.name}”. The copy is part of this email and can be edited.`)
      },
      openEditor: (rowId) => {
        const found = findRow(latest.current, rowId)
        if (found && isSharedRowRef(found.row) && adapterRef.current?.update)
          setEditingShared(rowId)
      },
      updateShared: async (id, row) => {
        const current = adapterRef.current
        if (!current?.update) return 'Shared blocks cannot be changed here.'
        try {
          const result = await current.update(id, { row }, latest.current.settings.width)
          const updated = readShared({ ...result, shared: true })
          const key = sharedKey(String(id))
          if (mounted.current) {
            setSaved((state) => ({
              ...state,
              items: state.items.map((item) =>
                String(item.id) === String(id)
                  ? { ...updated, usageCount: updated.usageCount ?? item.usageCount }
                  : item,
              ),
            }))
            setFetched((state) => (key in state ? { ...state, [key]: updated } : state))
            // The block may now give this email a second footer (the server would refuse it).
            const conflict =
              footerCount(latest.current, (ref) =>
                sharedKey(ref) === key ? updated.row : rowOfShared(ref),
              ) > 1
            const message = conflict
              ? `Saved the shared block “${updated.name}”, but this email now has more than one footer. Remove one before saving the template.`
              : `Saved the shared block “${updated.name}”.`
            setLive(message)
            setNotice(message)
          }
          return null
        } catch (caught) {
          return caught instanceof Error ? caught.message : 'The shared block could not be saved'
        }
      },
    },
    savedRows: {
      ...saved,
      items: plainItems,
      enabled,
      canSave: Boolean(adapter?.save),
      canRemove: Boolean(adapter?.remove),
      reload: reloadSaved,
      saveRow: async (rowId, name) => {
        const current = adapterRef.current
        const found = findRow(latest.current, rowId)
        if (!current?.save || !found || isSharedRowRef(found.row))
          return 'The row could not be saved'
        try {
          const row = await current.save(
            name,
            cloneRowWithNewIds(found.row),
            latest.current.settings.width,
          )
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
        if (!current?.remove) return
        try {
          await current.remove(id)
          if (mounted.current)
            setSaved((state) => ({ ...state, items: state.items.filter((item) => item.id !== id) }))
        } catch (caught) {
          if (!mounted.current) return
          if (caught instanceof SharedRowInUseError) {
            // A shared block in use is never deleted; say where it is used.
            const names = caught.templates.map((template) => template.name).join(', ')
            const count = caught.templates.length
            const message = `Used in ${count} ${count === 1 ? 'template' : 'templates'}${
              names ? `: ${names}` : ''
            }. Remove it from those templates first.`
            setNotice(message)
            setLive(message)
            return
          }
          setNotice(
            caught instanceof Error ? caught.message : 'The saved row could not be deleted.',
          )
        }
      },
    },
  }

  /* -- palette clicks ------------------------------------------------------ */

  const onAddBlock = (type: BlockType) => {
    apply(addBlock(latest.current, type, selectionRef.current, actionContext()))
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
        { resolveShared: rowOfShared },
      ),
    )
    if (!isDesktop) setSheet(null)
  }

  /* -- undo, redo and shortcuts -------------------------------------------- */

  const historyRef = useRef(history)
  historyRef.current = history
  useEffect(() => {
    // The "Edit shared block" dialog has its own editor and its own undo.
    if (disabled || editingShared) return
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
      if (action === 'undo') historyRef.current.undo()
      else historyRef.current.redo()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [disabled, editingShared])

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
        {
          ...actionContext(),
          sharedRow: (id) => saved.items.find((item) => String(item.id) === id)?.row,
        },
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
    if (palette?.kind === 'palette-shared') {
      const row = saved.items.find((item) => String(item.id) === palette.id)
      return { icon: 'link' as const, text: row ? `Shared block “${row.name}”` : 'Shared block' }
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
    if (row && isSharedRowRef(row.row))
      return { icon: 'link' as const, text: `Shared block · Row ${row.index + 1}` }
    return row ? { icon: 'layout' as const, text: `Row ${row.index + 1}` } : null
  })()

  const editingRow = editingShared ? findRow(design, editingShared) : null
  const editingLookup =
    editingRow && isSharedRowRef(editingRow.row) ? resolveShared(editingRow.row.ref) : null
  const editingSaved = editingLookup && typeof editingLookup !== 'string' ? editingLookup : null
  useEffect(() => {
    // The placeholder went away (or the block was deleted) while its dialog was open.
    if (editingShared && !editingSaved) setEditingShared(null)
  }, [editingShared, editingSaved])

  const chooseDevice = (next: Device) => {
    if (deviceProp === undefined) setOwnDevice(next)
    onDeviceChange?.(next)
  }

  return (
    <EditorContext.Provider value={api}>
      <div
        ref={root}
        className={['seb-editor', 'seb-blocks', className].filter(Boolean).join(' ')}
        role="group"
        aria-label={ariaLabel}
        data-disabled={disabled || undefined}
        // A drag in progress (its Esc cancels the drag; an enclosing dialog must not also close).
        data-drag-active={dragging ? '' : undefined}
        data-layout={isDesktop ? 'wide' : 'narrow'}
      >
        <DndContext
          sensors={sensors}
          accessibility={{ announcements }}
          collisionDetection={collisionDetection}
          // Drop areas move while the canvas scrolls under a drag: measure them all the time,
          // and scroll gently near the edges.
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
          autoScroll={{ threshold: { x: 0.05, y: 0.05 }, acceleration: 3, interval: 10 }}
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
                  onInsertShared={insertShared}
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
                <div className="seb-segmented" role="group" aria-label="Canvas width">
                  {DEVICES.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={device === option.value}
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
              <div className="seb-sr-only" aria-live="polite" aria-atomic="true">
                {live}
              </div>
              {shown && (
                <div className="seb-alert">
                  <p role="alert">{shown.message}</p>
                  <button type="button" className="seb-action" onClick={dismissHighlight}>
                    Dismiss
                  </button>
                </div>
              )}
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
                onInsertShared={insertShared}
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
        {editingShared && editingSaved && (
          <SharedRowDialog
            saved={editingSaved}
            settings={design.settings}
            mergeFields={mergeFields}
            brand={brand}
            onUploadImage={onUploadImage}
            dataSources={sources}
            onSave={(row) => api.sharedRows.updateShared(editingSaved.id, row)}
            onClose={() => setEditingShared(null)}
          />
        )}
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
