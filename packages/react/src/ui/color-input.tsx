import { forwardRef, useState, type HTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import { useFieldControl, useFieldLabelId } from '../lib/field-context'
import { useControllableState } from '../lib/use-controllable-state'

/** The swatches offered when the caller names none — one row of the ramp. */
export const DEFAULT_SWATCHES = [
  '#0f172a',
  '#64748b',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
]

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

/** `'#abc'` → `'#aabbcc'`; anything that is not a hex colour comes back `null`. */
export function normalizeHex(value: string): string | null {
  const trimmed = value.trim()
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
  if (!HEX.test(withHash)) return null
  if (withHash.length === 4) {
    const [, r, g, b] = withHash
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  return withHash.toLowerCase()
}

export interface ColorInputProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  /**
   * A hex colour, `'#0f172a'`. Controlled when defined; `''` is "no colour".
   * Leave it `undefined` (and use `defaultValue`) for an uncontrolled field.
   */
  value?: string
  /** Initial colour while uncontrolled. `#000000` when neither is given. */
  defaultValue?: string
  /** Submitted with a native `<form>` as the normalised `#rrggbb`, or `''` when empty. */
  name?: string
  onValueChange?: (value: string) => void
  /** Quick picks shown beside the field. Pass `[]` for none. */
  swatches?: string[]
  disabled?: boolean
  'aria-label'?: string
}

/**
 * A colour, as a swatch you can click and a hex you can type.
 *
 * The swatch is a real `<input type="color">` — the OS picker is better than
 * anything worth reimplementing, and it is the one native control users already
 * know. The hex field beside it exists because a brand colour arrives as text
 * from a design file far more often than it is chosen by eye.
 */
export const ColorInput = forwardRef<HTMLInputElement, ColorInputProps>(function ColorInput(
  {
    className,
    value,
    defaultValue,
    name,
    onValueChange,
    swatches = DEFAULT_SWATCHES,
    disabled,
    'aria-label': ariaLabelProp,
    ...props
  },
  ref,
) {
  const field = useFieldControl()
  const labelId = useFieldLabelId()
  const ariaLabel = ariaLabelProp ?? 'Colour'
  // What is in the text box while it is being typed: `#ab` is not yet a colour.
  const [draft, setDraft] = useState<string | null>(null)
  // Controlled exactly when `value` is defined, as everywhere in the kit.
  const [current, setCurrent] = useControllableState<string>({
    value,
    defaultValue: defaultValue ?? '#000000',
    onChange: onValueChange,
  })
  const isDisabled = disabled ?? field.disabled
  // `null` is "no colour": an empty controlled value, or one that is not hex.
  const colour = normalizeHex(current)

  function emit(next: string) {
    const normalized = normalizeHex(next)
    if (normalized) setCurrent(normalized)
  }

  return (
    <div className={cn('sui-color', className)} data-slot="color-input" {...props}>
      <div className="sui-input-group sui-color__control">
        <span
          className="sui-color__swatch"
          data-empty={colour ? undefined : true}
          style={colour ? { background: colour } : undefined}
        >
          <input
            ref={ref}
            type="color"
            className="sui-color__native"
            // The native picker cannot be empty; it opens on black instead.
            value={colour ?? '#000000'}
            disabled={isDisabled}
            // Inside a labelled `<Field>` the `<label for>` names the swatch.
            aria-label={labelId && !ariaLabelProp ? undefined : ariaLabel}
            id={field.id}
            aria-describedby={field['aria-describedby']}
            aria-invalid={field['aria-invalid']}
            onChange={(event) => emit(event.target.value)}
          />
        </span>

        <input
          type="text"
          className="sui-input-group__input sui-color__hex"
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          placeholder="#rrggbb"
          value={draft ?? colour ?? ''}
          disabled={isDisabled}
          aria-label={`${ariaLabel} hex value`}
          aria-invalid={
            (draft !== null && normalizeHex(draft) === null) || field['aria-invalid']
              ? true
              : undefined
          }
          aria-describedby={field['aria-describedby']}
          onChange={(event) => {
            setDraft(event.target.value)
            emit(event.target.value)
          }}
          // Whatever half-typed text is left goes back to the real value.
          onBlur={() => setDraft(null)}
        />
      </div>

      {swatches.length > 0 ? (
        <div className="sui-color__swatches" role="group" aria-label={`${ariaLabel} presets`}>
          {swatches.map((preset) => {
            const normalized = normalizeHex(preset) ?? preset
            return (
              <button
                key={preset}
                type="button"
                className="sui-color__preset sui-focusable"
                style={{ background: normalized }}
                disabled={isDisabled}
                aria-label={normalized}
                aria-pressed={normalized === colour}
                data-selected={normalized === colour || undefined}
                onClick={() => emit(normalized)}
              />
            )
          })}
        </div>
      ) : null}

      {/* A hidden input rather than `name` on the picker, which cannot be
            empty: an empty field has to submit `''`, not black. */}
      {name ? <input type="hidden" name={name} value={colour ?? ''} disabled={isDisabled} /> : null}
    </div>
  )
})
