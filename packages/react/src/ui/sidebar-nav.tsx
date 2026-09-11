import {
  Children,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react'
import { cn } from '../lib/cn'
import { ChevronDownIcon, CloseIcon, ExternalLinkIcon, SearchIcon } from '../lib/icons'
import {
  filterEntries,
  getSidebarTrail,
  initialOf,
  isSection,
  isSeparator,
  matchSidebarPath,
  walk,
  type SidebarNavEntry,
  type SidebarNavItem,
} from '../lib/sidebar-tree'
import { toneClass, type AccentTone } from '../lib/tone'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover'
import { Tooltip } from '../primitives/tooltip'
import { useHydrated } from '../lib/use-hydrated'
import {
  FlyoutContext,
  RailContext,
  SidebarContext,
  isStringArray,
  readStored,
  useRail,
  writeStored,
} from './sidebar-context'

/*
 * The sidebar's navigation: the data-driven `SidebarNav`, and the
 * `SidebarSection` / `SidebarMenuItem` parts it renders with.
 */

function highlight(label: ReactNode, query: string): ReactNode {
  const needle = query.trim()
  if (!needle || typeof label !== 'string') return label
  const at = label.toLowerCase().indexOf(needle.toLowerCase())
  if (at < 0) return label
  return (
    <>
      {label.slice(0, at)}
      <mark className="sui-sidebar-mark">{label.slice(at, at + needle.length)}</mark>
      {label.slice(at + needle.length)}
    </>
  )
}

/* ---------------------------------------------------------------------- nav */

export interface SidebarLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  children: ReactNode
}

interface NavContextValue {
  isExpanded: (id: string) => boolean
  setExpanded: (id: string, open: boolean) => void
  trail: ReadonlySet<string>
  /** A search is narrowing the tree: every section shows, collapsible or not. */
  searching: boolean
  renderLink?: (props: SidebarLinkProps) => ReactNode
}

const NavContext = createContext<NavContextValue | null>(null)

export interface SidebarNavProps extends Omit<HTMLAttributes<HTMLElement>, 'onSelect'> {
  /** The tree. Items, sections of items, separators — nested as deep as you like. */
  items?: readonly SidebarNavEntry[]
  /** The current destination, by id. */
  activeId?: string
  /**
   * Or the current URL path: the item with the matching (or longest enclosing)
   * `href` becomes active. `activeId` wins when both are given.
   */
  currentPath?: string
  /** Controlled open branches, by item id. */
  expanded?: string[]
  defaultExpanded?: string[]
  onExpandedChange?: (expanded: string[]) => void
  /** Opening a branch closes its siblings. */
  accordion?: boolean
  /** A filter box above the tree. */
  searchable?: boolean
  searchPlaceholder?: string
  /** Shown when the filter matches nothing. */
  emptyMessage?: ReactNode
  /**
   * Render links with your router — `(props) => <Link to={props.href} {...props} />`.
   * Receives every prop the default `<a>` would have had.
   */
  renderLink?: (props: SidebarLinkProps) => ReactNode
  /** Any item chosen — for a state-driven app, analytics, closing things. */
  onSelect?: (item: SidebarNavItem, event: MouseEvent<HTMLElement>) => void
}

/**
 * The navigation tree.
 *
 * Give it `items` and it renders sections, sub-lists and the current page; the
 * branch holding the current page opens by itself. Give it `children` and it
 * is a container for hand-written `SidebarSection`s — or both, and the
 * children follow the generated tree.
 *
 * Keyboard: Tab moves through the controls as usual; ↑/↓ step through the
 * visible items, → opens a branch or enters it, ← closes it or goes up to its
 * parent, Home/End jump to the ends.
 */
export const SidebarNav = forwardRef<HTMLElement, SidebarNavProps>(function SidebarNav(
  {
    className,
    items = EMPTY_ENTRIES,
    activeId: activeIdProp,
    currentPath,
    expanded: expandedProp,
    defaultExpanded,
    onExpandedChange,
    accordion = false,
    searchable = false,
    searchPlaceholder = 'Search…',
    emptyMessage = 'Nothing matches',
    renderLink,
    onSelect,
    onKeyDown,
    children,
    'aria-label': ariaLabel = 'Main',
    ...props
  },
  ref,
) {
  const sidebar = useContext(SidebarContext)
  const storageKey = sidebar?.storageKey && `${sidebar.storageKey}:expanded`
  const [query, setQuery] = useState('')

  const activeId = activeIdProp ?? matchSidebarPath(items, currentPath)
  const trailItems = useMemo(() => getSidebarTrail(items, activeId), [items, activeId])
  // Keyed by content: an inline `items` array is a new tree on every render,
  // and the effect below must fire when the current page moves, not per render.
  const trailKey = JSON.stringify(trailItems.slice(0, -1).map((item) => item.id))
  const trail = useMemo(() => new Set<string>(JSON.parse(trailKey) as string[]), [trailKey])

  // Which items share a parent, for accordion mode.
  const siblingsOf = useMemo(() => {
    const byParent = new Map<string, string[]>()
    const parentOf = new Map<string, string>()
    walk(items, (item, ancestors) => {
      const parent = ancestors.at(-1)?.id ?? ''
      parentOf.set(item.id, parent)
      byParent.set(parent, [...(byParent.get(parent) ?? []), item.id])
    })
    return (id: string) => byParent.get(parentOf.get(id) ?? '') ?? []
  }, [items])

  // `undefined` until the first change. Until then: what was remembered — read
  // only once hydrated, so server HTML and the first client render agree — or
  // `defaultExpanded`, with the current page's branch open either way.
  const [expandedState, setExpandedState] = useState<string[]>()
  const hydrated = useHydrated()
  // The trail at mount; a later page's branch is opened by the effect below.
  const mountTrail = useRef(trail).current
  const initialExpanded = useMemo(() => {
    const initial = (hydrated && readStored(storageKey, isStringArray)) || defaultExpanded || []
    return [...new Set([...initial, ...mountTrail])]
    // `defaultExpanded` is read once, like any `default*` prop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, storageKey, mountTrail])
  const expanded = expandedProp ?? expandedState ?? initialExpanded
  const expandedRef = useRef(expanded)
  expandedRef.current = expanded

  const commit = useCallback(
    (next: string[]) => {
      if (expandedProp === undefined) {
        setExpandedState(next)
        writeStored(storageKey, next)
      }
      onExpandedChange?.(next)
    },
    [expandedProp, onExpandedChange, storageKey],
  )

  // A new current page opens the branch it is in — but only once, so the
  // user can still close it again afterwards.
  useEffect(() => {
    const missing = [...trail].filter((id) => !expandedRef.current.includes(id))
    if (missing.length) commit([...expandedRef.current, ...missing])
    // `commit` changes identity with `onExpandedChange`; the trail is the trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trail])

  const filtered = useMemo(
    () => (query.trim() ? filterEntries(items, query) : null),
    [items, query],
  )

  const setExpanded = useCallback(
    (id: string, open: boolean) => {
      const current = expandedRef.current
      if (open === current.includes(id)) return
      if (!open) return commit(current.filter((value) => value !== id))
      const closing = accordion ? new Set(siblingsOf(id)) : new Set<string>()
      commit([...current.filter((value) => !closing.has(value)), id])
    },
    [accordion, commit, siblingsOf],
  )

  const navContext = useMemo<NavContextValue>(
    () => ({
      isExpanded: (id) => (filtered ? filtered.open.has(id) : false) || expanded.includes(id),
      setExpanded,
      trail,
      searching: !!filtered,
      renderLink,
    }),
    [expanded, filtered, setExpanded, trail, renderLink],
  )

  const renderItem = (item: SidebarNavItem): ReactNode => (
    <SidebarMenuItem
      key={item.id}
      value={item.id}
      label={highlight(item.label, query)}
      title={item.title ?? (typeof item.label === 'string' ? item.label : undefined)}
      icon={item.icon}
      href={item.href}
      external={item.external}
      badge={item.badge}
      badgeTone={item.badgeTone}
      disabled={item.disabled}
      actions={item.actions}
      active={item.id === activeId}
      onSelect={(event) => {
        item.onSelect?.(item, event)
        onSelect?.(item, event)
      }}
    >
      {item.children?.length ? item.children.map(renderItem) : undefined}
    </SidebarMenuItem>
  )

  const entries = filtered?.entries ?? items
  const blocks: ReactNode[] = []
  let loose: SidebarNavItem[] = []
  const flush = () => {
    if (!loose.length) return
    blocks.push(<SidebarMenu key={`menu-${loose[0]!.id}`}>{loose.map(renderItem)}</SidebarMenu>)
    loose = []
  }
  entries.forEach((entry, index) => {
    if (isSeparator(entry)) {
      flush()
      blocks.push(<hr key={entry.id ?? `separator-${index}`} className="sui-sidebar-separator" />)
    } else if (isSection(entry)) {
      flush()
      blocks.push(
        <SidebarSection
          key={entry.id}
          label={entry.label ? highlight(entry.label, query) : undefined}
          icon={entry.icon}
          tone={entry.tone}
          collapsible={entry.collapsible}
          defaultCollapsed={entry.defaultCollapsed}
          action={entry.action}
        >
          {entry.items.map(renderItem)}
        </SidebarSection>,
      )
    } else {
      loose.push(entry)
    }
  })
  flush()

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event)
    if (!event.defaultPrevented) moveFocus(event)
  }

  return (
    <nav
      ref={ref}
      data-slot="sidebar-nav"
      aria-label={ariaLabel}
      className={cn('sui-sidebar-nav', className)}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {searchable ? (
        <SidebarSearch value={query} onValueChange={setQuery} placeholder={searchPlaceholder} />
      ) : null}
      <NavContext.Provider value={navContext}>
        {blocks}
        {children}
      </NavContext.Provider>
      {filtered && filtered.count === 0 ? (
        <p className="sui-sidebar-nav__empty" role="status">
          {emptyMessage}
        </p>
      ) : null}
    </nav>
  )
})

const EMPTY_ENTRIES: readonly SidebarNavEntry[] = []

/** Arrow-key movement through whatever is visible, read from the DOM. */
function moveFocus(event: KeyboardEvent<HTMLElement>) {
  const target = event.target as HTMLElement
  // React bubbles events through portals, so keys pressed in a rail flyout, or
  // in a menu or popover an item's `actions` opened, arrive here too. A flyout
  // is navigated within itself; anything else portalled is not ours to steer.
  const nav = target.closest<HTMLElement>('[data-sidebar-flyout]') ?? event.currentTarget
  if (!nav.contains(target)) return
  const inInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
  if (inInput && !(event.key === 'ArrowDown' && target.hasAttribute('data-sidebar-focus'))) return

  const focusables = Array.from(nav.querySelectorAll<HTMLElement>('[data-sidebar-focus]')).filter(
    (el) => !(el as HTMLButtonElement).disabled,
  )
  const index = focusables.indexOf(target)
  const rtl = getComputedStyle(nav).direction === 'rtl'
  const forward = rtl ? 'ArrowLeft' : 'ArrowRight'
  const back = rtl ? 'ArrowRight' : 'ArrowLeft'
  const focus = (el: HTMLElement | null | undefined) => {
    if (!el) return
    event.preventDefault()
    el.focus()
  }

  if (event.key === 'ArrowDown') return focus(focusables[index + 1] ?? focusables[0])
  if (event.key === 'ArrowUp') return focus(focusables[index - 1] ?? focusables.at(-1))
  if (event.key === 'Home') return focus(focusables[0])
  if (event.key === 'End') return focus(focusables.at(-1))
  if (index < 0 || (event.key !== forward && event.key !== back)) return

  const item = target.closest<HTMLElement>('[data-sidebar-item]')
  if (!item) return
  const toggle = item.querySelector<HTMLElement>(
    ':scope > .sui-sidebar-item__row [data-sidebar-toggle]',
  )
  const isOpen = item.hasAttribute('data-expanded')

  if (event.key === forward) {
    if (!toggle) return
    event.preventDefault()
    if (!isOpen) return toggle.click()
    return focus(item.querySelector<HTMLElement>(':scope > ul [data-sidebar-focus]'))
  }
  if (isOpen && toggle) {
    event.preventDefault()
    return toggle.click()
  }
  const parent = item.parentElement?.closest<HTMLElement>('[data-sidebar-item]')
  focus(parent?.querySelector<HTMLElement>(':scope > .sui-sidebar-item__row [data-sidebar-focus]'))
}

/* ------------------------------------------------------------------- search */

interface SidebarSearchProps {
  value: string
  onValueChange: (value: string) => void
  placeholder: string
}

function SidebarSearch({ value, onValueChange, placeholder }: SidebarSearchProps) {
  const sidebar = useContext(SidebarContext)
  const rail = useRail()
  const inputRef = useRef<HTMLInputElement>(null)
  const focusOnExpand = useRef(false)

  useEffect(() => {
    if (!rail && focusOnExpand.current) {
      focusOnExpand.current = false
      inputRef.current?.focus()
    }
  }, [rail])

  if (rail) {
    // No room for a field in the rail: the icon widens the sidebar and puts
    // the caret in the box it just made room for.
    return (
      <div className="sui-sidebar-search">
        <button
          type="button"
          className="sui-sidebar-item__link sui-focusable"
          data-sidebar-focus=""
          aria-label={placeholder.replace(/…$/, '')}
          onClick={() => {
            focusOnExpand.current = true
            sidebar?.setCollapsed(false)
          }}
        >
          <span className="sui-sidebar-item__icon">
            <SearchIcon />
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className="sui-sidebar-search">
      <label className="sui-sidebar-search__field">
        <SearchIcon className="sui-sidebar-search__icon" />
        <input
          ref={inputRef}
          type="search"
          value={value}
          placeholder={placeholder}
          aria-label={placeholder.replace(/…$/, '')}
          data-sidebar-focus=""
          className="sui-sidebar-search__input"
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && value) {
              event.preventDefault()
              onValueChange('')
            }
          }}
        />
        {value ? (
          <button
            type="button"
            className="sui-sidebar-search__clear sui-focusable"
            aria-label="Clear search"
            onClick={() => {
              onValueChange('')
              inputRef.current?.focus()
            }}
          >
            <CloseIcon />
          </button>
        ) : null}
      </label>
    </div>
  )
}

/* ------------------------------------------------------------------ section */

export interface SidebarSectionProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  label?: ReactNode
  icon?: ReactNode
  /** Colours the icon — one hue per product area. */
  tone?: AccentTone
  /** The heading becomes a button that folds the section away. */
  collapsible?: boolean
  defaultCollapsed?: boolean
  /** A control at the end of the heading, e.g. a "+". */
  action?: ReactNode
}

/**
 * A labelled group of items: a product area, a module, a team.
 *
 * In the rail the heading has no room and becomes a rule, and a folded
 * section opens — a rail with a whole area missing from it is a dead end.
 */
export const SidebarSection = forwardRef<HTMLDivElement, SidebarSectionProps>(
  function SidebarSection(
    {
      className,
      label,
      icon,
      tone,
      collapsible = false,
      defaultCollapsed = false,
      action,
      children,
      ...props
    },
    ref,
  ) {
    const nav = useContext(NavContext)
    const rail = useRail()
    const [openState, setOpen] = useState(!defaultCollapsed)
    const open = !collapsible || rail || !!nav?.searching || openState
    const headingId = useId()
    const listId = useId()

    const heading = (
      <>
        {icon ? (
          <span className="sui-sidebar-section__icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className="sui-sidebar-section__text">{label}</span>
        {collapsible ? <ChevronDownIcon className="sui-sidebar-section__chevron" /> : null}
      </>
    )

    return (
      <div
        ref={ref}
        data-slot="sidebar-section"
        data-collapsed={!open || undefined}
        className={cn('sui-sidebar-section', tone && toneClass(tone), className)}
        {...props}
      >
        {label ? (
          <div className="sui-sidebar-section__header">
            {collapsible ? (
              <button
                type="button"
                id={headingId}
                className="sui-sidebar-section__label sui-focusable"
                data-sidebar-focus=""
                aria-expanded={open}
                aria-controls={open ? listId : undefined}
                onClick={() => setOpen((value) => !value)}
              >
                {heading}
              </button>
            ) : (
              <p id={headingId} className="sui-sidebar-section__label">
                {heading}
              </p>
            )}
            {action ? <span className="sui-sidebar-section__action">{action}</span> : null}
          </div>
        ) : null}
        {open ? (
          <ul
            id={listId}
            className="sui-sidebar-menu"
            aria-labelledby={label ? headingId : undefined}
          >
            {children}
          </ul>
        ) : null}
      </div>
    )
  },
)

/** A bare list of items, for items that belong to no section. */
export const SidebarMenu = forwardRef<HTMLUListElement, HTMLAttributes<HTMLUListElement>>(
  function SidebarMenu({ className, ...props }, ref) {
    return (
      <ul
        ref={ref}
        data-slot="sidebar-menu"
        className={cn('sui-sidebar-menu', className)}
        {...props}
      />
    )
  },
)

/* --------------------------------------------------------------------- item */

export interface SidebarMenuItemProps extends Omit<
  HTMLAttributes<HTMLLIElement>,
  'title' | 'onSelect'
> {
  /**
   * A stable key. Inside `SidebarNav` it lets the nav keep this branch's open
   * state (and remember it with `storageKey`); without one the item keeps its
   * own.
   */
  value?: string
  label: ReactNode
  icon?: ReactNode
  href?: string
  external?: boolean
  /** The current page: `aria-current="page"`. */
  active?: boolean
  badge?: ReactNode
  badgeTone?: AccentTone
  disabled?: boolean
  /** Revealed on hover and focus. */
  actions?: ReactNode
  /** Plain-text label for the rail tooltip and the native title. */
  title?: string
  /** Controlled open state of this branch. */
  expanded?: boolean
  defaultExpanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  /** The item was chosen. Not called for a branch that only opens. */
  onSelect?: (event: MouseEvent<HTMLElement>) => void
  /** Nested `SidebarMenuItem`s — this item becomes a branch. Any depth. */
  children?: ReactNode
}

/**
 * One destination, or a branch of them.
 *
 * With `children` it is a branch: a button that opens a sub-list, or — when it
 * also has an `href` — a link with its own open/close button beside it. Nest
 * `SidebarMenuItem`s inside it to any depth; each level indents along a guide
 * line so deep trees stay readable.
 *
 * In the rail a leaf shows its icon with the label as a tooltip, and a branch
 * opens its sub-tree in a flyout, so nothing is out of reach while collapsed.
 */
export const SidebarMenuItem = forwardRef<HTMLLIElement, SidebarMenuItemProps>(
  function SidebarMenuItem(
    {
      className,
      value,
      label,
      icon,
      href,
      external = false,
      active = false,
      badge,
      badgeTone,
      disabled = false,
      actions,
      title,
      expanded: expandedProp,
      defaultExpanded = false,
      onExpandedChange,
      onSelect,
      children,
      ...props
    },
    ref,
  ) {
    const nav = useContext(NavContext)
    const sidebar = useContext(SidebarContext)
    const closeFlyout = useContext(FlyoutContext)
    const rail = useRail()
    const subId = useId()
    const [localOpen, setLocalOpen] = useState(defaultExpanded)
    const [flyoutOpen, setFlyoutOpen] = useState(false)

    const hasChildren = Children.toArray(children).some(Boolean)
    const managed = nav !== null && value !== undefined
    const open =
      hasChildren && !rail && (expandedProp ?? (managed ? nav.isExpanded(value) : localOpen))
    const inTrail = managed && nav.trail.has(value)

    const setOpen = (next: boolean) => {
      if (expandedProp === undefined) {
        if (managed) nav.setExpanded(value, next)
        else setLocalOpen(next)
      }
      onExpandedChange?.(next)
    }

    const choose = (event: MouseEvent<HTMLElement>) => {
      onSelect?.(event)
      if (event.defaultPrevented) return
      closeFlyout?.()
      if (sidebar?.isMobile) sidebar.setMobileOpen(false)
    }

    const plainLabel = title ?? (typeof label === 'string' ? label : undefined)
    const iconNode = icon ?? (rail ? initialOf(label) : null)
    const content = (
      <>
        {iconNode ? (
          <span className="sui-sidebar-item__icon" aria-hidden="true">
            {iconNode}
          </span>
        ) : null}
        <span className="sui-sidebar-item__label">{label}</span>
        {external ? (
          <>
            <ExternalLinkIcon className="sui-sidebar-item__external" />
            <span className="sui-visually-hidden"> (opens in a new tab)</span>
          </>
        ) : null}
        {badge !== undefined && badge !== null ? (
          <span className={cn('sui-sidebar-item__badge', badgeTone && toneClass(badgeTone))}>
            {badge}
          </span>
        ) : null}
      </>
    )
    const chevron = <ChevronDownIcon className="sui-sidebar-item__chevron" />

    const linkClass = cn(
      'sui-sidebar-item__link sui-focusable',
      hasChildren && href && !rail && 'sui-sidebar-item__link--split',
    )
    const common = {
      className: linkClass,
      'data-sidebar-focus': '',
      'aria-current': active ? ('page' as const) : undefined,
      title: rail ? undefined : plainLabel,
    }

    let row: ReactElement
    if (disabled) {
      row = (
        <button type="button" {...common} disabled>
          {content}
        </button>
      )
    } else if (hasChildren && rail) {
      // In the rail a branch is a flyout trigger; the popover supplies the ARIA.
      row = (
        <button type="button" {...common} aria-label={plainLabel}>
          {content}
        </button>
      )
    } else if (href) {
      const linkProps: SidebarLinkProps = {
        ...common,
        href,
        children: content,
        ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : null),
        onClick: (event) => {
          if (hasChildren && !open) setOpen(true)
          choose(event)
        },
      }
      row = nav?.renderLink ? (nav.renderLink(linkProps) as ReactElement) : <a {...linkProps} />
    } else if (hasChildren) {
      row = (
        <button
          type="button"
          {...common}
          data-sidebar-toggle=""
          aria-expanded={open}
          aria-controls={open ? subId : undefined}
          onClick={() => setOpen(!open)}
        >
          {content}
          {chevron}
        </button>
      )
    } else {
      row = (
        <button type="button" {...common} onClick={choose}>
          {content}
        </button>
      )
    }

    if (rail && hasChildren && !disabled) {
      row = (
        <Popover open={flyoutOpen} onOpenChange={setFlyoutOpen}>
          <PopoverTrigger asChild data-sidebar-toggle="">
            {row}
          </PopoverTrigger>
          <PopoverContent
            side="right"
            align="start"
            sideOffset={10}
            className="sui-sidebar-flyout"
            data-sidebar-flyout=""
          >
            <p className="sui-sidebar-flyout__title">{label}</p>
            <RailContext.Provider value={false}>
              <FlyoutContext.Provider value={() => setFlyoutOpen(false)}>
                <ul className="sui-sidebar-sub sui-sidebar-sub--flyout">
                  {/* In the rail the row is the flyout's trigger, so a branch
                      that is also a page is reached from in here. */}
                  {href ? (
                    <FlyoutPageLink
                      label={label}
                      title={plainLabel}
                      icon={icon}
                      href={href}
                      external={external}
                      active={active}
                      onSelect={onSelect}
                    />
                  ) : null}
                  {children}
                </ul>
              </FlyoutContext.Provider>
            </RailContext.Provider>
          </PopoverContent>
        </Popover>
      )
    } else if (rail && plainLabel) {
      row = (
        <Tooltip content={plainLabel} side="right" delayDuration={0}>
          {row}
        </Tooltip>
      )
    }

    return (
      <li
        ref={ref}
        data-slot="sidebar-menu-item"
        data-sidebar-item=""
        data-expandable={hasChildren || undefined}
        data-expanded={open || undefined}
        data-active-trail={inTrail || undefined}
        className={cn('sui-sidebar-item', className)}
        {...props}
      >
        <div className="sui-sidebar-item__row">
          {row}
          {actions && !rail ? <span className="sui-sidebar-item__actions">{actions}</span> : null}
          {hasChildren && href && !rail && !disabled ? (
            <button
              type="button"
              className="sui-sidebar-item__toggle sui-focusable"
              data-sidebar-toggle=""
              aria-expanded={open}
              aria-controls={open ? subId : undefined}
              aria-label={`${open ? 'Collapse' : 'Expand'} ${plainLabel ?? 'section'}`}
              onClick={() => setOpen(!open)}
            >
              {chevron}
            </button>
          ) : null}
        </div>
        {open ? (
          <ul id={subId} className="sui-sidebar-sub">
            {children}
          </ul>
        ) : null}
      </li>
    )
  },
)

/**
 * A branch's own page, as the first entry of its rail flyout. Declared out
 * here because inside `SidebarMenuItem`'s render function that name is the
 * bare render function, not the `forwardRef` component.
 */
function FlyoutPageLink(props: SidebarMenuItemProps) {
  return <SidebarMenuItem {...props} />
}
