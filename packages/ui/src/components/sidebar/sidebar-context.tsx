'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { useHydrated } from '../../hooks/use-hydrated'
import type { SidebarLinkProps } from './sidebar-nav'

/* ------------------------------------------------------------------ storage */

/**
 * A remembered value, or `undefined`. `valid` guards the shape: the key is in
 * a shared namespace, and a string where a boolean belongs would otherwise
 * collapse the sidebar because `"false"` is truthy.
 */
export function readStored<T>(
  key: string | undefined,
  valid: (value: unknown) => value is T,
): T | undefined {
  if (!key || typeof window === 'undefined') return undefined
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return undefined
    const value: unknown = JSON.parse(raw)
    return valid(value) ? value : undefined
  } catch {
    // Private mode, a quota, a value some other code wrote: none is worth a crash.
    return undefined
  }
}

export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'

export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string')

export function writeStored(key: string | undefined, value: unknown) {
  if (!key || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* see readStored */
  }
}

const noop = () => {}

/** Mirrored by the `max-width: 48rem` queries in shell.css and sidebar.css. */
export const DEFAULT_BREAKPOINT = '48rem'

function useMediaQuery(query: string | null): boolean {
  const subscribe = useCallback(
    (notify: () => void) => {
      if (!query || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return noop
      }
      const list = window.matchMedia(query)
      list.addEventListener('change', notify)
      return () => list.removeEventListener('change', notify)
    },
    [query],
  )
  const read = () =>
    !!query &&
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(query).matches

  return useSyncExternalStore(subscribe, read, () => false)
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
}

/* ------------------------------------------------------------------ context */

export interface SidebarContextValue {
  /** The desktop preference: icon rail or full width. */
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  /** Whether the phone drawer is showing. */
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  /** Below `mobileBreakpoint`: the sidebar is a drawer, not a column. */
  isMobile: boolean
  /** Collapse or expand on a desktop; open or close the drawer on a phone. */
  toggle: () => void
  /** Rendering as the icon rail right now — collapsed, and not in the drawer. */
  rail: boolean
  /** The id on the `<aside>`, for `aria-controls`. */
  sidebarId: string
  storageKey?: string
  /** The width below which the sidebar is a drawer, as given to the provider. */
  mobileBreakpoint?: string | false
}

export const SidebarContext = createContext<SidebarContextValue | null>(null)

/** The sidebar's layout state. Throws outside a `Sidebar` or `SidebarProvider`. */
export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used inside <Sidebar> or <SidebarProvider>.')
  }
  return context
}

/**
 * Overrides `rail` for a subtree. A flyout's contents are portalled out of the
 * rail and must render at full width even though the sidebar is collapsed.
 */
export const RailContext = createContext<boolean | null>(null)

export function useRail(): boolean {
  const override = useContext(RailContext)
  const sidebar = useContext(SidebarContext)
  return override ?? sidebar?.rail ?? false
}

/** Closes the flyout an item is in, so choosing a destination dismisses it. */
export const FlyoutContext = createContext<(() => void) | null>(null)

/**
 * The `renderLink` given to `Sidebar`: used by the brand and account links in
 * its header and footer, and by a `SidebarNav` that has no `renderLink` of its own.
 */
export const LinkRendererContext = createContext<((props: SidebarLinkProps) => ReactNode) | null>(
  null,
)

export interface SidebarProviderProps {
  children?: ReactNode
  /** Controlled icon-rail state. */
  collapsed?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  /** Controlled phone-drawer state. */
  mobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
  /**
   * Below this width the sidebar becomes an off-canvas drawer. Any CSS length;
   * `false` keeps it a column at every width. Defaults to the shell's `48rem`.
   */
  mobileBreakpoint?: string | false
  /**
   * Remember the rail state and the open branches in `localStorage` under this
   * key. Uncontrolled state only — controlled state is the parent's to keep.
   */
  storageKey?: string
  /** A key that toggles the sidebar with ⌘ / Ctrl, e.g. `"b"`. Off by default. */
  shortcut?: string
}

/**
 * Shares the sidebar's state with controls outside it — a `SidebarTrigger` in
 * the page header is the usual one.
 *
 * Optional: a `Sidebar` without a provider above it makes its own, which is
 * all a sidebar with the trigger inside it needs.
 */
export function SidebarProvider({
  children,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  mobileOpen: mobileOpenProp,
  onMobileOpenChange,
  mobileBreakpoint = DEFAULT_BREAKPOINT,
  storageKey,
  shortcut,
}: SidebarProviderProps) {
  const sidebarId = useId()
  const isMobile = useMediaQuery(mobileBreakpoint ? `(max-width: ${mobileBreakpoint})` : null)

  // `undefined` until the user toggles: until then the remembered value, read
  // only once hydrated so server HTML and the first client render agree.
  const [collapsedState, setCollapsedState] = useState<boolean>()
  const [mobileOpenState, setMobileOpenState] = useState(false)
  const hydrated = useHydrated()
  const collapsedKey = storageKey && `${storageKey}:collapsed`
  const storedCollapsed = useMemo(
    () => (hydrated ? readStored(collapsedKey, isBoolean) : undefined),
    [hydrated, collapsedKey],
  )

  const collapsed = collapsedProp ?? collapsedState ?? storedCollapsed ?? defaultCollapsed
  const mobileOpen = mobileOpenProp ?? mobileOpenState

  // Refs so `toggle` stays stable and never toggles from a stale value.
  const latest = useRef({ collapsed, mobileOpen, isMobile, onCollapsedChange, onMobileOpenChange })
  latest.current = { collapsed, mobileOpen, isMobile, onCollapsedChange, onMobileOpenChange }

  const setCollapsed = useCallback(
    (next: boolean) => {
      if (next === latest.current.collapsed) return
      if (collapsedProp === undefined) {
        setCollapsedState(next)
        writeStored(collapsedKey, next)
      }
      latest.current.onCollapsedChange?.(next)
    },
    [collapsedProp, collapsedKey],
  )

  const setMobileOpen = useCallback(
    (next: boolean) => {
      if (next === latest.current.mobileOpen) return
      if (mobileOpenProp === undefined) setMobileOpenState(next)
      latest.current.onMobileOpenChange?.(next)
    },
    [mobileOpenProp],
  )

  const toggle = useCallback(() => {
    const { isMobile: mobile, mobileOpen: open, collapsed: rail } = latest.current
    if (mobile) setMobileOpen(!open)
    else setCollapsed(!rail)
  }, [setCollapsed, setMobileOpen])

  // Growing past the breakpoint with the drawer open would leave it open,
  // invisibly, the next time the window narrows.
  useEffect(() => {
    if (!isMobile) setMobileOpen(false)
  }, [isMobile, setMobileOpen])

  useEffect(() => {
    if (!shortcut) return
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      // Chrome's autofill dispatches a `keydown` with no `key` at all.
      if (event.key?.toLowerCase() !== shortcut.toLowerCase()) return
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return
      // ⌘B is bold in every editor; the sidebar does not get to steal it there.
      if (isEditable(event.target)) return
      event.preventDefault()
      toggle()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [shortcut, toggle])

  const value = useMemo<SidebarContextValue>(
    () => ({
      collapsed,
      setCollapsed,
      mobileOpen,
      setMobileOpen,
      isMobile,
      toggle,
      rail: collapsed && !isMobile,
      sidebarId,
      storageKey,
      mobileBreakpoint,
    }),
    [
      collapsed,
      setCollapsed,
      mobileOpen,
      setMobileOpen,
      isMobile,
      toggle,
      sidebarId,
      storageKey,
      mobileBreakpoint,
    ],
  )

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}
