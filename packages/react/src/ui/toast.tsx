import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '../lib/cn'
import { AlertIcon, CheckCircleIcon, CloseIcon, InfoIcon, TriangleAlertIcon } from '../lib/icons'

export type ToastTone = 'neutral' | 'success' | 'warning' | 'destructive' | 'info'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastOptions {
  title: ReactNode
  description?: ReactNode
  tone?: ToastTone
  /** How long before it dismisses itself, in ms. `0` keeps it up. */
  duration?: number
  action?: ToastAction
  /** Reuse an id to replace a toast in place — a "saving…" that becomes "saved". */
  id?: string
}

export interface Toast extends ToastOptions {
  id: string
}

export interface ToastContextValue {
  toasts: Toast[]
  /** Show a toast and return its id, so it can be updated or dismissed. */
  toast: (options: ToastOptions) => string
  dismiss: (id: string) => void
  dismissAll: () => void
  /**
   * Stop every auto-dismiss clock, keeping the time each toast has left.
   * `Toaster` calls this while a toast is hovered or focused; a custom stack
   * should do the same, or a toast can vanish while it is being read.
   */
  pause: () => void
  /** Restart the clocks `pause` stopped. */
  resume: () => void
}

interface ToastTimer {
  handle?: ReturnType<typeof setTimeout>
  /** Time left on the clock, in ms, as of `startedAt`. */
  remaining: number
  startedAt: number
}

const ToastContext = createContext<ToastContextValue | null>(null)

export interface ToastProviderProps {
  children: ReactNode
  /** Default lifetime, in ms. */
  duration?: number
  /** Beyond this many, the oldest is dropped — a stack nobody can read is noise. */
  limit?: number
}

/**
 * The toast store.
 *
 * Deliberately not a module-level singleton: an app that renders two providers
 * (a design-system gallery, a preview pane, a test) must get two independent
 * stacks, and a global would leak one into the other.
 */
export function ToastProvider({ children, duration = 5000, limit = 4 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef(new Map<string, ToastTimer>())
  const paused = useRef(false)
  const counter = useRef(0)

  const clearTimer = useCallback((id: string) => {
    clearTimeout(timers.current.get(id)?.handle)
    timers.current.delete(id)
  }, [])

  const dismiss = useCallback(
    (id: string) => {
      clearTimer(id)
      setToasts((current) => current.filter((entry) => entry.id !== id))
    },
    [clearTimer],
  )

  const start = useCallback(
    (id: string, timer: ToastTimer) => {
      timer.startedAt = Date.now()
      timer.handle = setTimeout(() => dismiss(id), timer.remaining)
    },
    [dismiss],
  )

  const toast = useCallback(
    (options: ToastOptions) => {
      counter.current += 1
      const id = options.id ?? `sui-toast-${counter.current}`
      // `??` rather than spreading defaults under the options: an explicit
      // `duration: undefined` would otherwise erase the default and pin the
      // toast up forever.
      const entry: Toast = {
        ...options,
        id,
        tone: options.tone ?? 'neutral',
        duration: options.duration ?? duration,
      }

      setToasts((current) => {
        const index = current.findIndex((existing) => existing.id === id)
        // Replacing keeps the toast's place in the stack, so a "saving…" that
        // becomes "saved" does not jump over the toasts that arrived since.
        const next =
          index === -1
            ? [...current, entry]
            : current.map((existing, at) => (at === index ? entry : existing))
        if (next.length <= limit) return next
        const dropped = next.slice(0, next.length - limit)
        for (const old of dropped) clearTimer(old.id)
        return next.slice(next.length - limit)
      })

      clearTimer(id)
      if (entry.duration && entry.duration > 0) {
        const timer: ToastTimer = { remaining: entry.duration, startedAt: Date.now() }
        timers.current.set(id, timer)
        // A toast raised while the stack is held waits with the others.
        if (!paused.current) start(id, timer)
      }
      return id
    },
    [clearTimer, duration, limit, start],
  )

  const dismissAll = useCallback(() => {
    for (const timer of timers.current.values()) clearTimeout(timer.handle)
    timers.current.clear()
    setToasts([])
  }, [])

  const pause = useCallback(() => {
    if (paused.current) return
    paused.current = true
    const now = Date.now()
    for (const timer of timers.current.values()) {
      if (timer.handle === undefined) continue
      clearTimeout(timer.handle)
      timer.handle = undefined
      timer.remaining = Math.max(0, timer.remaining - (now - timer.startedAt))
    }
  }, [])

  const resume = useCallback(() => {
    if (!paused.current) return
    paused.current = false
    for (const [id, timer] of timers.current) start(id, timer)
  }, [start])

  // Unmounting with timers outstanding would fire setState on a dead tree.
  useEffect(() => {
    const pending = timers.current
    return () => {
      for (const timer of pending.values()) clearTimeout(timer.handle)
      pending.clear()
    }
  }, [])

  const value = useMemo(
    () => ({ toasts, toast, dismiss, dismissAll, pause, resume }),
    [dismiss, dismissAll, pause, resume, toast, toasts],
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

/**
 * Show a toast.
 *
 * Throws outside a provider rather than no-opping: a message that silently
 * fails to appear is worse than a stack trace during development, because the
 * bug only shows up on the error path nobody tests.
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside a <ToastProvider>')
  return context
}

const TONE_ICONS: Record<ToastTone, ReactNode> = {
  neutral: <InfoIcon />,
  info: <InfoIcon />,
  success: <CheckCircleIcon />,
  warning: <TriangleAlertIcon />,
  destructive: <AlertIcon />,
}

export interface ToasterProps {
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center'
  className?: string
}

/**
 * Where the toasts appear.
 *
 * Rendered inline rather than through a portal, so it stays inside whatever
 * scope the provider painted — a portalled stack would escape a scoped
 * `UIKitProvider` and come out in the default palette.
 *
 * The region itself is the polite live region, and it is mounted before any
 * toast arrives: screen readers announce changes *inside* an existing live
 * region, but often skip one that is inserted already holding its text. A toast
 * is a notification, and stealing focus for one is how you lose someone's
 * place mid-form.
 *
 * Hovering or focusing a toast holds every clock, so a message cannot vanish
 * while someone is reading it or reaching for its action.
 */
export function Toaster({ position = 'bottom-right', className }: ToasterProps) {
  const { toasts, dismiss, pause, resume } = useToast()
  // Who is holding the stack open: `<id>:hover`, `<id>:focus`. Tracked per
  // toast so that one removed under the pointer releases its own hold — a
  // container-level mouseleave never fires when the hovered node disappears.
  const holders = useRef(new Set<string>())

  const hold = useCallback(
    (key: string) => {
      holders.current.add(key)
      pause()
    },
    [pause],
  )
  const release = useCallback(
    (key: string) => {
      if (!holders.current.delete(key)) return
      if (holders.current.size === 0) resume()
    },
    [resume],
  )

  return (
    <div
      className={cn('sui-toaster', `sui-toaster--${position}`, className)}
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {toasts.map((entry) => (
        <ToastItem key={entry.id} entry={entry} dismiss={dismiss} hold={hold} release={release} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  entry: Toast
  dismiss: (id: string) => void
  hold: (key: string) => void
  release: (key: string) => void
}

function ToastItem({ entry, dismiss, hold, release }: ToastItemProps) {
  const { id } = entry

  // A toast that leaves while hovered or focused must not keep the rest paused.
  useEffect(
    () => () => {
      release(`${id}:hover`)
      release(`${id}:focus`)
    },
    [id, release],
  )

  return (
    <div
      data-tone={entry.tone}
      className={cn('sui-toast', `sui-toast--${entry.tone ?? 'neutral'}`)}
      onPointerEnter={() => hold(`${id}:hover`)}
      onPointerLeave={() => release(`${id}:hover`)}
      onFocus={() => hold(`${id}:focus`)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          release(`${id}:focus`)
        }
      }}
    >
      <span className="sui-toast__icon" aria-hidden="true">
        {TONE_ICONS[entry.tone ?? 'neutral']}
      </span>
      <div className="sui-toast__text">
        <p className="sui-toast__title">{entry.title}</p>
        {entry.description ? <p className="sui-toast__description">{entry.description}</p> : null}
      </div>
      {entry.action ? (
        <button
          type="button"
          className="sui-toast__action sui-focusable"
          onClick={() => {
            entry.action?.onClick()
            dismiss(id)
          }}
        >
          {entry.action.label}
        </button>
      ) : null}
      <button
        type="button"
        className="sui-toast__close sui-focusable"
        aria-label="Dismiss"
        onClick={() => dismiss(id)}
      >
        <CloseIcon />
      </button>
    </div>
  )
}
