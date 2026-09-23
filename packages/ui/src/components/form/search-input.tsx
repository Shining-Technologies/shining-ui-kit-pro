'use client'

import { forwardRef, useRef, type InputHTMLAttributes } from 'react'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/cn'
import { CloseIcon, SearchIcon } from '../icons/icons'
import { useFieldControl } from './field-context'

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'type'> {
  value?: string
  defaultValue?: string
  /** Called with the text on every change, and with `''` when the clear button is pressed. */
  onValueChange?: (value: string) => void
  /** The clear button's accessible name. `'Clear search'` by default. */
  clearLabel?: string
  /** Class for the wrapper that holds the icon, the input and the clear button. */
  wrapperClassName?: string
}

/**
 * A search box: a magnifier, the text, and a clear button once there is text.
 *
 * The DataTable toolbar's search, made standalone for card grids, lists and
 * command bars: the same `sui-search` markup, so both look alike. Escape clears
 * the text (the browser's native `type="search"` behaviour, kept consistent
 * across browsers), and clearing returns focus to the input.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  {
    className,
    wrapperClassName,
    value: valueProp,
    defaultValue = '',
    onValueChange,
    onChange,
    onKeyDown,
    clearLabel = 'Clear search',
    placeholder = 'Search…',
    disabled,
    ...props
  },
  forwarded,
) {
  const field = useFieldControl()
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
  })
  const inner = useRef<HTMLInputElement | null>(null)
  const isDisabled = disabled ?? field.disabled

  return (
    <div className={cn('sui-search', wrapperClassName)} data-slot="search-input">
      <SearchIcon className="sui-search__icon" aria-hidden="true" />
      <input
        ref={(node) => {
          inner.current = node
          if (typeof forwarded === 'function') forwarded(node)
          else if (forwarded) forwarded.current = node
        }}
        type="search"
        className={cn('sui-input sui-search__input', className)}
        value={value}
        placeholder={placeholder}
        {...field}
        {...props}
        disabled={isDisabled}
        onChange={(event) => {
          onChange?.(event)
          setValue(event.target.value)
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.key === 'Escape' && value && !event.defaultPrevented) {
            event.preventDefault()
            setValue('')
          }
        }}
      />
      {value && !isDisabled ? (
        <button
          type="button"
          className="sui-search__clear"
          aria-label={clearLabel}
          onClick={() => {
            setValue('')
            inner.current?.focus()
          }}
        >
          <CloseIcon />
        </button>
      ) : null}
    </div>
  )
})
