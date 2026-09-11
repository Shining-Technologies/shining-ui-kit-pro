import { forwardRef, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { CheckIcon, CopyIcon } from '../lib/icons'
import { Button, type ButtonProps } from '../primitives/button'

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
  /** Announced to assistive tech and used as the icon-only button's name. */
  label?: string
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
    label = 'Copy',
    variant = 'ghost',
    size,
    ...props
  },
  ref,
) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  // A component that is unmounted mid-confirmation must not set state later.
  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Clipboard access can be refused (insecure origin, denied permission).
      // Failing silently is right here: the caller asked for a copy button, not
      // for an error surface, and the label simply does not change.
      return
    }
    setCopied(true)
    onCopied?.(value)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), timeout)
  }, [onCopied, timeout, value])

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size ?? (children ? 'sm' : 'icon-sm')}
      aria-label={children ? undefined : label}
      data-copied={copied || undefined}
      className={cn('sui-copy-btn', className)}
      onClick={() => void copy()}
      {...props}
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
  /** Fires once the button has been held for `duration`. */
  onHoldComplete: () => void
  /** How long the press must last, in ms. */
  duration?: number
  /** Label shown while the press is in progress. */
  holdingLabel?: ReactNode
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
 */
export const HoldButton = forwardRef<HTMLButtonElement, HoldButtonProps>(function HoldButton(
  {
    className,
    children,
    onHoldComplete,
    duration = 1200,
    holdingLabel,
    variant = 'destructive',
    disabled,
    ...props
  },
  ref,
) {
  const [progress, setProgress] = useState(0)
  const [holding, setHolding] = useState(false)
  const frame = useRef<number>()
  const started = useRef(0)

  const stop = useCallback(() => {
    if (frame.current !== undefined) cancelAnimationFrame(frame.current)
    frame.current = undefined
    setHolding(false)
    setProgress(0)
  }, [])

  useEffect(() => stop, [stop])

  const start = useCallback(() => {
    if (disabled || holding) return
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
  }, [disabled, duration, holding, onHoldComplete, stop])

  return (
    <Button
      ref={ref}
      variant={variant}
      disabled={disabled}
      data-holding={holding || undefined}
      className={cn('sui-hold-btn', className)}
      style={{ ['--sui-hold-progress' as string]: `${progress * 100}%` }}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      // Space and Enter are how a keyboard user presses a button, and neither
      // has a "hold" — repeat events stand in for one so the control is still
      // operable without a pointer.
      onKeyDown={(event) => {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault()
          start()
        }
      }}
      onKeyUp={(event) => {
        if (event.key === ' ' || event.key === 'Enter') stop()
      }}
      onBlur={stop}
      {...props}
    >
      <span className="sui-hold-btn__fill" aria-hidden="true" />
      <span className="sui-hold-btn__label">
        {holding && holdingLabel ? holdingLabel : children}
      </span>
    </Button>
  )
})
