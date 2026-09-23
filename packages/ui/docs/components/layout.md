# Layout

The application frame and page-level parts. `AppShell` is a CSS grid with a sticky header and a content area, a sidebar column when it contains a `Sidebar`, and an optional bottom bar for phones. `PageHeader` is the top of a page, and `SkipToContent` and `ScrollToTop` handle keyboard and long-page navigation. Inside a page, `Stack`, `Grid` and `Container` lay content out on the spacing scale, and `ResizablePanelGroup` splits an area into panels the user can resize.

```tsx
import {
  AppShell,
  AppShellBottomNav,
  AppShellContent,
  AppShellHeader,
  BottomNavItem,
  Container,
  Grid,
  PageHeader,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ScrollToTop,
  SkipToContent,
  Stack,
} from '@shining-technologies/ui' // or '@shining-technologies/ui/layout'
```

**Server and client.** `AppShell`, `AppShellHeader`, `AppShellContent`, `AppShellBottomNav`, `BottomNavItem` and `SkipToContent` come from a file with no `'use client'` directive. They are markup and CSS only, so they work as Server Components and can go straight into a `layout.tsx`. `BottomNavItem`'s `onClick` is a function, so a clickable bottom bar must be rendered from a client component. `PageHeader` and `ScrollToTop` are client components (`'use client'`). You can render `PageHeader` from a Server Component if you do not pass `onBack`. `Stack`, `Grid` and `Container` have no directive and render as Server Components; `ResizablePanelGroup`, `ResizablePanel` and `ResizableHandle` are client components.

- [A complete Next.js layout](#a-complete-nextjs-layout)
- [AppShell](#appshell)
- [AppShellHeader](#appshellheader)
- [AppShellContent](#appshellcontent)
- [AppShellBottomNav](#appshellbottomnav)
- [BottomNavItem](#bottomnavitem)
- [SkipToContent](#skiptocontent)
- [PageHeader](#pageheader)
- [ScrollToTop](#scrolltotop)
- [Stack](#stack)
- [Grid](#grid)
- [Container](#container)
- [Resizable panels](#resizable-panels)

## A complete Next.js layout

The root layout is a Server Component. The only client file is the sidebar, because it reads the pathname and passes `renderLink`.

```tsx
// app/layout.tsx (Server Component)
import '@shining-technologies/ui/styles.css'
import {
  AppShell,
  AppShellContent,
  AppShellHeader,
  ColorModeScript,
  ColorModeToggle,
  ScrollToTop,
  SidebarProvider,
  SidebarTrigger,
  SkipToContent,
} from '@shining-technologies/ui'
import { AppSidebar } from './app-sidebar'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorModeScript defaultMode="system" />
      </head>
      <body className="sui-scope">
        <SidebarProvider storageKey="acme-sidebar" shortcut="b">
          <SkipToContent />
          <AppShell>
            <AppSidebar />
            <AppShellHeader start={<SidebarTrigger />} end={<ColorModeToggle />} />
            <AppShellContent>{children}</AppShellContent>
          </AppShell>
          <ScrollToTop />
        </SidebarProvider>
      </body>
    </html>
  )
}
```

```tsx
// app/app-sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  DropdownMenuItem,
  InboxIcon,
  LayoutIcon,
  MailIcon,
  Sidebar,
  SidebarBrand,
  SidebarNav,
  SidebarUser,
  SlidersIcon,
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
        children: [
          { id: 'orders-open', label: 'Open', href: '/orders/open' },
          { id: 'orders-closed', label: 'Closed', href: '/orders/closed' },
        ],
      },
      { id: 'campaigns', label: 'Campaigns', href: '/campaigns', icon: <MailIcon /> },
    ],
  },
  { type: 'separator' },
  { id: 'settings', label: 'Settings', href: '/settings', icon: <SlidersIcon /> },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar
      renderLink={(props) => <Link {...props} />}
      header={<SidebarBrand name="Acme" description="Production" href="/" />}
      footer={
        <SidebarUser
          name="Ana Ortiz"
          description="ana@example.com"
          menu={
            <DropdownMenuItem asChild>
              <Link href="/account">Account</Link>
            </DropdownMenuItem>
          }
        />
      }
    >
      <SidebarNav items={items} currentPath={pathname} searchable />
    </Sidebar>
  )
}
```

Points to note:

- `SidebarProvider` wraps both the `Sidebar` and the header's `SidebarTrigger`, so they share state. Provider props (`storageKey`, `shortcut`, `mobileBreakpoint`, …) go on the provider; a `Sidebar` under it ignores them and warns in development.
- `renderLink` on `Sidebar` sends the brand link and every `SidebarNav` link through `next/link`.
- The `Sidebar` must be a **direct child** of `AppShell`: the grid finds it with `.sui-shell:has(> .sui-sidebar)`. A client component that returns `<Sidebar>` is fine, but do not wrap the sidebar in an extra element.
- `SkipToContent` targets `#main`, which is `AppShellContent`'s default `id`.
- While the drawer is open on a phone, the header (and the trigger in it) is inert. Escape, the backdrop or choosing a page closes it. To show a close button inside the drawer, add a `SidebarTrigger` to the sidebar header as well.

See [Sidebar](./sidebar.md) for the navigation tree, and [Next.js](../nextjs.md) for the rest of the App Router setup.

## AppShell

The frame the application lives in. It is a grid on `100dvh` with `header` over `content`, and a sidebar column beside both when a `Sidebar` is a direct child. The header sticks to the top while the page scrolls, and the sidebar is sticky at full height. Content is composed as children rather than passed as props, so different apps can fill the same frame differently.

```tsx
<AppShell hasBottomNav>
  <AppSidebar />
  <AppShellHeader start={<SidebarTrigger />} />
  <AppShellContent>{children}</AppShellContent>
  <MobileNav />
</AppShell>
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `hasBottomNav` | `boolean` | `false` | Adds bottom padding to the content equal to `--sui-bottom-nav-height` (default `3.5rem`), so an `AppShellBottomNav` does not cover it. Only applies at widths where the bottom bar shows. |
| `collapsed` | `boolean` | `false` | **Deprecated.** Sets `data-collapsed` on the shell as a styling hook; it has no layout effect. Collapse the sidebar with `Sidebar` or `SidebarProvider` (`collapsed`, `defaultCollapsed`, `SidebarTrigger`). |

Also accepts all `<div>` props. Hooks: `[data-slot="app-shell"]`, `.sui-shell`, `.sui-shell--with-bottom-nav`.

**Layout rules**

- Without a `Sidebar` child, the shell is one column at every width.
- With a `Sidebar` as a direct child, a first column is added and the sidebar sizes it: `16rem` (set with `Sidebar width`), or the rail width (`railWidth`, default `3.75rem`) when collapsed. The width change animates.
- When the `Sidebar` is a drawer (`data-mobile`), the shell is one column again, at whatever `mobileBreakpoint` the sidebar uses.
- The content area has `1.5rem` padding, and `1rem` at `48rem` and below.

## AppShellHeader

The sticky top bar, rendered as `<header>`. It lays out `start`, `center` and `end` slots in a row.

```tsx
<AppShellHeader
  start={<SidebarTrigger />}
  center={<GlobalSearch />}
  end={
    <>
      <NotificationsButton />
      <ColorModeToggle />
    </>
  }
/>
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `start` | `ReactNode` | — | Pinned to the start: a trigger, logo or app switcher. |
| `center` | `ReactNode` | — | Takes the free space, for example search. |
| `end` | `ReactNode` | — | Pushed to the end: notifications, the user menu. |
| `children` | `ReactNode` | — | Rendered between `center` and `end`. |

Also accepts all `<header>` props. The header is `position: sticky; top: 0` with `z-index: 30`, at least `--sui-shell-header-height` tall (`4rem`; `3.5rem` compact, `4.5rem` spacious) including its border, the same height as the `Sidebar` header so their bottom borders line up, with a translucent card background and a bottom border. Hooks: `[data-slot="app-shell-header"]`, `.sui-shell__header`, `.sui-shell__header-start`, `.sui-shell__header-center`, `.sui-shell__header-end`.

## AppShellContent

The main content area, rendered as `<main>`.

```tsx
<AppShellContent>
  <PageHeader title="Orders" />
  {children}
</AppShellContent>
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `id` | `string` | `'main'` | The target for `SkipToContent`. |

Also accepts all `<main>` props. It has `tabIndex={-1}`, so the skip link can move focus to it without adding it to the tab order, and no focus outline. Hooks: `[data-slot="app-shell-content"]`, `.sui-shell__content`.

## AppShellBottomNav

A fixed bottom navigation bar for phones, rendered as `<nav aria-label="Primary">`. It is hidden above `48rem`, where the sidebar takes over. Pair it with `AppShell hasBottomNav`.

```tsx
'use client'

import { usePathname, useRouter } from 'next/navigation'
import { AppShellBottomNav, BottomNavItem, InboxIcon, LayoutIcon, SlidersIcon } from '@shining-technologies/ui'

export function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  return (
    <AppShellBottomNav>
      <BottomNavItem icon={<LayoutIcon />} label="Home" active={pathname === '/'} onClick={() => router.push('/')} />
      <BottomNavItem
        icon={<InboxIcon />}
        label="Orders"
        active={pathname.startsWith('/orders')}
        onClick={() => router.push('/orders')}
      />
      <BottomNavItem
        icon={<SlidersIcon />}
        label="Settings"
        active={pathname.startsWith('/settings')}
        onClick={() => router.push('/settings')}
      />
    </AppShellBottomNav>
  )
}
```

Accepts all `<nav>` props. Pass `aria-label` to replace "Primary". The bar is `--sui-bottom-nav-height` tall (default `3.5rem`), adds `env(safe-area-inset-bottom)` padding, and has `z-index: 40`. It shows at `48rem` and below whatever the sidebar's `mobileBreakpoint` is. Hooks: `[data-slot="app-shell-bottom-nav"]`, `.sui-bottom-nav`.

## BottomNavItem

One destination in `AppShellBottomNav`: an icon over a short label. It renders a `<button type="button">`, so it has no `href`; navigate in `onClick`.

```tsx
<BottomNavItem icon={<InboxIcon />} label="Orders" badge={3} active onClick={openOrders} />
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `icon` | `ReactNode` | — | Required. Decorative (`aria-hidden`). |
| `label` | `ReactNode` | — | Required. The visible label and the accessible name. Truncated with an ellipsis if too long. |
| `active` | `boolean` | — | The current page: `aria-current="page"`, coloured with `--primary`. |
| `badge` | `ReactNode` | — | A small count on the icon. Rendered unless `undefined`. |
| `badgeLabel` | `string` | the badge, if a string or number | What screen readers hear for the badge, after the label. |

Also accepts all `<button>` props. Hooks: `.sui-bottom-nav__item`, `.sui-bottom-nav__icon`, `.sui-bottom-nav__badge`, `.sui-bottom-nav__label`.

The badge is drawn on the decorative icon, and its text is repeated as visually hidden text after the label, so the example above is announced as "Orders (3)". For a badge with no text, such as a dot, pass `badgeLabel` (for example `badgeLabel="new messages"`); without it, nothing is added to the name.

## SkipToContent

A link past the navigation to the main content (WCAG 2.4.1). It is visually hidden until it receives keyboard focus, then appears at the top left. Put it first in the page.

```tsx
<body>
  <SkipToContent />
  <AppShell>{/* … */}</AppShell>
</body>
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `targetId` | `string` | `'main'` | The `id` to jump to. The `href` is `#<targetId>`. |
| `children` | `ReactNode` | `'Skip to content'` | Link text. |

Also accepts all `<a>` props. `href` is overwritten by `targetId`. Hooks: `[data-slot="skip-to-content"]`, `.sui-skip-link`. It is shown on `:focus-visible`, with the primary colours and `z-index: 200`.

## PageHeader

The top of a page: the title and description, an optional eyebrow and back button, and the page's primary actions. Tabs or a filter bar can go underneath as children.

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { Button, PageHeader, SectionTabs } from '@shining-technologies/ui'

export function OrderHeader() {
  const router = useRouter()
  return (
    <PageHeader
      title="Order #1042"
      description="Placed 12 March by Rosewood Estates"
      onBack={() => router.back()}
      actions={<Button>Mark as paid</Button>}
      documentTitle
      bordered
    >
      <SectionTabs
        aria-label="Order sections"
        tabs={[
          { id: 'details', label: 'Details' },
          { id: 'invoices', label: 'Invoices', count: 2 },
        ]}
      />
    </PageHeader>
  )
}
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `title` | `ReactNode` | — | Required. Rendered in the heading element set by `as`. |
| `description` | `ReactNode` | — | A paragraph under the title. |
| `eyebrow` | `ReactNode` | — | Above the title, for example a breadcrumb or a status badge. |
| `actions` | `ReactNode` | — | Primary actions, aligned to the end on wide screens. |
| `onBack` | `() => void` | — | Shows a back button before the title. The package has no router, so this callback navigates. |
| `backLabel` | `string` | `'Back'` | Accessible name of the back button. |
| `as` | `'h1' \| 'h2' \| 'h3' \| 'h4' \| 'h5' \| 'h6'` | `'h1'` | Heading level. Use a lower level for a header inside a section. |
| `documentTitle` | `string \| boolean` | — | Sets `document.title` while mounted and restores the previous title on unmount. `true` uses `title` when it is a plain string; otherwise nothing is set. |
| `bordered` | `boolean` | `false` | Draws a rule under the whole block. |
| `children` | `ReactNode` | — | Rendered under the header, for example tabs or a filter bar. |

Also accepts all `<div>` props except `title`. The ref is forwarded to the outer `<div>`. Hooks: `[data-slot="page-header"]`, `.sui-page-header`, `.sui-page-header--bordered`, `__bar`, `__back`, `__text`, `__eyebrow`, `__title`, `__description`, `__actions`, `__extra`.

In the Next.js App Router, prefer route `metadata` for the tab title. `documentTitle` sets the title from the client after hydration.

## ScrollToTop

A floating "back to top" button, fixed to the bottom right of the viewport. It renders nothing until the scroll position passes `threshold`.

```tsx
<ScrollToTop threshold={600} />
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `threshold` | `number` | `400` | Scroll distance in px after which the button appears. |
| `target` | `HTMLElement \| null` | window | The scrolling element to watch and scroll. `null` or `undefined` uses the window. |
| `label` | `string` | `'Back to top'` | Accessible name. |
| `className` | `string` | — | Extra class on the button. |

It takes no other props and does not forward a ref. Pressing it calls `scrollTo({ top: 0 })` on the target with `behavior: 'smooth'`, or `'auto'` (an instant jump) when `prefers-reduced-motion: reduce` matches. Hook: `.sui-scroll-top` (`z-index: 45`).

Inside `AppShell` the window scrolls, so the default `target` is right. For a scrolling panel, pass the element from state (a callback ref), not `ref.current`: the button only picks up a new target when it re-renders.

```tsx
'use client'

import { useState } from 'react'
import { ScrollToTop } from '@shining-technologies/ui'

export function Log({ children }: { children: React.ReactNode }) {
  const [panel, setPanel] = useState<HTMLDivElement | null>(null)
  return (
    <div ref={setPanel} style={{ overflowY: 'auto', height: '30rem' }}>
      {children}
      <ScrollToTop target={panel} />
    </div>
  )
}
```

## Stack

Children in a column, or a row with `direction="horizontal"`, one step of the spacing scale apart. A
horizontal stack that wraps is the inline cluster of buttons, badges or chips. A plain class name
would do as well; use `Stack` when you want the gap to follow the theme's `--spacing`.

```tsx
<Stack gap="lg">
  <PageHeader title="Invoices" />
  <DataTable … />
</Stack>

<Stack direction="horizontal" gap="sm" wrap>
  <Badge>Draft</Badge>
  <Badge tone="info">Sent</Badge>
</Stack>
```

| Prop        | Type                                                   | Default      | Description |
| ----------- | ------------------------------------------------------ | ------------ | ----------- |
| `direction` | `'vertical' \| 'horizontal'`                           | `'vertical'` | A horizontal stack also centres its children vertically. |
| `gap`       | `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'`         | `'md'`       | `--spacing` × 0, 1, 2, 4, 6 or 8 (`LayoutGap`). |
| `align`     | `'start' \| 'center' \| 'end' \| 'stretch' \| 'baseline'` | —            | `align-items`. |
| `justify`   | `'start' \| 'center' \| 'end' \| 'between'`             | —            | `justify-content`. |
| `wrap`      | `boolean`                                              | `false`      | Let children flow onto more lines. |
| `as`        | `'div' \| 'section' \| 'ul' \| 'ol' \| 'form' \| …`        | `'div'`      | The element to render. List styling is reset. |

Also accepts all HTML attributes. The ref goes to the element. Classes: `.sui-layout-stack`,
`--horizontal`, `--wrap`, `.sui-gap--{gap}`, `.sui-align--*`, `.sui-justify--*`; `stackVariants`
returns them.

## Grid

Equal columns: a row of stats cards, a gallery of records, a form in two columns.

```tsx
<Grid columns={3}>
  <StatsCard … />
  <StatsCard … />
  <StatsCard … />
</Grid>

<Grid minItemWidth="16rem" gap="sm" as="ul">
  {records.map((record) => <li key={record.id}><RecordCard record={record} /></li>)}
</Grid>
```

| Prop           | Type        | Default | Description |
| -------------- | ----------- | ------- | ----------- |
| `columns`      | `number`    | `1`     | A fixed number of equal columns. They fold to one column under 40rem. |
| `minItemWidth` | `string`    | —       | As many columns as fit, each at least this wide (`'16rem'`), at every width. Takes precedence over `columns`. |
| `gap`          | `LayoutGap` | `'md'`  | As for `Stack`. |
| `as`           | as `Stack`  | `'div'` | |

Also accepts all HTML attributes. It sets `--sui-grid-columns` or `--sui-grid-min` on the element and
`data-layout="columns" | "fill"`. Classes: `.sui-layout-grid`, `.sui-gap--{gap}`; `gridVariants`.

## Container

Centres content at a readable width with the surface padding on either side.

```tsx
<Container size="sm" as="main">
  <SettingsForm />
</Container>
```

| Prop   | Type                                     | Default | Description |
| ------ | ---------------------------------------- | ------- | ----------- |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'lg'`  | Maximum width: 40rem, 48rem, 64rem, 80rem, or none. |
| `as`   | as `Stack`                               | `'div'` | |

The props type is `LayoutContainerProps` (`ContainerProps` is the DataTable's container part).
Classes: `.sui-layout-container`, `--{size}`; the width is `--sui-container-width`. `containerVariants`.

## Resizable panels

Panels whose sizes the user sets by dragging the handles between them: a list beside its detail, an
editor over its preview, a file tree beside a file. Panels and handles are direct children of the
group, a handle between each pair. Groups nest, for example a vertical group inside a horizontal one.

```tsx
'use client'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@shining-technologies/ui'

export function Inbox() {
  return (
    <ResizablePanelGroup direction="horizontal" onSizesChange={(sizes) => save('inbox', sizes)}>
      <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
        <ConversationList />
      </ResizablePanel>
      <ResizableHandle withHandle aria-label="Resize the list" />
      <ResizablePanel>
        <Conversation />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
```

`ResizablePanelGroup`:

| Prop            | Type                          | Default        | Description |
| --------------- | ----------------------------- | -------------- | ----------- |
| `direction`     | `'horizontal' \| 'vertical'`  | `'horizontal'` | Side by side, or stacked. |
| `sizes`         | `number[]`                    | —              | Every panel's size in percent, controlled. |
| `onSizesChange` | `(sizes: number[]) => void`   | —              | Called as a handle moves. Store the sizes to restore a layout, and pass them back as `sizes` or as each panel's `defaultSize`. |

`ResizablePanel`:

| Prop          | Type     | Default | Description |
| ------------- | -------- | ------- | ----------- |
| `defaultSize` | `number` | a share of what is left | Starting size in percent. |
| `minSize`     | `number` | `10`    | Smallest size in percent. |
| `maxSize`     | `number` | `100`   | Largest size in percent. |

`ResizableHandle`:

| Prop         | Type      | Default           | Description |
| ------------ | --------- | ----------------- | ----------- |
| `withHandle` | `boolean` | `false`           | Draw a grip on the handle. |
| `aria-label` | `string`  | `'Resize panels'` | The handle's accessible name. |

The group needs a size in the resize direction: give a horizontal group's parent a height, or put
the group in a flex column. Each handle is a focusable `role="separator"` whose `aria-valuenow` is
the size of the panel before it, with `aria-valuemin`, `aria-valuemax` and `aria-controls`. The
arrow keys move it by 5% (1% with Shift); Home and End take the panel before it to its smallest and
largest. What one panel gains, its neighbour gives up, within both panels' limits. The pointer is
captured while dragging, so a fast drag cannot lose the handle. Classes: `.sui-resizable`,
`--horizontal` / `--vertical`, `__panel`, `__handle`, `__grip`.

## Accessibility

- `AppShellHeader` renders `<header>`, `AppShellContent` renders `<main>` and `AppShellBottomNav` renders `<nav aria-label="Primary">`, so the page has banner, main and navigation landmarks without extra markup. If the page also has a `SidebarNav` ("Main"), keep the labels distinct.
- `SkipToContent` is the first tab stop and moves focus to `<main>` (`tabIndex={-1}`), bypassing the sidebar.
- `PageHeader` renders a real heading at the level you choose. Keep one `h1` per page. The back button has an accessible name (`backLabel`).
- `BottomNavItem` and the current `SidebarMenuItem` expose `aria-current="page"`. The `BottomNavItem` badge text is part of the button's accessible name (see [BottomNavItem](#bottomnavitem)).
- `ScrollToTop` has an accessible name, only appears when it is useful, and jumps instead of animating under reduced motion.
- While the sidebar drawer is open, the header, content and skip link are `inert`. See [Sidebar](./sidebar.md#mobile-drawer).
- `Stack`, `Grid` and `Container` add no roles; choose `as` for the semantics (`ul` for a list of cards, `main` for the page).
- `ResizableHandle` is a keyboard-operable separator. Name it after what it resizes when a page has more than one.

See [Accessibility](../accessibility.md).

## Related

- [Sidebar](./sidebar.md): `Sidebar`, `SidebarNav`, `SidebarTrigger`
- [Navigation](./navigation.md): `Breadcrumb` for the `PageHeader` eyebrow, `SectionTabs` and `Tabs` under it
- [Next.js](../nextjs.md): root layout setup and server/client boundaries
- [Color mode](./color-mode.md): `ColorModeToggle` and `ColorModeScript` in the header
- [Button](./button.md)
- [Theming](../theming.md)
- [Troubleshooting](../troubleshooting.md)
