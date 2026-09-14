# Sidebar

The application sidebar. It has a pinned header and footer and a scrolling navigation tree. It collapses to an icon rail on wide screens and becomes a modal drawer on narrow ones. `SidebarNav` builds the tree from data, marks the current page and opens the branch that holds it. `SidebarSection` and `SidebarMenuItem` are the parts it renders with, and you can also use them by hand.

```tsx
import {
  Sidebar,
  SidebarNav,
  SidebarProvider,
  SidebarTrigger,
} from '@shining-technologies/ui' // or '@shining-technologies/ui/sidebar'
```

**Server and client.** `Sidebar`, `SidebarProvider`, `SidebarNav`, `SidebarSection`, `SidebarMenu`, `SidebarMenuItem`, `SidebarBrand`, `SidebarUser`, `SidebarTrigger` and `useSidebar` are client components: their source files start with `'use client'`. You can render them from a Server Component as long as every prop is serialisable. Props that take functions (`renderLink`, `onSelect`, `onCollapsedChange`, …) and item trees with an `onSelect` must be passed from a client component. The tree helpers `getSidebarTrail` and `matchSidebarPath` have no directive and no React state, so you can call them in Server Components and route handlers.

- [Quick start](#quick-start)
- [Sidebar](#sidebar-1)
- [SidebarProvider](#sidebarprovider)
- [useSidebar](#usesidebar)
- [Icon rail](#icon-rail)
- [Mobile drawer](#mobile-drawer)
- [Persistence](#persistence)
- [SidebarNav](#sidebarnav)
- [Tree helpers](#tree-helpers)
- [SidebarSection](#sidebarsection)
- [SidebarMenu](#sidebarmenu)
- [SidebarMenuItem](#sidebarmenuitem)
- [SidebarBrand](#sidebarbrand)
- [SidebarUser](#sidebaruser)
- [SidebarTrigger](#sidebartrigger)
- [Types](#types)

## Quick start

```tsx
// app/app-sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  InboxIcon,
  LayoutIcon,
  Sidebar,
  SidebarBrand,
  SidebarNav,
  SidebarUser,
  type SidebarNavEntry,
} from '@shining-technologies/ui'

const items: SidebarNavEntry[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/', icon: <LayoutIcon /> },
  {
    type: 'section',
    id: 'sales',
    label: 'Sales',
    items: [
      {
        id: 'orders',
        label: 'Orders',
        href: '/orders',
        icon: <InboxIcon />,
        badge: 12,
        children: [
          { id: 'orders-open', label: 'Open', href: '/orders/open' },
          { id: 'orders-closed', label: 'Closed', href: '/orders/closed' },
        ],
      },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar
      renderLink={(props) => <Link {...props} />}
      header={<SidebarBrand name="Acme" description="Production" href="/" />}
      footer={<SidebarUser name="Ana Ortiz" description="ana@example.com" />}
    >
      <SidebarNav items={items} currentPath={pathname} searchable />
    </Sidebar>
  )
}
```

To put the sidebar inside the application frame with a trigger in the page header, see [Layout](./layout.md#a-complete-nextjs-layout).

## Sidebar

The sidebar panel, with a pinned `header`, a scrolling body (`children`) and a pinned `footer`. Inside an `AppShell` it takes the sidebar column and sizes that column itself, so collapsing to the rail animates the width. Below the mobile breakpoint it leaves the grid and becomes a drawer.

If no `SidebarProvider` is above it, `Sidebar` creates one from its own provider props (`collapsed`, `defaultCollapsed`, `onCollapsedChange`, `mobileOpen`, `onMobileOpenChange`, `mobileBreakpoint`, `storageKey`, `shortcut`). Use an explicit `SidebarProvider` when a control outside the sidebar, such as a `SidebarTrigger` in the page header, needs the sidebar's state.

> [!IMPORTANT]
> With a `SidebarProvider` above it, the provider owns the state. `Sidebar` ignores its own provider props and, in development, logs a `console.warn` naming them. Set them on the provider. `nonce`, `renderLink` and the other panel props always apply.

```tsx
<Sidebar
  width="17rem"
  appearance="primary"
  storageKey="acme-sidebar"
  shortcut="b"
  header={<SidebarBrand name="Acme" />}
>
  <SidebarNav items={items} currentPath="/orders" />
</Sidebar>
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `header` | `ReactNode` | — | Pinned above the scrolling area, for example `SidebarBrand` or a workspace switcher. |
| `footer` | `ReactNode` | — | Pinned below the scrolling area, for example `SidebarUser`, a version string or a help link. |
| `children` | `ReactNode` | — | The scrolling body, usually a `SidebarNav`. |
| `width` | `string` | `16rem` (from CSS) | Full width, as any CSS length. Sets `--sui-sidebar-width` on the panel. |
| `railWidth` | `string` | `3.75rem` (from CSS) | Icon-rail width. Sets `--sui-sidebar-rail-width` on the panel. |
| `appearance` | `'subtle' \| 'primary'` | `'subtle'` | How the current page is marked. `subtle` uses a neutral fill (`--sidebar-accent`). `primary` tints it with `--sidebar-primary`. |
| `aria-label` | `string` | `'Sidebar'` as a column | The accessible name. As the open drawer, the name comes from this prop, else the `SidebarBrand` in the sidebar, else `'Navigation'`. |
| `nonce` | `string` | — | Content-Security-Policy nonce for the `<style>` element rendered into server HTML when `mobileBreakpoint` is not the default. Applies with or without a `SidebarProvider`. See [Content-Security-Policy](#content-security-policy). |
| `renderLink` | `(props: SidebarLinkProps) => ReactNode` | — | Render links with your router: the `SidebarBrand` and `SidebarUser` links in this sidebar, and every `SidebarNav` inside without its own `renderLink`. See [renderLink](#renderlink). |
| `collapsed` | `boolean` | — | Controlled rail state. Ignored, with a development warning, when a `SidebarProvider` is above. |
| `defaultCollapsed` | `boolean` | `false` | Initial rail state while uncontrolled. Ignored, with a development warning, when a `SidebarProvider` is above. |
| `onCollapsedChange` | `(collapsed: boolean) => void` | — | Called when the rail state changes. Ignored, with a development warning, when a `SidebarProvider` is above. |
| `mobileOpen` | `boolean` | — | Controlled drawer state. Ignored, with a development warning, when a `SidebarProvider` is above. |
| `onMobileOpenChange` | `(open: boolean) => void` | — | Called when the drawer opens or closes. Ignored, with a development warning, when a `SidebarProvider` is above. |
| `mobileBreakpoint` | `string \| false` | `'48rem'` | Below this width the sidebar is a drawer. Ignored, with a development warning, when a `SidebarProvider` is above. |
| `storageKey` | `string` | — | Remember the rail state and open branches in `localStorage`. Ignored, with a development warning, when a `SidebarProvider` is above. |
| `shortcut` | `string` | — | A key that toggles the sidebar with ⌘ or Ctrl. Ignored, with a development warning, when a `SidebarProvider` is above. |

Also accepts all `<div>` props except `id`. The element's `id` comes from the provider so that `SidebarTrigger` can point `aria-controls` at it. The ref is forwarded to the panel element.

**Styling hooks**

| Hook | Meaning |
| ---- | ------- |
| `.sui-sidebar`, `[data-slot="sidebar"]` | The panel. |
| `.sui-sidebar__header`, `.sui-sidebar__body`, `.sui-sidebar__footer` | The three regions. Only the body scrolls. |
| `.sui-sidebar__backdrop` | The drawer backdrop. |
| `[data-collapsed]` | Rendering as the icon rail. |
| `[data-mobile]` | Below the breakpoint, where the sidebar is a drawer. |
| `[data-open]` | The drawer is open. |
| `[data-appearance="subtle" \| "primary"]` | The `appearance` prop. |
| `[data-breakpoint-pending]`, `[data-breakpoint-scope]` | Set in server HTML before hydration. See [Mobile drawer](#mobile-drawer). |
| `--sui-sidebar-width`, `--sui-sidebar-rail-width` | Full and rail widths. |
| `--sui-sidebar-indent` | Indent of nested lists (default `1.1875rem`). |
| `--sidebar`, `--sidebar-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-primary`, `--sidebar-border` | Theme tokens for the sidebar surface. See [Theming](../theming.md). |

## SidebarProvider

Shares the sidebar's state with controls outside it. The usual case is a `SidebarTrigger` in the page header. It renders no element of its own.

```tsx
'use client'

import { useState } from 'react'
import { Sidebar, SidebarNav, SidebarProvider, SidebarTrigger } from '@shining-technologies/ui'

export function Shell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <SidebarProvider collapsed={collapsed} onCollapsedChange={setCollapsed} mobileBreakpoint="60rem">
      <SidebarTrigger />
      <Sidebar>
        <SidebarNav items={[{ id: 'home', label: 'Home', href: '/' }]} />
      </Sidebar>
      {children}
    </SidebarProvider>
  )
}
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `children` | `ReactNode` | — | Content. |
| `collapsed` | `boolean` | — | Controlled rail state. When set, the state is not written to storage. |
| `defaultCollapsed` | `boolean` | `false` | Initial rail state while uncontrolled. A value in storage takes precedence after hydration. |
| `onCollapsedChange` | `(collapsed: boolean) => void` | — | Called when the rail state changes. Called in controlled and uncontrolled mode. |
| `mobileOpen` | `boolean` | — | Controlled drawer state. |
| `onMobileOpenChange` | `(open: boolean) => void` | — | Called when the drawer opens or closes. |
| `mobileBreakpoint` | `string \| false` | `'48rem'` | Any CSS length. The sidebar is a drawer while `(max-width: <value>)` matches. `false` keeps it a column at every width. |
| `storageKey` | `string` | — | Remember uncontrolled state in `localStorage`. See [Persistence](#persistence). |
| `shortcut` | `string` | — | A key that toggles the sidebar with ⌘ or Ctrl, for example `"b"`. Off by default. |

**Shortcut.** The listener is on `window`. The key matches without regard to case and needs ⌘ or Ctrl, with neither Alt nor Shift. It is ignored while focus is in an `input`, `textarea`, `select` or a content-editable element, so ⌘B still means bold in an editor. On a desktop it toggles the rail. Below the breakpoint it opens or closes the drawer.

**Growing past the breakpoint** closes the drawer, so it does not reappear the next time the window narrows.

## useSidebar

Reads the sidebar's layout state. It must be called under a `Sidebar` or `SidebarProvider`, and throws otherwise.

```tsx
'use client'

import { Button, useSidebar } from '@shining-technologies/ui'

export function CollapseAll() {
  const { rail, setCollapsed } = useSidebar()
  return <Button onClick={() => setCollapsed(!rail)}>{rail ? 'Show labels' : 'Icons only'}</Button>
}
```

Returns `SidebarContextValue`:

| Field | Type | Description |
| ----- | ---- | ----------- |
| `collapsed` | `boolean` | The desktop preference: rail (`true`) or full width. |
| `setCollapsed` | `(collapsed: boolean) => void` | Sets the rail state. Does nothing if the value is unchanged. |
| `mobileOpen` | `boolean` | Whether the drawer is open. |
| `setMobileOpen` | `(open: boolean) => void` | Opens or closes the drawer. |
| `isMobile` | `boolean` | `true` below `mobileBreakpoint`. Always `false` during server rendering and hydration. |
| `toggle` | `() => void` | Toggles the drawer when `isMobile` is `true`, otherwise the rail. Stable identity. |
| `rail` | `boolean` | Rendering as the icon rail right now: `collapsed && !isMobile`. |
| `sidebarId` | `string` | The `id` on the sidebar panel, for `aria-controls`. |
| `storageKey` | `string \| undefined` | As given to the provider. |
| `mobileBreakpoint` | `string \| false` | The provider's value, `'48rem'` by default. |

## Icon rail

When `collapsed` is `true` and the viewport is above the breakpoint, the sidebar renders as a narrow icon rail (`data-collapsed`):

- Labels are hidden visually, not removed, so links and buttons keep their accessible names.
- An item with no `icon` shows the first letter of its label.
- A leaf item shows its label in a tooltip to the right.
- A branch becomes a button that opens its sub-tree in a flyout: a popover to the right, titled with the branch label. If the branch also has an `href`, the flyout's first entry links to that page. Choosing an item in the flyout closes it. ↑/↓/Home/End move within the flyout.
- The branch that holds the current page gets the active highlight, because the page itself is hidden inside a flyout.
- Section headings are hidden and a rule separates sections. Collapsible sections are forced open.
- Badges shrink to a dot. Item `actions` are not rendered.
- The search field becomes an icon button. Pressing it expands the sidebar and focuses the field.
- `SidebarBrand` and `SidebarUser` show only their media, and their menus open to the right.

## Mobile drawer

While `(max-width: mobileBreakpoint)` matches, the panel gets `data-mobile` and is a closed, off-canvas drawer. Open it with `SidebarTrigger`, `toggle()` or `setMobileOpen(true)`. While it is open (`data-open`):

- The panel has `role="dialog"` and `aria-modal="true"`. Its name comes from `aria-label`, else the `SidebarBrand` title, else `'Navigation'`. When closed it is `role="complementary"` again.
- Focus moves to the panel, and Tab and Shift+Tab wrap inside it.
- Every element outside the panel gets `inert`, up to `<body>`. The exceptions are the backdrop, `script`, `style` and `template` elements, `[aria-live]` regions, and anything that was already inert. `document.body` gets `overflow: hidden`. Both changes are undone exactly on close or unmount.
- Escape, a click on the backdrop, or choosing a destination closes it.
- On close, focus returns to the element that had it before opening. If that element no longer exists, or nothing had focus, it goes to the `SidebarTrigger` whose `aria-controls` points at this sidebar.

> [!NOTE]
> A `SidebarTrigger` in the page header is inert while the drawer is open. To give the drawer a visible close button, put a second `SidebarTrigger` inside the sidebar, for example in its `header`.

**Before hydration.** The server cannot know the viewport, so it renders the desktop column. At the default `48rem` breakpoint, the panel carries `data-breakpoint-pending` and the stylesheet hides it on narrow screens from the first paint. For any other breakpoint, `Sidebar` renders a small `<style data-sui-breakpoint>` element with the same rules, scoped to that sidebar. It is emitted only when the value contains nothing but letters, digits, whitespace and `. , + - * / % ( )`; otherwise it is left out.

### Content-Security-Policy

With a nonce-based `style-src` policy, pass the nonce to `Sidebar`. It is only used for the `<style>` element described above, which exists only for a non-default `mobileBreakpoint`.

```tsx
// app/layout.tsx (Server Component)
import { headers } from 'next/headers'
import { AppShell, Sidebar, SidebarProvider } from '@shining-technologies/ui'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined
  return (
    <html lang="en">
      <body>
        <SidebarProvider mobileBreakpoint="60rem">
          <AppShell>
            <Sidebar nonce={nonce}>{/* … */}</Sidebar>
            {children}
          </AppShell>
        </SidebarProvider>
      </body>
    </html>
  )
}
```

## Persistence

With `storageKey`, uncontrolled state is saved to `localStorage` as JSON:

| Key | Value | Written by |
| --- | ----- | ---------- |
| `<storageKey>:collapsed` | `boolean` | `Sidebar` / `SidebarProvider`, when `collapsed` is not controlled. |
| `<storageKey>:expanded` | `string[]` of item ids | `SidebarNav`, when `expanded` is not controlled. |

- Stored values are read only after hydration, so server HTML and the first client render agree. The remembered state arrives one commit later, with no hydration warning. In an app without server rendering it applies on the first render.
- A stored value of the wrong type (for example `"yes"` for `collapsed`) is ignored. Storage errors such as private mode or a full quota are ignored.
- The drawer state, the folded state of a `SidebarSection`, and the open state of a `SidebarMenuItem` without a `value` are not persisted.

## SidebarNav

The navigation tree, rendered as `<nav>`. Pass `items` and it renders sections, separators, nested branches and the current page. Pass `children` and it is a container for hand-written `SidebarSection` and `SidebarMenu` elements. If you pass both, the children follow the generated tree.

```tsx
'use client'

import { SidebarNav, type SidebarNavEntry } from '@shining-technologies/ui'

const items: SidebarNavEntry[] = [
  { id: 'home', label: 'Home', href: '/' },
  {
    type: 'section',
    id: 'marketing',
    label: 'Marketing',
    tone: 'chart-2',
    items: [
      { id: 'leads', label: 'Leads', href: '/leads', badge: 4 },
      { id: 'email', label: 'Email', href: '/email', keywords: ['newsletter'] },
    ],
  },
  { type: 'separator' },
  {
    type: 'section',
    id: 'ops',
    label: 'Operations',
    collapsible: true,
    items: [
      {
        id: 'residential',
        label: 'Residential',
        children: [
          { id: 'res-dash', label: 'Dashboard', href: '/residential' },
          { id: 'res-orders', label: 'Orders', href: '/residential/orders' },
        ],
      },
      { id: 'archived', label: 'Archived', disabled: true },
    ],
  },
]

export function Nav({ path }: { path: string }) {
  return <SidebarNav items={items} currentPath={path} searchable accordion />
}
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `items` | `readonly SidebarNavEntry[]` | `[]` | The tree: items, sections and separators. Nest items to any depth. |
| `activeId` | `string` | — | The current destination, by item id. Takes precedence over `currentPath`. |
| `currentPath` | `string` | — | The current URL or path. The item whose `href` matches, or most closely encloses it, becomes active. See [Active item](#active-item). |
| `expanded` | `string[]` | — | Controlled open branches, by item id. |
| `defaultExpanded` | `string[]` | — | Initially open branches while uncontrolled. Read once. |
| `onExpandedChange` | `(expanded: string[]) => void` | — | Called with the next list of open ids. |
| `accordion` | `boolean` | `false` | Opening a branch closes its siblings. |
| `searchable` | `boolean` | `false` | Show a filter field above the tree. |
| `searchPlaceholder` | `string` | `'Search…'` | Placeholder of the filter field. With a trailing `…` removed, it is also the field's accessible name. |
| `emptyMessage` | `ReactNode` | `'Nothing matches'` | Shown, and announced, when the filter matches nothing. |
| `resultsMessage` | `(count: number) => string` | `'1 result'` / `'N results'` | What the search announces to screen readers while it matches something. |
| `renderLink` | `(props: SidebarLinkProps) => ReactNode` | the `Sidebar` `renderLink` | Render item links with your router. See [renderLink](#renderlink). |
| `onSelect` | `(item: SidebarNavItem, event: MouseEvent<HTMLElement>) => void` | — | Called when any item is chosen, after the item's own `onSelect`. |
| `aria-label` | `string` | `'Main'` | The name of the navigation landmark. |
| `children` | `ReactNode` | — | Hand-written sections and menus, rendered after the generated tree. |

Also accepts all `<nav>` props except `onSelect`. `onKeyDown` runs before the built-in arrow-key handling; call `event.preventDefault()` in it to skip that handling. The ref is forwarded to the `<nav>`.

### Entry shapes

`SidebarNavEntry` is `SidebarNavItem | SidebarNavSection | SidebarNavSeparator`, told apart by `type`.

**`SidebarNavItem`** (`type` omitted or `'item'`)

| Field | Type | Description |
| ----- | ---- | ----------- |
| `id` | `string` | Required. Unique across the whole tree: it keys expansion, activity, search and storage. |
| `label` | `ReactNode` | Required. |
| `icon` | `ReactNode` | Shown before the label. In the rail, the first letter of the label is used when omitted. |
| `href` | `string` | Makes the item a link. |
| `external` | `boolean` | Opens in a new tab (`target="_blank"`, `rel="noopener noreferrer"`), shows an external-link icon, and adds visually hidden text "(opens in a new tab)". External items never match `currentPath`. |
| `badge` | `ReactNode` | Shown after the label. `0` is rendered; `null` and `undefined` are not. |
| `badgeTone` | `AccentTone` | Colours the badge. |
| `disabled` | `boolean` | Rendered as a disabled button, and skipped by arrow-key navigation. |
| `title` | `string` | Plain text for search, the rail tooltip and the native `title`, for when `label` is not a string. |
| `keywords` | `string[]` | Extra words search matches: synonyms, old names, codes. |
| `actions` | `ReactNode` | Controls revealed on hover and focus, such as a "+" or a "…" menu. Not rendered in the rail. |
| `onSelect` | `(item: SidebarNavItem, event: MouseEvent<HTMLElement>) => void` | Called when this item is chosen. |
| `children` | `SidebarNavItem[]` | Nested items. The item becomes a branch. |

**`SidebarNavSection`**

| Field | Type | Description |
| ----- | ---- | ----------- |
| `type` | `'section'` | Required. |
| `id` | `string` | Required. Used as the React key. |
| `label` | `ReactNode` | Heading. Without it the section has no header. |
| `icon` | `ReactNode` | Shown before the heading. |
| `tone` | `AccentTone` | Colours the section icon. |
| `collapsible` | `boolean` | The heading becomes a button that folds the section. |
| `defaultCollapsed` | `boolean` | Start folded. |
| `action` | `ReactNode` | A control at the end of the heading. |
| `items` | `SidebarNavItem[]` | Required. Sections do not nest. |

**`SidebarNavSeparator`**: `{ type: 'separator'; id?: string }`. Renders `<hr class="sui-sidebar-separator">`.

`AccentTone` is `'neutral' | 'primary' | 'success' | 'warning' | 'destructive' | 'info' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'`.

Items outside a section are grouped into a `SidebarMenu` between sections and separators.

### How an item renders

| Item | Element |
| ---- | ------- |
| `disabled` | `<button disabled>` |
| `href`, no children | A link (`<a>` or `renderLink`) |
| Children, no `href` | A `<button>` with `aria-expanded` that opens and closes the branch |
| `href` and children | A link, plus a separate open/close button labelled "Expand *label*" or "Collapse *label*". Clicking the link also opens the branch if it is closed. |
| Neither `href` nor children | A `<button>` that calls `onSelect`, for state-driven apps |

The current item gets `aria-current="page"`. Choosing a link or a leaf button calls the item's `onSelect`, then the nav's `onSelect`. Then, unless the event was default-prevented, it closes the rail flyout and the mobile drawer. A button that only opens a branch does not count as choosing. Calling `event.preventDefault()` in `onSelect` keeps the drawer open, and on a plain `<a>` it also cancels navigation.

### Active item

`activeId`, when given, names the active item. Otherwise `currentPath` is matched with [`matchSidebarPath`](#tree-helpers):

- Origin, query string, fragment and trailing slashes are ignored. `https://app.test/orders/?page=2` and `/orders` are the same path.
- A hash route (`#/reports`) is treated as a path.
- An exact `href` wins. Otherwise the longest `href` the path sits under, at a `/` boundary, wins. `/orders/1042/edit` activates `/orders`.
- `href="/"` matches only `/`.
- Items that are `external`, and hrefs with no path (`#`, `?tab=2`), never match.

The ancestors of the active item get `data-active-trail`. Their branches are open on first render, and so is a collapsible section that holds the active item, even with `defaultCollapsed`. When the active item later changes, the branches and the section on the new trail are opened once. The user can still close them, and re-rendering with a new `items` array does not reopen them.

Because `currentPath` is known on the server, the active item, its open branches and its section are already in the server HTML.

### Expansion

- **Uncontrolled.** On first render the open branches are: the stored list (with `storageKey`, after hydration), else `defaultExpanded`, else none. The current trail is always added.
- **Controlled.** Pass `expanded` and `onExpandedChange`. Nothing opens until you pass the new array back. `onExpandedChange` is also called when a new current page adds its trail.
- **Accordion.** With `accordion`, opening a branch closes the other branches at its level: those under the same parent item or, for top-level items, those in the same section. Top-level items outside any section form one group. Each section keeps its own open branch. Hand-written `SidebarMenuItem`s that are not in `items` close nothing.

### Search

With `searchable`, a `type="search"` field filters the tree as you type:

- Matching is a case-insensitive substring of the item's `title` (or the text of its `label`) and its `keywords`.
- A matching item keeps everything beneath it. A non-matching item is kept if something beneath it matches, and is shown open.
- A section whose heading matches is kept whole. Separators are hidden while searching, and collapsible sections are shown open.
- The matched text is wrapped in `<mark class="sui-sidebar-mark">` when the label is a plain string.
- Escape clears a non-empty field. A clear button ("Clear search") appears while there is text.
- A visually hidden `role="status"` region is rendered with the field, before anything is typed, so screen readers announce every change. While a search is active it holds `resultsMessage(count)`, or `emptyMessage` when nothing matches; it is empty otherwise. `count` is the number of matching items and section headings (a matching branch counts once, not its descendants).
- When nothing matches, `emptyMessage` is also shown visibly in `.sui-sidebar-nav__empty`, which is `aria-hidden` so it is not read twice.

The query is internal state. It is not controlled, persisted or exposed.

### renderLink

By default links are plain `<a>` elements. `renderLink` receives every prop the `<a>` would have had and returns your router's link. The props are `SidebarLinkProps`: `href`, `children`, `className`, `title`, `aria-current`, `data-sidebar-focus`, `onClick`, and `target`/`rel` for external items. Spread all of them, since the arrow keys, the active style and closing the drawer depend on them. In the rail the link is wrapped in a tooltip trigger, so the returned element must accept a ref and pass it to the DOM `<a>`; `next/link` and React Router's `Link` both do.

Set `renderLink` on `Sidebar` to use it throughout the sidebar: for `SidebarBrand` and `SidebarUser` links, and as the default for every `SidebarNav` inside, including hand-written `SidebarMenuItem`s in it. A `renderLink` on a `SidebarNav` takes precedence for that nav. Without either, links are plain `<a>` elements.

**Next.js (App Router)**

```tsx
// app/app-sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sidebar, SidebarBrand, SidebarNav, type SidebarNavEntry } from '@shining-technologies/ui'

export function AppSidebar({ items }: { items: SidebarNavEntry[] }) {
  const pathname = usePathname()
  return (
    <Sidebar renderLink={(props) => <Link {...props} />} header={<SidebarBrand name="Acme" href="/" />}>
      <SidebarNav items={items} currentPath={pathname} />
    </Sidebar>
  )
}
```

The same function can be passed to `SidebarNav` directly (`<SidebarNav renderLink={…} />`) when the nav is not inside a `Sidebar`.

`items` can come from a Server Component as long as it is serialisable: no `onSelect`, and `icon` or `label` values that are elements rather than functions. Otherwise, define the tree in the client file.

**React Router**

```tsx
'use client'

import { Link, useLocation } from 'react-router-dom'
import { SidebarNav, type SidebarNavEntry } from '@shining-technologies/ui'

export function RouterNav({ items }: { items: SidebarNavEntry[] }) {
  const { pathname } = useLocation()
  return (
    <SidebarNav
      items={items}
      currentPath={pathname}
      renderLink={({ href, ...props }) => <Link to={href} {...props} />}
    />
  )
}
```

**State-driven apps.** Leave out `href`, pass `activeId`, and handle `onSelect`:

```tsx
<SidebarNav items={items} activeId={view} onSelect={(item) => setView(item.id)} />
```

### Keyboard

Tab moves through controls as usual. Inside the `<nav>`, including the rail flyouts:

| Key | Action |
| --- | ------ |
| ↓ / ↑ | Next or previous visible item, section toggle or search field (wraps around). Disabled items are skipped. From the search field only ↓ works. |
| Home / End | First or last. |
| → | On a closed branch, open it. On an open branch, move to its first child. |
| ← | On an open branch, close it. Otherwise move to the parent item. |

→ and ← swap in a right-to-left layout.

## Tree helpers

Pure functions over the same `SidebarNavEntry[]` tree. They have no React or DOM dependency.

```tsx
// app/orders/[id]/page.tsx (Server Component)
import { Fragment } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  getSidebarTrail,
  matchSidebarPath,
} from '@shining-technologies/ui'
import { navItems } from '@/lib/nav' // serialisable SidebarNavEntry[]

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const trail = getSidebarTrail(navItems, matchSidebarPath(navItems, `/orders/${id}`))
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {trail.map((item, index) => (
          <Fragment key={item.id}>
            {index > 0 ? <BreadcrumbSeparator /> : null}
            <BreadcrumbItem>
              <BreadcrumbPage>{item.label}</BreadcrumbPage>
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
```

| Function | Signature | Returns |
| -------- | --------- | ------- |
| `matchSidebarPath` | `(entries: readonly SidebarNavEntry[], path: string \| undefined) => string \| undefined` | The id of the item the path belongs to, using the rules in [Active item](#active-item). `undefined` if nothing matches. |
| `getSidebarTrail` | `(entries: readonly SidebarNavEntry[], id: string \| undefined) => SidebarNavItem[]` | The items from the top of the tree down to `id`, inclusive. Sections are not included. Empty when `id` is missing or not in the tree. |

The example marks every level as a page because a tree item's `href` is optional. [Navigation](./navigation.md#breadcrumb) shows the usual pattern with `BreadcrumbLink` for ancestors.

## SidebarSection

A labelled group of items, such as a product area or a module. It renders a heading and a `<ul class="sui-sidebar-menu">` labelled by that heading. `SidebarNav` renders one for each `type: 'section'` entry; you can also write them by hand, inside a `SidebarNav` or directly in a `Sidebar`.

```tsx
<SidebarNav>
  <SidebarSection
    label="Projects"
    icon={<StarIcon />}
    tone="success"
    collapsible
    action={
      <Button variant="ghost" size="icon-sm" aria-label="New project">
        <PlusIcon />
      </Button>
    }
  >
    <SidebarMenuItem label="Website" href="/projects/website" active />
    <SidebarMenuItem label="Mobile app" href="/projects/mobile" />
  </SidebarSection>
</SidebarNav>
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `label` | `ReactNode` | — | Heading. Without it there is no header and the list is unlabelled. |
| `icon` | `ReactNode` | — | Shown before the heading (`aria-hidden`). |
| `tone` | `AccentTone` | — | Adds `sui-tone--<tone>` to the section, which colours the icon. |
| `collapsible` | `boolean` | `false` | The heading becomes a button with `aria-expanded` that folds the section. |
| `defaultCollapsed` | `boolean` | `false` | Start folded. Folding is internal state: not controlled and not persisted. A section generated by `SidebarNav items` opens anyway when it holds the current page. |
| `action` | `ReactNode` | — | A control at the end of the heading. |
| `children` | `ReactNode` | — | `SidebarMenuItem` elements. |

Also accepts all `<div>` props except `title`. A section is always open in the rail and while a search is active. A folded section has `data-collapsed` and does not render its list. Hooks: `[data-slot="sidebar-section"]`, `.sui-sidebar-section`, `.sui-sidebar-section__header`, `.sui-sidebar-section__label`, `.sui-sidebar-section__action`.

## SidebarMenu

A bare `<ul class="sui-sidebar-menu">` for items that belong to no section. `SidebarNav` wraps loose top-level items in one.

```tsx
<SidebarMenu>
  <SidebarMenuItem label="Settings" href="/settings" />
</SidebarMenu>
```

Accepts all `<ul>` props. Hook: `[data-slot="sidebar-menu"]`.

## SidebarMenuItem

One destination, or a branch of them, rendered as an `<li>`. Nest `SidebarMenuItem`s as children to make a branch, to any depth. It must be placed in a `SidebarMenu`, a `SidebarSection` or another `SidebarMenuItem`. The element it renders follows the same rules as [How an item renders](#how-an-item-renders).

```tsx
<SidebarSection label="Operations">
  <SidebarMenuItem label="Residential" icon={<LayoutIcon />} defaultExpanded>
    <SidebarMenuItem label="Dashboard" href="/residential" active />
    <SidebarMenuItem label="Jobs" href="/residential/jobs" badge={4} badgeTone="warning" />
  </SidebarMenuItem>
  <SidebarMenuItem label="Docs" href="https://docs.example.com" external />
</SidebarSection>
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `label` | `ReactNode` | — | Required. |
| `value` | `string` | — | A stable key. Inside a `SidebarNav`, the nav owns this branch's open state (so `accordion` and `storageKey` apply to it). Without `value`, the item keeps its own open state. |
| `icon` | `ReactNode` | — | Shown before the label. In the rail, the first letter of the label is used when omitted. |
| `href` | `string` | — | Makes the item a link. Rendered through the enclosing `SidebarNav`'s `renderLink` when there is one. |
| `external` | `boolean` | `false` | New tab, external icon, and visually hidden "(opens in a new tab)". |
| `active` | `boolean` | `false` | The current page: `aria-current="page"`. |
| `badge` | `ReactNode` | — | Shown after the label unless `null` or `undefined`. |
| `badgeTone` | `AccentTone` | — | Colours the badge. |
| `disabled` | `boolean` | `false` | Renders a disabled button. |
| `actions` | `ReactNode` | — | Revealed on hover and focus. Not rendered in the rail. |
| `title` | `string` | label, if a string | Plain text for the rail tooltip, the native `title` and the branch toggle's label. |
| `expanded` | `boolean` | — | Controlled open state of this branch. |
| `defaultExpanded` | `boolean` | `false` | Initial open state when neither `expanded` nor a nav-managed `value` applies. |
| `onExpandedChange` | `(expanded: boolean) => void` | — | Called when the branch opens or closes. |
| `onSelect` | `(event: MouseEvent<HTMLElement>) => void` | — | The item was chosen. Not called for a branch button that only opens. |
| `children` | `ReactNode` | — | Nested `SidebarMenuItem`s. |

Also accepts all `<li>` props except `title` and `onSelect`. The ref is forwarded to the `<li>`.

Data attributes on the `<li>`: `data-slot="sidebar-menu-item"`, `data-sidebar-item`, `data-expandable` (has children), `data-expanded` (open), `data-active-trail` (an ancestor of the active item, for nav-managed items). Class hooks: `.sui-sidebar-item`, `.sui-sidebar-item__link`, `.sui-sidebar-item__icon`, `.sui-sidebar-item__label`, `.sui-sidebar-item__badge`, `.sui-sidebar-item__actions`, `.sui-sidebar-item__toggle`, `.sui-sidebar-sub` (nested list).

## SidebarBrand

The product or workspace identity, usually in the `Sidebar` `header`. With `menu` it becomes a switcher button that opens a dropdown menu. With `href` it is a link. Otherwise it is static. Its title also names the mobile drawer, unless the `Sidebar` has an `aria-label`.

```tsx
<SidebarBrand
  logo={<img src="/logo.svg" alt="" width={24} height={24} />}
  name="Acme"
  description="Production"
  menu={
    <>
      <DropdownMenuItem onSelect={() => switchWorkspace('prod')}>Production</DropdownMenuItem>
      <DropdownMenuItem onSelect={() => switchWorkspace('staging')}>Staging</DropdownMenuItem>
    </>
  }
/>
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `name` | `ReactNode` | — | Required. The title line. |
| `logo` | `ReactNode` | first letter of `name` | A mark, `<img>` or svg. It is all the rail shows. |
| `description` | `ReactNode` | — | A second line: workspace, plan, environment. |
| `href` | `string` | — | Links the brand, through the `Sidebar` `renderLink` when there is one, else as `<a>`. Ignored when `menu` is set. |
| `menu` | `ReactNode` | — | `DropdownMenuItem` elements. Turns the brand into a `<button>` that opens a menu below it, or to the right in the rail. |

Also accepts the props of the rendered element (`<button>`, `<a>` or `<div>`) except `title`. A link rendered through `renderLink` receives these props but not the ref. Hooks: `[data-slot="sidebar-brand"]`, `.sui-sidebar-identity`, `.sui-sidebar-identity__media`, `__title`, `__subtitle`. See [Overlay](./overlay.md) for `DropdownMenuItem`.

## SidebarUser

The signed-in account, usually in the `Sidebar` `footer`. It shows a `UserAvatar` with the name, and optionally opens an account menu.

```tsx
<SidebarUser
  name="Ana Ortiz"
  description="ana@example.com"
  avatarSrc="/avatars/ana.jpg"
  status="online"
  menu={
    <>
      <DropdownMenuItem asChild>
        <a href="/settings">Settings</a>
      </DropdownMenuItem>
      <DropdownMenuItem destructive onSelect={signOut}>
        Sign out
      </DropdownMenuItem>
    </>
  }
/>
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `name` | `string` | — | Required. Also used for the avatar initials. |
| `description` | `ReactNode` | — | Second line, for example an email or a role. |
| `avatarSrc` | `string` | — | Avatar image URL. |
| `status` | `'online' \| 'away' \| 'busy' \| 'offline'` | — | Presence dot on the avatar. |
| `href` | `string` | — | Links the block, through the `Sidebar` `renderLink` when there is one, else as `<a>`. Ignored when `menu` is set. |
| `menu` | `ReactNode` | — | `DropdownMenuItem` elements: profile, settings, sign out. The menu opens above, or to the right in the rail. |

Also accepts the props of the rendered element except `title`. The avatar is `aria-hidden` because the name is next to it. Hook: `[data-slot="sidebar-user"]`. See [Avatar](./avatar.md).

## SidebarTrigger

The button that toggles the sidebar. On a desktop it switches between rail and full width; below the breakpoint it opens and closes the drawer. It works anywhere under a `SidebarProvider`, or inside a `Sidebar`.

```tsx
<AppShellHeader start={<SidebarTrigger labels={{ open: 'Menu', close: 'Close menu' }} />} />
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `labels` | `{ expand?: string; collapse?: string; open?: string; close?: string }` | `'Expand sidebar'`, `'Collapse sidebar'`, `'Open navigation'`, `'Close navigation'` | Accessible names for each state. |
| `variant` | Button `variant` | `'ghost'` | See [Button](./button.md). |
| `size` | Button `size` | `'icon'` | See [Button](./button.md). |
| `children` | `ReactNode` | `<PanelLeftIcon />` | Button content. |
| `onClick` | `MouseEventHandler<HTMLButtonElement>` | — | Runs first. Call `event.preventDefault()` to stop the toggle. |

Also accepts all `Button` props. It sets `aria-label` from `labels`, `aria-expanded` (the sidebar is expanded, or the drawer is open) and `aria-controls` (the sidebar's id). An `aria-label` you pass replaces the computed one. Hooks: `[data-slot="sidebar-trigger"]`, `.sui-sidebar-trigger`.

## Types

All exported as types:

| Type | Describes |
| ---- | --------- |
| `SidebarProps` | `Sidebar` props. |
| `SidebarProviderProps` | `SidebarProvider` props. |
| `SidebarContextValue` | The value returned by `useSidebar`. |
| `SidebarNavProps` | `SidebarNav` props. |
| `SidebarNavEntry`, `SidebarNavItem`, `SidebarNavSection`, `SidebarNavSeparator` | The data tree. |
| `SidebarLinkProps` | What `renderLink` receives: `AnchorHTMLAttributes<HTMLAnchorElement>` with required `href: string` and `children: ReactNode`. |
| `SidebarSectionProps`, `SidebarMenuItemProps` | Part props. |
| `SidebarBrandProps`, `SidebarUserProps`, `SidebarTriggerProps` | Identity and trigger props. |

## Accessibility

- As a column the sidebar is a `complementary` landmark named "Sidebar". `SidebarNav` is a `navigation` landmark named "Main". Give either a different `aria-label` if the page already has a landmark with that name.
- The open drawer is a named modal dialog: focus moves into it and is trapped, the rest of the page is `inert`, and Escape or the backdrop closes it, returning focus. See [Mobile drawer](#mobile-drawer).
- The current page has `aria-current="page"`. Branch toggles and collapsible section headings expose `aria-expanded`, and `aria-controls` while open. Section lists are labelled by their heading.
- In the rail, labels are visually hidden rather than removed, so every control keeps its accessible name. Tooltips repeat the name and are not the only source of it.
- Arrow keys, Home and End move through the tree, and →/← open, enter, close and leave branches (mirrored in RTL). The ⌘/Ctrl shortcut is opt-in and ignored in text fields.
- External links announce "(opens in a new tab)".
- `SidebarBrand` and `SidebarUser` menus use Radix dropdown menus: arrow keys move through the items and Escape closes.
- Motion (the rail width, the drawer slide, branch reveal) is removed under `prefers-reduced-motion: reduce`.
- Search results are announced through a status region that exists before the first keystroke: the result count, or `emptyMessage` when nothing matches.
- Some built-in strings are fixed English and cannot be changed by a prop: "Expand *label*" / "Collapse *label*" on split branches, "Clear search", and "(opens in a new tab)". The trigger labels, `searchPlaceholder`, `emptyMessage`, `resultsMessage` and `aria-label` can be changed.

See [Accessibility](../accessibility.md) for the package-wide approach.

## Related

- [Layout](./layout.md): `AppShell`, the header the trigger usually sits in, and a complete Next.js layout
- [Navigation](./navigation.md): breadcrumbs, tabs and pagination
- [Next.js](../nextjs.md): server and client components, CSP
- [Overlay](./overlay.md): `DropdownMenuItem`, `Tooltip`, `Popover`
- [Avatar](./avatar.md): `UserAvatar` and presence status
- [Button](./button.md): the props `SidebarTrigger` extends
- [Icons](./icons.md)
- [Theming](../theming.md): `--sidebar*` tokens
- [Troubleshooting](../troubleshooting.md)
