# Component Inventory — Shining Services Portal → `shining-ui-kit`

> **Status: proposal / list only. No code written yet.**
>
> This document is the exhaustive inventory of every component in
> `shining-services-portal/src/components`, its variants, its functionality and its
> server-side-loading behaviour — plus a gap analysis against what
> `shining-ui-kit` already ships, and a proposed extraction plan.
>
> **Source scanned:** `F:\Shining-remote\shining-service\shining-services-portal\src\components`
> **Total:** 542 `.tsx` files across 40 folders.
> **Target:** `F:\Shining-remote\Component-library\library-table` (`shining-ui-kit`).

---

## 0. How the source is organised

| Tier                      | Folder             | Files | What it is                                                                  |
| ------------------------- | ------------------ | ----- | --------------------------------------------------------------------------- |
| **0 — Primitives**        | `ui/`              | 53    | shadcn/ui "new-york" on Radix. Unstyled behaviour + CVA variants.           |
| **1 — Shared composites** | `common/`          | 57    | The real design system: DataTable, FormField suite, StatsCard, StatusBadge… |
| **2 — Layout / shell**    | `layout/`          | 29    | 4 role-aware app shells, sidebars, header, route guards.                    |
| **3 — Domain**            | 37 feature folders | ~400  | Business components. Mostly _patterns_ to extract, not components to lift.  |

The library's own layering (`ARCHITECTURE.md`) maps onto this cleanly:

```
COLOUR → PROJECT → THEME → ENGINE → STATE → RENDER MODEL → COMPONENTS → APPLICATION
                                                            ^tier 0/1/2   ^tier 3
```

Tier 3 stays in the portal. Tiers 0–2 are the library.

---

## 1. The exact design in use

Everything below is read from `src/index.css` and `src/lib/constants/areaAccents.ts`.
These are the numbers the extracted components must reproduce.

### 1.1 Brand seeds

| Token                    | Light                       | Dark                                 |
| ------------------------ | --------------------------- | ------------------------------------ |
| `--primary`              | `#01493b` (deep teal-green) | `oklch(0.705 0.213 47.604)` (orange) |
| `--primary-foreground`   | `#f0fdf4`                   | `oklch(0.98 0.016 73.684)`           |
| `--background`           | `#fafaf7` (warm off-white)  | `oklch(0.141 0.005 285.823)`         |
| `--card` / `--popover`   | `oklch(1 0 0)`              | `oklch(0.21 0.006 285.885)`          |
| `--ring`                 | `#01493b`                   | `oklch(0.408 0.123 38.172)`          |
| `--destructive`          | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)`          |
| `--muted-foreground`     | `oklch(0.50 0.016 285.938)` | `oklch(0.705 0.015 286.067)`         |
| `--border` (decorative)  | `oklch(0.92 0.004 286.32)`  | `oklch(1 0 0 / 10%)`                 |
| `--input` (control edge) | `oklch(0.64 0.006 286.32)`  | `oklch(1 0 0 / 40%)`                 |

> **Two deliberate accessibility decisions to preserve.** `--input` is a _different,
> darker_ value than `--border`: WCAG 1.4.11 needs 3:1 for a form-control boundary
> (measured 3.35:1 on white), while card edges and table rules are decorative and
> carry no such requirement. `--muted-foreground` was darkened from `0.552` to
> `0.50` because 11px column labels on the zinc-100 table header measured 4.39:1 —
> under the 4.5 AA floor; `0.50` measures 5.49:1.

Secondary brand ramp: `--color-primary-50 #f0fdf4`, `-100 #dcfce7`, `-500 #01493b`,
`-600 #0a6b5a`, `-700 #134e4a`. Orange accent: `--color-orange-500 #ff7f00`, `-600 #ff7033`.

### 1.2 Shape, type, scale

- `--radius: 0.65rem`, with derived `sm = r-4px`, `md = r-2px`, `lg = r`, `xl = r+4`, `2xl = r+8`, `3xl = r+12`, `4xl = r+16`.
- Font: `Inter, sans-serif`; `line-height: 1.5`; `font-synthesis: none`; antialiased.
- Breakpoint added: `xs: 475px`. Max widths added: `8xl: 88rem`, `9xl: 96rem`.
- Charts: `--chart-1 … --chart-5`, an amber → orange → brand-teal ramp.
- Sidebar owns a parallel token set (`--sidebar`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border`, `--sidebar-ring`).

### 1.3 Structural CSS conventions

| Class / rule                        | Purpose                                                                                                           |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `.page`                             | One page frame — `flex column; gap: 1rem; min-width: 0`. Replaced 36 ad-hoc root containers.                      |
| `.page-with-footer-actions`         | `padding-bottom: calc(6rem + var(--bottom-nav-height, 0rem))` so a sticky action bar never covers the last field. |
| `html { scrollbar-gutter: stable }` | Stops the content column jumping ~15px between short and long pages.                                              |
| `.skip-link`                        | WCAG 2.4.1, hand-written because Tailwind emits no `focus:not-sr-only`.                                           |
| `--bottom-nav-height`               | Set by layouts with a pinned bottom nav (contractor app).                                                         |

### 1.4 Motion

| Animation                                 | Use                                                                                                                 |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `--animate-row-glow` (1.1s ×3)            | Marks the row a user just added. Drawn as an **inset** ring — `border-collapse` rows don't paint outer box-shadows. |
| `--animate-live-pulse` (1.8s ∞)           | "Job running". **Opacity only** — it composites and can never reflow a neighbouring cell.                           |
| `--animate-phone-ring` (2s ∞)             | Incoming call.                                                                                                      |
| `--animate-collapsible-down/up`           | Radix collapsible, driven by `--radix-collapsible-content-height`.                                                  |
| `--animate-fade-in`, `--animate-slide-in` | Entry.                                                                                                              |

`@media (prefers-reduced-motion: reduce)` kills `live-pulse` and `phone-ring`.

### 1.5 Area accents — the portal's signature idea

`AREA_ACCENTS` maps each sidebar area to a hue. Shared components call
`useAreaAccent()` (route-derived) **instead of taking a colour prop**, so every page
picks up its section's colour automatically.

| Area                          | Hue     |
| ----------------------------- | ------- |
| `crm`                         | sky     |
| `archer`                      | violet  |
| `seo`                         | amber   |
| `business-ops`                | emerald |
| `finance`                     | teal    |
| …plus the remaining nav areas |         |

Each accent exposes five class strings: `text`, `surface` (`/10`), `border` (`/20`),
`solid`, `tab` (`data-[state=active]:…`). Consumed by `PageHeader` (the 1×7 rule),
`StatsCard` (icon chip), `EmptyState` (icon circle), `SectionTabs`.

> **Library note.** This is a _second_ theming axis on top of the project palette.
> It must become a token-driven `AccentProvider` in `shining-ui-kit`, not a
> hardcoded Tailwind class table, or it violates the "no hardcoded colour" rule
> enforced by `tests/tokens.test.ts`.

### 1.6 Toast styling

Sonner is overridden per type with deep OKLCH backgrounds: success `oklch(0.42 0.1 155)`,
error `oklch(0.52 0.15 25)`, warning `oklch(0.62 0.14 75)` (dark text), info
`oklch(0.48 0.11 250)`. The close button is re-flowed inline (`position: static; order: 9999; margin-inline-start: auto`).

---

## 2. Tier 0 — `ui/` primitives (53)

### 2.1 With CVA variants (exact values)

| Component                  | Variants                                                                                  | Sizes                                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **`button`**               | `default` · `destructive` · `outline` · `secondary` · `ghost` · `link`                    | `default` (h-9) · `sm` (h-8) · `lg` (h-10) · `icon` (size-9) · `icon-sm` (size-8) · `icon-lg` (size-10) |
| **`badge`**                | `default` · `secondary` · `destructive` · `outline`                                       | — (pill: `rounded-full px-2 py-0.5 text-xs`)                                                            |
| **`alert`**                | `default` · `destructive`                                                                 | — (grid layout, auto-adjusts for a leading `svg`)                                                       |
| **`toggle`**               | `default` · `outline`                                                                     | `default` · `sm` · `lg`                                                                                 |
| **`item`**                 | `default` · `outline` · `muted`                                                           | `default` (p-4) · `sm` (py-3 px-4)                                                                      |
| `itemMedia`                | `default` · (icon/image variants)                                                         | —                                                                                                       |
| **`field`**                | orientation: `vertical` · `horizontal` · `responsive` (container-query `@md/field-group`) | —                                                                                                       |
| **`empty`** (`emptyMedia`) | `default` · (icon variant)                                                                | —                                                                                                       |
| **`input-group`**          | addon: block-start / block-end / inline-start / inline-end                                | button: `xs` (default) · `sm` · `icon-xs` · `icon-sm`                                                   |
| **`button-group`**         | orientation: `horizontal` · `vertical`                                                    | —                                                                                                       |

> Note: `button` uses `rounded-sm` (i.e. `radius − 4px ≈ 6.4px`), **not** `rounded-md`.
> `badge` is a full pill. These two differ from stock shadcn and are load-bearing for the look.

### 2.2 Compound components (no CVA — parts API)

| Component     | Parts                                                                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `card`        | `Card` · `CardHeader` · `CardTitle` · `CardDescription` · `CardAction` · `CardContent` · `CardFooter`                                                     |
| `item`        | `ItemGroup` · `Item` · `ItemMedia` · `ItemContent` · `ItemTitle` · `ItemDescription` · `ItemActions` · `ItemHeader` · `ItemFooter` · `ItemSeparator`      |
| `empty`       | `Empty` · `EmptyHeader` · `EmptyMedia` · `EmptyTitle` · `EmptyDescription` · `EmptyContent`                                                               |
| `field`       | `FieldSet` · `FieldLegend` · `FieldGroup` · `Field` · `FieldContent` · `FieldLabel` · `FieldTitle` · `FieldDescription` · `FieldSeparator` · `FieldError` |
| `input-group` | `InputGroup` · `InputGroupAddon` · `InputGroupButton` · `InputGroupText` · `InputGroupInput` · `InputGroupTextarea`                                       |
| `table`       | `Table` · `TableHeader` · `TableBody` · `TableFooter` · `TableHead` · `TableRow` · `TableCell` · `TableCaption`                                           |
| `kbd`         | `Kbd` · `KbdGroup`                                                                                                                                        |

### 2.3 Full `ui/` list by category

**Form & input (14)** — `input`, `textarea`, `label`, `checkbox`, `radio-group`,
`select`, `switch`, `slider`, `toggle`, `toggle-group`, `input-otp`, `input-group`,
`field`, `form`

**Overlay (11)** — `dialog`, `alert-dialog`, `sheet`, `drawer` (vaul),
`popover`, `hover-card`, `tooltip`, `dropdown-menu`, `context-menu`, `menubar`, `command` (cmdk)

**Navigation (7)** — `tabs`, `navigation-menu`, `breadcrumb`, `pagination`,
`sidebar`, `accordion`, `collapsible`

**Data display (8)** — `table`, `card`, `badge`, `avatar`, `item`, `empty`, `chart` (recharts), `carousel` (embla)

**Feedback (5)** — `alert`, `progress`, `skeleton`, `spinner`, `sonner` (toaster)

**Layout & utility (8)** — `separator`, `scroll-area`, `resizable`
(react-resizable-panels), `aspect-ratio`, `button-group`, `kbd`, `calendar`
(react-day-picker), `alert`

---

## 3. Tier 1 — `common/` shared composites (57)

This is the layer with the most library value. Grouped by function.

### 3.1 DataTable stack — ⭐ the flagship

| File                            | LOC   | Role                                                                         |
| ------------------------------- | ----- | ---------------------------------------------------------------------------- |
| `DataTable.tsx`                 | ~1400 | The table itself.                                                            |
| `DataTableComponents.tsx`       | 291   | `TableCellRenderer` (memoised), `SearchBar`, `Pagination`.                   |
| `DataTableErrorBoundary.tsx`    | —     | Catches a bad cell renderer without blanking the page.                       |
| `FilterForm.tsx`                | 355   | Standalone filter bar + `MultiSelectFilterPopover` + `summarizeMultiSelect`. |
| `RowAction.tsx`                 | 102   | `RowAction` + `RowActionGroup`.                                              |
| `BulkActions.tsx`               | 150   | Selection action bar.                                                        |
| `PaginatedSearchableSelect.tsx` | —     | Async, paged combobox (also used as a filter type).                          |

**`Column<T>` model — 15 fields:**

```ts
;(id,
  header,
  accessorKey,
  cell,
  sortable,
  filterable,
  filterType,
  filterConfig,
  exportable,
  exportAlias,
  getExportValue,
  type,
  formatOptions,
  sticky,
  width,
  wrap)
```

**`ColumnType` (10)** — `string` · `number` · `currency` · `date` · `datetime` ·
`boolean` · `percentage` · `phone` · `fileSize` · `action`

`type: 'action'` is special-cased: it forces `sortable: false`, `filterable: false`,
`exportable: false` and defaults `sticky: 'right'` (via `getEffectiveColumnProps`).

**`FilterType` (9)** — `equals` · `notEquals` · `contains` · `startsWith` ·
`endsWith` · `greaterThan` · `lessThan` · `between` · `in`

**`FormatOptions` (9)** — `currency`, `dateFormat`, `dateFormatPreference`,
`timeFormatPreference`, `decimals`, `locale`, `trueLabel`, `falseLabel`, `showSymbol`

**`FilterField` (`FilterForm` + DataTable's integrated toolbar):**

| Field               | Notes                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `type`              | `text` · `select` · `date` · `daterange` · `paginatedSelect`                                      |
| `multiSelect`       | `select` only — value becomes `string[]`, renders a checkbox popover                              |
| `loadOptions`       | `paginatedSelect` only — `({search, page, pageSize}) => Promise<{options, hasMore, totalCount?}>` |
| `getOptionLabel`    | Label for a value not in the loaded page (e.g. restored from URL)                                 |
| `searchPlaceholder` | Search box placeholder                                                                            |

**Behaviours built in:**

- **Column resizing** — drag _and_ keyboard nudge, both clamped 60–800px; persisted to `localStorage` under `${localStorageKey}_columnWidths`, in-memory otherwise.
- **Sticky columns** — `left` / `right`, auto for action columns.
- **Selection** — `Set<string>` of row ids, `onSelectionChange(rows)`.
- **Loading skeleton** — `DEFAULT_SKELETON_ROWS = 5` (a skeleton row ≈ 53px, matching the `h-66` the empty state reserves, so loading and "no results" occupy identical space — no layout jump).
- **`datetime` default width `185px`** — fits `"Aug 24, 2026 09:15 PM"` in every supported preference so the time half is never what gets cut.
- **Integrated toolbar** — when `filterFields` is passed, DataTable renders search + selects + date-range + active chips + "X–Y of N" and wraps everything in one rounded card.
- **Empty state** — falls through to `EmptyState` with a `FileQuestion` icon.
- **User preferences** — dates/currency formatted via `useFormatDate()` (per-user `DateFormatType` / `TimeFormatType`).

#### Server-side loading contract ⭐

Two independent, opt-in prop bags. Passing either switches that concern off locally.

```ts
serverSidePagination?: {
  currentPage: number
  pageSize: number
  totalPages: number
  totalRecords: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  loading?: boolean
}

serverSideSorting?: {
  sortBy: string | null                 // a column `id`, NOT an API field
  direction: 'asc' | 'desc'
  onSortChange: (columnId: string | null, direction: 'asc' | 'desc') => void
  allowUnsorted?: boolean               // default true
}
```

Design notes worth carrying over verbatim:

- **Why server sorting must be separable.** Client sorting only ever sees the current
  page — on a paginated list it reorders 25 rows out of N and reads as broken. When
  `serverSideSorting` is set the local sort is skipped _entirely_.
- **The three-state cycle.** Header clicks cycle asc → desc → unsorted. Pass
  `allowUnsorted: false` where the list always has a fallback order (an API default),
  because there "unsorted" clears the arrow without moving a single row.
- **`sortBy` is a column id, not a field name.** The parent owns the id → `ordering`
  query-param mapping. The table never invents API vocabulary.
- **Page-size persistence is disabled under server pagination** — the server owns
  `pageSize`, so `localStorageKey` only applies to client-side mode.
- **Filters are fully controlled** — `filterValues` + `onFilterChange(next)` +
  `onClearFilters()`. The table never holds filter state.

Async option loading (`PaginatedSearchableSelect`) is a third, orthogonal server
contract: `loadOptions({search, page, pageSize}) → {options, hasMore, totalCount?}`,
with `preload`, `getLabelForValue`, and a `triggerId` so an external `<label htmlFor>`
can name the combobox.

### 3.2 Form system — `FormField.*` (1397 LOC, 11 field types)

Deliberately **schema-free**: no react-hook-form, no Zod. Validators live in
`src/lib/validation/*Forms.ts`, each exporting `*FormData`, `*FormErrors`,
`validate*Form()`.

| `FormField.`        | Implementation          | Notes                                        |
| ------------------- | ----------------------- | -------------------------------------------- |
| `.Input`            | `InputField`            |                                              |
| `.Password`         | `PasswordField`         | show/hide toggle                             |
| `.Textarea`         | `TextareaField`         |                                              |
| `.Phone`            | `PhoneField`            | libphonenumber-js + react-phone-number-input |
| `.Select`           | `SelectField`           |                                              |
| `.SearchableSelect` | `SearchableSelectField` |                                              |
| `.Checkbox`         | `CheckboxField`         |                                              |
| `.CheckboxGroup`    | `CheckboxGroupField`    |                                              |
| `.RadioGroup`       | `RadioGroupField`       |                                              |
| `.DatePicker`       | `DatePickerField`       |                                              |
| `.Time`             | `TimeField`             |                                              |

Uniform prop shape: `name`, `label`, `value`, `onChange`, `error?: { message }`,
plus `required`, `disabled`, `placeholder`, `description`.

**Related form components:** `SearchableSelectField`, `SearchableMultiSelectField`,
`DateTimePicker`, `SmartTextField`, `PasswordStrengthIndicator`, `FileUpload`,
`GooglePlacesAutocomplete`, `TiptapEditorField`, `TiptapViewer`, `LineItemsCreate`,
`PropertyDetailsForm`, `ReadonlyPropertyDetails`, `FloatingFormActions`
(sticky bottom action bar), `FloatingSectionNavigation`.

### 3.3 Display & feedback

| Component         | Variants / props                                                                                                                                                | Server-side                               |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| **`StatsCard`**   | `size`: `sm` · `default` · `lg`; `trend`: `up` · `down` · `neutral`; `gradient?: {from, to, text}`; plus `badge`, `description`, `change`, `onClick`, `loading` | `loading` → spinner in place of the value |
| **`StatusBadge`** | `size`: `sm` · `md` · `lg`; `type`: **21 domain vocabularies**                                                                                                  | —                                         |
| **`EmptyState`**  | `icon`, `title`, `description`, `action {label,onClick}`, `children`                                                                                            | —                                         |
| **`PageHeader`**  | `showBackButton`, `as` (h1–h6), `documentTitle` (`false` opts out)                                                                                              | sets `document.title` via `usePageTitle`  |
| `UserAvatar`      | `size` scale + deterministic colour from a fixed `PALETTE`                                                                                                      | —                                         |
| `SectionTabs`     | `tabs: SectionTab[]`, accent-tinted active state                                                                                                                | —                                         |
| `CopyButton`      | 1200ms "copied" confirmation                                                                                                                                    | —                                         |
| `HoldButton`      | press-and-hold to confirm, 180ms retract                                                                                                                        | —                                         |
| `ConfirmDialog`   | `actions: DialogAction[]` — each with `label`, `onClick`, `variant` (6), `icon`, `disabled`                                                                     | —                                         |

**`StatusBadge` `type` vocabularies (21):** `service_category`, `service_lane`,
`active_status`, `quote`, `order`, `job`, `review`, `complaint`, `complaint_role`,
`complaint_priority`, `complaint_type`, `complaint_issue_type`, `invoice`, `payment`,
`lead`, `recording`, `call`, `appointment` (+ `STATUS_COLORS` counterparts). Both
`STATUS_LABELS[type][status]` and `STATUS_COLORS[type][status]` fall back to the raw
value / a muted style, so an unknown server status renders rather than crashing.

> **Library note.** Status vocabularies are _application_ data, not library data. The
> library should ship `StatusBadge` taking an injected registry, and the portal
> supplies `STATUS_LABELS`/`STATUS_COLORS`.

### 3.4 Media, comms & misc

`PdfViewer` (react-pdf) · `OpenStreetMap` (leaflet) · `MessageBubble` ·
`MessageAttachments` · `MessageMediaViewer` (+ `messageMediaContext`) ·
`MicButton` · `DictationButton` (feature-flagged on `VITE_ENABLE_DICTATION`) ·
`RefineButton` · `CallWidget` (Twilio Voice) · `EmailSendHistoryModal` ·
`OrderDetailsModal` · `AssignHandlerDialog` · `CancelInvitationDialog` ·
`ContactLeadButton` · `CustomerContactPanel` · `CustomerPhoneCallRow` ·
`LeadHandlerCard`

---

## 4. Tier 2 — `layout/` (29)

| Component                                   | Role                                              |
| ------------------------------------------- | ------------------------------------------------- |
| `ConditionalLayout`                         | Picks a shell by `user_type`.                     |
| `AppLayout`                                 | Admin/staff (default).                            |
| `ContractorAppLayout` + `ContractorSidebar` | Mobile-first job app; sets `--bottom-nav-height`. |
| `CommercialAppLayout` + `CommercialSidebar` | Property-manager portal.                          |
| `CustomerAppLayout` + `CustomerSidebar`     | Customer self-service.                            |
| `AuthLayout`                                | Login / register / reset.                         |
| `Header`, `HeaderUserMenu`, `UserMenu`      | Top bar.                                          |
| `Sidebar`                                   | Admin nav; source of the area-accent mapping.     |
| `Breadcrumbs`                               | Route-derived.                                    |
| `ProtectedRoute`                            | Auth + RBAC (`canAccessPathByResourceGrant()`).   |
| `PublicRoute`                               | Redirects authenticated users away from `/login`. |
| `ScrollToTop`, `SkipToContent`              | Route-change scroll reset; WCAG 2.4.1 skip link.  |

Four shells × one nav model is itself a reusable pattern: **`AppShell`** with slots
for sidebar / header / bottom-nav and a role→shell resolver.

---

## 5. Tier 3 — domain folders (~400 files)

Not library candidates individually, but they reveal the _patterns_ the library
must support. Counts are `.tsx` files excluding tests.

| Folder                   | #        | Dominant patterns                                                                                     |
| ------------------------ | -------- | ----------------------------------------------------------------------------------------------------- |
| `leads`                  | 54       | Detail workspace (3-pane), dialer panels (6 tabs), kanban board, import wizard, right-panel tabs (7)  |
| `jobs`                   | 43       | Calendar day/week/month, slot blocks, check-in/out, detail cards (18), recurrence                     |
| `orders`                 | 39       | Calendar (4 views), create sections (7), detail card + edit-modal pairs (12)                          |
| `quotes`                 | 28       | Create sections (9), detail cards (12), change-request panel, price calculator                        |
| `contractorPortal`       | 28       | Mobile check-in/out stepper, photo pair/description lists, job detail tabs                            |
| `seo`                    | 22       | GBP location detail sections, local-visibility audit, issue modal                                     |
| `services`               | 19       | 12 content-block **array editors** (FAQ, features, testimonials, process…)                            |
| `clients`                | 17       | Detail cards (11) + paired dialogs                                                                    |
| `notifications`          | 16       | Inbox (thread list / thread view / bubble), template dialogs                                          |
| `marketing`              | 16       | Campaign step editor, email block builder, social sections                                            |
| `calls`                  | 12       | Call widget parts (header/details/actions/queued/panel), transfer, recorder                           |
| `quoteFormFields`        | 10       | Form-builder sections (conditional logic, validation rules, display settings)                         |
| `financeOs`              | 10       | Invoice info blocks, payment dialogs                                                                  |
| `contractorOnboarding`   | 9        | Document cards, review decision, risk badge                                                           |
| `user`                   | 8        | Activity-log & login-history data tables, action dropdown, status badge                               |
| `agentMemory`            | 7        | Fact / message / thread CRUD dialogs                                                                  |
| `commercialPortal`       | 7        | Recleans, issues, reschedule, work-days calendar                                                      |
| `contractors`            | 6        | Detail cards, invite/edit dialogs                                                                     |
| `cleaningAreas`          | 6        | Area form + link dialogs, photo requirements                                                          |
| `workScheduleBuilder`    | 5        | Day-of-week / monthly-date selectors, preset picker, preview                                          |
| `settings`               | 5        | Address card + modal, parameter/signature dialogs                                                     |
| `archer`                 | 5        | Assignment rules, rota fields, outbound channel                                                       |
| `servicePartnerRequests` | 4        | Status dialogs, document preview                                                                      |
| `customerSupport`        | 4        | Appointment calendar sheets, conversation dialogs                                                     |
| `contractorAvailability` | 4        | Slot add/edit — **Drawer (mobile) + Sheet (desktop) pairs**                                           |
| `leadTitan`              | 4        | Status badges, source icon, campaign table                                                            |
| `addOns`                 | 4        | Grouped list, form dialogs                                                                            |
| others                   | 1–2 each | `auth`, `clientArea`, `dashboard`, `finance`, `llmApiCalls`, `quoteRequests`, `reports`, `shortLinks` |

### Cross-cutting patterns worth promoting to the library

1. **Detail-card + edit-modal pair** — appears ~40 times (`OrderInfo` / `OrderInfoEditModal`).
   → `<DetailCard>` with an `onEdit` slot and a paired `<EditModal>`.
2. **Array/content editor** — 12 in `services/` alone (`AreaFAQEditor`, `ArrayFieldEditor`).
   → `<ArrayFieldEditor>` with dnd-kit sorting and a render-prop item.
3. **Calendar** — 3 independent implementations (jobs, orders, commercial).
   → one `<ScheduleCalendar>` with day/week/month views and slot render props.
4. **Drawer-vs-Sheet responsive pair** — literally duplicated files in `contractorAvailability`.
   → one `<ResponsiveDialog>` that picks vaul vs Radix by breakpoint.
5. **Domain status badge** — `LeadStatusBadge`, `JobStatusBadge`, `UserStatusBadge`,
   `RiskScoreBadge`, `WhatsappSessionBadge`, `SmsCampaignStatusBadge`, `CallTransferredBadge`.
   → one registry-driven `StatusBadge`.
6. **Message bubble / inbox** — leads, notifications, customerSupport each have one.
   → `<MessageBubble>` + `<ThreadList>` + `<ThreadView>`.
7. **Stepper** — `CheckOutStepper`, campaign steps, onboarding.
8. **Kanban** — `ContactsKanbanBoard` (dnd-kit).

---

## 6. Gap analysis — portal vs `shining-ui-kit` today

### ✅ Already in the kit

`packages/react/src/primitives/` — badge, button, checkbox, dropdown-menu, input,
popover, select, separator, skeleton, tooltip, visually-hidden.

`packages/react/src/ui/` — Card (+ **Stat**), Alert, Avatar (+ AvatarGroup),
Empty/Kbd/Progress/Spinner, Field/Fieldset/Label, InputGroup/RadioGroup/Slider/
Switch/Textarea/Toggle/ToggleGroup, Accordion/Breadcrumb/Collapsible/Pagination/Tabs,
AlertDialog/Dialog/HoverCard/Sheet.

Plus the entire DataTable engine (toolbar, filters, column menu, selection bar,
virtualisation, CSV export) and two chart layers (`charts/` bespoke, `recharts/`).

**Landed since this document was written** — raw `Table` parts, `StatusBadge`
(registry-driven), `StatsCard`, `PageHeader`, `SectionTabs`, `Combobox` /
`MultiCombobox`, `FileUpload`, `PasswordStrengthIndicator`, `ConfirmDialog`,
`CopyButton`, `HoldButton`, `UserAvatar`, `FloatingFormActions`, a dependency-free
toaster (`ToastProvider` / `useToast` / `Toaster`), and the `AppShell` family with
sidebar, header, bottom-nav, `SkipToContent` and `ScrollToTop`. All of it is plain
`sui-*` CSS on the existing tokens — see [components](../components/overview.md#composites).

### ❌ Missing primitives (portal has, kit doesn't)

`calendar` (react-day-picker) · `command` (cmdk) · `context-menu` · `menubar` ·
`navigation-menu` · `drawer` (vaul) · `resizable` · `scroll-area` · `carousel` ·
`aspect-ratio` · `input-otp` · `item` · `form`

(`button-group`, `sidebar`, the toaster and the raw `table` parts have since landed —
the toaster hand-rolled rather than on sonner, and the sidebar as `AppShell`.)

### ❌ Missing composites (the high-value gap)

| Priority | Component                                                                            |
| -------- | ------------------------------------------------------------------------------------ |
| **P0**   | `FormField.*` suite (11 field types + schema-free validation contract)               |
| ~~P0~~   | ~~`StatusBadge` (registry-driven)~~ — **done**                                       |
| ~~P0~~   | ~~`PageHeader`, `ConfirmDialog`~~ — **done** (`EmptyState` ships as `Empty`)         |
| ~~P0~~   | ~~`StatsCard`~~ — **done** (trend, size, badge, loading, full-bleed chart)           |
| ~~P1~~   | ~~Searchable selects~~ — **done** as `Combobox` / `MultiCombobox` (`onSearch`)       |
| **P1**   | ~~`SectionTabs`~~ **done**; `BulkActions`, `FilterForm` still open                   |
| **P1**   | ~~`FloatingFormActions`, `FileUpload`~~ **done**; `FloatingSectionNavigation` open   |
| ~~P1~~   | ~~`UserAvatar`, `CopyButton`, `HoldButton`, `PasswordStrengthIndicator`~~ — **done** |
| **P2**   | `DateTimePicker`, `SmartTextField`, `TiptapEditorField`/`Viewer`                     |
| ~~P2~~   | ~~`AppShell` + sidebar/header/bottom-nav slots~~ — **done**                          |
| **P2**   | `ArrayFieldEditor`, `DetailCard`, `ResponsiveDialog`, `ScheduleCalendar`             |
| **P3**   | `PdfViewer`, `OpenStreetMap`, `MessageBubble`/inbox trio, `Stepper`, `Kanban`        |

### ⚠️ Reconciliation decisions needed

| Issue                        | Portal                                                            | Kit                                        | Question                                                                                                                                              |
| ---------------------------- | ----------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Styling engine**           | Tailwind 4 utilities + CVA                                        | `sui-*` classes from CSS custom properties | Do extracted components get rewritten to `sui-*`, or does the kit gain a Tailwind preset?                                                             |
| **React version**            | 19                                                                | 18                                         | Kit must support both (peer range `^18 \|\| ^19`).                                                                                                    |
| **Table engine**             | Bespoke (~1400 LOC)                                               | `@tanstack/table-core`                     | Does the portal migrate to the kit's table, or does the kit absorb portal features (resize persistence, sticky, integrated toolbar, 10 column types)? |
| **Area accents**             | Hardcoded Tailwind class strings, route-derived                   | No equivalent                              | Needs a token-driven `AccentProvider` — the current form breaks `tests/tokens.test.ts`.                                                               |
| **Icons**                    | `lucide-react` (direct dep)                                       | own `lib/icons.tsx`                        | Peer dep or keep the kit icon-free?                                                                                                                   |
| **Router coupling**          | `PageHeader`, `RowAction`, `Breadcrumbs`, guards use react-router | none                                       | Extract with an injectable `LinkComponent` / `useNavigate` adapter.                                                                                   |
| **User-preference coupling** | `useFormatDate()` reads per-user date/time/currency prefs         | none                                       | Needs a `FormatProvider`.                                                                                                                             |

---

## 7. Proposed extraction plan (for approval)

Each phase is independently shippable.

| Phase | Scope                                                                                                                                                                                                       | Output                                      |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **0** | Design-token parity: port the portal's seeds, radii, Inter, area-accent axis, motion tokens into `packages/themes` as a `shining` project. Add `AccentProvider`.                                            | `@shining-ui-kit/themes`                    |
| **1** | Missing primitives — `calendar`, `command`, `drawer`, `context-menu`, `menubar`, `navigation-menu`, `resizable`, `scroll-area`, `carousel`, `aspect-ratio`, `input-otp`, `item`, `button-group`, `toaster`. | `@shining-ui-kit/react`                     |
| **2** | P0 composites — `FormField.*`, `StatusBadge`, `PageHeader`, `EmptyState`, `ConfirmDialog`, `StatsCard`.                                                                                                     | new `@shining-ui-kit/forms` + kit additions |
| **3** | Table reconciliation — decide engine, then land resize-persistence, sticky columns, the 10 column types, the integrated toolbar, and the two server prop bags.                                              | `@shining-ui-kit/react`                     |
| **4** | P1 composites + `AppShell` / sidebar / breadcrumbs.                                                                                                                                                         | `@shining-ui-kit/layout`                    |
| **5** | P2/P3 patterns — `ArrayFieldEditor`, `DetailCard`, `ResponsiveDialog`, `ScheduleCalendar`, inbox trio, `Stepper`, `Kanban`.                                                                                 | `@shining-ui-kit/patterns`                  |
| **6** | Portal migration — replace local imports package-by-package, delete duplicates.                                                                                                                             | portal PRs                                  |

Every phase ships: component + types + Storybook story + gallery section + tests
(`tokens.test.ts` must stay green) + a `docs/` page.

---

## 8. Questions blocking the code

1. **Styling engine** — rewrite to `sui-*` CSS-variable classes (matches
   `ARCHITECTURE.md`'s one rule) or ship a Tailwind preset so portal components
   lift over unchanged? _This decides how much of phase 2 is rewrite vs copy._
2. **Table** — migrate the portal onto the kit's TanStack table, or port the
   portal's bespoke table's extra features into the kit?
3. **Scope** — all six phases, or start with phases 0–2 only?
4. **Portal migration** — in scope now, or is the library standalone for now?
5. **Package layout** — new packages (`forms`, `layout`, `patterns`) or everything
   into `@shining-ui-kit/react`?

---

_Generated from a read-only scan. No source files were modified._
