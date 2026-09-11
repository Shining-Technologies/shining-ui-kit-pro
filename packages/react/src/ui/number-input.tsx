import {
  forwardRef,
  useEffect,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cn } from '../lib/cn'
import { useFieldControl } from '../lib/field-context'
import { ChevronDownIcon, ChevronUpIcon } from '../lib/icons'

export interface NumberInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'type' | 'prefix' | 'min' | 'max' | 'step'
> {
  value?: number | null
  /** Starting value when the caller does not control the field. */
  defaultValue?: number
  onValueChange?: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  /** Decimal places kept on blur. `2` for money, `0` for a count. */
  precision?: number
  /** Inside the control, before the number — `'$'`, an icon. */
  prefix?: ReactNode
  /** Inside the control, after the number — `'kg'`, `'%'`. */
  suffix?: ReactNode
  /** Group thousands while the field is not being edited. */
  thousands?: boolean
  /** Hide the up/down buttons and keep only the keyboard steppers. */
  steppers?: boolean
  wrapperClassName?: string
}

const clamp = (value: number, min?: number, max?: number) =>
  Math.min(max ?? Infinity, Math.max(min ?? -Infinity, value))

/**
 * A number field with real steppers.
 *
 * `<input type="number">` is avoided on purpose: it silently discards what it
 * cannot parse (so a stray character empties the field), its spinners cannot be
 * styled, and a scroll over a focused one changes the value. This is a text
 * field that accepts only numeric input, formats on blur and steps from both
 * the buttons and the arrow keys.
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  {
    className,
    wrapperClassName,
    value,
    defaultValue,
    onValueChange,
    min,
    max,
    step = 1,
    precision,
    prefix,
    suffix,
    thousands = false,
    steppers = true,
    disabled,
    ...props
  },
  ref,
) {
  const field = useFieldControl()
  const [focused, setFocused] = useState(false)
  // The draft is what is typed; `-`, `1.` and `` are all legal on the way to a
  // number and none of them survive a round trip through `Number`.
  const [draft, setDraft] = useState(() => {
    const initial = value ?? defaultValue
    return initial == null ? '' : String(initial)
  })

  useEffect(() => {
    // Only a controlled field follows its prop; an uncontrolled one owns its draft.
    if (value !== undefined && !focused) setDraft(value == null ? '' : String(value))
  }, [focused, value])

  const isDisabled = disabled ?? field.disabled
  const current = value ?? (draft === '' ? null : Number(draft))

  const display =
    !focused && thousands && current != null && Number.isFinite(current)
      ? current.toLocaleString(undefined, {
          minimumFractionDigits: precision ?? 0,
          maximumFractionDigits: precision ?? 20,
        })
      : draft

  function commit(next: number | null) {
    setDraft(next == null ? '' : String(next))
    onValueChange?.(next)
  }

  function nudge(direction: 1 | -1) {
    if (isDisabled) return
    const base = current ?? min ?? 0
    const stepped = clamp(base + direction * step, min, max)
    // Floating-point addition leaves 0.30000000000000004 behind; round it off
    // at the step's own precision rather than showing the artefact.
    const decimals = precision ?? String(step).split('.')[1]?.length ?? 0
    commit(Number(stepped.toFixed(decimals)))
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      nudge(event.key === 'ArrowUp' ? 1 : -1)
    }
  }

  return (
    <div
      className={cn('sui-input-group sui-number', wrapperClassName)}
      data-slot="number-input"
      data-disabled={isDisabled || undefined}
    >
      {prefix ? (
        <span className="sui-input-group__addon" aria-hidden="true">
          {prefix}
        </span>
      ) : null}

      <input
        ref={ref}
        type="text"
        inputMode={precision === 0 ? 'numeric' : 'decimal'}
        autoComplete="off"
        role="spinbutton"
        aria-valuenow={current ?? undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        className={cn('sui-input-group__input sui-number__input', className)}
        {...field}
        {...props}
        disabled={isDisabled}
        value={display}
        onFocus={(event) => {
          setFocused(true)
          props.onFocus?.(event)
        }}
        onKeyDown={onKeyDown}
        onChange={(event) => {
          const raw = event.target.value.replace(/[^\d.-]/g, '')
          setDraft(raw)
          const parsed = Number(raw)
          onValueChange?.(raw === '' || Number.isNaN(parsed) ? null : parsed)
        }}
        onBlur={(event) => {
          setFocused(false)
          if (draft === '' || Number.isNaN(Number(draft))) {
            commit(null)
          } else {
            const rounded =
              precision == null ? Number(draft) : Number(Number(draft).toFixed(precision))
            commit(clamp(rounded, min, max))
          }
          props.onBlur?.(event)
        }}
      />

      {suffix ? <span className="sui-input-group__addon">{suffix}</span> : null}

      {steppers ? (
        <span className="sui-number__steppers">
          <button
            type="button"
            tabIndex={-1}
            className="sui-number__stepper"
            aria-label="Increase"
            disabled={isDisabled || (max !== undefined && (current ?? 0) >= max)}
            onClick={() => nudge(1)}
          >
            <ChevronUpIcon />
          </button>
          <button
            type="button"
            tabIndex={-1}
            className="sui-number__stepper"
            aria-label="Decrease"
            disabled={isDisabled || (min !== undefined && (current ?? 0) <= min)}
            onClick={() => nudge(-1)}
          >
            <ChevronDownIcon />
          </button>
        </span>
      ) : null}
    </div>
  )
})
