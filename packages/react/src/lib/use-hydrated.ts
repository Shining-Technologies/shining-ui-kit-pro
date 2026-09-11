import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/**
 * `false` on the server and while hydrating server HTML; `true` from then on,
 * and from the very first render of an app with no server rendering.
 *
 * State that lives only in the browser — `localStorage`, a persisted registry —
 * must not reach the first client render of server HTML: the server could not
 * see it, so the markup would disagree, and React does not patch mismatched
 * attributes. Gate it on this instead. React re-renders straight after
 * hydration, so the stored value still arrives, one commit later; a client-only
 * app reads it on its first render and never shows the default at all.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}
