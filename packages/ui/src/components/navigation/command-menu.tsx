'use client'

import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cn } from '../../lib/cn'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useEventCallback } from '../../hooks/use-event-callback'
import { SearchIcon } from '../icons/icons'
import { Dialog, DialogContent, DialogTitle } from '../overlay/overlays'

export interface CommandItem {
  /** Unique within `items`. */
  id: string
  /** What the filter matches, and what is shown. */
  label: string
  /** Items with the same group are listed together under that heading, in order of first appearance. */
  group?: string
  icon?: ReactNode
  /** Shown at the end of the row, for example `⌘N`. Text only; the application binds the key. */
  shortcut?: ReactNode
  /** A second line under the label. The filter does not search it. */
  description?: ReactNode
  /** More words the filter matches: synonyms, ids, old names. */
  keywords?: string[]
  disabled?: boolean
  /** Runs when this item is chosen, before the command's `onSelect`. */
  onSelect?: () => void
}

export interface CommandProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  items: CommandItem[]
  /** Any item chosen, by Enter or by click. */
  onSelect?: (item: CommandItem) => void
  /** Controlled search text. */
  query?: string
  defaultQuery?: string
  onQueryChange?: (query: string) => void
  placeholder?: string
  /** Shown when nothing matches. */
  emptyMessage?: ReactNode
  /**
   * Replaces the default filter. The default matches when every word typed
   * appears somewhere in the item's label, group or keywords, ignoring case.
   */
  filter?: (item: CommandItem, query: string) => boolean
  /** What the search announces to screen readers. Defaults to `"1 result"` / `"N results"`. */
  resultsMessage?: (count: number) => string
  /** The search box's accessible name. Defaults to `"Search commands"`. */
  inputLabel?: string
  autoFocus?: boolean
  /** Under the list: key hints, a link to all commands. */
  footer?: ReactNode
}

export function defaultCommandFilter(item: CommandItem, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const haystack = [item.label, item.group ?? '', ...(item.keywords ?? [])].join(' ').toLowerCase()
  return words.every((word) => haystack.includes(word))
}

/**
 * A search box over a list of commands, like the one a command palette opens.
 *
 * The input is a `combobox` that owns a `listbox`. Focus stays in the input
 * while ↑/↓ move the highlighted option, which is linked with
 * `aria-activedescendant`, and Enter runs it. Disabled items are listed but
 * skipped by the arrow keys.
 *
 * This is the inline version, for a page or a popover. `CommandMenu` puts it in
 * a dialog opened with ⌘K / Ctrl+K.
 */
export const Command = forwardRef<HTMLDivElement, CommandProps>(function Command(
  {
    className,
    items,
    onSelect,
    query: queryProp,
    defaultQuery = '',
    onQueryChange,
    placeholder = 'Type a command or search…',
    emptyMessage = 'No results.',
    filter = defaultCommandFilter,
    resultsMessage = (count) => (count === 1 ? '1 result' : `${count} results`),
    inputLabel = 'Search commands',
    autoFocus,
    footer,
    ...props
  },
  ref,
) {
  const baseId = useId()
  const listId = `${baseId}-list`
  const [query, setQuery] = useControllableState({
    value: queryProp,
    defaultValue: defaultQuery,
    onChange: onQueryChange,
  })
  const [activeId, setActiveId] = useState<string | null>(null)
  const optionRefs = useRef(new Map<string, HTMLDivElement>())

  const { groups, ordered } = useMemo(() => {
    const matches = items.filter((item) => filter(item, query))
    const byGroup = new Map<string, CommandItem[]>()
    for (const item of matches) {
      const key = item.group ?? ''
      byGroup.set(key, [...(byGroup.get(key) ?? []), item])
    }
    const grouped = [...byGroup.entries()].map(([heading, entries]) => ({ heading, entries }))
    return { groups: grouped, ordered: grouped.flatMap((group) => group.entries) }
  }, [items, filter, query])

  const enabled = ordered.filter((item) => !item.disabled)
  // The highlighted option is resolved at render: when the filter drops it, the
  // first enabled match takes over instead of nothing being highlighted.
  const active = enabled.find((item) => item.id === activeId) ?? enabled[0]
  const optionId = (item: CommandItem) => `${baseId}-option-${ordered.indexOf(item)}`

  useEffect(() => {
    if (active) optionRefs.current.get(active.id)?.scrollIntoView?.({ block: 'nearest' })
  }, [active])

  const choose = useEventCallback((item: CommandItem | undefined) => {
    if (!item || item.disabled) return
    item.onSelect?.()
    onSelect?.(item)
  })

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (enabled.length === 0) return
      const at = active ? enabled.indexOf(active) : -1
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActiveId(enabled[(at + step + enabled.length) % enabled.length]!.id)
    } else if (event.key === 'Enter') {
      if (event.nativeEvent.isComposing) return
      event.preventDefault()
      choose(active)
    }
  }

  return (
    <div ref={ref} data-slot="command" className={cn('sui-command', className)} {...props}>
      <div className="sui-command__search">
        <SearchIcon className="sui-command__search-icon" aria-hidden="true" />
        <input
          className="sui-command__input"
          role="combobox"
          aria-label={inputLabel}
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active ? optionId(active) : undefined}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActiveId(null)
          }}
          onKeyDown={onKeyDown}
        />
      </div>

      <div id={listId} role="listbox" aria-label={inputLabel} className="sui-command__list">
        {groups.map((group, groupIndex) => {
          const headingId = group.heading ? `${baseId}-group-${groupIndex}` : undefined
          return (
            <div
              key={group.heading || '__ungrouped'}
              role="group"
              aria-labelledby={headingId}
              className="sui-command__group"
            >
              {group.heading ? (
                <div id={headingId} className="sui-command__heading" aria-hidden="true">
                  {group.heading}
                </div>
              ) : null}
              {group.entries.map((item) => (
                <div
                  key={item.id}
                  ref={(node) => {
                    if (node) optionRefs.current.set(item.id, node)
                    else optionRefs.current.delete(item.id)
                  }}
                  id={optionId(item)}
                  role="option"
                  aria-selected={item === active}
                  aria-disabled={item.disabled || undefined}
                  data-highlighted={item === active || undefined}
                  data-disabled={item.disabled || undefined}
                  className="sui-menu__item sui-command__item"
                  // Keeps focus in the input, so typing can carry on after a click.
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseMove={() => {
                    if (!item.disabled && item !== active) setActiveId(item.id)
                  }}
                  onClick={() => choose(item)}
                >
                  {item.icon ? (
                    <span className="sui-command__icon" aria-hidden="true">
                      {item.icon}
                    </span>
                  ) : null}
                  <span className="sui-command__text">
                    <span className="sui-command__label">{item.label}</span>
                    {item.description ? (
                      <span className="sui-command__description">{item.description}</span>
                    ) : null}
                  </span>
                  {item.shortcut ? (
                    <span className="sui-menu__shortcut" aria-hidden="true">
                      {item.shortcut}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {ordered.length === 0 ? <div className="sui-command__empty">{emptyMessage}</div> : null}

      <div role="status" className="sui-visually-hidden">
        {query.trim() ? (ordered.length ? resultsMessage(ordered.length) : '') : ''}
      </div>

      {footer ? <div className="sui-command__footer">{footer}</div> : null}
    </div>
  )
})

/* ------------------------------------------------------------ command menu */

export interface CommandMenuProps extends Omit<CommandProps, 'autoFocus' | 'title'> {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /**
   * The key that opens and closes the menu from anywhere on the page:
   * `'mod+k'` (the default) is ⌘K on a Mac and Ctrl+K elsewhere. Other forms:
   * `'ctrl+shift+p'`, `'/'`. `false` turns it off.
   */
  shortcut?: string | false
  /** The dialog's accessible name. It is not shown. Defaults to `"Command menu"`. */
  title?: string
  /** Close after an item is chosen. Defaults to `true`. */
  closeOnSelect?: boolean
}

/** Whether a key event matches a shortcut such as `'mod+k'`. */
export function matchesShortcut(
  event: Pick<globalThis.KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'>,
  shortcut: string,
): boolean {
  const parts = shortcut
    .toLowerCase()
    .split('+')
    .map((part) => part.trim())
  const key = parts.pop()
  if (!key || event.key.toLowerCase() !== key) return false
  const mod = parts.includes('mod')
  const wants = {
    meta: parts.includes('meta') || parts.includes('cmd'),
    ctrl: parts.includes('ctrl'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt') || parts.includes('option'),
  }
  if (mod && !(event.metaKey || event.ctrlKey)) return false
  if (!mod && (event.metaKey !== wants.meta || event.ctrlKey !== wants.ctrl)) return false
  return event.shiftKey === wants.shift && event.altKey === wants.alt
}

/**
 * A command palette: `Command` in a dialog, opened with ⌘K / Ctrl+K.
 *
 * The search text is cleared each time the menu opens, and choosing an item
 * closes it. Focus goes back to whatever had it before the menu opened. Put a
 * visible button somewhere that opens it too, because a keyboard shortcut
 * cannot be discovered by looking.
 */
export function CommandMenu({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  shortcut = 'mod+k',
  title = 'Command menu',
  closeOnSelect = true,
  onSelect,
  className,
  ...commandProps
}: CommandMenuProps) {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })

  useEffect(() => {
    if (!shortcut) return
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || !matchesShortcut(event, shortcut)) return
      event.preventDefault()
      setOpen((current) => !current)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [shortcut, setOpen])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        hideClose
        aria-describedby={undefined}
        data-slot="command-menu"
        className="sui-command-dialog"
      >
        <DialogTitle className="sui-visually-hidden">{title}</DialogTitle>
        <Command
          className={className}
          {...commandProps}
          onSelect={(item) => {
            onSelect?.(item)
            if (closeOnSelect) setOpen(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
