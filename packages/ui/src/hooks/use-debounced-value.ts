'use client'

import { useEffect, useState } from 'react'

/**
 * Debounce a value. Used by the search box so typing does not re-filter (or,
 * in server mode, re-fetch) on every keystroke.
 *
 * A delay of `0` short-circuits entirely, which keeps tests synchronous.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    if (delayMs <= 0) {
      setDebounced(value)
      return
    }
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return delayMs <= 0 ? value : debounced
}
