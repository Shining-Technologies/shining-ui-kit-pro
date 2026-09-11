import { forwardRef, useState, type HTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import { useFieldControl } from '../lib/field-context'

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

export interface ColorInputProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** A hex colour, `'#0f172a'`. */
  value?: string
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
    value = '#000000',
    onValueChange,
    swatches = DEFAULT_SWATCHES,
    disabled,
    'aria-label': ariaLabel = 'Colour',
    ...props
  },
  ref,
) {
  const field = useFieldControl()
  // What is in the text box while it is being typed: `#ab` is not yet a colour.
  const [draft, setDraft] = useState<string | null>(null)
  const isDisabled = disabled ?? field.disabled
  const colour = normalizeHex(value) ?? '#000000'

  function emit(next: string) {
    const normalized = normalizeHex(next)
    if (normalized) onValueChange?.(normalized)
  }

  return (
    <div className={cn('sui-color', className)} data-slot="color-input" {...props}>
      <div className="sui-input-group sui-color__control">
        <span className="sui-color__swatch" style={{ background: colour }}>
          <input
            ref={ref}
            type="color"
            className="sui-color__native"
            value={colour}
            disabled={isDisabled}
            aria-label={ariaLabel}
            id={field.id}
            aria-describedby={field['aria-describedby']}
            onChange={(event) => emit(event.target.value)}
          />
        </span>

        <input
          type="text"
          className="sui-input-group__input sui-color__hex"
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          value={draft ?? colour}
          disabled={isDisabled}
          aria-label={`${ariaLabel} hex value`}
          aria-invalid={draft !== null && normalizeHex(draft) === null ? true : undefined}
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
    </div>
  )
})
