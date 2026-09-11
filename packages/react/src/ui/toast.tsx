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
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const counter = useRef(0)

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((current) => current.filter((entry) => entry.id !== id))
  }, [])

  const toast = useCallback(
    (options: ToastOptions) => {
      counter.current += 1
      const id = options.id ?? `sui-toast-${counter.current}`
      const entry: Toast = { tone: 'neutral', duration, ...options, id }

      setToasts((current) => {
        const without = current.filter((existing) => existing.id !== id)
        const next = [...without, entry]
        return next.length > limit ? next.slice(next.length - limit) : next
      })

      clearTimeout(timers.current.get(id))
      if (entry.duration && entry.duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), entry.duration),
        )
      }
      return id
    },
    [dismiss, duration, limit],
  )

  const dismissAll = useCallback(() => {
    for (const timer of timers.current.values()) clearTimeout(timer)
    timers.current.clear()
    setToasts([])
  }, [])

  // Unmounting with timers outstanding would fire setState on a dead tree.
  useEffect(() => {
    const pending = timers.current
    return () => {
      for (const timer of pending.values()) clearTimeout(timer)
      pending.clear()
    }
  }, [])

  const value = useMemo(
    () => ({ toasts, toast, dismiss, dismissAll }),
    [dismiss, dismissAll, toast, toasts],
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
 * The region is a polite live region: a toast is a notification, and stealing
 * focus for one is how you lose someone's place mid-form.
 */
export function Toaster({ position = 'bottom-right', className }: ToasterProps) {
  const { toasts, dismiss } = useToast()

  return (
    <div
      className={cn('sui-toaster', `sui-toaster--${position}`, className)}
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((entry) => (
        <div
          key={entry.id}
          role="status"
          aria-live="polite"
          data-tone={entry.tone}
          className={cn('sui-toast', `sui-toast--${entry.tone ?? 'neutral'}`)}
        >
          <span className="sui-toast__icon" aria-hidden="true">
            {TONE_ICONS[entry.tone ?? 'neutral']}
          </span>
          <div className="sui-toast__text">
            <p className="sui-toast__title">{entry.title}</p>
            {entry.description ? (
              <p className="sui-toast__description">{entry.description}</p>
            ) : null}
          </div>
          {entry.action ? (
            <button
              type="button"
              className="sui-toast__action sui-focusable"
              onClick={() => {
                entry.action?.onClick()
                dismiss(entry.id)
              }}
            >
              {entry.action.label}
            </button>
          ) : null}
          <button
            type="button"
            className="sui-toast__close sui-focusable"
            aria-label="Dismiss"
            onClick={() => dismiss(entry.id)}
          >
            <CloseIcon />
          </button>
        </div>
      ))}
    </div>
  )
}
