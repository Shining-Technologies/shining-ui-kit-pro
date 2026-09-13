# Navigation

Components for moving around within a page and between pages. This family covers tabs, section links, accordions, collapsibles, breadcrumbs and pagination. `Tabs`, `Accordion` and `Collapsible` are styled wrappers around Radix UI primitives; the others are this package's own markup.

```tsx
import {
  Accordion,
  Breadcrumb,
  Collapsible,
  Pagination,
  SectionTabs,
  Tabs,
} from '@shining-technologies/ui' // or '@shining-technologies/ui/navigation'
```

**Server and client.** `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator` and `BreadcrumbEllipsis` come from a file with no `'use client'` directive, so they are Server Components. `Tabs` (and its parts), `Accordion` (and its parts), `Collapsible` (and its parts) and `Pagination` come from a `'use client'` file, and so does `SectionTabs`. Client components can still be rendered from a Server Component with serialisable props. `Tabs defaultValue="a"` works there, but `onValueChange`, `onPageChange` and other function props must come from a client component.

- [Tabs](#tabs)
- [SectionTabs](#sectiontabs)
- [Accordion](#accordion)
- [Collapsible](#collapsible)
- [Breadcrumb](#breadcrumb)
- [Pagination](#pagination)

## Tabs

Panels in one place, switched by a tab list. This is Radix Tabs with the package's styles: `role="tablist"`, `tab` and `tabpanel` semantics, and arrow-key movement.

```tsx
<Tabs defaultValue="summary" appearance="underline">
  <TabsList aria-label="Invoice">
    <TabsTrigger value="summary">Summary</TabsTrigger>
    <TabsTrigger value="lines">Line items</TabsTrigger>
    <TabsTrigger value="history" disabled>
      History
    </TabsTrigger>
  </TabsList>
  <TabsContent value="summary">…</TabsContent>
  <TabsContent value="lines">…</TabsContent>
</Tabs>
```

### Tabs

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `appearance` | `'pills' \| 'underline'` | `'pills'` | `pills` is a segmented track and reads as a control or filter. `underline` reads as sections. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` (Radix) | `vertical` also adds `.sui-tabs--vertical`, which puts the list beside the panels. |

Also accepts Radix Tabs `Root` props: `value`, `defaultValue`, `onValueChange`, `activationMode`, `dir`, and the `<div>` props. Use `value` with `onValueChange` for controlled tabs, or `defaultValue` for uncontrolled ones.

### TabsList, TabsTrigger, TabsContent

| Part | Accepts | Required |
| ---- | ------- | -------- |
| `TabsList` | Radix `List` props (`loop`, …) | — |
| `TabsTrigger` | Radix `Trigger` props (`disabled`, …) | `value` |
| `TabsContent` | Radix `Content` props (`forceMount`, …) | `value` |

Keyboard (Radix): ←/→ (↑/↓ when vertical) move between tabs, Home/End go to the first or last tab, and Tab moves into the active panel. With the default `activationMode="automatic"`, moving focus also selects the tab.

Hooks: `[data-slot="tabs" | "tabs-list" | "tabs-trigger" | "tabs-content"]`, `.sui-tabs`, `.sui-tabs--underline`, `.sui-tabs--vertical`, `.sui-tabs__list`, `.sui-tabs__trigger`, `.sui-tabs__content`. The active trigger has `data-state="active"`.

## SectionTabs

A row of section links that looks like tabs. Use it when each "tab" is really a separate page or route, or a filter over one list. It renders a `role="group"` wrapper around `<button>`s, with `aria-current="page"` on the selected one. It is not a `tablist`, because it does not own panels. It also has no arrow-key movement; Tab moves between the buttons.

```tsx
'use client'

import { usePathname, useRouter } from 'next/navigation'
import { SectionTabs } from '@shining-technologies/ui'

const tabs = [
  { id: '/jobs', label: 'All' },
  { id: '/jobs/today', label: 'Today', count: 4 },
  { id: '/jobs/archived', label: 'Archived', disabled: true },
]

export function JobSections() {
  const pathname = usePathname()
  const router = useRouter()
  return <SectionTabs tabs={tabs} value={pathname} onValueChange={(id) => router.push(id)} />
}
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `tabs` | `SectionTab[]` | — | Required. The tabs, in order. |
| `value` | `string` | — | Controlled selected id. |
| `defaultValue` | `string` | id of the first tab | Initial selected id while uncontrolled. |
| `onValueChange` | `(id: string) => void` | — | Called when a different tab is clicked, in controlled and uncontrolled mode. Not called for the tab that is already selected. |
| `appearance` | `'underline' \| 'pills'` | `'underline'` | `underline` reads as sections of a page; `pills` reads as a filter. |
| `fill` | `boolean` | `false` | Stretch the tabs to fill the row, for a two- or three-way split. |
| `aria-label` | `string` | — | Names the group. |

Also accepts all `<div>` props except `onChange`; a `role` you pass replaces `group`. The ref is forwarded to the `<div>`.

**`SectionTab`**

| Field | Type | Description |
| ----- | ---- | ----------- |
| `id` | `string` | Required. The value reported by `onValueChange`. |
| `label` | `ReactNode` | Required. |
| `count` | `number` | A count after the label. `0` is shown. |
| `icon` | `ReactNode` | Before the label (`aria-hidden`). |
| `disabled` | `boolean` | Disables the button. |

When uncontrolled and nothing has been selected yet, the first tab is current. This also applies to tabs that arrive after the first render, for example once loaded. In controlled mode, a `value` that matches no tab leaves none current.

Hooks: `[data-slot="section-tabs"]`, `.sui-section-tabs`, `.sui-section-tabs--pills`, `.sui-section-tabs--fill`, `.sui-section-tabs__tab`, `__icon`, `__label`, `__count`. The current tab is `[aria-current="page"]`.

**Tabs or SectionTabs?** Use `Tabs` when the panels are on the page and switching does not change the URL. Use `SectionTabs` when each choice is a route, or a filter that re-renders the same list.

## Accordion

Stacked sections that expand and collapse. This is Radix Accordion with the package's styles and an open/close animation.

```tsx
<Accordion type="single" collapsible defaultValue="shipping" appearance="separated">
  <AccordionItem value="shipping">
    <AccordionTrigger>Shipping</AccordionTrigger>
    <AccordionContent>Two to five business days.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="returns">
    <AccordionTrigger>Returns</AccordionTrigger>
    <AccordionContent>Within 30 days of delivery.</AccordionContent>
  </AccordionItem>
</Accordion>
```

### Accordion

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `appearance` | `'bordered' \| 'separated'` | `'bordered'` | `bordered` separates items with a shared rule. `separated` gives each item its own bordered card. |

Also accepts Radix Accordion `Root` props. `type` is required: `'single'` (with `value`/`defaultValue: string`, `onValueChange` and `collapsible`) or `'multiple'` (with `value`/`defaultValue: string[]`). Also `disabled`, `dir`, `orientation`. The exported `AccordionProps` type is these Radix `Root` props plus `appearance`.

### AccordionItem, AccordionTrigger, AccordionContent

| Part | Accepts | Notes |
| ---- | ------- | ----- |
| `AccordionItem` | Radix `Item` props | `value` is required. `disabled` disables the item. |
| `AccordionTrigger` | Radix `Trigger` props, plus `headingLevel?: 1 \| 2 \| 3 \| 4 \| 5 \| 6` (default `3`) | Rendered inside a heading of that level, followed by a chevron icon. Props type: `AccordionTriggerProps`. |
| `AccordionContent` | Radix `Content` props | Children are wrapped in `<div class="sui-accordion__body">`. |

Keyboard (Radix): Enter or Space toggles the focused item, ↓/↑ move between triggers, and Home/End go to the first or last trigger.

Hooks: `[data-slot="accordion" | "accordion-item" | "accordion-trigger" | "accordion-content"]`, `.sui-accordion`, `.sui-accordion--separated`, `.sui-accordion__item`, `__trigger`, `__chevron`, `__content`, `__body`. Open triggers and content have `data-state="open"`.

## Collapsible

A single region shown and hidden by a trigger. `Collapsible` and `CollapsibleTrigger` are the Radix primitives, re-exported unchanged. `CollapsibleContent` adds the package's open/close animation.

```tsx
'use client'

import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@shining-technologies/ui'

export function AdvancedOptions() {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="ghost">Advanced options</Button>
      </CollapsibleTrigger>
      <CollapsibleContent>…</CollapsibleContent>
    </Collapsible>
  )
}
```

| Part | Accepts |
| ---- | ------- |
| `Collapsible` | Radix Collapsible `Root` props: `open`, `defaultOpen`, `onOpenChange`, `disabled`, and `<div>` props. |
| `CollapsibleTrigger` | Radix `Trigger` props, including `asChild`. It has no styles of its own, so use `asChild` with a `Button` or your own element. |
| `CollapsibleContent` | Radix `Content` props (`forceMount`, …). |

The trigger gets `aria-expanded` and `aria-controls` from Radix. Hooks: `[data-slot="collapsible-content"]`, `.sui-collapsible__content` (with `data-state="open" | "closed"`).

## Breadcrumb

The path from the top of the site to the current page. The parts are plain markup: a `<nav aria-label="Breadcrumb">` around an ordered list. Separators are not added for you; place a `BreadcrumbSeparator` between items.

```tsx
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbEllipsis />
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/orders">Orders</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Order #1042</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

| Part | Element | Accepts | Notes |
| ---- | ------- | ------- | ----- |
| `Breadcrumb` | `<nav>` | All `<nav>` props | `aria-label="Breadcrumb"`; pass `aria-label` to replace it. No class of its own. |
| `BreadcrumbList` | `<ol>` | All `<ol>` props | `.sui-breadcrumb__list`: a wrapping flex row. |
| `BreadcrumbItem` | `<li>` | All `<li>` props | `.sui-breadcrumb__item`. |
| `BreadcrumbLink` | `<a>` | All `<a>` props | `.sui-breadcrumb__link sui-focusable`. |
| `BreadcrumbPage` | `<span>` | All `<span>` props | The current page: `role="link"`, `aria-disabled="true"`, `aria-current="page"`. Not a link. |
| `BreadcrumbSeparator` | `<li>` | All `<li>` props | `role="presentation"`, `aria-hidden="true"`. Children replace the default `ChevronRightIcon`. Place it directly in `BreadcrumbList`. |
| `BreadcrumbEllipsis` | `<span>` | All `<span>` props, plus `label?: string` (default `'More'`) | Marks collapsed levels: a decorative `MoreIcon` followed by `label` as visually hidden text. Place it inside a `BreadcrumbItem`. Props type: `BreadcrumbEllipsisProps`. |

Every part forwards its ref to the element listed.

**With a router link.** `BreadcrumbLink` always renders `<a>` and has no `asChild`. For `next/link` or React Router, put your link directly in `BreadcrumbItem` and give it the same classes:

```tsx
import Link from 'next/link'

<BreadcrumbItem>
  <Link href="/orders" className="sui-breadcrumb__link sui-focusable">
    Orders
  </Link>
</BreadcrumbItem>
```

To build the trail from your sidebar tree, use `getSidebarTrail` and `matchSidebarPath`; see [Sidebar](./sidebar.md#tree-helpers).

## Pagination

Standalone page navigation for lists that are not tables. The numbered window comes from `getPageNumbers` in [core](../api/core.md), the same function the data table uses. When there are more pages than slots, the number of slots stays fixed (`siblings × 2 + 5`), so the control does not change width while you page.

```tsx
'use client'

import { useState } from 'react'
import { Pagination } from '@shining-technologies/ui'

export function ResultsPager({ pageCount }: { pageCount: number }) {
  const [page, setPage] = useState(1)
  return <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
}
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `page` | `number` | — | Required. The current page, **1-based**. Not clamped: keep it within `1…pageCount`. |
| `pageCount` | `number` | — | Required. Total pages. Values below 1 render a single page. |
| `onPageChange` | `(page: number) => void` | — | Required. Called with the 1-based page to go to. The component is always controlled. |
| `siblings` | `number` | `1` | Numbered pages shown on each side of the current page. |
| `labels` | `{ previous?: ReactNode; next?: ReactNode; label?: string; previousPage?: string; nextPage?: string; page?: (page: number) => string }` | — | `previous` and `next` replace the visible chevron icons. `label` names the landmark (default `'Pagination'`). `previousPage` and `nextPage` name the arrow buttons (defaults `'Previous page'`, `'Next page'`). `page` names a numbered button from its 1-based page (default `` (page) => `Page ${page}` ``). |

Also accepts all `<nav>` props. The ref is forwarded to the `<nav>`.

- Previous is disabled when `page <= 1`, and Next when `page >= pageCount`.
- Page buttons are named "Page *n*", and the current one has `aria-current="page"`. Gaps are shown as a decorative, `aria-hidden` ellipsis.
- `labels.previous` and `labels.next` change only what is visible. Set `labels.previousPage`, `labels.nextPage` and `labels.page` to change the accessible names, for example to translate them:

```tsx
<Pagination
  page={page}
  pageCount={12}
  onPageChange={setPage}
  labels={{
    label: 'Seiten',
    previousPage: 'Vorherige Seite',
    nextPage: 'Nächste Seite',
    page: (n) => `Seite ${n}`,
  }}
/>
```

Hooks: `[data-slot="pagination"]`, `.sui-pager`, `.sui-pager__item` (current: `[aria-current="page"]`), `.sui-pager__ellipsis`.

For tables, use the `DataTable`'s built-in pagination instead; see [Data table](../data-table.md).

## Accessibility

- `Tabs` and `Accordion` follow the WAI-ARIA tabs and accordion patterns through Radix: roles, `aria-selected`/`aria-expanded`, `aria-controls` and roving keyboard focus. `AccordionTrigger` sits in a heading so each panel has one: `<h3>` by default, or the level set with `headingLevel` to fit the page outline.
- `SectionTabs` deliberately uses buttons with `aria-current="page"` instead of tab roles, because it does not control panels. It is a `group`, named by `aria-label`, and has no arrow-key navigation. When it is the page's route navigation and should be a landmark, wrap it in `<nav aria-label="…">`.
- `Collapsible` exposes `aria-expanded` on its trigger. Give the trigger a visible text label.
- `Breadcrumb` is a named `navigation` landmark with an ordered list. The current page has `aria-current="page"`. Separators are hidden from assistive technology; the ellipsis is read as its `label` ("More"). If collapsed levels can be expanded, put the ellipsis inside a real button.
- `Pagination` is a `navigation` landmark named "Pagination", with named page buttons and the current page marked. Every accessible name can be changed through `labels`.
- Tab triggers, accordion triggers, section tab buttons, breadcrumb links and pagination buttons use the shared `sui-focusable` focus ring. `CollapsibleTrigger` has no styles, so the element you pass with `asChild` provides the ring. Accordion and collapsible animations are removed under `prefers-reduced-motion: reduce`.

See [Accessibility](../accessibility.md).

## Related

- [Sidebar](./sidebar.md): the application navigation tree, and `getSidebarTrail` for breadcrumbs
- [Layout](./layout.md): `PageHeader`, which takes tabs as children and a breadcrumb as `eyebrow`
- [Data table](../data-table.md): table pagination
- [Core API](../api/core.md): `getPageNumbers`
- [Button](./button.md): for `CollapsibleTrigger asChild`
- [Icons](./icons.md)
- [Next.js](../nextjs.md)
