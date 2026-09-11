import { useMemo, useState } from 'react'
import { CalendarIcon, CloseIcon } from '../lib/icons'
import { cn } from '../lib/cn'
import { Calendar, fromIso, type IsoDate } from './calendar'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

export interface DateFieldProps {
  value: IsoDate | undefined
  onChange: (value: IsoDate | undefined) => void
  /** Shown when nothing is chosen. */
  placeholder?: string
  /** Accessible name. Required — the field is a button, not a labelled input. */
  label: string
  min?: IsoDate
  max?: IsoDate
  locale?: string
  disabled?: boolean
  className?: string
}

/**
 * A date field with the kit's own calendar behind it.
 *
 * A native `<input type="date">` is accessible and free, but it is also the one
 * control in a themed table that cannot be themed: its layout, its placeholder
 * and its picker belong to the browser, so a filter bar built from tokens ends
 * up with one control that ignores every one of them.
 *
 * This keeps the accessibility — a labelled control, a keyboard-navigable grid,
 * a clear button — and gives the appearance back to the project's tokens.
 */
export function DateField({
  value,
  onChange,
  placeholder = 'Pick a date',
  label,
  min,
  max,
  locale,
  disabled,
  className,
}: DateFieldProps) {
  const [open, setOpen] = useState(false)
  const date = fromIso(value)

  const formatted = useMemo(
    () => (date ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date) : null),
    [date, locale],
  )

  return (
    <div className={cn('sui-date-field', className)} data-empty={date ? undefined : true}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="sui-date-field__trigger"
            disabled={disabled}
            aria-label={formatted ? `${label}: ${formatted}` : label}
          >
            <CalendarIcon className="sui-date-field__icon" aria-hidden="true" />
            <span className="sui-date-field__value">{formatted ?? placeholder}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="sui-date-field__popover" align="start">
          <Calendar
            value={value}
            min={min}
            max={max}
            label={label}
            locale={locale}
            onChange={(next) => {
              onChange(next)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>

      {date ? (
        <button
          type="button"
          className="sui-date-field__clear"
          aria-label={`Clear ${label}`}
          onClick={() => onChange(undefined)}
        >
          <CloseIcon aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}
