import { isValidElement, type MouseEvent, type ReactNode } from 'react'
import type { AccentTone } from './tone'

/*
 * The sidebar's data model and the pure functions over it: find the current
 * page from a URL, the trail down to it, what a search keeps. No React state
 * here, so each is testable on a plain array and reusable for breadcrumbs.
 */

export interface SidebarNavItem {
  type?: 'item'
  /** Unique across the whole tree: it keys expansion, activity and search. */
  id: string
  label: ReactNode
  icon?: ReactNode
  href?: string
  /** Opens in a new tab, and says so. */
  external?: boolean
  badge?: ReactNode
  badgeTone?: AccentTone
  disabled?: boolean
  /** Plain text for search and the rail tooltip when `label` is not a string. */
  title?: string
  /** More words search should match: synonyms, old names, codes. */
  keywords?: string[]
  /** Controls revealed on hover — a "+" to create one, a "…" menu. */
  actions?: ReactNode
  onSelect?: (item: SidebarNavItem, event: MouseEvent<HTMLElement>) => void
  /** Nested destinations. Any depth. */
  children?: SidebarNavItem[]
}

export interface SidebarNavSection {
  type: 'section'
  id: string
  label?: ReactNode
  icon?: ReactNode
  /** Colours the section's icon. */
  tone?: AccentTone
  collapsible?: boolean
  defaultCollapsed?: boolean
  /** A control at the end of the heading. */
  action?: ReactNode
  items: SidebarNavItem[]
}

export interface SidebarNavSeparator {
  type: 'separator'
  id?: string
}

export type SidebarNavEntry = SidebarNavItem | SidebarNavSection | SidebarNavSeparator

export function isSection(entry: SidebarNavEntry): entry is SidebarNavSection {
  return entry.type === 'section'
}

export function isSeparator(entry: SidebarNavEntry): entry is SidebarNavSeparator {
  return entry.type === 'separator'
}

/** Every item in the tree, depth first, with the chain of items above it. */
export function walk(
  entries: readonly SidebarNavEntry[],
  visit: (item: SidebarNavItem, ancestors: SidebarNavItem[]) => void,
) {
  const descend = (items: readonly SidebarNavItem[], ancestors: SidebarNavItem[]) => {
    for (const item of items) {
      visit(item, ancestors)
      if (item.children?.length) descend(item.children, [...ancestors, item])
    }
  }
  for (const entry of entries) {
    if (isSeparator(entry)) continue
    if (isSection(entry)) descend(entry.items, [])
    else descend([entry], [])
  }
}

/**
 * The items from the top of the tree down to `id`, inclusive — a breadcrumb,
 * a page title, a "back to" link. Empty when `id` is not in the tree.
 */
export function getSidebarTrail(
  entries: readonly SidebarNavEntry[],
  id: string | undefined,
): SidebarNavItem[] {
  if (!id) return []
  let trail: SidebarNavItem[] = []
  walk(entries, (item, ancestors) => {
    if (item.id === id) trail = [...ancestors, item]
  })
  return trail
}

/**
 * The comparable part of a URL: no origin, query, fragment or trailing slash.
 * `https://app.test/orders/?page=2` and `/orders` are the same place. A
 * hash route (`#/orders`) is a path in its own right, so it keeps its path.
 */
function stripPath(path: string): string {
  let rest = path.trim()
  const origin = /^[a-z][a-z\d+.-]*:\/\/[^/?#]*/i.exec(rest)
  if (origin) rest = rest.slice(origin[0].length) || '/'
  if (rest.startsWith('#')) rest = rest.slice(1)
  const bare = rest.split(/[?#]/)[0] ?? ''
  return bare.length > 1 ? bare.replace(/\/+$/, '') || '/' : bare
}

/**
 * The id of the item a URL path belongs to: an exact `href`, or else the
 * longest one the path sits under, so `/orders/1042/edit` lights up "Orders".
 */
export function matchSidebarPath(
  entries: readonly SidebarNavEntry[],
  path: string | undefined,
): string | undefined {
  if (!path) return undefined
  const current = stripPath(path)
  if (!current) return undefined
  let best: { id: string; length: number } | undefined
  walk(entries, (item) => {
    if (!item.href || item.external) return
    const href = stripPath(item.href)
    // `#` and `?tab=2` name no path: they would otherwise match every page.
    if (!href) return
    const under =
      href === '/' ? current === '/' : current === href || current.startsWith(`${href}/`)
    if (under && (!best || href.length > best.length)) best = { id: item.id, length: href.length }
  })
  return best?.id
}

export function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children)
  return ''
}

export function initialOf(node: ReactNode): string {
  return textOf(node).trim().charAt(0).toUpperCase()
}

export interface FilterResult {
  entries: SidebarNavEntry[]
  /** Items kept only because something under them matched — shown open. */
  open: Set<string>
  count: number
}

export function filterEntries(entries: readonly SidebarNavEntry[], query: string): FilterResult {
  const needle = query.trim().toLowerCase()
  const open = new Set<string>()
  let count = 0

  const matches = (item: SidebarNavItem) =>
    [item.title ?? textOf(item.label), ...(item.keywords ?? [])].some((text) =>
      text.toLowerCase().includes(needle),
    )

  const filterItems = (items: readonly SidebarNavItem[]): SidebarNavItem[] =>
    items.flatMap((item) => {
      if (matches(item)) {
        count += 1
        // A matching branch keeps everything under it: finding "Residential"
        // is usually the way to what is inside it.
        return [item]
      }
      const children = item.children ? filterItems(item.children) : []
      if (!children.length) return []
      open.add(item.id)
      return [{ ...item, children }]
    })

  const kept = entries.flatMap<SidebarNavEntry>((entry) => {
    if (isSeparator(entry)) return []
    if (isSection(entry)) {
      if (textOf(entry.label).toLowerCase().includes(needle)) {
        count += 1
        return [entry]
      }
      const items = filterItems(entry.items)
      return items.length ? [{ ...entry, items }] : []
    }
    return filterItems([entry])
  })

  return { entries: kept, open, count }
}
