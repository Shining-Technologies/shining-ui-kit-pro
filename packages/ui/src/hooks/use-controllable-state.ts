'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useEventCallback } from './use-event-callback'

/** An updater in the React `setState` sense: a value, or a function of the previous one. */
export type Updater<T> = T | ((old: T) => T)

export function applyUpdater<T>(updater: Updater<T>, previous: T): T {
  return typeof updater === 'function' ? (updater as (old: T) => T)(previous) : updater
}

export interface ControllableStateOptions<T> {
  /** When defined, the value is controlled by the parent. */
  value: T | undefined
  /** Initial value while uncontrolled. */
  defaultValue: T
  /** Always called, controlled or not. */
  onChange?: (value: T) => void
}

/**
 * One implementation of controlled/uncontrolled, used by all nine state slices,
 * so the behaviour cannot drift between them (§38).
 *
 * `onChange` fires in both modes; in controlled mode the internal store is not
 * used, so the parent stays the single source of truth.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: ControllableStateOptions<T>): [T, (updater: Updater<T>) => void] {
  const isControlled = value !== undefined
  const [internal, setInternal] = useState<T>(defaultValue)
  const handleChange = useEventCallback(onChange)

  // Keep a ref of the current value so the setter can stay referentially stable.
  const current = isControlled ? (value as T) : internal
  const currentRef = useRef(current)
  currentRef.current = current

  const setValue = useCallback(
    (updater: Updater<T>) => {
      const next = applyUpdater(updater, currentRef.current)
      if (Object.is(next, currentRef.current)) return
      if (!isControlled) setInternal(next)
      handleChange(next)
    },
    [handleChange, isControlled],
  )

  return useMemo(() => [current, setValue], [current, setValue])
}
