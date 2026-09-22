'use client'

import {
  stableHash,
  type ColumnPinningState,
  type ColumnSizingState,
  type VisibilityState,
} from '../../../core'
import { useEffect, useLayoutEffect, useRef } from 'react'
import type { DataTablePersistOptions, PersistedTableState } from '../types/props'

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

const STORAGE_PREFIX = 'sui-data-table'
const DEFAULT_SLICES: readonly PersistedTableState[] = ['columnPinning', 'columnVisibility']
const SLICES: readonly PersistedTableState[] = ['columnPinning', 'columnSizing', 'columnVisibility']

/** The version of the record written to storage. Bump it when the shape changes, and migrate below. */
export const LAYOUT_VERSION = 1

/** What one table keeps in storage: one record, versioned, a slice per feature. */
export interface PersistedLayout {
  version: typeof LAYOUT_VERSION
  columnPinning?: ColumnPinningState
  columnSizing?: ColumnSizingState
  columnVisibility?: VisibilityState
}

export interface ResolvedPersistence {
  /** Storage key for the table's record. */
  key: string
  slices: readonly PersistedTableState[]
  storage: 'local' | 'session'
  /**
   * Names the table went by before 2.1.2, when each slice had its own entry
   * (`<name>:<slice>`) and a table without an `id` was named by its column ids
   * in full. A record found under one of these is imported once and the old
   * entries removed, so nothing a user pinned before the upgrade is lost.
   */
  legacyKeys: readonly string[]
}

/**
 * Turn the `persist` prop into a storage key and a list of slices, or `null`.
 *
 * The key is, in order of preference, the `persist` key, the table's `id`, or
 * a fingerprint of its column ids. Nothing else takes part — not the headers,
 * not the data, not the column configuration — so a title that is renamed or
 * translated, or a header that is an element rather than text, leaves the key
 * where it was. Two tables only ever share a record when they have the same
 * key or `id`, or no `id` and the same column ids, in which case they are the
 * same table on two pages and sharing is what the user expects.
 *
 * The fingerprint is hashed to keep the key short. A hash collision would
 * only make two unrelated tables share a record, and each reads it against
 * its own columns, so nothing that does not apply survives the read.
 */
export function resolvePersistence(
  persist: boolean | string | DataTablePersistOptions | undefined,
  id: string | undefined,
  columnIds: string,
): ResolvedPersistence | null {
  if (persist === false) return null
  const options: DataTablePersistOptions =
    typeof persist === 'string' ? { key: persist } : typeof persist === 'object' ? persist : {}
  const slices = options.state ?? DEFAULT_SLICES
  if (slices.length === 0) return null
  const explicit = options.key || id
  const name = explicit || (columnIds ? `columns:${stableHash(columnIds)}` : '')
  if (!name) return null
  const key = `${STORAGE_PREFIX}:${name}`
  const legacyKeys = explicit ? [key] : [`${STORAGE_PREFIX}:columns:${columnIds}`]
  return { key, slices, storage: options.storage ?? 'local', legacyKeys }
}

// ------------------------------------------------------------------ storage

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

function removeStored(kind: 'local' | 'session', key: string): void {
  try {
    getStorage(kind)?.removeItem(key)
  } catch {
    // See `getStorage`.
  }
}

/** The slices of a stored record, still unvalidated: each is checked against the current columns on use. */
type StoredSlices = Partial<Record<PersistedTableState, unknown>>

/**
 * Read a record of any version into the current shape.
 *
 * A record this version of the table cannot read — a newer version, or no
 * version at all — is ignored rather than guessed at, and overwritten by the
 * next change the user makes. Add a case here when `LAYOUT_VERSION` moves.
 */
export function migrateLayout(raw: unknown): StoredSlices | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const record = raw as Record<string, unknown>
  switch (record.version) {
    case 1: {
      const slices: StoredSlices = {}
      for (const slice of SLICES) if (record[slice] !== undefined) slices[slice] = record[slice]
      return slices
    }
    default:
      return undefined
  }
}

/**
 * The record for a table, from its own key or else imported from where an
 * earlier version kept it. `imported` asks for the record to be written back
 * under its new key and the old entries removed.
 */
function readLayout(
  persistence: ResolvedPersistence,
): { slices: StoredSlices; imported: boolean } | undefined {
  const stored = readStored(persistence.storage, persistence.key)
  if (stored !== undefined) {
    const slices = migrateLayout(stored)
    return slices && { slices, imported: false }
  }
  const slices: StoredSlices = {}
  let found = false
  for (const base of persistence.legacyKeys) {
    for (const slice of SLICES) {
      const value = readStored(persistence.storage, `${base}:${slice}`)
      if (value === undefined || slices[slice] !== undefined) continue
      slices[slice] = value
      found = true
    }
  }
  return found ? { slices, imported: true } : undefined
}

function removeLegacy(persistence: ResolvedPersistence): void {
  for (const base of persistence.legacyKeys) {
    for (const slice of SLICES) removeStored(persistence.storage, `${base}:${slice}`)
  }
}

// --------------------------------------------------------------------- hook

export interface PersistedSlice<T> {
  /** A controlled slice belongs to the application and is left alone. */
  controlled: boolean
  /** Whether the feature behind the slice is on; a switched-off one is not restored. */
  available: boolean
  value: T
  // Method syntax on purpose: it lets a slice of any type be handled by name.
  setValue(value: T): void
  /** Validate a stored value against the current columns; `undefined` discards it. */
  parse(stored: unknown): T | undefined
}

export interface PersistedLayoutSlices {
  columnPinning: PersistedSlice<ColumnPinningState>
  columnSizing: PersistedSlice<ColumnSizingState>
  columnVisibility: PersistedSlice<VisibilityState>
}

function restore(slice: PersistedSlice<unknown>, raw: unknown): void {
  const restored = slice.parse(raw)
  if (restored !== undefined) slice.setValue(restored)
}

interface Loaded {
  key: string
  /** Each slice's value when the record was loaded, or last written. Anything else is a change worth saving. */
  values: Partial<Record<PersistedTableState, unknown>>
  /** What the record holds, including slices this table does not manage, which it keeps as they are. */
  stored: StoredSlices
}

/**
 * Keep the uncontrolled column layout in browser storage.
 *
 * The stored record is read before the first paint on the client, so a
 * client-rendered table never shows its defaults first. A server-rendered one
 * cannot know what the browser saved, so it renders the defaults and switches
 * right after hydration. After that, every change the user makes is saved.
 *
 * Persistence is an enhancement: storage that is missing, full, blocked or
 * holding something unreadable leaves the table working from its defaults.
 */
export function usePersistedLayout(
  persistence: ResolvedPersistence | null,
  slices: PersistedLayoutSlices,
): void {
  const latest = useRef({ slices, persistence })
  latest.current = { slices, persistence }

  const active = persistence
    ? SLICES.filter(
        (slice) =>
          persistence.slices.includes(slice) && !slices[slice].controlled && slices[slice].available,
      )
    : []
  const activeKey = active.join(',')
  const storageKey = active.length > 0 && persistence ? persistence.key : null
  const storage = persistence?.storage ?? 'local'
  const legacyKey = persistence?.legacyKeys.join('|') ?? ''

  const loaded = useRef<Loaded | null>(null)

  // `persistence` is rebuilt from the strings below, so they are the
  // dependencies; the object itself is read from the ref.
  useIsomorphicLayoutEffect(() => {
    loaded.current = null
    const { slices: current, persistence: resolved } = latest.current
    if (!storageKey || !resolved) return
    const values: Loaded['values'] = {}
    for (const slice of SLICES) values[slice] = current[slice].value
    const record = readLayout(resolved)
    loaded.current = { key: storageKey, values, stored: record?.slices ?? {} }
    if (!record) return
    for (const slice of activeKey.split(',') as PersistedTableState[]) {
      const raw = record.slices[slice]
      if (raw !== undefined) restore(current[slice], raw)
    }
    if (record.imported) {
      writeStored(storage, storageKey, { version: LAYOUT_VERSION, ...record.slices })
      removeLegacy(resolved)
    }
  }, [storage, storageKey, activeKey, legacyKey])

  const pinning = slices.columnPinning.value
  const sizing = slices.columnSizing.value
  const visibility = slices.columnVisibility.value
  useEffect(() => {
    const base = loaded.current
    if (!storageKey || !base || base.key !== storageKey) return
    let changed = false
    for (const slice of activeKey.split(',') as PersistedTableState[]) {
      const value = latest.current.slices[slice].value
      if (Object.is(base.values[slice], value)) continue
      base.values[slice] = value
      base.stored[slice] = value
      changed = true
    }
    if (changed) writeStored(storage, storageKey, { version: LAYOUT_VERSION, ...base.stored })
  }, [storage, storageKey, activeKey, pinning, sizing, visibility])
}

// ------------------------------------------------------------------ parsers

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

/**
 * A stored pinning, restricted to columns that still exist, each on one side
 * only (the left wins).
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
  const leftIds = (left ?? []).filter((id, index, ids) => pinnable.has(id) && ids.indexOf(id) === index)
  const rightIds = (right ?? []).filter(
    (id, index, ids) => pinnable.has(id) && !leftIds.includes(id) && ids.indexOf(id) === index,
  )
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
