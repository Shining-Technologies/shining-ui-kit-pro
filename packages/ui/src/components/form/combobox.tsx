'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cn } from '../../lib/cn'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useDebouncedValue } from '../../hooks/use-debounced-value'
import { useEventCallback } from '../../hooks/use-event-callback'
import { useFieldControl, useFieldLabelId } from './field-context'
import { CheckIcon, ChevronDownIcon, CloseIcon, SearchIcon } from '../icons/icons'
import { Popover, PopoverContent, PopoverTrigger } from '../overlay/popover'
import { Spinner } from '../feedback/feedback'

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
  /**
   * Submitted with a native `<form>`: a hidden input carrying the value (one
   * per selected value in the multi variant), since the trigger is a button.
   */
  name?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
}

/**
 * Call `onSearch` once per settled query while the list is open.
 *
 * Through a stable callback, so an inline `onSearch={(q) => fetch(q)}` does
 * not re-run the effect on every parent render — which, with a `loading` flag
 * that re-renders the parent, is a request loop.
 */
function useServerSearch(
  onSearch: ((query: string) => void) | undefined,
  query: string,
  delay: number,
  open: boolean,
) {
  const debounced = useDebouncedValue(query, delay)
  const search = useEventCallback(onSearch)
  const enabled = Boolean(onSearch)
  useEffect(() => {
    if (enabled && open) search(debounced)
  }, [debounced, enabled, open, search])
}

const NONE_OPTIONS: ComboboxOption[] = []

/**
 * Options the user has picked, remembered past the list that offered them.
 *
 * With `onSearch` the options are whatever the last query returned, so the
 * picked one is usually gone from them a keystroke later; without this the
 * trigger would fall back to the placeholder while a value is still selected.
 */
function usePicked() {
  const picked = useRef(new Map<string, ComboboxOption>())
  const remember = useCallback((option: ComboboxOption) => {
    picked.current.set(option.value, option)
  }, [])
  /**
   * The option to show for a value: from `options`, then from the caller's
   * `selectedOption(s)`, then from what was picked here. A value none of them
   * knows is shown as itself — a selection that exists must never read as the
   * placeholder, which would say the field is empty while it submits a value.
   */
  const lookup = useCallback(
    (options: ComboboxOption[], known: ComboboxOption[], value: string): ComboboxOption =>
      options.find((option) => option.value === value) ??
      known.find((option) => option.value === value) ??
      picked.current.get(value) ?? { value, label: value },
    [],
  )
  return { remember, lookup }
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

interface ListName {
  'aria-label'?: string
  'aria-labelledby'?: string
}

/**
 * The listbox's name, so the list is never unnamed.
 *
 * A name given to the combobox wins, as it does for the trigger; then the
 * surrounding field's label; then the placeholder.
 */
function useListName(
  props: { 'aria-label'?: string; 'aria-labelledby'?: string },
  placeholder: string,
): ListName {
  const labelId = useFieldLabelId()
  if (props['aria-labelledby']) return { 'aria-labelledby': props['aria-labelledby'] }
  if (props['aria-label']) return { 'aria-label': props['aria-label'] }
  if (labelId) return { 'aria-labelledby': labelId }
  return { 'aria-label': placeholder }
}

/** Point a forwarded ref at a node the component also keeps for itself. */
function assignRef<T>(ref: ForwardedRef<T>, node: T | null) {
  if (typeof ref === 'function') ref(node)
  else if (ref) ref.current = node
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
  listName,
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
  listName: ListName
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
      // While loading the list shows "Searching…", not the options the cursor
      // last pointed at: Enter must not pick one nobody can see.
      if (loading) {
        event.preventDefault()
        return
      }
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
  // Option ids, so the search box can point at the active one: focus stays in
  // the input, and `aria-activedescendant` is what a screen reader follows.
  const optionId = (option: ComboboxOption) => `${listId}-${options.indexOf(option)}`
  const active = enabled[cursor]

  return (
    <>
      {/* A field box like any other input: same corners, same focus. */}
      <div className="sui-combobox__search">
        <div className="sui-input-group sui-combobox__search-field">
          <SearchIcon className="sui-combobox__search-icon" aria-hidden="true" />
          <input
            className="sui-input-group__input sui-combobox__search-input"
            value={query}
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active && !loading ? optionId(active) : undefined}
            aria-label={searchPlaceholder}
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
      </div>

      <div ref={listRef} id={listId} role="listbox" className="sui-combobox__list" {...listName}>
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
                    id={optionId(option)}
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
                    <span
                      className="sui-option-check"
                      data-checked={selected || undefined}
                      aria-hidden="true"
                    >
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
  /**
   * Controlled selection when defined; `null` is "nothing selected". Leave it
   * `undefined` (and use `defaultValue`) for an uncontrolled field.
   */
  value?: string | null
  /** Initial selection while uncontrolled. */
  defaultValue?: string | null
  onValueChange?: (value: string | null) => void
  /**
   * The option for the current value, when `options` may not contain it — a
   * saved value shown before async options have loaded, or after a server
   * search has moved on. Used for the trigger's label only; it is not added
   * to the list.
   */
  selectedOption?: ComboboxOption | null
  /** Offer a way back to "nothing selected" — the ✕, and Backspace/Delete on the trigger. */
  clearable?: boolean
}

/**
 * The field wiring for a trigger that is a `<button>`.
 *
 * `required` is not a button attribute, so it travels as `aria-required`, and
 * `disabled` is kept apart so the caller's own prop is not overwritten by the
 * field's `undefined` when the two are spread together.
 */
function useTriggerFieldProps() {
  const { disabled, required, ...aria } = useFieldControl()
  return { aria, disabled, required }
}

/**
 * A select you can type into.
 *
 * `Select` is right up to about a dozen options; past that, scanning beats
 * scrolling and this is the answer. Filtering is local by default and moves to
 * the server the moment `onSearch` is passed — the same component either way,
 * so a list that outgrows the client does not have to be rewritten.
 *
 * The clear button is not inside the trigger: a button inside a button is
 * invalid and out of a screen reader's reach. With `clearable`, the trigger
 * sits in a `.sui-combobox` wrapper with a layer stacked over it that repeats
 * its layout with the text hidden, and the real clear button sits in that
 * layer exactly where the trigger leaves room for it.
 */
export const Combobox = forwardRef<HTMLButtonElement, ComboboxProps>(function Combobox(
  {
    className,
    options,
    value,
    defaultValue,
    onValueChange,
    selectedOption,
    placeholder = 'Select…',
    searchPlaceholder = 'Search…',
    emptyMessage = 'No matches',
    disabled,
    loading,
    onSearch,
    searchDebounce = 250,
    footer,
    clearable = false,
    name,
    ...props
  },
  ref,
) {
  const field = useTriggerFieldProps()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const generatedId = useId()
  const listId = `${props.id ?? field.aria.id ?? generatedId}-list`
  const listName = useListName(props, placeholder)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  // Controlled exactly when `value` is defined; `null` is the empty selection.
  const [current, setCurrent] = useControllableState<string | null>({
    value,
    defaultValue: defaultValue ?? null,
    onChange: onValueChange,
  })
  const { remember, lookup } = usePicked()

  useServerSearch(onSearch, query, searchDebounce, open)

  const visible = useFiltered(options, query, !onSearch)
  const selected =
    current == null
      ? undefined
      : lookup(options, selectedOption ? [selectedOption] : NONE_OPTIONS, current)
  const isDisabled = disabled ?? field.disabled
  const showClear = Boolean(clearable && selected && !isDisabled)

  const popover = (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery('')
      }}
    >
      <PopoverTrigger asChild>
        <button
          ref={(node) => {
            triggerRef.current = node
            assignRef(ref, node)
          }}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-required={field.required}
          className={cn('sui-combobox__trigger sui-focusable', className)}
          {...field.aria}
          {...props}
          disabled={isDisabled}
          onKeyDown={(event) => {
            // The ✕ is pointer-only, so the keyboard gets the same action on
            // the trigger itself.
            if (clearable && selected && (event.key === 'Backspace' || event.key === 'Delete')) {
              event.preventDefault()
              setCurrent(null)
            }
          }}
        >
          <span className={cn('sui-combobox__value', !selected && 'sui-combobox__value--empty')}>
            {selected?.label ?? placeholder}
          </span>
          {/* Room for the clear button in the layer above. */}
          {showClear ? (
            <span className="sui-combobox__clear sui-combobox__ghost" aria-hidden="true">
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
          listName={listName}
          isSelected={(candidate) => candidate === current}
          onSelect={(option) => {
            remember(option)
            setCurrent(option.value)
            setOpen(false)
          }}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  )

  return (
    <>
      {clearable ? (
        <div className="sui-combobox" data-slot="combobox">
          {popover}
          {showClear ? (
            <span className="sui-combobox__trigger sui-combobox__overlay">
              <span className="sui-combobox__value" />
              <button
                type="button"
                tabIndex={-1}
                aria-label="Clear selection"
                className="sui-combobox__clear"
                // Keep focus where it is; the click lands it on the trigger.
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => {
                  setCurrent(null)
                  triggerRef.current?.focus()
                }}
              >
                <CloseIcon />
              </button>
              <ChevronDownIcon className="sui-combobox__chevron sui-combobox__ghost" />
            </span>
          ) : null}
        </div>
      ) : (
        popover
      )}
      {name ? (
        <input type="hidden" name={name} value={current ?? ''} disabled={isDisabled} />
      ) : null}
    </>
  )
})

/* ------------------------------------------------------------ multi combobox */

export interface MultiComboboxProps extends ComboboxBaseProps {
  /**
   * Controlled selection when defined; `[]` is "nothing selected". Leave it
   * `undefined` (and use `defaultValue`) for an uncontrolled field.
   */
  value?: string[]
  /** Initial selection while uncontrolled. */
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  /**
   * The options for the current values, when `options` may not contain them —
   * as `selectedOption` on `Combobox`. Used for the chips' labels only.
   */
  selectedOptions?: ComboboxOption[]
  /**
   * Show at most this many chips, then a `+n` summary. Without it the trigger
   * shows as many as fit on its one line.
   */
  maxChips?: number
}

const NONE: string[] = []

// React 18 warns for every `useLayoutEffect` rendered on the server; the
// measuring only matters in a browser.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/**
 * How many chips fit on the trigger's one line, leaving room for the `+n`
 * summary when some are left over.
 *
 * Every chip, and the summary, is laid out once more in a hidden row that is
 * never squeezed, so each keeps its natural width whatever the trigger shows.
 * At least one chip is always shown; a label too long for the line on its own
 * is cut with an ellipsis. With no layout to read (a test environment, a
 * hidden field) nothing is dropped beyond `limit`.
 */
function useChipsThatFit(
  chipsRef: { current: HTMLElement | null },
  measureRef: { current: HTMLElement | null },
  count: number,
  limit: number,
  labels: string,
): number {
  const [fit, setFit] = useState(limit)

  const measure = useEventCallback(() => {
    const chips = chipsRef.current
    const row = measureRef.current
    const available = chips?.clientWidth ?? 0
    if (!chips || !row || available === 0) {
      setFit(limit)
      return
    }
    const widths = Array.from(row.children, (child) => child.getBoundingClientRect().width)
    const summary = widths[count] ?? 0
    const gap = Number.parseFloat(getComputedStyle(chips).columnGap) || 0

    let used = 0
    let next = 0
    while (next < limit) {
      const width = used + (next > 0 ? gap : 0) + widths[next]!
      const leftOver = next + 1 < count ? gap + summary : 0
      if (width + leftOver > available) break
      used = width
      next += 1
    }
    setFit(Math.max(1, next))
  })

  useIsomorphicLayoutEffect(() => measure(), [measure, count, limit, labels])

  // The chips row mounts with the first selection, so the observer follows it.
  const hasChips = count > 0
  useEffect(() => {
    const chips = chipsRef.current
    if (!hasChips || !chips || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => measure())
    observer.observe(chips)
    return () => observer.disconnect()
  }, [chipsRef, measure, hasChips])

  return Math.min(fit, limit)
}

/**
 * The same list, for picking several.
 *
 * Selections are chips in the trigger rather than a comma-joined string,
 * because removing one is the operation people actually want and a string
 * makes them clear the whole field and start again.
 *
 * The chips' remove buttons live in a layer stacked over the trigger, as the
 * clear button of `Combobox` does, so none of them is a button inside a button.
 */
export const MultiCombobox = forwardRef<HTMLButtonElement, MultiComboboxProps>(
  function MultiCombobox(
    {
      className,
      options,
      value,
      defaultValue,
      onValueChange,
      selectedOptions = NONE_OPTIONS,
      placeholder = 'Select…',
      searchPlaceholder = 'Search…',
      emptyMessage = 'No matches',
      disabled,
      loading,
      onSearch,
      searchDebounce = 250,
      footer,
      maxChips,
      name,
      ...props
    },
    ref,
  ) {
    const field = useTriggerFieldProps()
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const generatedId = useId()
    const listId = `${props.id ?? field.aria.id ?? generatedId}-list`
    const listName = useListName(props, placeholder)
    const triggerRef = useRef<HTMLButtonElement | null>(null)
    const chipsRef = useRef<HTMLSpanElement | null>(null)
    const measureRef = useRef<HTMLSpanElement | null>(null)
    // Controlled exactly when `value` is defined; `[]` is the empty selection.
    const [selected, setSelected] = useControllableState<string[]>({
      value,
      defaultValue: defaultValue ?? NONE,
      onChange: onValueChange,
    })
    const { remember, lookup } = usePicked()

    useServerSearch(onSearch, query, searchDebounce, open)

    const visible = useFiltered(options, query, !onSearch)
    const chosen = selected.map((entry) => lookup(options, selectedOptions, entry))
    const fit = useChipsThatFit(
      chipsRef,
      measureRef,
      chosen.length,
      Math.min(chosen.length, maxChips ?? Number.POSITIVE_INFINITY),
      chosen.map((option) => option.label).join('\n'),
    )
    const shown = chosen.slice(0, fit)
    const more = chosen.length - shown.length
    const isDisabled = disabled ?? field.disabled

    const toggle = useCallback(
      (candidate: string) => {
        setSelected((previous) =>
          previous.includes(candidate)
            ? previous.filter((entry) => entry !== candidate)
            : [...previous, candidate],
        )
      },
      [setSelected],
    )

    return (
      <>
        <div className="sui-combobox sui-combobox--multi" data-slot="multi-combobox">
          <Popover
            open={open}
            onOpenChange={(next) => {
              setOpen(next)
              if (!next) setQuery('')
            }}
          >
            <PopoverTrigger asChild>
              <button
                ref={(node) => {
                  triggerRef.current = node
                  assignRef(ref, node)
                }}
                type="button"
                role="combobox"
                aria-expanded={open}
                aria-controls={open ? listId : undefined}
                aria-required={field.required}
                className={cn(
                  'sui-combobox__trigger sui-combobox__trigger--multi sui-focusable',
                  className,
                )}
                {...field.aria}
                {...props}
                disabled={isDisabled}
              >
                {chosen.length === 0 ? (
                  <span className="sui-combobox__value sui-combobox__value--empty">
                    {placeholder}
                  </span>
                ) : (
                  <span ref={chipsRef} className="sui-combobox__chips">
                    {shown.map((option) => (
                      <span key={option.value} className="sui-combobox__chip">
                        <span className="sui-combobox__chip-label">{option.label}</span>
                        {/* Room for the remove button in the layer above. */}
                        {isDisabled ? null : (
                          <span
                            className="sui-combobox__chip-remove sui-combobox__ghost"
                            aria-hidden="true"
                          >
                            <CloseIcon />
                          </span>
                        )}
                      </span>
                    ))}
                    {more > 0 ? (
                      <span className="sui-combobox__chip sui-combobox__chip--more">+{more}</span>
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
                listName={listName}
                isSelected={(candidate) => selected.includes(candidate)}
                // The popover stays open: picking several things and having the
                // list close after each one is the classic multi-select annoyance.
                onSelect={(option) => {
                  remember(option)
                  toggle(option.value)
                }}
                onClose={() => setOpen(false)}
              />
            </PopoverContent>
          </Popover>

          {!isDisabled && shown.length > 0 ? (
            <span className="sui-combobox__trigger sui-combobox__trigger--multi sui-combobox__overlay">
              <span className="sui-combobox__chips">
                {shown.map((option) => (
                  <span key={option.value} className="sui-combobox__chip">
                    <span
                      className="sui-combobox__chip-label sui-combobox__ghost"
                      aria-hidden="true"
                    >
                      {option.label}
                    </span>
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={`Remove ${option.label}`}
                      className="sui-combobox__chip-remove"
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={() => {
                        toggle(option.value)
                        triggerRef.current?.focus()
                      }}
                    >
                      <CloseIcon />
                    </button>
                  </span>
                ))}
                {more > 0 ? (
                  <span
                    className="sui-combobox__chip sui-combobox__chip--more sui-combobox__ghost"
                    aria-hidden="true"
                  >
                    +{more}
                  </span>
                ) : null}
              </span>
              <ChevronDownIcon className="sui-combobox__chevron sui-combobox__ghost" />
            </span>
          ) : null}

          {/* Every chip at its natural width, for `useChipsThatFit` to read. */}
          {chosen.length > 0 ? (
            <span
              ref={measureRef}
              className="sui-combobox__chips sui-combobox__measure"
              aria-hidden="true"
            >
              {chosen.map((option) => (
                <span key={option.value} className="sui-combobox__chip">
                  <span className="sui-combobox__chip-label">{option.label}</span>
                  {isDisabled ? null : (
                    <span className="sui-combobox__chip-remove">
                      <CloseIcon />
                    </span>
                  )}
                </span>
              ))}
              <span className="sui-combobox__chip sui-combobox__chip--more">+{chosen.length}</span>
            </span>
          ) : null}
        </div>
        {name
          ? selected.map((entry) => (
              <input key={entry} type="hidden" name={name} value={entry} disabled={isDisabled} />
            ))
          : null}
      </>
    )
  },
)
