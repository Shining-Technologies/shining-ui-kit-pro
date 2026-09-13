'use client'

import type { Breakpoint, ColumnResponsive } from '../../../core'
import { useCallback, useMemo, useSyncExternalStore } from 'react'

/** Mirrors the `sui-hide-below-*` / `sui-hide-above-*` rules in table.css. */
const BREAKPOINT_PX: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

const EMPTY: string[] = []
const noop = () => {}

/**
 * Listen for a media query flipping. Safari before 14 has no
 * `addEventListener` on `MediaQueryList`, only the older `addListener`, so
 * that is the fallback; the returned function undoes whichever was used.
 */
function listen(list: MediaQueryList, notify: () => void): () => void {
  if (typeof list.addEventListener === 'function') {
    list.addEventListener('change', notify)
    return () => list.removeEventListener('change', notify)
  }
  if (typeof list.addListener === 'function') {
    list.addListener(notify)
    return () => list.removeListener(notify)
  }
  return noop
}

function queriesFor(responsive: ColumnResponsive): string[] {
  const queries: string[] = []
  if (responsive.hideBelow) {
    queries.push(`(max-width: ${BREAKPOINT_PX[responsive.hideBelow] - 1}px)`)
  }
  if (responsive.hideAbove) {
    queries.push(`(min-width: ${BREAKPOINT_PX[responsive.hideAbove]}px)`)
  }
  return queries
}

/**
 * The ids of the columns that `meta.responsive` hides at the current viewport.
 *
 * Responsive hiding used to be CSS alone, which made it permanent: a
 * `display: none !important` column could not be brought back through the
 * column picker, the picker still listed it as visible, and a pinned column
 * after it kept an offset for a column that was not on screen. As table state
 * it is an ordinary default the user can override.
 *
 * The CSS classes are still emitted, so the server render and the first paint
 * agree with the viewport before this hook has run.
 */
export function useResponsiveHidden(rules: Map<string, ColumnResponsive>): string[] {
  // Keyed by content, so inline `columns` rebuilt on every render do not
  // re-create the media query lists and re-subscribe each time.
  const key = rules.size
    ? JSON.stringify([...rules].map(([id, responsive]) => [id, queriesFor(responsive)]))
    : ''

  const entries = useMemo(() => {
    if (!key) return []
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return []
    return (JSON.parse(key) as [string, string[]][]).map(([id, queries]) => ({
      id,
      media: queries.map((query) => window.matchMedia(query)),
    }))
  }, [key])

  const subscribe = useCallback(
    (notify: () => void) => {
      const lists = entries.flatMap((entry) => entry.media)
      if (lists.length === 0) return noop
      const undo = lists.map((list) => listen(list, notify))
      return () => {
        for (const stop of undo) stop()
      }
    },
    [entries],
  )

  // The snapshot is a string of entry positions — cheap to compare, stable
  // while nothing changes, and free of any separator a column id could contain.
  const getSnapshot = useCallback(
    () =>
      entries
        .flatMap((entry, index) => (entry.media.some((list) => list.matches) ? [index] : []))
        .join(','),
    [entries],
  )

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => '')
  return useMemo(
    () => (snapshot ? snapshot.split(',').map((index) => entries[Number(index)]?.id ?? '') : EMPTY),
    [entries, snapshot],
  )
}
