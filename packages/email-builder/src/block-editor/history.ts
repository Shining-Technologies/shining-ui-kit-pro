import { useCallback, useMemo, useReducer, useRef } from 'react'
import { withDefaults, type BlockDesign } from '../design'

export const HISTORY_LIMIT = 50
/** Edits to the same field within this many milliseconds share one undo step. */
const COALESCE_MS = 1000

/**
 * Undo and redo over a controlled design: a stack of up to 50 snapshots, kept
 * here (the parent only stores the value). A value that changes without us
 * having emitted it (a template loaded) starts a new history. Typing in one
 * field is one step, not one per key.
 */
export function useHistory(design: BlockDesign, onChange: (design: BlockDesign) => void) {
  const [, bump] = useReducer((n: number) => n + 1, 0)
  const undoStack = useRef<BlockDesign[]>([])
  const redoStack = useRef<BlockDesign[]>([])
  const latest = useRef(design)
  const emitted = useRef<string | null>(null)
  const shown = useRef<string | null>(null)
  const lastCommit = useRef<{ key: string; at: number } | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const key = useMemo(() => JSON.stringify(design), [design])
  const latestKey = useRef(key)
  if (key !== shown.current) {
    // A value we did not emit starts a new history.
    if (shown.current !== null && key !== emitted.current) {
      undoStack.current = []
      redoStack.current = []
      lastCommit.current = null
    }
    shown.current = key
  }
  latest.current = design
  latestKey.current = key

  const emit = (next: BlockDesign) => {
    // The parent hands the value back through `toBlockDesign`, which fills defaults.
    emitted.current = JSON.stringify(withDefaults(next))
    latest.current = next
    latestKey.current = emitted.current
    onChangeRef.current(next)
    bump()
  }

  const commit = useCallback((next: BlockDesign, coalesceKey?: string) => {
    // Compare the content, not the identity: a move to where a block already is makes no step.
    if (next === latest.current || JSON.stringify(withDefaults(next)) === latestKey.current) return
    const now = Date.now()
    const last = lastCommit.current
    const merge = Boolean(
      coalesceKey && last && last.key === coalesceKey && now - last.at < COALESCE_MS,
    )
    if (!merge) undoStack.current = [...undoStack.current, latest.current].slice(-HISTORY_LIMIT)
    lastCommit.current = coalesceKey ? { key: coalesceKey, at: now } : null
    redoStack.current = []
    emit(next)
  }, [])

  const undo = useCallback(() => {
    const previous = undoStack.current[undoStack.current.length - 1]
    if (!previous) return
    undoStack.current = undoStack.current.slice(0, -1)
    redoStack.current = [...redoStack.current, latest.current]
    lastCommit.current = null
    emit(previous)
  }, [])

  const redo = useCallback(() => {
    const next = redoStack.current[redoStack.current.length - 1]
    if (!next) return
    redoStack.current = redoStack.current.slice(0, -1)
    undoStack.current = [...undoStack.current, latest.current].slice(-HISTORY_LIMIT)
    lastCommit.current = null
    emit(next)
  }, [])

  return {
    commit,
    undo,
    redo,
    latest,
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
  }
}

/** Ctrl/Cmd+Z undoes, Shift+Z or Y redoes — unless focus is in a field or editable text. */
export function shortcutFor(event: KeyboardEvent): 'undo' | 'redo' | null {
  if (!(event.metaKey || event.ctrlKey) || event.altKey) return null
  const target = event.target as HTMLElement | null
  if (
    target?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])')
  )
    return null
  const key = event.key.toLowerCase()
  if (key === 'z') return event.shiftKey ? 'redo' : 'undo'
  if (key === 'y') return 'redo'
  return null
}
