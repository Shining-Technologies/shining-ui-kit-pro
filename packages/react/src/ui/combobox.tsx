import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cn } from '../lib/cn'
import { useDebouncedValue } from '../lib/use-debounced-value'
import { useFieldControl } from '../lib/field-context'
import { CheckIcon, ChevronDownIcon, CloseIcon, SearchIcon } from '../lib/icons'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover'
import { Spinner } from './feedback'

export interface ComboboxOption {
  value: string
  label: string
  /** A second line under the label — a role, an id, an address. */
  description?: ReactNode
  icon?: ReactNode
  disabled?: boolean
  /** Options sharing a group are rendered under one heading. */
  group?: string
}

interface ComboboxBaseProps {
  options: ComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: ReactNode
  disabled?: boolean
  /** Show a spinner in the list — for options that are still being fetched. */
  loading?: boolean
  /**
   * Hand searching to the caller (a server, usually). When set, the list is
   * rendered exactly as given and no local filtering happens.
   */
  onSearch?: (query: string) => void
  /** How long to wait after typing before calling `onSearch`, in ms. */
  searchDebounce?: number
  /** Rendered at the bottom of the list — "Load more", "Add new…". */
  footer?: ReactNode
  className?: string
  id?: string
  'aria-label'?: string
}

function useFiltered(options: ComboboxOption[], query: string, local: boolean) {
  return useMemo(() => {
    if (!local || !query.trim()) return options
    const needle = query.trim().toLowerCase()
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(needle) || option.value.toLowerCase().includes(needle),
    )
  }, [local, options, query])
}

/** Options in declaration order, grouped only where a `group` is set. */
function grouped(options: ComboboxOption[]): Array<[string | undefined, ComboboxOption[]]> {
  const groups = new Map<string | undefined, ComboboxOption[]>()
  for (const option of options) {
    const bucket = groups.get(option.group)
    if (bucket) bucket.push(option)
    else groups.set(option.group, [option])
  }
  return [...groups.entries()]
}

/**
 * The shared list: search box, options, keyboard cursor.
 *
 * Both comboboxes render this, which is what keeps their behaviour identical —
 * the only thing that differs between picking one thing and picking several is
 * what happens on select.
 */
function OptionList({
  options,
  query,
  onQueryChange,
  searchPlaceholder,
  emptyMessage,
  loading,
  footer,
  isSelected,
  onSelect,
  onClose,
  listId,
}: {
  options: ComboboxOption[]
  query: string
  onQueryChange: (value: string) => void
  searchPlaceholder: string
  emptyMessage: ReactNode
  loading?: boolean
  footer?: ReactNode
  isSelected: (value: string) => boolean
  onSelect: (option: ComboboxOption) => void
  onClose: () => void
  listId: string
}) {
  const [cursor, setCursor] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const enabled = options.filter((option) => !option.disabled)

  // A filtered list is a different list: park the cursor at the top again
  // rather than leaving it pointing at whatever now occupies that index.
  useEffect(() => setCursor(0), [query, options.length])

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      setCursor((current) => {
        if (enabled.length === 0) return 0
        return (current + step + enabled.length) % enabled.length
      })
      return
    }
    if (event.key === 'Enter') {
      const option = enabled[cursor]
      if (option) {
        event.preventDefault()
        onSelect(option)
      }
      return
    }
    if (event.key === 'Escape') onClose()
  }

  const activeValue = enabled[cursor]?.value

  return (
    <>
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
          placeholder={searchPlaceholder}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={onKeyDown}
        />
        {query ? (
          <button
            type="button"
            className="sui-combobox__search-clear"
            aria-label="Clear search"
            onClick={() => onQueryChange('')}
          >
            <CloseIcon />
          </button>
        ) : null}
      </div>

      <div ref={listRef} id={listId} role="listbox" className="sui-combobox__list">
        {loading ? (
          <p className="sui-combobox__status">
            <Spinner size="sm" label={null} /> Searching…
          </p>
        ) : options.length === 0 ? (
          <p className="sui-combobox__status">{emptyMessage}</p>
        ) : (
          grouped(options).map(([group, items]) => (
            <div key={group ?? '__ungrouped'} className="sui-combobox__group">
              {group ? <p className="sui-combobox__group-label">{group}</p> : null}
              {items.map((option) => {
                const selected = isSelected(option.value)
                return (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={selected}
                    aria-disabled={option.disabled || undefined}
                    data-active={option.value === activeValue || undefined}
                    className={cn(
                      'sui-combobox__option',
                      option.disabled && 'sui-combobox__option--disabled',
                    )}
                    onClick={() => !option.disabled && onSelect(option)}
                    onMouseEnter={() => {
                      const index = enabled.indexOf(option)
                      if (index >= 0) setCursor(index)
                    }}
                  >
                    <span className="sui-combobox__check" aria-hidden="true">
                      {selected ? <CheckIcon /> : null}
                    </span>
                    {option.icon ? (
                      <span className="sui-combobox__option-icon" aria-hidden="true">
                        {option.icon}
                      </span>
                    ) : null}
                    <span className="sui-combobox__option-text">
                      <span className="sui-combobox__option-label">{option.label}</span>
                      {option.description ? (
                        <span className="sui-combobox__option-description">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>

      {footer ? <div className="sui-combobox__footer">{footer}</div> : null}
    </>
  )
}

/* ------------------------------------------------------------------ combobox */

export interface ComboboxProps extends ComboboxBaseProps {
  value?: string | null
  onValueChange?: (value: string | null) => void
  /** Offer a way back to "nothing selected". */
  clearable?: boolean
}

/**
 * A select you can type into.
 *
 * `Select` is right up to about a dozen options; past that, scanning beats
 * scrolling and this is the answer. Filtering is local by default and moves to
 * the server the moment `onSearch` is passed — the same component either way,
 * so a list that outgrows the client does not have to be rewritten.
 */
export const Combobox = forwardRef<HTMLButtonElement, ComboboxProps>(function Combobox(
  {
    className,
    options,
    value,
    onValueChange,
    placeholder = 'Select…',
    searchPlaceholder = 'Search…',
    emptyMessage = 'No matches',
    disabled,
    loading,
    onSearch,
    searchDebounce = 250,
    footer,
    clearable = false,
    ...props
  },
  ref,
) {
  const field = useFieldControl()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const debounced = useDebouncedValue(query, searchDebounce)
  const listId = `${props.id ?? field.id ?? 'combobox'}-list`

  useEffect(() => {
    if (onSearch && open) onSearch(debounced)
  }, [debounced, onSearch, open])

  const visible = useFiltered(options, query, !onSearch)
  const selected = options.find((option) => option.value === value)

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery('')
      }}
    >
      <PopoverTrigger asChild>
        <button
          ref={ref}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          disabled={disabled ?? field.disabled}
          className={cn('sui-combobox__trigger sui-focusable', className)}
          {...field}
          {...props}
        >
          <span className={cn('sui-combobox__value', !selected && 'sui-combobox__value--empty')}>
            {selected?.label ?? placeholder}
          </span>
          {clearable && selected ? (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear selection"
              className="sui-combobox__clear"
              onPointerDown={(event) => {
                // Stop the trigger from opening the popover on the way through.
                event.preventDefault()
                event.stopPropagation()
                onValueChange?.(null)
              }}
            >
              <CloseIcon />
            </span>
          ) : null}
          <ChevronDownIcon className="sui-combobox__chevron" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="sui-combobox__panel" align="start">
        <OptionList
          options={visible}
          query={query}
          onQueryChange={setQuery}
          searchPlaceholder={searchPlaceholder}
          emptyMessage={emptyMessage}
          loading={loading}
          footer={footer}
          listId={listId}
          isSelected={(candidate) => candidate === value}
          onSelect={(option) => {
            onValueChange?.(option.value)
            setOpen(false)
          }}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  )
})

/* ------------------------------------------------------------ multi combobox */

export interface MultiComboboxProps extends ComboboxBaseProps {
  value?: string[]
  onValueChange?: (value: string[]) => void
  /** Show at most this many chips, then a `+n` summary. */
  maxChips?: number
}

/**
 * The same list, for picking several.
 *
 * Selections are chips in the trigger rather than a comma-joined string,
 * because removing one is the operation people actually want and a string
 * makes them clear the whole field and start again.
 */
export const MultiCombobox = forwardRef<HTMLButtonElement, MultiComboboxProps>(
  function MultiCombobox(
    {
      className,
      options,
      value,
      onValueChange,
      placeholder = 'Select…',
      searchPlaceholder = 'Search…',
      emptyMessage = 'No matches',
      disabled,
      loading,
      onSearch,
      searchDebounce = 250,
      footer,
      maxChips = 3,
      ...props
    },
    ref,
  ) {
    const field = useFieldControl()
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const debounced = useDebouncedValue(query, searchDebounce)
    const selected = useMemo(() => value ?? [], [value])
    const listId = `${props.id ?? field.id ?? 'multi-combobox'}-list`

    useEffect(() => {
      if (onSearch && open) onSearch(debounced)
    }, [debounced, onSearch, open])

    const visible = useFiltered(options, query, !onSearch)
    const chosen = options.filter((option) => selected.includes(option.value))

    const toggle = useCallback(
      (candidate: string) => {
        onValueChange?.(
          selected.includes(candidate)
            ? selected.filter((entry) => entry !== candidate)
            : [...selected, candidate],
        )
      },
      [onValueChange, selected],
    )

    return (
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setQuery('')
        }}
      >
        <PopoverTrigger asChild>
          <button
            ref={ref}
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-controls={open ? listId : undefined}
            disabled={disabled ?? field.disabled}
            className={cn('sui-combobox__trigger sui-combobox__trigger--multi', className)}
            {...field}
            {...props}
          >
            {chosen.length === 0 ? (
              <span className="sui-combobox__value sui-combobox__value--empty">{placeholder}</span>
            ) : (
              <span className="sui-combobox__chips">
                {chosen.slice(0, maxChips).map((option) => (
                  <span key={option.value} className="sui-combobox__chip">
                    {option.label}
                    <span
                      role="button"
                      tabIndex={-1}
                      aria-label={`Remove ${option.label}`}
                      className="sui-combobox__chip-remove"
                      onPointerDown={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        toggle(option.value)
                      }}
                    >
                      <CloseIcon />
                    </span>
                  </span>
                ))}
                {chosen.length > maxChips ? (
                  <span className="sui-combobox__chip sui-combobox__chip--more">
                    +{chosen.length - maxChips}
                  </span>
                ) : null}
              </span>
            )}
            <ChevronDownIcon className="sui-combobox__chevron" />
          </button>
        </PopoverTrigger>

        <PopoverContent className="sui-combobox__panel" align="start">
          <OptionList
            options={visible}
            query={query}
            onQueryChange={setQuery}
            searchPlaceholder={searchPlaceholder}
            emptyMessage={emptyMessage}
            loading={loading}
            footer={footer}
            listId={listId}
            isSelected={(candidate) => selected.includes(candidate)}
            // The popover stays open: picking several things and having the
            // list close after each one is the classic multi-select annoyance.
            onSelect={(option) => toggle(option.value)}
            onClose={() => setOpen(false)}
          />
        </PopoverContent>
      </Popover>
    )
  },
)
