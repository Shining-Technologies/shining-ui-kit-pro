'use client'

import { forwardRef, useEffect, useMemo, useState, type FocusEventHandler } from 'react'
import { CalendarIcon, CheckIcon, CloseIcon } from '../icons/icons'
import { cn } from '../../lib/cn'
import { useFieldControl, useFieldLabelId, useTriggerName } from '../form/field-context'
import { Calendar, type CalendarRange } from './calendar'
import {
  DATE_RANGE_PRESETS,
  countDays,
  formatDateRange,
  type DateRange,
  type DateRangePreset,
  type IsoDate,
} from './date-utils'
import { DEFAULT_LOCALE } from './internal'
import { Popover, PopoverContent, PopoverTrigger } from '../overlay/popover'

export interface DateRangeFieldProps {
  /** Both ends, inclusive; `undefined` when nothing is chosen. */
  value: DateRange | undefined
  /** Called with a complete range — never a half-picked one — or `undefined` when cleared. */
  onChange: (value: DateRange | undefined) => void
  /** Shown when nothing is chosen. */
  placeholder?: string
  /**
   * Accessible name. Inside a `<Field>` leave it out: the field's label names
   * the control. Outside one, pass it — the field is a button, not an input.
   */
  label?: string
  min?: IsoDate
  max?: IsoDate
  /**
   * One-click ranges above the calendar. `DATE_RANGE_PRESETS` by default;
   * pass `[]` for none. A preset that reaches past `min` or `max` is disabled.
   */
  presets?: DateRangePreset[]
  /** Months side by side: one by default; `2` shows two on wider screens. Phones always get one. */
  months?: 1 | 2
  /** `1` = Monday (the default), `0` = Sunday. */
  weekStartsOn?: 0 | 1
  /** Formats the trigger and the calendar. `'en-US'` by default. */
  locale?: string
  /** Overrides the id a surrounding `<Field>` supplies. */
  id?: string
  /**
   * Submitted with a native `<form>`: a hidden input carries the range as an
   * ISO 8601 interval, `yyyy-mm-dd/yyyy-mm-dd`.
   */
  name?: string
  /** Announced as required (`aria-required`); a hidden input cannot be validated natively. */
  required?: boolean
  /** Fires when the trigger loses focus — where a form library records "touched". */
  onBlur?: FocusEventHandler<HTMLButtonElement>
  disabled?: boolean
  className?: string
}

/** The width below which the panel shows one month, as in the stylesheet. */
const NARROW = '(max-width: 40rem)'

function useNarrow() {
  // The panel only exists in a browser, after a click, so this never runs on the server.
  const [narrow, setNarrow] = useState(
    () => typeof window.matchMedia === 'function' && window.matchMedia(NARROW).matches,
  )
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia(NARROW)
    const update = () => setNarrow(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return narrow
}

/**
 * A start and an end date in one field.
 *
 * One trigger, not a From and a To field: a range is one value, and two boxes
 * make people check which of them they filled. The first click on the
 * calendar picks the start, the second the end — in either order — and the
 * span between is previewed under the pointer before the second click lands.
 * Presets above the calendar cover the ranges people want most.
 *
 * `onChange` hears only complete ranges: a half-picked one stays in the panel,
 * and closing it early leaves the value as it was.
 */
export const DateRangeField = forwardRef<HTMLButtonElement, DateRangeFieldProps>(
  function DateRangeField(
    {
      value,
      onChange,
      placeholder = 'Pick a date range',
      label,
      min,
      max,
      presets = DATE_RANGE_PRESETS,
      months = 1,
      weekStartsOn,
      locale = DEFAULT_LOCALE,
      disabled,
      className,
      id,
      name,
      required,
      onBlur,
    },
    ref,
  ) {
    const field = useFieldControl()
    const fieldLabelId = useFieldLabelId()
    const [open, setOpen] = useState(false)
    const isDisabled = disabled ?? field.disabled

    const formatted = useMemo(() => formatDateRange(value, locale), [value, locale])
    const trigger = useTriggerName(label, formatted, 'Date range')

    return (
      <div
        className={cn('sui-date-field sui-date-range', className)}
        data-empty={formatted ? undefined : true}
      >
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              ref={ref}
              type="button"
              id={id ?? field.id}
              className="sui-date-field__trigger"
              disabled={isDisabled}
              {...trigger.props}
              aria-describedby={field['aria-describedby']}
              aria-invalid={field['aria-invalid']}
              aria-required={(required ?? field.required) || undefined}
              onBlur={onBlur}
            >
              <CalendarIcon className="sui-date-field__icon" aria-hidden="true" />
              <span id={trigger.valueId} className="sui-date-field__value">
                {formatted ?? placeholder}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="sui-date-range__popover" align="start">
            <RangePanel
              value={value}
              onChange={(next) => {
                onChange(next)
                if (next) setOpen(false)
              }}
              label={trigger.text}
              labelledBy={label ? undefined : fieldLabelId}
              min={min}
              max={max}
              presets={presets}
              months={months}
              weekStartsOn={weekStartsOn}
              locale={locale}
            />
          </PopoverContent>
        </Popover>

        {/* Only a value the field shows can be cleared, and a disabled field cannot be. */}
        {formatted && !isDisabled ? (
          <button
            type="button"
            className="sui-date-field__clear"
            aria-label={`Clear ${trigger.text}`}
            onClick={() => onChange(undefined)}
          >
            <CloseIcon aria-hidden="true" />
          </button>
        ) : null}
        {name ? (
          <input
            type="hidden"
            name={name}
            value={value ? `${value.from}/${value.to}` : ''}
            disabled={isDisabled}
          />
        ) : null}
      </div>
    )
  },
)

interface RangePanelProps {
  value: DateRange | undefined
  onChange: (value: DateRange | undefined) => void
  label: string
  labelledBy: string | undefined
  min: IsoDate | undefined
  max: IsoDate | undefined
  presets: DateRangePreset[]
  months: 1 | 2
  weekStartsOn: 0 | 1 | undefined
  locale: string
}

/** The popover's content, mounted each time it opens, so a half-picked range starts over. */
function RangePanel({
  value,
  onChange,
  label,
  labelledBy,
  min,
  max,
  presets,
  months,
  weekStartsOn,
  locale,
}: RangePanelProps) {
  const [draft, setDraft] = useState<CalendarRange>(() => value ?? {})
  const narrow = useNarrow()

  // Read on every render but used only inside the panel, which is never part
  // of server HTML, so the server's clock cannot cause a hydration mismatch.
  const ranges = presets.map((preset) => {
    const [from, to] = preset.range()
    return {
      preset,
      from,
      to,
      allowed: (!min || from >= min) && (!max || to <= max),
      current: value?.from === from && value?.to === to,
    }
  })

  const status = draft.to
    ? `${formatDateRange(draft as DateRange, locale)} · ${countDays(draft as DateRange)} days`
    : draft.from
      ? 'Now pick the last day'
      : 'Pick the first day'

  return (
    <>
      <div className="sui-date-range__body">
        {ranges.length > 0 ? (
          // The table's date filter presets, so the two panels read as one family.
          <div
            className="sui-range-panel__presets sui-date-range__presets"
            role="group"
            aria-label="Presets"
          >
            {ranges.map(({ preset, from, to, allowed, current }) => (
              <button
                type="button"
                key={preset.label}
                className="sui-range-panel__preset"
                aria-pressed={current}
                data-selected={current || undefined}
                disabled={!allowed}
                onClick={() => {
                  setDraft({ from, to })
                  onChange({ from, to })
                }}
              >
                {current ? <CheckIcon aria-hidden="true" /> : null}
                {preset.label}
              </button>
            ))}
          </div>
        ) : null}

        <Calendar
          range={draft}
          months={narrow ? 1 : months}
          min={min}
          max={max}
          label={label}
          aria-labelledby={labelledBy}
          locale={locale}
          weekStartsOn={weekStartsOn}
          onChange={(day) => {
            // A first pick, or a new start once a range is complete.
            if (!draft.from || draft.to) {
              setDraft({ from: day })
              return
            }
            // The second pick may come before the first: the range is the same.
            const range =
              day < draft.from ? { from: day, to: draft.from } : { from: draft.from, to: day }
            setDraft(range)
            onChange(range)
          }}
        />
      </div>

      <div className="sui-date-range__foot">
        <span className="sui-date-range__status" aria-live="polite">
          {status}
        </span>
        {draft.from ? (
          <button
            type="button"
            className="sui-btn sui-btn--ghost sui-btn--sm"
            onClick={() => {
              setDraft({})
              if (value) onChange(undefined)
            }}
          >
            Clear
          </button>
        ) : null}
      </div>
    </>
  )
}
