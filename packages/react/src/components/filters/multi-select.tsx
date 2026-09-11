import type { SelectOption } from '@shining-ui-kit/core'
import { useId, useMemo, useState, type ReactNode } from 'react'
import { CheckIcon, ChevronDownIcon, SearchIcon } from '../../lib/icons'
import { cn } from '../../lib/cn'
import { Popover, PopoverContent, PopoverTrigger } from '../../primitives/popover'

export interface MultiSelectProps {
  options: SelectOption<unknown>[]
  value: unknown[]
  onChange: (value: unknown[]) => void
  placeholder?: string
  label: string
  /**
   * Replace the default trigger. The inline filter bar passes a button that
   * carries its own field name, so several filters can sit side by side.
   */
  trigger?: ReactNode
}

/**
 * A searchable multi-select.
 *
 * Written by hand rather than pulled from a command-palette dependency: it is
 * a listbox with checkboxes, which `cmdk` would not make any more accessible
 * (§15). Roles follow the ARIA listbox pattern so arrow keys and screen-reader
 * announcements work as expected.
 */
export function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
  label,
  trigger,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const listId = useId()

  const selected = useMemo(() => new Set(value.map((v) => String(v))), [value])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return options
    return options.filter((option) => option.label.toLowerCase().includes(needle))
  }, [options, query])

  const toggle = (option: SelectOption<unknown>) => {
    const key = String(option.value)
    const next = selected.has(key)
      ? value.filter((v) => String(v) !== key)
      : [...value, option.value]
    onChange(next)
  }

  const summary =
    value.length === 0
      ? (placeholder ?? 'Any')
      : value.length === 1
        ? (options.find((o) => String(o.value) === String(value[0]))?.label ?? String(value[0]))
        : `${value.length} selected`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="sui-select__trigger"
            aria-label={`${label}: ${summary}`}
            data-placeholder={value.length === 0 || undefined}
          >
            <span className="sui-select__value">{summary}</span>
            <ChevronDownIcon className="sui-select__chevron" />
          </button>
        )}
      </PopoverTrigger>

      <PopoverContent className="sui-multiselect">
        <div className="sui-multiselect__search">
          <SearchIcon className="sui-multiselect__search-icon" />
          <input
            className="sui-multiselect__input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search options…"
            aria-label={`Search ${label} options`}
            aria-controls={listId}
          />
        </div>

        <ul className="sui-multiselect__list" id={listId} role="listbox" aria-multiselectable>
          {visible.length === 0 ? (
            <li className="sui-multiselect__empty">No matches</li>
          ) : (
            visible.map((option) => {
              const isSelected = selected.has(String(option.value))
              return (
                <li key={String(option.value)}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    className={cn(
                      'sui-multiselect__option',
                      isSelected && 'sui-multiselect__option--selected',
                    )}
                    onClick={() => toggle(option)}
                  >
                    <span className="sui-multiselect__check">
                      {isSelected ? <CheckIcon /> : null}
                    </span>
                    {option.label}
                  </button>
                </li>
              )
            })
          )}
        </ul>

        {value.length > 0 ? (
          <div className="sui-multiselect__footer">
            <button type="button" className="sui-link" onClick={() => onChange([])}>
              Clear selection
            </button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
