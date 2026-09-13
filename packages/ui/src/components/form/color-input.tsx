'use client'

import { forwardRef, useId, useState, type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { useFieldControl, useFieldLabelId } from './field-context'
import { useControllableState } from '../../hooks/use-controllable-state'
import { DEFAULT_SWATCHES, normalizeHex } from './color'

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
  /**
   * Mark the hex field required, so an empty colour blocks a native submission
   * and is announced as required. Taken from a surrounding `Field` when unset.
   */
  required?: boolean
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
    required,
    'aria-label': ariaLabelProp,
    ...props
  },
  ref,
) {
  const field = useFieldControl()
  const labelId = useFieldLabelId()
  const hexWordId = useId()
  const presetsWordId = useId()
  const ariaLabel = ariaLabelProp ?? 'Colour'
  // Inside a labelled `<Field>` every part is named from the field's label —
  // "Brand colour hex value" — rather than from the generic "Colour".
  const fromField = Boolean(labelId && !ariaLabelProp)
  // What is in the text box while it is being typed: `#ab` is not yet a colour.
  const [draft, setDraft] = useState<string | null>(null)
  // Controlled exactly when `value` is defined, as everywhere in the kit.
  const [current, setCurrent] = useControllableState<string>({
    value,
    defaultValue: defaultValue ?? '#000000',
    onChange: onValueChange,
  })
  const isDisabled = disabled ?? field.disabled
  const isRequired = required ?? field.required
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
            aria-label={fromField ? undefined : ariaLabel}
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
          // The picker always holds a colour, so `required` means something only
          // here, where "no colour" is an empty box.
          required={isRequired || undefined}
          aria-label={fromField ? undefined : `${ariaLabel} hex value`}
          aria-labelledby={fromField ? `${labelId} ${hexWordId}` : undefined}
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
        <div
          className="sui-color__swatches"
          role="group"
          aria-label={fromField ? undefined : `${ariaLabel} presets`}
          aria-labelledby={fromField ? `${labelId} ${presetsWordId}` : undefined}
        >
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

      {/* The words appended to the field's label. Hidden, but `aria-labelledby`
            reads hidden text. */}
      {fromField ? (
        <>
          <span id={hexWordId} hidden>
            hex value
          </span>
          <span id={presetsWordId} hidden>
            presets
          </span>
        </>
      ) : null}

      {/* A hidden input rather than `name` on the picker, which cannot be
            empty: an empty field has to submit `''`, not black. */}
      {name ? <input type="hidden" name={name} value={colour ?? ''} disabled={isDisabled} /> : null}
    </div>
  )
})
