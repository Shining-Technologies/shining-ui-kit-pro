import { useRef, useState, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { Button, type ButtonProps } from '../primitives/button'
import { Spinner } from './feedback'
import {
  AlertDialog,
  AlertDialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './overlays'

export interface ConfirmAction {
  label: ReactNode
  onClick?: () => void | Promise<unknown>
  variant?: ButtonProps['variant']
  icon?: ReactNode
  disabled?: boolean
  /** Keep the dialog open after this action runs — for a "save and continue". */
  keepOpen?: boolean
}

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  /** Extra context — a list of what is about to be deleted, say. */
  children?: ReactNode
  /**
   * The choices, in reading order. Omit for the ordinary
   * confirm/cancel pair built from `confirmLabel` and `cancelLabel`.
   */
  actions?: ConfirmAction[]
  confirmLabel?: ReactNode
  cancelLabel?: ReactNode
  /** Called for the built-in confirm. May be async — the button waits. */
  onConfirm?: () => void | Promise<unknown>
  /** Paints the confirm button as destructive and adds the usual friction. */
  destructive?: boolean
  /**
   * Called when an action throws or its promise rejects. The dialog stays open
   * with every choice enabled again, so the person can retry or cancel. Without
   * it the error is rethrown, as an unhandled rejection.
   */
  onError?: (error: unknown, action: ConfirmAction) => void
  className?: string
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof (value as PromiseLike<unknown>).then === 'function'
  )
}

/**
 * "Are you sure?", done once.
 *
 * Built on `AlertDialog` — no close button and no dismiss-by-overlay, because a
 * question that is worth interrupting someone for is worth an explicit answer.
 *
 * Actions may be async: the dialog holds itself open, disables every choice and
 * shows the pending one as busy, which is what stops the double-submit that a
 * hand-rolled confirm always eventually allows.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  actions,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  destructive = false,
  onError,
  className,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState<number | null>(null)
  // The guard reads a ref, not the state: a double-click can deliver its second
  // click before the re-render that would have disabled the button.
  const busy = useRef(false)

  const resolved: ConfirmAction[] = actions ?? [
    { label: cancelLabel, variant: 'outline' },
    { label: confirmLabel, variant: destructive ? 'destructive' : 'default', onClick: onConfirm },
  ]

  async function run(action: ConfirmAction, index: number) {
    if (busy.current) return
    busy.current = true
    try {
      const result = action.onClick?.()
      // Any thenable, not only a native `Promise` — a promise from another
      // realm or a query library's own type must hold the dialog open too.
      if (isThenable(result)) {
        setPending(index)
        await result
      }
      if (!action.keepOpen) onOpenChange(false)
    } catch (error) {
      if (!onError) throw error
      onError(error, action)
    } finally {
      busy.current = false
      setPending(null)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !busy.current && onOpenChange(next)}>
      <AlertDialogContent
        className={cn('sui-confirm', className)}
        onEscapeKeyDown={(event) => busy.current && event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        {children ? <div className="sui-confirm__body">{children}</div> : null}

        <DialogFooter>
          {resolved.map((action, index) => (
            <Button
              key={index}
              variant={action.variant ?? 'outline'}
              disabled={action.disabled || (pending !== null && pending !== index)}
              aria-busy={pending === index || undefined}
              onClick={() => void run(action, index)}
            >
              {pending === index ? <Spinner size="sm" label={null} /> : action.icon}
              {action.label}
            </Button>
          ))}
        </DialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
