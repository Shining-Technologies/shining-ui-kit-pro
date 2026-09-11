import { forwardRef, useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { CheckIcon, CopyIcon } from '../lib/icons'
import { Button, type ButtonProps } from '../primitives/button'
import { ConfirmDialog } from './confirm-dialog'

/* ---------------------------------------------------------------- copy button */

export interface CopyButtonProps extends Omit<ButtonProps, 'onCopy' | 'children'> {
  /** The text to put on the clipboard. */
  value: string
  /** Resting label. Omit for an icon-only button. */
  children?: ReactNode
  /** Label while the confirmation is showing. */
  copiedLabel?: ReactNode
  /** How long the confirmation stays up, in ms. */
  timeout?: number
  onCopied?: (value: string) => void
  /**
   * Called when the browser refused the copy — permission denied, or no
   * clipboard at all. The button's label does not change, so this is the only
   * place the failure surfaces.
   */
  onCopyError?: (error: unknown) => void
  /** Announced to assistive tech and used as the icon-only button's name. */
  label?: string
}

/**
 * The async clipboard, falling back to the legacy copy command.
 *
 * The fallback is not nostalgia: `navigator.clipboard` does not exist on a
 * plain-HTTP origin (an intranet app, a LAN preview), and it rejects inside an
 * iframe that was not granted `clipboard-write` (Storybook, an embedded admin).
 * `execCommand('copy')` still works in both.
 */
async function writeClipboard(text: string): Promise<void> {
  let failure: unknown = new Error('Clipboard API unavailable')
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch (error) {
      failure = error
    }
  }
  if (typeof document === 'undefined' || typeof document.execCommand !== 'function') throw failure

  const previous = document.activeElement as HTMLElement | null
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  let copied = false
  try {
    copied = document.execCommand('copy')
  } finally {
    area.remove()
    previous?.focus()
  }
  if (!copied) throw failure
}

/**
 * Copy to clipboard, with the confirmation that makes it believable.
 *
 * The tick is the whole point: without it there is no feedback at all, and
 * people press the button twice. It reverts after `timeout` rather than on the
 * next render, so the confirmation survives a parent re-rendering underneath it.
 */
export const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(function CopyButton(
  {
    className,
    value,
    children,
    copiedLabel = 'Copied',
    timeout = 1200,
    onCopied,
    onCopyError,
    label = 'Copy',
    variant = 'ghost',
    size,
    onClick,
    ...props
  },
  ref,
) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const mounted = useRef(true)

  // A component that is unmounted mid-confirmation must not set state later.
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      clearTimeout(timer.current)
    }
  }, [])

  const copy = useCallback(async () => {
    try {
      await writeClipboard(value)
    } catch (error) {
      // Clipboard access can be refused (insecure origin, denied permission).
      // No error surface of its own — the caller asked for a copy button — so
      // the label simply does not change, and `onCopyError` hears about it.
      onCopyError?.(error)
      return
    }
    onCopied?.(value)
    if (!mounted.current) return
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), timeout)
  }, [onCopied, onCopyError, timeout, value])

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size ?? (children ? 'sm' : 'icon-sm')}
      aria-label={children ? undefined : label}
      data-copied={copied || undefined}
      className={cn('sui-copy-btn', className)}
      {...props}
      // Composed rather than overridable: an `onClick` added for analytics
      // must not silently stop the button copying.
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) void copy()
      }}
    >
      {copied ? <CheckIcon className="sui-copy-btn__tick" /> : <CopyIcon />}
      {children ? <span>{copied ? copiedLabel : children}</span> : null}
      <span className="sui-visually-hidden" role="status">
        {copied ? 'Copied to clipboard' : ''}
      </span>
    </Button>
  )
})

/* ---------------------------------------------------------------- hold button */

export interface HoldButtonProps extends Omit<ButtonProps, 'onClick'> {
  /** Fires once the button has been held for `duration`, or the fallback dialog is confirmed. */
  onHoldComplete: () => void
  /** How long the press must last, in ms. */
  duration?: number
  /** Label shown while the press is in progress. */
  holdingLabel?: ReactNode
  /**
   * What a click that was not a hold does — a screen reader in browse mode or
   * voice control, which activate a button without pressing it. By default it
   * asks in a `ConfirmDialog`, and confirming runs `onHoldComplete`. `false`
   * ignores such clicks, as the button used to.
   */
  confirmOnClick?: boolean
  /** The fallback dialog's title. Defaults to the label, as a question: "Delete?". */
  confirmTitle?: ReactNode
  confirmDescription?: ReactNode
  /** The fallback dialog's confirm button. Defaults to the label's verb: "Delete". */
  confirmLabel?: ReactNode
  /**
   * How the button is used, for assistive tech (`aria-describedby`). Defaults
   * to saying both ways: hold, or activate and confirm.
   */
  instructions?: string
}

/**
 * "Hold to delete" → "Delete". A label that is not plain text has no verb to
 * lift, so the dialog falls back to generic wording.
 */
function actionFromLabel(label: ReactNode, ariaLabel: string | undefined): string | undefined {
  const text = typeof label === 'string' ? label : ariaLabel
  const verb = text
    ?.trim()
    .replace(/^(press\s+and\s+)?hold(\s+down)?\s+to\s+/i, '')
    .replace(/[.…]+$/, '')
  return verb ? verb.charAt(0).toUpperCase() + verb.slice(1) : undefined
}

/**
 * Press and hold to confirm.
 *
 * The alternative to a confirmation dialog for an action that is destructive
 * but not rare — the friction is in the gesture rather than in a second screen,
 * so an operator doing this fifty times a day is not asked fifty questions.
 *
 * Releasing early retracts the fill quickly rather than snapping it to zero, so
 * a slip reads as "not yet" instead of as a glitch.
 *
 * A screen reader in browse mode and voice control activate a button with a
 * bare click — no pointer or key goes down, so there is nothing to hold. That
 * click opens a confirmation instead: the friction survives, in the one form
 * those users can get through.
 */
export const HoldButton = forwardRef<HTMLButtonElement, HoldButtonProps>(function HoldButton(
  {
    className,
    children,
    onHoldComplete,
    duration = 1200,
    holdingLabel,
    confirmOnClick = true,
    confirmTitle,
    confirmDescription,
    confirmLabel,
    instructions,
    variant = 'destructive',
    disabled,
    style,
    onPointerDown,
    onPointerUp,
    onPointerLeave,
    onPointerCancel,
    onKeyDown,
    onKeyUp,
    onBlur,
    'aria-describedby': describedBy,
    ...props
  },
  ref,
) {
  const [progress, setProgress] = useState(0)
  const [holding, setHolding] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const frame = useRef<number>()
  const started = useRef(0)
  // Synchronous twin of `holding`: two starts in one frame (a pointer and a key,
  // or a key event before the re-render) must not run two clocks.
  const active = useRef(false)
  // Which presses have gone down since the last click. The click that ends a
  // press — held long enough or not — belongs to the press; only a click with
  // no press behind it is the assistive-tech activation. Tracked apart because
  // they are cleared apart: a key press is over by its keyup (a keyboard click
  // follows in the same task), while a touch click can trail its pointerup.
  const pressed = useRef({ pointer: false, key: false })
  const keyRelease = useRef<ReturnType<typeof setTimeout>>()
  const instructionsId = useId()
  const action = actionFromLabel(children, props['aria-label'])

  useEffect(() => () => clearTimeout(keyRelease.current), [])

  const stop = useCallback(() => {
    if (frame.current !== undefined) cancelAnimationFrame(frame.current)
    frame.current = undefined
    active.current = false
    setHolding(false)
    setProgress(0)
  }, [])

  useEffect(() => stop, [stop])

  const start = useCallback(() => {
    if (disabled || active.current) return
    active.current = true
    setHolding(true)
    started.current = performance.now()

    const tick = () => {
      const elapsed = performance.now() - started.current
      const ratio = Math.min(1, elapsed / duration)
      setProgress(ratio)
      if (ratio >= 1) {
        stop()
        onHoldComplete()
        return
      }
      frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
  }, [disabled, duration, onHoldComplete, stop])

  const spoken =
    instructions ??
    (confirmOnClick
      ? 'Press and hold to confirm, or activate to confirm in a dialog.'
      : 'Press and hold to confirm.')

  return (
    <>
      <Button
        ref={ref}
        variant={variant}
        disabled={disabled}
        data-holding={holding || undefined}
        className={cn('sui-hold-btn', className)}
        // Merged, not replaced: a caller's `style` must not wipe the fill.
        style={{ ...style, ['--sui-hold-progress' as string]: `${progress * 100}%` }}
        aria-describedby={
          [describedBy, spoken && instructionsId].filter(Boolean).join(' ') || undefined
        }
        {...props}
        // Every handler below is composed with the caller's, for the same reason.
        onClick={(event) => {
          // A pointer click always has a count (`detail` ≥ 1); a synthetic
          // activation has none, so a stale pointer flag — a press released
          // off the button, which never clicks — cannot swallow it.
          const fromPress = pressed.current.key || (event.detail > 0 && pressed.current.pointer)
          pressed.current = { pointer: false, key: false }
          if (!fromPress && confirmOnClick && !disabled) setConfirming(true)
        }}
        onPointerDown={(event) => {
          onPointerDown?.(event)
          // Only the primary button: a right-click opens the context menu, and
          // must not start arming a destructive action behind it.
          if (event.button !== 0) return
          pressed.current.pointer = true
          if (!event.defaultPrevented) start()
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event)
          stop()
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event)
          stop()
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event)
          stop()
        }}
        // Space and Enter are how a keyboard user presses a button, and neither
        // has a "hold" — the key held down stands in for one, so the control is
        // still operable without a pointer. Auto-repeat keydowns are ignored:
        // after a completed hold they would otherwise re-arm it and fire again
        // while the key is still down.
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.defaultPrevented) return
          if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault()
            clearTimeout(keyRelease.current)
            pressed.current.key = true
            if (!event.repeat) start()
          }
        }}
        onKeyUp={(event) => {
          onKeyUp?.(event)
          if (event.key !== ' ' && event.key !== 'Enter') return
          stop()
          // Some browsers still click on Space's keyup; that click comes in
          // this same task, so the flag outlives it by exactly one turn.
          clearTimeout(keyRelease.current)
          keyRelease.current = setTimeout(() => (pressed.current.key = false), 0)
        }}
        onBlur={(event) => {
          onBlur?.(event)
          pressed.current.key = false
          stop()
        }}
      >
        <span className="sui-hold-btn__fill" aria-hidden="true" />
        <span className="sui-hold-btn__label">
          {holding && holdingLabel ? holdingLabel : children}
        </span>
        {/* `hidden` keeps it out of the button's name; `aria-describedby`
            still reads hidden text it points at directly. */}
        {spoken ? (
          <span id={instructionsId} hidden>
            {spoken}
          </span>
        ) : null}
      </Button>

      {confirmOnClick ? (
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          destructive={variant === 'destructive' || variant === 'danger'}
          title={confirmTitle ?? (action ? `${action}?` : 'Are you sure?')}
          description={confirmDescription}
          confirmLabel={confirmLabel ?? action ?? 'Confirm'}
          onConfirm={() => onHoldComplete()}
        />
      ) : null}
    </>
  )
})
