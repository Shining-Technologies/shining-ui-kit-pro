import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import {
  BRAND_COLOR_ATTRS,
  BRAND_FONT_ATTRS,
  FONT_STACKS,
  brandRef,
  resolveBrand,
  type Align,
  type BrandPreview,
  type Padding,
} from '../design'
import type { EditResult } from './context'
import { Icon, type IconName } from './icons'

/** A commit returns why it was refused, or nothing. */
type Commit<T> = (value: T) => EditResult | void

/** Local text that reaches the design only when the design accepts it. */
function useDraft<T extends string | number>(value: T, commit: Commit<T>) {
  const [draft, setDraft] = useState<string>(String(value))
  const [error, setError] = useState<string | null>(null)
  const seen = useRef(value)
  useEffect(() => {
    // Follow a value changed from elsewhere (undo, another control).
    if (seen.current !== value) {
      seen.current = value
      setDraft(String(value))
      setError(null)
    }
  }, [value])
  return {
    draft,
    error,
    set(text: string, parsed: T | null) {
      setDraft(text)
      if (parsed === null) return setError(null)
      const result = commit(parsed)
      seen.current = result ? seen.current : parsed
      setError(result ?? null)
    },
    reset() {
      setDraft(String(value))
      setError(null)
    },
  }
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string | null
  children: ReactNode
}) {
  return (
    <div className="seb-field">
      <label className="seb-field-label">
        <span>{label}</span>
        {children}
      </label>
      {hint && !error && <small className="seb-hint">{hint}</small>}
      {error && (
        <small className="seb-error" role="alert">
          {error}
        </small>
      )}
    </div>
  )
}

export function Group({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  const id = useId()
  return (
    <div
      className={['seb-field', className].filter(Boolean).join(' ')}
      role="group"
      aria-labelledby={id}
    >
      <span id={id}>{label}</span>
      {children}
    </div>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="seb-section" aria-label={title}>
      <h3 className="seb-section-title">{title}</h3>
      <div className="seb-section-body">{children}</div>
    </section>
  )
}

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = 'text',
}: {
  label: string
  value: string
  onChange: Commit<string>
  placeholder?: string
  hint?: string
  type?: string
}) {
  const d = useDraft(value, onChange)
  return (
    <Field label={label} hint={hint} error={d.error}>
      <input
        className="seb-input"
        type={type}
        value={d.draft}
        placeholder={placeholder}
        aria-invalid={Boolean(d.error)}
        onChange={(event) => d.set(event.target.value, event.target.value)}
        onBlur={() => d.error && d.reset()}
      />
    </Field>
  )
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 6,
  hint,
  mono,
}: {
  label: string
  value: string
  onChange: Commit<string>
  rows?: number
  hint?: string
  mono?: boolean
}) {
  const d = useDraft(value, onChange)
  return (
    <Field label={label} hint={hint} error={d.error}>
      <textarea
        className={['seb-input seb-textarea', mono && 'seb-mono'].filter(Boolean).join(' ')}
        rows={rows}
        value={d.draft}
        aria-invalid={Boolean(d.error)}
        onChange={(event) => d.set(event.target.value, event.target.value)}
      />
    </Field>
  )
}

export function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  unit,
  step = 1,
  compact,
}: {
  label: string
  value: number
  onChange: Commit<number>
  min: number
  max: number
  unit?: string
  step?: number
  compact?: boolean
}) {
  const d = useDraft(value, onChange)
  const parse = (text: string): number | null => {
    if (text.trim() === '') return null
    const n = Number(text)
    return Number.isFinite(n) && Number.isInteger(n) && n >= min && n <= max ? n : null
  }
  const input = (
    <input
      className="seb-input seb-number"
      type="number"
      inputMode="numeric"
      value={d.draft}
      min={min}
      max={max}
      step={step}
      aria-invalid={Boolean(d.error)}
      aria-label={compact ? label : undefined}
      onChange={(event) => {
        const text = event.target.value
        d.set(text, parse(text))
      }}
      onBlur={() => {
        if (parse(d.draft) === null) d.reset()
      }}
    />
  )
  if (compact) return input
  return (
    <Field label={label} hint={`${min}–${max}${unit ? ` ${unit}` : ''}`} error={d.error}>
      {input}
    </Field>
  )
}

export function SelectInput<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <Field label={label}>
      <select
        className="seb-input"
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T | null
  options: { value: T; label: string; icon?: IconName }[]
  onChange: (value: T) => void
}) {
  return (
    <Group label={label}>
      <div className="seb-segmented seb-segmented-wide">
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            className="seb-segment"
            aria-pressed={value === option.value}
            aria-label={option.label}
            title={option.label}
            onClick={() => onChange(option.value)}
          >
            {option.icon ? <Icon name={option.icon} /> : option.label}
          </button>
        ))}
      </div>
    </Group>
  )
}

export const ALIGN_OPTIONS: { value: Align; label: string; icon: IconName }[] = [
  { value: 'left', label: 'Align left', icon: 'align-left' },
  { value: 'center', label: 'Align centre', icon: 'align-center' },
  { value: 'right', label: 'Align right', icon: 'align-right' },
]

export function AlignInput({ value, onChange }: { value: Align; onChange: (a: Align) => void }) {
  return <Segmented label="Alignment" value={value} options={ALIGN_OPTIONS} onChange={onChange} />
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="seb-check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

/* -- colour ---------------------------------------------------------------- */

const BRAND_COLOR_LABELS: Record<(typeof BRAND_COLOR_ATTRS)[number], string> = {
  primary_color: 'Primary',
  text_color: 'Text',
  muted_text_color: 'Muted text',
  link_color: 'Link',
  background_color: 'Background',
  content_background_color: 'Content background',
  button_text_color: 'Button text',
}
const NEUTRALS = ['#000000', '#374151', '#6b7280', '#d1d5db', '#f3f4f6', '#ffffff']
const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

/**
 * A colour: the brand's swatches (they write ``brand.<attr>``, so a change to
 * the brand kit reaches the email), a few neutrals, a hex input, and Clear
 * (``null``, inherit) where the colour is optional.
 */
export function ColorInput({
  label,
  value,
  brand,
  onChange,
  clearable = false,
  inheritLabel = 'Inherited',
}: {
  label: string
  value: string | null | undefined
  brand: BrandPreview
  onChange: Commit<string | null>
  clearable?: boolean
  inheritLabel?: string
}) {
  const literal = value && !value.startsWith('brand.') ? value : ''
  const d = useDraft(literal, (hex) => onChange(hex))
  return (
    <Group label={label} className="seb-color">
      <div className="seb-swatches" role="group" aria-label={`${label}: brand colours`}>
        {BRAND_COLOR_ATTRS.map((attr) => (
          <button
            key={attr}
            type="button"
            className="seb-swatch"
            style={{ background: resolveBrand(brandRef(attr), brand) }}
            aria-label={`${label}: brand ${BRAND_COLOR_LABELS[attr]}`}
            title={`Brand: ${BRAND_COLOR_LABELS[attr]}`}
            aria-pressed={value === brandRef(attr)}
            onClick={() => onChange(brandRef(attr))}
          />
        ))}
      </div>
      <div className="seb-swatches" role="group" aria-label={`${label}: neutrals`}>
        {NEUTRALS.map((hex) => (
          <button
            key={hex}
            type="button"
            className="seb-swatch"
            style={{ background: hex }}
            aria-label={`${label}: ${hex}`}
            title={hex}
            aria-pressed={value?.toLowerCase() === hex}
            onClick={() => onChange(hex)}
          />
        ))}
      </div>
      <div className="seb-color-row">
        <input
          className="seb-input seb-hex"
          value={d.draft}
          placeholder={value?.startsWith('brand.') ? 'Brand colour' : value ? '' : inheritLabel}
          aria-label={`${label}: hex`}
          aria-invalid={Boolean(d.error)}
          maxLength={7}
          onChange={(event) => {
            const text = event.target.value
            d.set(text, HEX.test(text) ? text : null)
          }}
          onBlur={() => d.reset()}
        />
        {clearable && (
          <button
            type="button"
            className="seb-action"
            disabled={value === null || value === undefined}
            onClick={() => onChange(null)}
          >
            Clear
          </button>
        )}
      </div>
      {d.error && (
        <small className="seb-error" role="alert">
          {d.error}
        </small>
      )}
    </Group>
  )
}

/* -- font ------------------------------------------------------------------ */

const FONT_LABELS: Record<string, string> = {
  'brand.body_font': 'Brand body font',
  'brand.heading_font': 'Brand heading font',
}

export function FontInput({
  label = 'Font',
  value,
  onChange,
  clearable,
}: {
  label?: string
  value: string | null | undefined
  onChange: (value: string | null) => void
  clearable?: boolean
}) {
  const options = [
    ...BRAND_FONT_ATTRS.map((attr) => ({
      value: brandRef(attr),
      label: FONT_LABELS[brandRef(attr)]!,
    })),
    ...Object.keys(FONT_STACKS).map((key) => ({
      value: key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
    })),
  ]
  return (
    <Field label={label}>
      <select
        className="seb-input"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
      >
        {clearable && <option value="">Inherited</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

/* -- padding --------------------------------------------------------------- */

const SIDES = ['Top', 'Right', 'Bottom', 'Left'] as const

/** Four compact number inputs with a link-all-sides toggle. ``null`` is
 * inherit, shown as the fallback; the first edit makes it explicit. */
export function PaddingInput({
  label = 'Padding',
  value,
  fallback,
  max,
  nullable,
  onChange,
}: {
  label?: string
  value: Padding | null | undefined
  fallback: Padding
  max: number
  nullable?: boolean
  onChange: Commit<Padding | null>
}) {
  const shown = value ?? fallback
  const [linked, setLinked] = useState(shown.every((side) => side === shown[0]))
  const [error, setError] = useState<string | null>(null)
  const write = (next: Padding | null) => setError(onChange(next) ?? null)
  const setSide = (index: number, n: number) => {
    const next = (
      linked ? [n, n, n, n] : shown.map((side, i) => (i === index ? n : side))
    ) as Padding
    write(next)
  }
  return (
    <Group label={label} className="seb-padding">
      <div className="seb-padding-row">
        {SIDES.map((side, index) => (
          <label key={side} className="seb-padding-side">
            <span>{side[0]}</span>
            <NumberInput
              compact
              label={`${label} ${side.toLowerCase()}`}
              value={shown[index]!}
              min={0}
              max={max}
              onChange={(n) => {
                setSide(index, n)
              }}
            />
          </label>
        ))}
      </div>
      <div className="seb-padding-actions">
        <Toggle label="Link all sides" checked={linked} onChange={setLinked} />
        {nullable && (
          <button
            type="button"
            className="seb-action"
            disabled={value === null || value === undefined}
            onClick={() => write(null)}
          >
            Reset
          </button>
        )}
      </div>
      {error && (
        <small className="seb-error" role="alert">
          {error}
        </small>
      )}
    </Group>
  )
}

/* -- upload ---------------------------------------------------------------- */

export function UploadButton({
  label,
  onFile,
}: {
  label: string
  onFile: (file: File) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const id = useId()
  return (
    <div className="seb-field">
      <span id={id}>{label}</span>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        aria-labelledby={id}
        disabled={busy}
        onChange={async (event) => {
          const file = event.target.files?.[0]
          if (!file) return
          setBusy(true)
          setError('')
          try {
            await onFile(file)
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'The upload failed')
          } finally {
            setBusy(false)
            if (input.current) input.current.value = ''
          }
        }}
      />
      {busy && <small className="seb-hint">Uploading…</small>}
      {error && (
        <small className="seb-error" role="alert">
          {error}
        </small>
      )}
    </div>
  )
}
