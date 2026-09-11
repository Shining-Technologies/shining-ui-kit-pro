import {
  forwardRef,
  useEffect,
  useMemo,
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
  /** Controlled when defined; `null` is the empty field. */
  value?: number | null
  /** Starting value when the caller does not control the field. */
  defaultValue?: number
  onValueChange?: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  /** Decimal places kept on blur. `2` for money, `0` for a count. */
  precision?: number
  /**
   * BCP 47 locale for the decimal separator and the grouping — `'de-DE'`
   * types and shows `1.250,5`. Defaults to the runtime's locale; pass it when
   * server rendering, so the server and the browser format alike.
   */
  locale?: string
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

/** The locale's decimal separator — `.` in `en`, `,` in `de` and `fr`. */
function decimalSeparator(locale?: string): string {
  try {
    // Latin digits, as the display uses: Arabic-Indic numbering has its own
    // separator (`٫`), which the Latin form of the same locale does not.
    const part = new Intl.NumberFormat(locale, { numberingSystem: 'latn' })
      .formatToParts(1.5)
      .find((entry) => entry.type === 'decimal')
    return part?.value ?? '.'
  } catch {
    return '.'
  }
}

/**
 * The number a draft stands for, or `null`.
 *
 * `Number('-')` and `Number('1-2')` are `NaN`, and a `NaN` that escapes into
 * the value poisons every step after it (`NaN + 1` is still `NaN`), so a
 * draft that is not yet a number is simply no number.
 *
 * Where the locale's separator is not `.`, a `.` is still read as the decimal
 * point — it is the only one on many numeric keypads — unless the locale's own
 * separator is also present, in which case the `.` is grouping: `1.250,5`.
 */
function toNumber(raw: string, decimal: string): number | null {
  if (raw === '') return null
  let normalized = raw
  if (decimal !== '.') {
    normalized = raw.includes(decimal) ? raw.replace(/\./g, '').replace(decimal, '.') : raw
  }
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

/** A number as the draft that is edited: no grouping, the locale's separator. */
const toDraft = (value: number, decimal: string) => String(value).replace('.', decimal)

const isNumber = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value)

/**
 * A number field with real steppers.
 *
 * `<input type="number">` is avoided on purpose: it silently discards what it
 * cannot parse (so a stray character empties the field), its spinners cannot be
 * styled, and a scroll over a focused one changes the value. This is a text
 * field that accepts only numeric input, formats on blur and steps from both
 * the buttons and the arrow keys.
 *
 * The decimal separator is the locale's (`locale`, or the runtime default), and
 * a `.` is accepted too. `name` goes on a hidden input holding the plain number
 * (`1250.5`), so a native form never receives the text (`1.250,50`) the field
 * displays.
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
    locale,
    prefix,
    suffix,
    thousands = false,
    steppers = true,
    disabled,
    name,
    form,
    onKeyDown: onKeyDownProp,
    ...props
  },
  ref,
) {
  const field = useFieldControl()
  const decimal = useMemo(() => decimalSeparator(locale), [locale])
  const [focused, setFocused] = useState(false)
  // The draft is what is typed; `-`, `1.` and `` are all legal on the way to a
  // number and none of them survive a round trip through `Number`.
  const [draft, setDraft] = useState(() => {
    const initial = value ?? defaultValue
    return isNumber(initial) ? toDraft(initial, decimal) : ''
  })

  useEffect(() => {
    // Only a controlled field follows its prop; an uncontrolled one owns its
    // draft. A value the draft already stands for is left alone — that is our
    // own emission coming back, and rewriting `1.` as `1` mid-number would eat
    // the separator — but anything else, `null` included, replaces it, even
    // while focused: a parent that clears the field must be able to.
    if (value === undefined) return
    setDraft((previous) =>
      toNumber(previous, decimal) === (isNumber(value) ? value : null)
        ? previous
        : isNumber(value)
          ? toDraft(value, decimal)
          : '',
    )
  }, [decimal, value])

  const isDisabled = disabled ?? field.disabled
  const current = isNumber(value) ? value : toNumber(draft, decimal)

  const formatter = useMemo(() => {
    if (!thousands && precision == null) return null
    try {
      return new Intl.NumberFormat(locale, {
        useGrouping: thousands,
        // `precision={2}` is money: 12.5 reads as 12.50 once it is not being typed.
        minimumFractionDigits: precision ?? 0,
        maximumFractionDigits: precision ?? 20,
        // Western digits whatever the locale: the field only accepts those.
        numberingSystem: 'latn',
      })
    } catch {
      return null
    }
  }, [locale, precision, thousands])

  const display = !focused && formatter && current != null ? formatter.format(current) : draft

  // A phone keypad has no minus key: iOS's `numeric` pad is digits only, and
  // its `decimal` pad adds just the separator. So a field that can go negative
  // (no `min`, or one below zero) gets the full keyboard — its number row has
  // the `-` — and a non-negative one gets the pad: with the separator when
  // fractions are allowed, digits only for a count. A caller's `inputMode` wins.
  const allowsNegative = min === undefined || min < 0
  const inputMode = allowsNegative ? 'text' : precision === 0 ? 'numeric' : 'decimal'

  function commit(next: number | null) {
    setDraft(next == null ? '' : toDraft(next, decimal))
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
    onKeyDownProp?.(event)
    if (event.defaultPrevented) return
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
        inputMode={inputMode}
        autoComplete="off"
        role="spinbutton"
        aria-valuenow={current ?? undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        className={cn('sui-input-group__input sui-number__input', className)}
        {...field}
        {...props}
        form={form}
        disabled={isDisabled}
        value={display}
        onFocus={(event) => {
          setFocused(true)
          props.onFocus?.(event)
        }}
        onKeyDown={onKeyDown}
        onChange={(event) => {
          // Digits, a minus, the locale's separator and `.`; grouping typed or
          // pasted in the locale's own style (`1.250,5`) is read by `toNumber`.
          const allowed = new RegExp(`[^\\d.\\-${decimal === '.' ? '' : `\\${decimal}`}]`, 'g')
          const raw = event.target.value.replace(allowed, '')
          setDraft(raw)
          onValueChange?.(toNumber(raw, decimal))
        }}
        onBlur={(event) => {
          setFocused(false)
          const parsed = toNumber(draft, decimal)
          if (parsed == null) {
            commit(null)
          } else {
            const rounded = precision == null ? parsed : Number(parsed.toFixed(precision))
            commit(clamp(rounded, min, max))
          }
          props.onBlur?.(event)
        }}
      />

      {/* The text is formatted for reading (`1,250.00`); the form gets the number. */}
      {name ? (
        <input
          type="hidden"
          name={name}
          form={form}
          value={current == null ? '' : String(current)}
          disabled={isDisabled}
        />
      ) : null}

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
