import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type MutableRefObject,
} from 'react'
import { cn } from '../lib/cn'
import { useFieldControl } from '../lib/field-context'
import { COUNTRIES, countryByCode, countryByDial, type Country } from '../lib/countries'
import { ChevronDownIcon, SearchIcon } from '../lib/icons'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover'

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

export interface PhoneInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> {
  /** The full international number, e.g. `'+61412345678'`. */
  value?: string
  /** Fires with the E.164 number, plus the parts, so neither has to be re-derived. */
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
 * presentation and never reaches the value.
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput(
  {
    className,
    wrapperClassName,
    value,
    onValueChange,
    defaultCountry = 'AU',
    countries,
    preferredCountries,
    placeholder = 'Phone number',
    searchPlaceholder = 'Search countries…',
    disabled,
    ...props
  },
  ref,
) {
  const field = useFieldControl()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState<Country>(
    () => countryByCode(defaultCountry) ?? COUNTRIES[0]!,
  )
  const [national, setNational] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  // An externally supplied value decides both halves — including the country,
  // so loading a saved `+1…` number selects the right flag without extra props.
  useEffect(() => {
    if (value === undefined) return
    const digits = value.replace(/[^\d]/g, '')
    const match = countryByDial(digits)
    if (match) {
      setCountry(match)
      setNational(digits.slice(match.dial.length))
    } else {
      setNational(digits)
    }
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

  function emit(next: Country, digits: string) {
    setCountry(next)
    setNational(digits)
    onValueChange?.(digits ? `+${next.dial}${digits}` : '', { country: next, national: digits })
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Backspace at the start of an empty field is a request to change country.
    if (event.key === 'Backspace' && national === '') setOpen(true)
  }

  return (
    <div
      className={cn('sui-input-group sui-phone', wrapperClassName)}
      data-slot="phone-input"
      data-disabled={(disabled ?? field.disabled) || undefined}
    >
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) {
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
            disabled={disabled ?? field.disabled}
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
              placeholder={searchPlaceholder}
              aria-label="Search countries"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div role="listbox" aria-label="Country" className="sui-combobox__list">
            {visible.length === 0 ? (
              <p className="sui-combobox__status">No countries match that</p>
            ) : (
              visible.map((entry) => (
                <div
                  key={entry.code}
                  role="option"
                  aria-selected={entry.code === country.code}
                  className="sui-combobox__option"
                  onClick={() => {
                    emit(entry, national)
                    setOpen(false)
                  }}
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
        placeholder={placeholder}
        disabled={disabled ?? field.disabled}
        value={group(national, country.dial)}
        onChange={(event) => emit(country, event.target.value.replace(/[^\d]/g, ''))}
        onKeyDown={onKeyDown}
      />
    </div>
  )
})
