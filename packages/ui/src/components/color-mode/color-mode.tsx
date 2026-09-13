'use client'

import { forwardRef, useCallback, useEffect, useSyncExternalStore } from 'react'
import { Button, type ButtonProps } from '../button/button'
import { MoonIcon, SunIcon } from '../icons/icons'
import {
  DEFAULT_COLOR_MODE_STORAGE_KEY,
  type ColorModePreference,
  type ColorModeScriptOptions,
  type ResolvedColorMode,
} from './color-mode-script'

const CHANGE_EVENT = 'sui:color-mode'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function readStored(key: string): ColorModePreference | null {
  try {
    const value = window.localStorage.getItem(key)
    return value === 'light' || value === 'dark' || value === 'system' ? value : null
  } catch {
    return null
  }
}

function systemMode(): ResolvedColorMode {
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches
    ? 'dark'
    : 'light'
}

export function resolveColorMode(
  preference: ColorModePreference,
  system: ResolvedColorMode,
): ResolvedColorMode {
  return preference === 'system' ? system : preference
}

/** Put a mode on `<html>`: the `.dark` class every token follows, and `color-scheme`. */
export function applyColorMode(mode: ResolvedColorMode, root: HTMLElement = document.documentElement) {
  root.classList.toggle('dark', mode === 'dark')
  root.style.colorScheme = mode
}

export type UseColorModeOptions = ColorModeScriptOptions

export interface ColorModeState {
  /** The stored preference; may be `'system'`. */
  mode: ColorModePreference
  /**
   * What is painted. During server rendering and hydration there is no storage
   * or media query to read, so this is `defaultMode` resolved with the system
   * taken as light: `'dark'` only when `defaultMode` is `'dark'`.
   */
  resolvedMode: ResolvedColorMode
  setMode: (mode: ColorModePreference) => void
}

/**
 * The store behind `useColorMode`. `manageDocument` is off for a controlled
 * toggle, whose owner (next-themes, say) writes `<html>` itself.
 */
function useColorModeStore(
  { storageKey = DEFAULT_COLOR_MODE_STORAGE_KEY, defaultMode = 'system' }: UseColorModeOptions,
  manageDocument: boolean,
): ColorModeState {
  const subscribe = useCallback(
    (notify: () => void) => {
      const media = typeof window.matchMedia === 'function' ? window.matchMedia(DARK_QUERY) : null
      const sync = () => {
        if (manageDocument) {
          applyColorMode(resolveColorMode(readStored(storageKey) ?? defaultMode, systemMode()))
        }
        notify()
      }
      const onStorage = (event: StorageEvent) => {
        if (event.key === storageKey) sync()
      }
      const onMedia = () => {
        if ((readStored(storageKey) ?? defaultMode) === 'system') sync()
        else notify()
      }
      window.addEventListener('storage', onStorage)
      window.addEventListener(CHANGE_EVENT, notify)
      media?.addEventListener('change', onMedia)
      return () => {
        window.removeEventListener('storage', onStorage)
        window.removeEventListener(CHANGE_EVENT, notify)
        media?.removeEventListener('change', onMedia)
      }
    },
    [storageKey, defaultMode, manageDocument],
  )

  // A string snapshot: stable between changes, cheap to compare.
  const snapshot = useSyncExternalStore(
    subscribe,
    () => `${readStored(storageKey) ?? defaultMode}:${systemMode()}`,
    () => `${defaultMode}:light`,
  )
  const [mode, system] = snapshot.split(':') as [ColorModePreference, ResolvedColorMode]

  // Without `<ColorModeScript>` nothing applied the stored preference before
  // paint, and the page would disagree with this hook until the next change.
  // Correct `<html>` once on mount; with the script in place this is a no-op.
  useEffect(() => {
    if (!manageDocument) return
    const resolved = resolveColorMode(readStored(storageKey) ?? defaultMode, systemMode())
    const root = document.documentElement
    if (root.classList.contains('dark') !== (resolved === 'dark') || root.style.colorScheme !== resolved) {
      applyColorMode(resolved, root)
    }
  }, [manageDocument, storageKey, defaultMode])

  const setMode = useCallback(
    (next: ColorModePreference) => {
      try {
        window.localStorage.setItem(storageKey, next)
      } catch {
        // Storage blocked: the change still applies for this page.
      }
      applyColorMode(resolveColorMode(next, systemMode()))
      window.dispatchEvent(new Event(CHANGE_EVENT))
    },
    [storageKey],
  )

  return { mode, resolvedMode: resolveColorMode(mode, system), setMode }
}

/**
 * Read and change the colour mode. No provider: the source of truth is the
 * stored preference plus the OS setting, shared by every component that calls
 * this hook and by other tabs.
 *
 * Pair it with `<ColorModeScript>` using the same `storageKey`, so the first
 * paint is already right. Without the script, the hook applies the stored
 * preference to `<html>` when it mounts.
 */
export function useColorMode(options: UseColorModeOptions = {}): ColorModeState {
  return useColorModeStore(options, true)
}

export interface ColorModeToggleProps
  extends Omit<ButtonProps, 'onClick' | 'children'>, UseColorModeOptions {
  /**
   * Controlled mode, e.g. from `next-themes`' `resolvedTheme`. Passing the prop
   * at all — even as `undefined` — makes the toggle controlled: it only reports
   * clicks through `onModeChange` and never writes `<html>` or storage. While
   * the value is `undefined` (next-themes before it mounts) the button shows a
   * neutral "Toggle colour mode" state.
   */
  mode?: ResolvedColorMode
  onModeChange?: (mode: ResolvedColorMode) => void
  /** Accessible names for the action the button performs. */
  labels?: { toDark?: string; toLight?: string; toggle?: string }
}

/** A button that switches between light and dark. */
export const ColorModeToggle = forwardRef<HTMLButtonElement, ColorModeToggleProps>(
  function ColorModeToggle(allProps, ref) {
    const {
      mode: controlledMode,
      onModeChange,
      storageKey,
      defaultMode,
      labels,
      variant = 'ghost',
      size = 'icon',
      ...props
    } = allProps
    const controlled = 'mode' in allProps
    const internal = useColorModeStore({ storageKey, defaultMode }, !controlled)
    const current: ResolvedColorMode | undefined = controlled ? controlledMode : internal.resolvedMode
    const next: ResolvedColorMode = current === 'dark' ? 'light' : 'dark'
    const label =
      current === undefined
        ? (labels?.toggle ?? 'Toggle colour mode')
        : next === 'dark'
          ? (labels?.toDark ?? 'Switch to dark mode')
          : (labels?.toLight ?? 'Switch to light mode')

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        aria-label={label}
        title={label}
        data-mode={current}
        onClick={() => {
          // Mode not known yet: flip whatever is painted.
          const target: ResolvedColorMode =
            current === undefined
              ? document.documentElement.classList.contains('dark')
                ? 'light'
                : 'dark'
              : next
          if (!controlled) internal.setMode(target)
          onModeChange?.(target)
        }}
        {...props}
      >
        {current === 'dark' ? <SunIcon aria-hidden="true" /> : <MoonIcon aria-hidden="true" />}
      </Button>
    )
  },
)
