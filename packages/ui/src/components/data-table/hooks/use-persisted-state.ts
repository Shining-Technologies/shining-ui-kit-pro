'use client'

import type { ColumnPinningState, ColumnSizingState, VisibilityState } from '../../../core'
import { useEffect, useLayoutEffect, useRef } from 'react'
import type { DataTablePersistOptions, PersistedTableState } from '../types/props'

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

const STORAGE_PREFIX = 'sui-data-table'
const DEFAULT_SLICES: readonly PersistedTableState[] = ['columnPinning']

export interface ResolvedPersistence {
  /** Storage key for the table; each slice is stored under `${key}:${slice}`. */
  key: string
  slices: readonly PersistedTableState[]
  storage: 'local' | 'session'
}

/**
 * Turn the `persist` prop into a storage key and a list of slices, or `null`.
 *
 * Without an explicit key the table is named by its `id`, or else by its
 * column ids: the same table on another page — or after a reload — finds what
 * it saved, and two different tables almost never collide.
 */
export function resolvePersistence(
  persist: boolean | string | DataTablePersistOptions | undefined,
  id: string | undefined,
  columnIds: string,
): ResolvedPersistence | null {
  if (persist === false) return null
  const options: DataTablePersistOptions =
    typeof persist === 'string' ? { key: persist } : typeof persist === 'object' ? persist : {}
  const name = options.key || id || (columnIds ? `columns:${columnIds}` : '')
  const slices = options.state ?? DEFAULT_SLICES
  if (!name || slices.length === 0) return null
  return { key: `${STORAGE_PREFIX}:${name}`, slices, storage: options.storage ?? 'local' }
}

function getStorage(kind: 'local' | 'session'): Storage | null {
  if (typeof window === 'undefined') return null
  // Storage can be switched off, full, or blocked outright (a sandboxed frame
  // throws on the property access itself). None of that is worth an error:
  // the table simply forgets.
  try {
    return kind === 'session' ? window.sessionStorage : window.localStorage
  } catch {
    return null
  }
}

function readStored(kind: 'local' | 'session', key: string): unknown {
  try {
    const raw = getStorage(kind)?.getItem(key)
    return raw == null ? undefined : (JSON.parse(raw) as unknown)
  } catch {
    return undefined
  }
}

function writeStored(kind: 'local' | 'session', key: string, value: unknown): void {
  try {
    getStorage(kind)?.setItem(key, JSON.stringify(value))
  } catch {
    // Quota exceeded or storage blocked; see `getStorage`.
  }
}

export interface PersistedSliceOptions<T> {
  persistence: ResolvedPersistence | null
  slice: PersistedTableState
  /** A controlled slice belongs to the application and is left alone. */
  controlled: boolean
  /** Whether the feature behind the slice is on; a switched-off one is not restored. */
  available: boolean
  value: T
  setValue: (value: T) => void
  /** Validate a stored value against the current columns; `undefined` discards it. */
  parse: (stored: unknown) => T | undefined
}

/**
 * Keep one uncontrolled state slice in browser storage.
 *
 * The stored value is read before the first paint on the client, so a
 * client-rendered table never shows its defaults first. A server-rendered one
 * cannot know what the browser saved, so it renders the defaults and switches
 * right after hydration. After that, every change the user makes is saved.
 */
export function usePersistedSlice<T>({
  persistence,
  slice,
  controlled,
  available,
  value,
  setValue,
  parse,
}: PersistedSliceOptions<T>): void {
  const enabled = Boolean(persistence?.slices.includes(slice)) && !controlled && available
  const storageKey = enabled && persistence ? `${persistence.key}:${slice}` : null
  const storage = persistence?.storage ?? 'local'

  const latest = useRef({ value, setValue, parse })
  latest.current = { value, setValue, parse }
  // The value the slice held when it was loaded. Anything else is a change
  // worth saving; the load itself is not.
  const loaded = useRef<{ key: string; value: T } | null>(null)

  useIsomorphicLayoutEffect(() => {
    if (!storageKey) {
      loaded.current = null
      return
    }
    loaded.current = { key: storageKey, value: latest.current.value }
    const stored = readStored(storage, storageKey)
    if (stored === undefined) return
    const restored = latest.current.parse(stored)
    if (restored !== undefined) latest.current.setValue(restored)
  }, [storage, storageKey])

  useEffect(() => {
    const base = loaded.current
    if (!storageKey || !base || base.key !== storageKey || Object.is(base.value, value)) return
    base.value = value
    writeStored(storage, storageKey, value)
  }, [storage, storageKey, value])
}

// ------------------------------------------------------------------ parsers

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

/**
 * A stored pinning, restricted to columns that still exist.
 *
 * The injected columns (selection, actions) are not the user's to pin — the
 * menu does not offer them — so they always follow the table's current
 * configuration: leading on the left, trailing on the right.
 */
export function parsePinning(
  stored: unknown,
  pinnable: ReadonlySet<string>,
  structural: ReadonlySet<string>,
  initial: ColumnPinningState,
): ColumnPinningState | undefined {
  if (!stored || typeof stored !== 'object') return undefined
  const { left, right } = stored as { left?: unknown; right?: unknown }
  if ((left !== undefined && !isStringList(left)) || (right !== undefined && !isStringList(right))) {
    return undefined
  }
  const leftIds = (left ?? []).filter((id) => pinnable.has(id))
  const rightIds = (right ?? []).filter((id) => pinnable.has(id) && !leftIds.includes(id))
  const lead = (initial.left ?? []).filter((id) => structural.has(id))
  const trail = (initial.right ?? []).filter((id) => structural.has(id))
  return { left: [...lead, ...leftIds], right: [...rightIds, ...trail] }
}

/** A stored sizing, keeping only positive widths of columns that still exist. */
export function parseSizing(
  stored: unknown,
  columns: ReadonlySet<string>,
): ColumnSizingState | undefined {
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return undefined
  const sizing: ColumnSizingState = {}
  for (const [id, size] of Object.entries(stored)) {
    if (columns.has(id) && typeof size === 'number' && Number.isFinite(size) && size > 0) {
      sizing[id] = size
    }
  }
  return sizing
}

/** A stored visibility, keeping only columns that still exist and may be hidden. */
export function parseVisibility(
  stored: unknown,
  hideable: ReadonlySet<string>,
): VisibilityState | undefined {
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return undefined
  const visibility: VisibilityState = {}
  for (const [id, visible] of Object.entries(stored)) {
    if (hideable.has(id) && typeof visible === 'boolean') visibility[id] = visible
  }
  return visibility
}
