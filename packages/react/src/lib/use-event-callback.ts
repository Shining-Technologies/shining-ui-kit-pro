import { useCallback, useInsertionEffect, useRef } from 'react'

/**
 * A callback with a stable identity that always sees the latest render's scope.
 *
 * Lets us pass handlers into memoised rows without invalidating them on every
 * parent render — the main lever for keeping large tables from re-rendering (§40).
 */
export function useEventCallback<TArgs extends unknown[], TResult>(
  fn: ((...args: TArgs) => TResult) | undefined,
): (...args: TArgs) => TResult | undefined {
  const ref = useRef(fn)

  useInsertionEffect(() => {
    ref.current = fn
  }, [fn])

  return useCallback((...args: TArgs) => ref.current?.(...args), [])
}
