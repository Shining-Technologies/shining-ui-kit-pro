# Navigation

Components for moving around within a page, between pages and through a task. This family covers tabs, section links, segmented controls, accordions, collapsibles, breadcrumbs, pagination, steppers, menus (a context menu, a menubar and a command menu), vertical navigation and the navigation rail. `Tabs`, `SegmentedControl`, `Accordion`, `Collapsible`, `ContextMenu` and `Menubar` are styled wrappers around Radix UI primitives; the others are this package's own markup.

```tsx
import {
  Accordion,
  Breadcrumb,
  Collapsible,
  CommandMenu,
  ContextMenu,
  Menubar,
  NavigationRail,
  Pagination,
  SectionTabs,
  SegmentedControl,
  Stepper,
  Tabs,
  VerticalNav,
} from '@shining-technologies/ui' // or '@shining-technologies/ui/navigation'
```

**Server and client.** These come from files with no `'use client'` directive, so they are Server Components:

- `Breadcrumb` and its parts (`BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis`)
- `VerticalNav`, `VerticalNavSection` and `VerticalNavItem`
- `NavigationRail` and `NavigationRailItem`
- `MenuShortcut`

These come from `'use client'` files:

- `Tabs`, `Accordion`, `Collapsible`, `ContextMenu` and `Menubar`, with their parts
- `SectionTabs`, `SegmentedControl`, `Pagination`, `Stepper`, `Command` and `CommandMenu`

Client components can still be rendered from a Server Component with serialisable props. `Tabs defaultValue="a"` works there, but function props such as `onValueChange`, `onPageChange`, `onStepClick` and `onSelect` must come from a client component.

**Already in other families.** Some navigation lives elsewhere in the package:

- The dropdown menu is `DropdownMenu`; see [Overlay](./overlay.md).
- The collapsible sidebar and its groups are `Sidebar`, `SidebarTrigger` and `SidebarSection`; see [Sidebar](./sidebar.md).
- The mobile bottom navigation is `AppShellBottomNav` with `BottomNavItem`; see [Layout](./layout.md).

On this page:

- [Tabs](#tabs)
- [SectionTabs](#sectiontabs)
- [SegmentedControl](#segmentedcontrol)
- [Accordion](#accordion)
- [Collapsible](#collapsible)
- [Breadcrumb](#breadcrumb)
- [Pagination](#pagination)
- [Stepper](#stepper)
- [ContextMenu](#contextmenu)
- [Menubar](#menubar)
- [MenuShortcut](#menushortcut)
- [Command and CommandMenu](#command-and-commandmenu)
- [VerticalNav](#verticalnav)
- [NavigationRail](#navigationrail)

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

## SegmentedControl

One choice out of two to five options, all visible at once: a view switch (List or Board) or a period (Day, Week or Month). This is Radix RadioGroup with the pill track of `Tabs`. It renders a `radiogroup` of `radio` buttons, so exactly one segment is selected and ←/→ move the selection.

```tsx
'use client'

import { useState } from 'react'
import { ColumnsIcon, LayoutIcon, ListIcon, SegmentedControl } from '@shining-technologies/ui'

export function ViewSwitch() {
  const [view, setView] = useState('list')
  return (
    <SegmentedControl
      aria-label="View"
      value={view}
      onValueChange={setView}
      options={[
        { value: 'list', label: 'List', icon: <ListIcon /> },
        { value: 'board', label: 'Board', icon: <ColumnsIcon /> },
        { value: 'grid', label: null, icon: <LayoutIcon />, 'aria-label': 'Grid' },
      ]}
    />
  )
}
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `options` | `SegmentedControlOption[]` | — | Required. The segments, in order. |
| `value` | `string` | — | Controlled selected value. |
| `defaultValue` | `string` | value of the first option | Initial value while uncontrolled. Without `value` or `defaultValue`, the first option is selected, so the control never has nothing chosen. |
| `onValueChange` | `(value: string) => void` | — | Called when the selection changes. |
| `size` | `'sm' \| 'default'` | `'default'` | `sm` matches the small control height. |
| `fill` | `boolean` | `false` | Stretch the segments to fill the row. |
| `aria-label` | `string` | — | Names the radio group. Always give one, or use `aria-labelledby`. |

Also accepts the other Radix RadioGroup `Root` props (`name`, `required`, `disabled`, `loop`) and `<div>` props. The orientation is always horizontal. The ref is forwarded to the root `<div>`.

**`SegmentedControlOption`**

| Field | Type | Description |
| ----- | ---- | ----------- |
| `value` | `string` | Required. |
| `label` | `ReactNode` | Required. Pass `null` for an icon-only segment, which is drawn square. |
| `icon` | `ReactNode` | Before the label (`aria-hidden`). |
| `disabled` | `boolean` | Disables the segment. The arrow keys skip it. |
| `aria-label` | `string` | The accessible name when `label` is not text. |

Keyboard (Radix): Tab moves into the group, onto the selected segment. The arrow keys move the selection, wrapping at the ends unless `loop={false}`.

Hooks: `[data-slot="segmented-control"]`, `.sui-segmented`, `.sui-segmented--sm`, `.sui-segmented--fill`, `.sui-segmented__item`, `__icon`, `__label`. The selected segment has `data-state="checked"`.

**Tabs, SectionTabs or SegmentedControl?** Use `Tabs` when the choice shows different panels. Use `SectionTabs` when each option is a route. Use `SegmentedControl` when the choice is a setting the page reads, such as a view or a period.

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
| `Breadcrumb` | `<nav>` | All `<nav>` props | `aria-label="Breadcrumb"`; pass `aria-label` to replace it. No class of its own; style it with `[data-slot="breadcrumb"]`. |
| `BreadcrumbList` | `<ol>` | All `<ol>` props | `.sui-breadcrumb__list`: a wrapping flex row. |
| `BreadcrumbItem` | `<li>` | All `<li>` props | `.sui-breadcrumb__item`. |
| `BreadcrumbLink` | `<a>` | All `<a>` props | `.sui-breadcrumb__link sui-focusable`. |
| `BreadcrumbPage` | `<span>` | All `<span>` props | The current page: `role="link"`, `aria-disabled="true"`, `aria-current="page"`. Not a link. |
| `BreadcrumbSeparator` | `<li>` | All `<li>` props | `role="presentation"`, `aria-hidden="true"`. Children replace the default `ChevronRightIcon`. Place it directly in `BreadcrumbList`. |
| `BreadcrumbEllipsis` | `<span>` | All `<span>` props, plus `label?: string` (default `'More'`) | Marks collapsed levels: a decorative `MoreIcon` followed by `label` as visually hidden text. Place it inside a `BreadcrumbItem`. Styling hook: `.sui-breadcrumb__separator`. Props type: `BreadcrumbEllipsisProps`. |

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

## Stepper

Progress through a task done in order, such as checkout, onboarding or a long form split into steps. It renders an ordered list. Each step shows an indicator (its number, a check when complete, or an alert icon on error), its label, an optional description, and a connector to the next step.

The stepper only shows where the user is. It does not render step content or buttons. Render the current step's form beside it, and change `activeStep` when the user moves on.

```tsx
'use client'

import { useState } from 'react'
import { Button, Stepper } from '@shining-technologies/ui'

const steps = [
  { id: 'cart', label: 'Cart' },
  { id: 'address', label: 'Address', description: 'Where we deliver' },
  { id: 'payment', label: 'Payment' },
  { id: 'extras', label: 'Extras', optional: true },
]

export function Checkout() {
  const [step, setStep] = useState(0)
  return (
    <>
      <Stepper aria-label="Checkout" steps={steps} activeStep={step} onStepClick={setStep} />
      {/* …the form for steps[step]… */}
      <Button onClick={() => setStep((s) => s + 1)}>Continue</Button>
    </>
  )
}
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `steps` | `StepperStep[]` | — | Required. |
| `activeStep` | `number` | — | Required. The current step, **0-based**. Earlier steps are `complete` and later ones `upcoming`. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | `vertical` stacks the steps, with the connector running down under each indicator. |
| `onStepClick` | `(index: number, step: StepperStep) => void` | — | Makes steps clickable. By default only `complete` and `error` steps can be clicked; the current step never can. |
| `linear` | `boolean` | `true` | With `false`, every step except the current one can be clicked. |
| `size` | `'sm' \| 'default'` | `'default'` | `sm` makes the indicators smaller. |
| `labels` | `{ complete?: string; current?: string; error?: string; optional?: string }` | `'Completed'`, `'Current'`, `'Error'`, `'Optional'` | The status text read after each label (visually hidden), and the visible "Optional" text. |

Also accepts `<ol>` props. The ref is forwarded to the `<ol>`.

**`StepperStep`**

| Field | Type | Description |
| ----- | ---- | ----------- |
| `id` | `string` | Required. Used as the React key. |
| `label` | `ReactNode` | Required. |
| `description` | `ReactNode` | A line under the label. |
| `status` | `'complete' \| 'current' \| 'upcoming' \| 'error'` | Replaces the status worked out from `activeStep`. Mostly used for `'error'`. |
| `optional` | `boolean` | Shows "Optional" under the label. |
| `disabled` | `boolean` | The step cannot be clicked, and is drawn faded. |

- Each step is an `<li>`, and the current one has `aria-current="step"`. A clickable step contains a `<button>`; any other step contains a `<span>`.
- The status is part of the step's text ("Payment (Current)"), so it is not shown by colour alone.
- Horizontal steps are equal columns, with each step's text centred under its indicator and the connector running between indicators. A container query makes the row compact below `36rem` wide, for phones and side panels: smaller indicators and labels, and descriptions and "Optional" hidden visually but still read by screen readers. Long labels wrap within their column. For more than five or six steps on a phone, use `orientation="vertical"`.

Hooks: `[data-slot="stepper"]` (with `data-orientation`), `.sui-stepper`, `.sui-stepper--vertical`, `.sui-stepper--sm`, `.sui-stepper__step` (with `data-status`), `__button`, `__indicator`, `__text`, `__label`, `__optional`, `__description`, `__connector`. The variable `--sui-stepper-size` sets the indicator's diameter.

## ContextMenu

A menu opened by right-click, or by a long press on touch screens. This is Radix Context Menu. Its items use the same row as `DropdownMenu`, and it has the same parts: items (with `destructive`), checkbox and radio items, labels, separators, groups and submenus.

Nothing on screen shows that a context menu exists, so treat it as a shortcut. Every action in it should also be available from a visible control, such as a row's `DropdownMenu`.

```tsx
<ContextMenu>
  <ContextMenuTrigger className="job-card">…</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem onSelect={open}>Open</ContextMenuItem>
    <ContextMenuItem onSelect={copyLink}>
      Copy link <MenuShortcut>⌘C</MenuShortcut>
    </ContextMenuItem>
    <ContextMenuSub>
      <ContextMenuSubTrigger>Set status</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        <ContextMenuRadioGroup value={status} onValueChange={setStatus}>
          <ContextMenuRadioItem value="scheduled">Scheduled</ContextMenuRadioItem>
          <ContextMenuRadioItem value="done">Completed</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuSubContent>
    </ContextMenuSub>
    <ContextMenuCheckboxItem checked={pinned} onCheckedChange={setPinned}>
      Pinned
    </ContextMenuCheckboxItem>
    <ContextMenuSeparator />
    <ContextMenuItem destructive onSelect={remove}>
      Delete
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

| Part | Accepts | Notes |
| ---- | ------- | ----- |
| `ContextMenu` | Radix `Root` props (`onOpenChange`, `modal`, `dir`) | Re-exported unchanged. |
| `ContextMenuTrigger` | Radix `Trigger` props (`disabled`, `asChild`) | The area that opens the menu. It has no visible styles; its class only turns off the iOS long-press callout. |
| `ContextMenuContent` | Radix `Content` props | Portalled like `DropdownMenuContent`: into the nearest `PortalContainerProvider`, or `<body>`. |
| `ContextMenuItem` | Radix `Item` props, plus `destructive?: boolean` | `destructive` colours the item as a delete. |
| `ContextMenuCheckboxItem`, `ContextMenuRadioItem` | Radix props | A check or a dot in the indicator column. |
| `ContextMenuSub`, `ContextMenuSubTrigger`, `ContextMenuSubContent` | Radix props | The sub trigger draws its own chevron. |
| `ContextMenuLabel`, `ContextMenuSeparator`, `ContextMenuGroup`, `ContextMenuRadioGroup` | Radix props | |

Keyboard (Radix): once the menu is open, ↑/↓ move between items, → opens a submenu and ← closes it, Enter or Space chooses, and Escape closes.

Hooks: `[data-slot="context-menu-trigger" | "context-menu-content"]`, `.sui-context-menu__trigger`, `.sui-menu.sui-menu--context`, and the shared `.sui-menu__item`, `__label`, `__separator`, `__indicator`, `__chevron`.

## Menubar

A row of menus like a desktop application's: File, Edit, View. This is Radix Menubar, with the `menubar` role. Once one menu is open, ←/→ move to the next menu, and moving the pointer along the bar switches the open menu. Its items are the same as `DropdownMenu`'s.

```tsx
<Menubar aria-label="Editor">
  <MenubarMenu>
    <MenubarTrigger>File</MenubarTrigger>
    <MenubarContent>
      <MenubarItem onSelect={newFile}>
        New file <MenuShortcut>⌘N</MenuShortcut>
      </MenubarItem>
      <MenubarSub>
        <MenubarSubTrigger>Open recent</MenubarSubTrigger>
        <MenubarSubContent>…</MenubarSubContent>
      </MenubarSub>
      <MenubarSeparator />
      <MenubarItem disabled>Export as PDF</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu>
    <MenubarTrigger>View</MenubarTrigger>
    <MenubarContent>
      <MenubarCheckboxItem checked={grid} onCheckedChange={setGrid}>
        Show grid
      </MenubarCheckboxItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>
```

| Part | Accepts | Notes |
| ---- | ------- | ----- |
| `Menubar` | Radix `Root` props (`value`, `defaultValue`, `onValueChange`, `loop`, `dir`) and `<div>` props | A bordered row. Give it an `aria-label`. |
| `MenubarMenu` | Radix `Menu` props (`value`) | One menu. Re-exported unchanged. |
| `MenubarTrigger` | Radix `Trigger` props | Highlighted while its menu is open. |
| `MenubarContent` | Radix `Content` props | Portalled. Defaults: `align="start"`, `alignOffset={-4}`, `sideOffset={6}`. |
| `MenubarItem` | Radix `Item` props, plus `destructive?: boolean` | |
| `MenubarCheckboxItem`, `MenubarRadioItem`, `MenubarRadioGroup`, `MenubarSub`, `MenubarSubTrigger`, `MenubarSubContent`, `MenubarLabel`, `MenubarSeparator`, `MenubarGroup` | Radix props | As in `DropdownMenu`. |

Hooks: `[data-slot="menubar" | "menubar-trigger" | "menubar-content"]`, `.sui-menubar`, `.sui-menubar__trigger` (with `data-state="open"`), `.sui-menu.sui-menu--menubar`.

A menubar suits tools with many commands, such as an editor. For a page with a few actions, a `DropdownMenu` or a row of buttons is easier to find.

## MenuShortcut

The key hint at the end of a menu item: `⌘S`, `Ctrl+Shift+P`. It is text only and does not bind the key; the application does that. It works in `DropdownMenuItem`, `ContextMenuItem` and `MenubarItem`.

```tsx
<DropdownMenuItem onSelect={save}>
  Save <MenuShortcut>⌘S</MenuShortcut>
</DropdownMenuItem>
```

It renders `<span class="sui-menu__shortcut">`, pushed to the end of the row, and accepts all `<span>` props. Screen readers read it as part of the item's name. To stop that, pass `aria-hidden`.

## Command and CommandMenu

A search box over a list of commands. `Command` is the inline version, for a page, a popover or an empty state. `CommandMenu` puts it in a dialog opened with ⌘K on a Mac or Ctrl+K elsewhere: a command palette.

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { CommandMenu, InboxIcon, PlusIcon, type CommandItem } from '@shining-technologies/ui'

export function Palette() {
  const router = useRouter()
  const items: CommandItem[] = [
    {
      id: 'new',
      label: 'New job',
      group: 'Create',
      icon: <PlusIcon />,
      shortcut: '⌘N',
      onSelect: () => router.push('/jobs/new'),
    },
    {
      id: 'inbox',
      label: 'Inbox',
      group: 'Go to',
      icon: <InboxIcon />,
      keywords: ['messages'],
      onSelect: () => router.push('/inbox'),
    },
    { id: 'billing', label: 'Billing', group: 'Go to', disabled: true, description: 'Owners only' },
  ]
  return <CommandMenu items={items} />
}
```

A keyboard shortcut cannot be discovered by looking, so also give people a visible way in, such as a search button in the header that sets `open`.

### Command

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `items` | `CommandItem[]` | — | Required. |
| `onSelect` | `(item: CommandItem) => void` | — | Any item chosen, by Enter or by click. Runs after the item's own `onSelect`. |
| `query` | `string` | — | Controlled search text. |
| `defaultQuery` | `string` | `''` | Initial search text while uncontrolled. |
| `onQueryChange` | `(query: string) => void` | — | |
| `filter` | `(item: CommandItem, query: string) => boolean` | `defaultCommandFilter` | The default matches when every word typed appears in the item's label, group or keywords, ignoring case. |
| `placeholder` | `string` | `'Type a command or search…'` | |
| `emptyMessage` | `ReactNode` | `'No results.'` | Shown when nothing matches. |
| `resultsMessage` | `(count: number) => string` | `"1 result"` / `"N results"` | Announced in a live region while a search is typed. |
| `inputLabel` | `string` | `'Search commands'` | The accessible name of the input and of the list. |
| `autoFocus` | `boolean` | — | Focus the input on mount. |
| `footer` | `ReactNode` | — | Under the list, for example key hints. `<kbd>` elements inside it are styled. |

Also accepts `<div>` props except `onSelect`. The ref is forwarded to the root `<div>`.

**`CommandItem`**

| Field | Type | Description |
| ----- | ---- | ----------- |
| `id` | `string` | Required. Unique within `items`. |
| `label` | `string` | Required. Shown, and searched. |
| `group` | `string` | Items with the same group are listed under that heading, in order of first appearance. |
| `icon` | `ReactNode` | Before the label (`aria-hidden`). |
| `shortcut` | `ReactNode` | At the end of the row. Text only, and hidden from screen readers. |
| `description` | `ReactNode` | A second line. Not searched. |
| `keywords` | `string[]` | More words to match, such as synonyms or ids. |
| `disabled` | `boolean` | Listed, but skipped by the arrow keys and not chosen on click. |
| `onSelect` | `() => void` | Runs when this item is chosen. |

Keyboard: focus stays in the input. ↑/↓ move the highlighted option, skipping disabled items and wrapping at the ends, and Enter runs it. Typing moves the highlight to the first match. Moving the mouse over an option highlights it too.

### CommandMenu

Takes every `Command` prop except `autoFocus`, plus:

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `open` | `boolean` | — | Controlled open state. |
| `defaultOpen` | `boolean` | `false` | |
| `onOpenChange` | `(open: boolean) => void` | — | |
| `shortcut` | `string \| false` | `'mod+k'` | Opens and closes the menu from anywhere on the page. `mod` means ⌘ or Ctrl. Other examples: `'ctrl+shift+p'`, `'/'`. `false` turns the shortcut off. |
| `title` | `string` | `'Command menu'` | The dialog's accessible name. It is visually hidden. |
| `closeOnSelect` | `boolean` | `true` | Close after an item is chosen. |

The panel is a `DialogContent` with the class `.sui-command-dialog`. Focus is trapped inside it, it closes on Escape or a click outside, and focus returns to whatever had it before it opened. The search text is cleared each time it opens.

`matchesShortcut(event, shortcut)` is exported too, for binding keys with the same syntax yourself.

Hooks: `[data-slot="command" | "command-menu"]`, `.sui-command`, `__search`, `__input`, `__list`, `__group`, `__heading`, `__item` (with `data-highlighted` and `data-disabled`, on the shared `.sui-menu__item` row), `__icon`, `__text`, `__label`, `__description`, `__empty`, `__footer`.

## VerticalNav

A vertical list of links within one area of an app: settings sections, an account area, a docs table of contents. Each item is its own page or anchor, so the current one has `aria-current="page"` instead of tab semantics.

It is not `Sidebar`, which is the whole application's navigation, with collapse, a mobile drawer and a tree. It is not vertical `Tabs` either, which switch panels on one page without changing the URL.

```tsx
import Link from 'next/link'
import { VerticalNav, VerticalNavItem, VerticalNavSection } from '@shining-technologies/ui'

<VerticalNav aria-label="Settings">
  <VerticalNavSection title="Account">
    <VerticalNavItem href="/settings/profile" active>
      Profile
    </VerticalNavItem>
    <VerticalNavItem href="/settings/notifications" badge={2}>
      Notifications
    </VerticalNavItem>
    <VerticalNavItem asChild>
      <Link href="/settings/billing">Billing</Link>
    </VerticalNavItem>
  </VerticalNavSection>
</VerticalNav>
```

| Part | Element | Props |
| ---- | ------- | ----- |
| `VerticalNav` | `<nav>` | `appearance?: 'pills' \| 'line'` (default `'pills'`), plus `<nav>` props. `line` draws a rule down the start edge and colours the current item's stretch of it. Give it an `aria-label`. |
| `VerticalNavSection` | `<div>` around a `<ul>` | `title?: ReactNode`, a small heading. When `title` is a string it also names the list. Items must be inside a section; leave out `title` for an untitled group. |
| `VerticalNavItem` | `<li>` around an `<a>`, a `<button>` or your element | See below. |

**`VerticalNavItem`**

| Prop | Type | Description |
| ---- | ---- | ----------- |
| `href` | `string` | Renders an `<a>`. Without `href` and without `asChild`, the item is a `<button type="button">`. |
| `target`, `rel` | `string` | Passed to the `<a>`. |
| `active` | `boolean` | The current page: `aria-current="page"`. |
| `icon` | `ReactNode` | Before the label (`aria-hidden`). |
| `badge` | `ReactNode` | At the end of the row, such as a count or a `Badge`. It is part of the item's name. |
| `disabled` | `boolean` | A button gets `disabled`. A link loses its `href` and gets `aria-disabled="true"`, so it cannot be followed or focused. |
| `asChild` | `boolean` | Render your own link element (`next/link`, React Router) with the item's classes, through Radix Slot. The icon and badge go around the child's own children. |

Also accepts `HTMLElement` props (`onClick`, `className`, …). The ref is forwarded to the `<a>`, the `<button>` or your element.

Hooks: `[data-slot="vertical-nav" | "vertical-nav-item"]`, `.sui-vnav`, `.sui-vnav--line`, `__section`, `__title`, `__list`, `__entry`, `__item` (current: `[aria-current="page"]`), `__icon`, `__label`, `__badge`.

## NavigationRail

A narrow column of three to seven top-level destinations, each an icon with a short label under it. It suits tablet widths, and apps with too few destinations to need a sidebar.

It is different from the collapsed `Sidebar`. The sidebar's rail is the whole sidebar made narrow, with icons only and tooltips. This rail always shows its labels and has no tree. On phones, use `AppShellBottomNav`.

```tsx
<NavigationRail
  header={
    <Button size="icon" aria-label="New job">
      <PlusIcon />
    </Button>
  }
  footer={<UserAvatar name="Priya Shah" size="sm" />}
>
  <NavigationRailItem icon={<LayoutIcon />} label="Home" href="/" />
  <NavigationRailItem icon={<InboxIcon />} label="Inbox" href="/inbox" badge={12} active />
  <NavigationRailItem asChild icon={<FileIcon />} label="Files">
    <Link href="/files" />
  </NavigationRailItem>
</NavigationRail>
```

**`NavigationRail`**

| Prop | Type | Description |
| ---- | ---- | ----------- |
| `header` | `ReactNode` | Above the items: a logo, or a primary action. |
| `footer` | `ReactNode` | Pinned to the bottom: settings, the user's avatar. |
| `aria-label` | `string` | Defaults to `'Primary'`. |

Also accepts `<nav>` props. The rail is the full height of its container and 5rem wide; set `--sui-rail-width` to change the width. When the items do not fit, the list scrolls and the header and footer stay in place.

**`NavigationRailItem`**

| Prop | Type | Description |
| ---- | ---- | ----------- |
| `icon` | `ReactNode` | Required. Decorative (`aria-hidden`). |
| `label` | `ReactNode` | Required. Keep it to one short word; longer labels are truncated. |
| `href` | `string` | Renders an `<a>`. Without `href` and without `asChild`, the item is a `<button>`. |
| `active` | `boolean` | `aria-current="page"`, drawn as a pill behind the icon. |
| `badge` | `ReactNode` | A count or a short word on the icon. |
| `badgeLabel` | `string` | What screen readers hear for `badge`, after the label: "Inbox (3)". Defaults to the badge itself when it is a string or a number. |
| `disabled` | `boolean` | As for `VerticalNavItem`. |
| `asChild` | `boolean` | Render your own link element. Pass it with no children, for example `<Link href="/files" />`, because the icon and label come from these props. |

The ref is forwarded to the item element. Hooks: `[data-slot="navigation-rail" | "navigation-rail-item"]`, `.sui-rail`, `__header`, `__list`, `__entry`, `__item` (current: `[aria-current="page"]`), `__icon`, `__badge`, `__label`, `__footer`.

## Accessibility

- `Tabs` and `Accordion` follow the WAI-ARIA tabs and accordion patterns through Radix: roles, `aria-selected`/`aria-expanded`, `aria-controls` and roving keyboard focus. `AccordionTrigger` sits in a heading so each panel has one: `<h3>` by default, or the level set with `headingLevel` to fit the page outline.
- `SectionTabs` deliberately uses buttons with `aria-current="page"` instead of tab roles, because it does not control panels. It is a `group`, named by `aria-label`, and has no arrow-key navigation. When it is the page's route navigation and should be a landmark, wrap it in `<nav aria-label="…">`.
- `Collapsible` exposes `aria-expanded` on its trigger. Give the trigger a visible text label.
- `Breadcrumb` is a named `navigation` landmark with an ordered list. The current page has `aria-current="page"`. Separators are hidden from assistive technology; the ellipsis is read as its `label` ("More"). If collapsed levels can be expanded, put the ellipsis inside a real button.
- `Pagination` is a `navigation` landmark named "Pagination", with named page buttons and the current page marked. Every accessible name can be changed through `labels`.
- `SegmentedControl` is a `radiogroup`, so exactly one option is checked and the arrow keys move the choice. Name it with `aria-label`, and give each icon-only segment an `aria-label` of its own.
- `Stepper` is an ordered list with `aria-current="step"` on the current step. Each step's status is read as text after its label, and can be translated with `labels`.
- `ContextMenu` and `Menubar` follow the WAI-ARIA menu and menubar patterns through Radix. A context menu cannot be seen until it is opened, so every action in it must also be available somewhere visible.
- `Command` is a `combobox` input that controls a `listbox`. The highlighted option is linked with `aria-activedescendant`, groups are named by their headings, and the number of results is announced in a live region. `CommandMenu` is a named, focus-trapped dialog.
- `VerticalNav` and `NavigationRail` are `navigation` landmarks with `aria-current="page"` on the current item. When a page has more than one, give each a different `aria-label`. Rail badges are repeated as hidden text after the label.
- Tab triggers, segments, accordion triggers, section tab buttons, breadcrumb links, pagination buttons, stepper buttons, menubar triggers, vertical nav items and rail items use the shared `sui-focusable` focus ring. `CollapsibleTrigger` has no styles, so the element you pass with `asChild` provides the ring. Accordion and collapsible animations are removed under `prefers-reduced-motion: reduce`.

See [Accessibility](../accessibility.md).

## Related

- [Sidebar](./sidebar.md): the application navigation tree, the collapsible sidebar, sidebar groups, and `getSidebarTrail` for breadcrumbs
- [Overlay](./overlay.md): `DropdownMenu`, which shares its item row with `ContextMenu`, `Menubar` and `Command`, and `Dialog`, which `CommandMenu` is built on
- [Layout](./layout.md): `PageHeader`, which takes tabs as children and a breadcrumb as `eyebrow`, and `AppShellBottomNav` for phones
- [Data table](../data-table.md): table pagination
- [Core API](../api/core.md): `getPageNumbers`
- [Button](./button.md): for `CollapsibleTrigger asChild`
- [Icons](./icons.md)
- [Next.js](../nextjs.md)
