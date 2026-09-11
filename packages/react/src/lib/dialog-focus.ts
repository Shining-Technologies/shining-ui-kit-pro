import { useRef, type ForwardedRef } from 'react'
import { useEventCallback } from './use-event-callback'

/**
 * Behaviour shared by every dialog-shaped panel — `DialogContent`,
 * `AlertDialogContent`, `SheetContent` — and the one piece of menu state it
 * needs. @internal: nothing here is exported from the package.
 */

/* ------------------------------------------------------------ environment */

/**
 * Whether development-only warnings should run.
 *
 * The library build leaves `process.env.NODE_ENV` alone (Vite's library mode
 * does not replace `process.env`), so the consumer's bundler decides — which is
 * the point: an app's production build strips the warning. An unbundled
 * browser import has no `process` at all, and reading it throws; that is
 * treated as production rather than guessed at.
 */
export function isDevelopment(): boolean {
  try {
    return process.env.NODE_ENV !== 'production'
  } catch {
    return false
  }
}

/* ------------------------------------------------------- menu → dialog focus */

let menuTrigger: HTMLElement | null = null
let menuClosedAt: number | null = null

/** How long after a menu closes a dialog still counts as opened from it. */
const MENU_HANDOFF_MS = 1000

/**
 * Called by `DropdownMenuContent` as its panel mounts (`node`) and unmounts
 * (`null`). Radix labels the panel by its trigger, so the trigger is found
 * from the panel rather than from wherever focus happened to be — Safari does
 * not focus a button on click.
 */
export function trackMenuContent(node: HTMLElement | null) {
  if (!node) {
    menuClosedAt = Date.now()
    return
  }
  const id = node.getAttribute('aria-labelledby')
  menuTrigger = id ? node.ownerDocument.getElementById(id) : null
  menuClosedAt = null
}

function recentMenuTrigger(): HTMLElement | null {
  if (!menuTrigger?.isConnected) return null
  if (menuClosedAt !== null && Date.now() - menuClosedAt > MENU_HANDOFF_MS) return null
  return menuTrigger
}

function tryFocus(element: HTMLElement | null): boolean {
  if (!element?.isConnected) return false
  element.focus({ preventScroll: true })
  return element.ownerDocument.activeElement === element
}

/* --------------------------------------------------------- accessible name */

function hasAccessibleName(content: HTMLElement): boolean {
  if (content.getAttribute('aria-label')?.trim()) return true
  const ids = content.getAttribute('aria-labelledby')?.split(/\s+/).filter(Boolean) ?? []
  return ids.some((id) => content.ownerDocument.getElementById(id)?.textContent?.trim())
}

/* -------------------------------------------------------------------- hook */

type CloseAutoFocusHandler = (event: Event) => void

/**
 * Wires a dialog panel for focus return and, in development, for a missing
 * accessible name. Returns the ref and the `onCloseAutoFocus` to put on the
 * Radix content.
 *
 * Focus return: Radix sends focus back to the `DialogTrigger`, and to nothing
 * at all when there is none — a controlled dialog, a `ConfirmDialog`, or one
 * opened from a `DropdownMenuItem`, whose item has unmounted by the time the
 * dialog closes. Each of those dropped focus on `<body>`, which for a keyboard
 * or screen-reader user means starting again from the top of the page. So the
 * element that had focus when the panel opened gets it back; if that was a
 * menu item (or nothing), the menu's trigger does. A caller's own
 * `onCloseAutoFocus` runs first and can `preventDefault()` to take over.
 */
export function useDialogPanel(
  kind: string,
  forwarded: ForwardedRef<HTMLDivElement>,
  onCloseAutoFocus: CloseAutoFocusHandler | undefined,
) {
  const opener = useRef<HTMLElement | null>(null)
  const fallback = useRef<HTMLElement | null>(null)
  const warned = useRef(false)

  // Stable identity, so React does not detach and re-attach it on every render
  // — a re-attach while open would re-read focus from inside the panel.
  const ref = useEventCallback((node: HTMLDivElement | null) => {
    if (typeof forwarded === 'function') forwarded(node)
    else if (forwarded) forwarded.current = node
    if (!node) return

    // Attached as the panel mounts, before Radix moves focus into it.
    const active = node.ownerDocument.activeElement as HTMLElement | null
    const usable = active && active !== node.ownerDocument.body && !node.contains(active)
    opener.current = usable ? active : null
    fallback.current = !usable || active.closest('[role="menu"]') ? recentMenuTrigger() : null

    if (!warned.current && isDevelopment()) {
      // After the current task, so a title rendered by an effect still counts.
      setTimeout(() => {
        if (warned.current || !node.isConnected || hasAccessibleName(node)) return
        warned.current = true
        console.warn(
          `[shining-ui-kit] <${kind}> has no accessible name, so a screen reader announces ` +
            'only "dialog". Add a title (wrap it in <VisuallyHidden> to hide it) or an aria-label.',
        )
      }, 0)
    }
  })

  const handleCloseAutoFocus = useEventCallback((event: Event) => {
    onCloseAutoFocus?.(event)
    const candidates = [opener.current, fallback.current]
    opener.current = null
    fallback.current = null
    if (event.defaultPrevented) return
    // Only claimed once something actually took focus; otherwise Radix's own
    // default — the trigger, if there is one — still runs.
    if (candidates.some(tryFocus)) event.preventDefault()
  })

  return { ref, onCloseAutoFocus: handleCloseAutoFocus }
}
