'use client'

import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type MutableRefObject,
} from 'react'
import { cn } from '../../lib/cn'
import { useFieldControl } from './field-context'
import { COUNTRIES, countryByCode, countryByDial, type Country } from './countries'
import { ChevronDownIcon, SearchIcon } from '../icons/icons'
import { Popover, PopoverContent, PopoverTrigger } from '../overlay/popover'

/**
 * Group the national digits so a long number can be read back.
 *
 * Deliberately not a full libphonenumber: that is 150 kB to place brackets, and
 * the grouping below is right for the great majority of numbering plans while
 * never *rejecting* anything — the digits the caller gets are untouched either
 * way, so a number this formats oddly is still stored correctly.
 */
function group(digits: string, dial: string): string {
  if (!digits) return ''
  // The North American plan is the one everybody recognises on sight.
  if (dial === '1') {
    const [, area = '', prefix = '', line = ''] =
      /^(\d{0,3})(\d{0,3})(\d{0,4})$/.exec(digits.slice(0, 10)) ?? []
    return [area && `(${area})`, prefix, line && `-${line}`]
      .filter(Boolean)
      .join(' ')
      .replace(' -', '-')
  }
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim()
}

interface PhoneState {
  country: Country
  national: string
}

/**
 * Split an international number into country and national digits.
 *
 * The country already selected wins a code it shares: `+1` is Canada as much
 * as the United States, and a Canadian who picked the maple leaf must not see
 * it swapped for the stars and stripes the moment the value comes back round.
 */
function parse(value: string, current: Country): PhoneState {
  const digits = value.replace(/[^\d]/g, '')
  if (current.dial && digits.startsWith(current.dial)) {
    return withNational(current, digits.slice(current.dial.length))
  }
  const match = countryByDial(digits)
  return match
    ? withNational(match, digits.slice(match.dial.length))
    : withNational(current, digits)
}

/**
 * National digits cut to what the number can hold, so the field never shows
 * digits the value does not carry, or the other way round.
 *
 * E.164 is fifteen digits at most, country code included; a trunk `0` in front
 * is not part of that count, since it never reaches the value. The North
 * American plan is exactly ten digits after the `1`, and a `1` typed in front
 * of ten is its trunk prefix rather than part of the number.
 */
function withNational(country: Country, national: string): PhoneState {
  if (country.dial === '1') {
    const digits = national.length > 10 && national.startsWith('1') ? national.slice(1) : national
    return { country, national: digits.slice(0, 10) }
  }
  const trunk = KEEPS_LEADING_ZERO.has(country.code) ? 0 : (/^0*/.exec(national)?.[0].length ?? 0)
  return { country, national: national.slice(0, trunk + 15 - country.dial.length) }
}

/**
 * Plans where the leading `0` is part of the subscriber number and survives
 * into the international form (`+39 06…` is Rome). Everywhere else a leading
 * `0` is the trunk prefix dialled only inside the country, and E.164 drops it.
 */
const KEEPS_LEADING_ZERO = new Set(['IT', 'SM', 'VA', 'CI', 'CG'])

/** The national significant number: what follows the country code in E.164. */
function significant({ country, national }: PhoneState): string {
  return KEEPS_LEADING_ZERO.has(country.code) ? national : national.replace(/^0+/, '')
}

/**
 * An Australian types `0412 345 678`, because that is how the number is written
 * at home; the value is `+61412345678`, because that is the number.
 */
function toE164(state: PhoneState): string {
  const digits = significant(state)
  return digits ? `+${state.country.dial}${digits}` : ''
}

export interface PhoneInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'type'
> {
  /** The full international number, e.g. `'+61412345678'`. */
  value?: string
  /** Initial number while uncontrolled, in the same E.164 form as `value`. */
  defaultValue?: string
  /**
   * Fires with the E.164 number, plus the parts, so neither has to be re-derived.
   * A trunk `0` typed in front of the national number (`0412…` in Australia, `07…`
   * in the UK) is dropped from both, as E.164 requires; the field keeps showing it.
   */
  onValueChange?: (value: string, parts: { country: Country; national: string }) => void
  /** Alpha-2 of the country selected before anything is typed. */
  defaultCountry?: string
  /** Restrict the list to these alpha-2 codes, in this order. */
  countries?: string[]
  /** Codes to float to the top of the full list — the ones most users pick. */
  preferredCountries?: string[]
  searchPlaceholder?: string
  wrapperClassName?: string
}

/**
 * A phone number with the country it belongs to.
 *
 * The country is a control of its own rather than something to be typed,
 * because `+61` and `+1` are four keystrokes that decide how the whole number
 * is parsed — and the flag makes a wrong one obvious at a glance.
 *
 * What the caller receives is always E.164 (`+61412345678`): the spacing is
 * presentation and never reaches the value. With `name`, a hidden input carries
 * the same E.164 string into a native form submission.
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput(
  {
    className,
    wrapperClassName,
    value,
    defaultValue,
    onValueChange,
    defaultCountry = 'AU',
    countries,
    preferredCountries,
    placeholder = 'Phone number',
    searchPlaceholder = 'Search countries…',
    disabled,
    name,
    form,
    onKeyDown,
    ...props
  },
  ref,
) {
  const field = useFieldControl()
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [state, setState] = useState<PhoneState>(() => {
    const base = countryByCode(defaultCountry) ?? COUNTRIES[0]!
    const initial = value ?? defaultValue
    return initial ? parse(initial, base) : { country: base, national: '' }
  })
  const { country, national } = state
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const isDisabled = disabled ?? field.disabled

  // An externally supplied value decides both halves — including the country,
  // so loading a saved `+44…` number selects the right flag without extra props.
  //
  // Compared as E.164 rather than digit-for-digit: the value that comes back is
  // our own emission with the trunk `0` removed, and rewriting the field from it
  // would pull the `0` out from under the user mid-number.
  useEffect(() => {
    if (value === undefined) return
    setState((previous) => {
      if ((value || '') === toE164(previous)) return previous
      return value ? parse(value, previous.country) : { ...previous, national: '' }
    })
  }, [value])

  const list = useMemo(() => {
    const base = countries
      ? countries.map((code) => countryByCode(code)).filter((entry): entry is Country => !!entry)
      : COUNTRIES
    if (!preferredCountries?.length || countries) return base
    const top = preferredCountries
      .map((code) => countryByCode(code))
      .filter((entry): entry is Country => !!entry)
    const codes = new Set(top.map((entry) => entry.code))
    return [...top, ...base.filter((entry) => !codes.has(entry.code))]
  }, [countries, preferredCountries])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return list
    const bare = needle.replace(/^\+/, '')
    return list.filter(
      (entry) =>
        entry.name.toLowerCase().includes(needle) ||
        entry.code.toLowerCase() === needle ||
        entry.dial.startsWith(bare),
    )
  }, [list, query])

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView?.({ block: 'nearest' })
  }, [active, open])

  function emit(next: PhoneState) {
    setState(next)
    onValueChange?.(toE164(next), { country: next.country, national: significant(next) })
  }

  function choose(entry: Country) {
    emit(withNational(entry, national))
    setOpen(false)
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    // Backspace at the start of an empty field is a request to change country.
    if (event.key === 'Backspace' && national === '') setOpen(true)
  }

  // The list is driven from the search box, as a combobox: focus stays where
  // the typing is, and `aria-activedescendant` tells a screen reader which
  // country the arrows are on.
  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const last = visible.length - 1
    const moves: Record<string, number> = {
      ArrowDown: Math.min(last, active + 1),
      ArrowUp: Math.max(0, active - 1),
    }
    if (event.key in moves && visible.length > 0) {
      event.preventDefault()
      setActive(moves[event.key]!)
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const entry = visible[active]
      if (entry) choose(entry)
    }
  }

  const optionId = (code: string) => `${listId}-${code}`
  const activeEntry = visible[active]

  return (
    <div
      className={cn('sui-input-group sui-phone', wrapperClassName)}
      data-slot="phone-input"
      data-disabled={isDisabled || undefined}
    >
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (next) {
            // Open on the country already chosen, so Enter keeps it.
            setActive(
              Math.max(
                0,
                visible.findIndex((entry) => entry.code === country.code),
              ),
            )
          } else {
            setQuery('')
            // Picking a country is nearly always followed by typing the number.
            requestAnimationFrame(() => inputRef.current?.focus())
          }
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className="sui-phone__country sui-focusable"
            disabled={isDisabled}
            aria-label={`Country: ${country.name} (+${country.dial})`}
            aria-expanded={open}
          >
            <span className="sui-phone__flag" aria-hidden="true">
              {country.flag}
            </span>
            <span className="sui-phone__dial">+{country.dial}</span>
            <ChevronDownIcon className="sui-phone__chevron" />
          </button>
        </PopoverTrigger>

        <PopoverContent className="sui-combobox__panel sui-phone__panel" align="start">
          <div className="sui-combobox__search">
            <SearchIcon className="sui-combobox__search-icon" />
            <input
              className="sui-combobox__search-input"
              value={query}
              autoFocus
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={activeEntry ? optionId(activeEntry.code) : undefined}
              placeholder={searchPlaceholder}
              aria-label="Search countries"
              onChange={(event) => {
                setQuery(event.target.value)
                setActive(0)
              }}
              onKeyDown={onSearchKeyDown}
            />
          </div>
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label="Country"
            className="sui-combobox__list"
          >
            {visible.length === 0 ? (
              <p className="sui-combobox__status">No countries match that</p>
            ) : (
              visible.map((entry, index) => (
                <div
                  key={entry.code}
                  id={optionId(entry.code)}
                  role="option"
                  aria-selected={entry.code === country.code}
                  data-active={index === active || undefined}
                  className="sui-combobox__option"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(entry)}
                >
                  <span className="sui-phone__flag" aria-hidden="true">
                    {entry.flag}
                  </span>
                  <span className="sui-combobox__option-text">
                    <span className="sui-combobox__option-label">{entry.name}</span>
                  </span>
                  <span className="sui-phone__option-dial">+{entry.dial}</span>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      <input
        ref={(node) => {
          inputRef.current = node
          if (typeof ref === 'function') ref(node)
          // The forwarded ref is typed read-only; assigning through it is what
          // every "merge two refs" helper does, and is what React expects here.
          else if (ref) (ref as MutableRefObject<HTMLInputElement | null>).current = node
        }}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        className={cn('sui-input-group__input', className)}
        {...field}
        {...props}
        form={form}
        placeholder={placeholder}
        disabled={isDisabled}
        value={group(national, country.dial)}
        onChange={(event) => {
          const raw = event.target.value
          // The field never shows a `+`, so one arriving means a full
          // international number was pasted or autofilled: let it pick the
          // country rather than prefixing it with the current one.
          if (raw.trimStart().startsWith('+')) emit(parse(raw, country))
          else emit(withNational(country, raw.replace(/[^\d]/g, '')))
        }}
        onKeyDown={onInputKeyDown}
      />

      {/* The visible text is spaced for reading; the form gets E.164. */}
      {name ? (
        <input type="hidden" name={name} form={form} value={toE164(state)} disabled={isDisabled} />
      ) : null}
    </div>
  )
})
