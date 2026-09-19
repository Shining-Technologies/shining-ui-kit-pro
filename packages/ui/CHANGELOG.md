# @shining-technologies/ui

## 2.1.0

### Added

- Theme: the complete shadcn/tweakcn token set. `theme.css` now also defines `--font-sans`,
  `--font-serif`, `--font-mono`, `--tracking-normal`, `--spacing` and `--shadow-2xs` …
  `--shadow-2xl`, and components read them, so a tweakcn export pasted into `globals.css` sets
  the components' fonts, shadows, letter spacing and size as well as their colours and radius.
  The font, tracking and spacing defaults sit in `@layer theme`, below Tailwind's own values, so
  importing the kit never overrides an application's Tailwind `@theme`.
- Theme: `--radius-sm`, `--radius-md`, `--radius-lg` and `--radius-xl` are defined by the kit
  (`--radius` − 4px, − 2px, ± 0, + 4px, as in shadcn) and follow scoped themes.
- Control heights, gaps, surface padding and table row and cell sizes are multiples of `--spacing`
  (a control is `--spacing` × 9, like shadcn's `h-9`). At the default `0.25rem` nothing changes.
- New preset `mint` (`data-theme="mint"`): electric mint on white and true black, 1.4rem corners.
- `DateRangeField`: a start and an end date in one field. One month with Previous and Next
  (`months={2}` for two side by side on wider screens), presets above it, the span previewed
  under the pointer before the second click, and `onChange` called only with a complete
  `{ from, to }`. `name` submits an ISO 8601 interval (`yyyy-mm-dd/yyyy-mm-dd`).
- `Calendar` takes `range` (mark a span, with a hover preview while only `from` is set) and
  `months` (`1` or `2` side by side; the arrow keys walk from one month into the next).
- Helpers `formatDateRange` (`Sep 3 – 12, 2026`, via `Intl.DateTimeFormat#formatRange`) and
  `countDays`, and the types `DateRange` and `CalendarRange`.
- Navigation: `SegmentedControl`, one choice out of a few on the pill track of `Tabs`. It is a
  Radix radio group, so one option is always selected and the arrow keys move it.
- Navigation: `Stepper`, progress through a task done in order. Horizontal or vertical, with
  `complete`, `current`, `upcoming` and `error` steps, optional steps, and `onStepClick` for going
  back (or to any step with `linear={false}`). Each status is read after the step's label.
- Navigation: `ContextMenu` (Radix Context Menu) and `Menubar` (Radix Menubar), with the same parts
  and item row as `DropdownMenu`, and `MenuShortcut` for a key hint at the end of any menu item.
- Navigation: `Command`, a search box over a grouped list of commands (a combobox and a listbox,
  with `aria-activedescendant`), and `CommandMenu`, which puts it in a dialog opened with ⌘K /
  Ctrl+K. `matchesShortcut` and `defaultCommandFilter` are exported.
- Navigation: `VerticalNav` (with `VerticalNavSection` and `VerticalNavItem`) for links within an
  area such as settings, in `pills` or `line` appearance, and `NavigationRail` (with
  `NavigationRailItem`), a narrow column of icon-and-label destinations. Both are Server
  Components and take `asChild` for a router's link.
- DataTable: new export `DataTableColumnResizer`, the default resize grip, for custom `HeaderCell` components.
- DataTable: the `persist` prop, and column pinning is remembered in the browser by default: a column pinned from the header
  menu stays pinned on the next visit until the user changes it. The new `persist` prop turns it off
  (`false`), names the stored table (`'orders'`), or also remembers widths and hidden columns
  (`{ state: ['columnPinning', 'columnSizing', 'columnVisibility'] }`) in `localStorage` or
  `sessionStorage`. Controlled slices are never stored.
- DataTable: `features.resizing.mode: 'onEnd'` shows a guide line that follows the pointer during
  the drag.
- New dependencies: `@radix-ui/react-context-menu` and `@radix-ui/react-menubar`.

### Changed

- Components use `--radius-md` (controls), `--radius-lg` (surfaces), `--radius-xl` (dialogs),
  `--shadow-sm` / `--shadow-md` / `--shadow-lg`, `--font-sans` and `--font-mono` instead of the kit's
  own names. Default values are unchanged.
- `createTheme({ fontFamily })` writes `--font-sans` instead of `--sui-font-family`.
- `MultiCombobox` keeps its chips on one line, so the field is always a text input's height: it
  shows as many chips as fit the trigger's width, then a `+n` summary, and re-measures as the
  field resizes. `maxChips` no longer defaults to `3`; set it to cap the count as before. Chips
  fill the trigger's height with an even inset and corners concentric with the field's.
- DataTable column resizing no longer re-renders the table while dragging. The grip captures the
  pointer (mouse, pen or touch) and rewrites the width variables on the `<table>` once per animation
  frame; `columnSizing` and `onColumnSizingChange` receive the width once, on release, instead of on
  every pointer move. Escape during a drag puts the column back, and a click without movement no
  longer counts as a resize. Pinned offsets are CSS variables too (`--sui-pl-<id>`,
  `--sui-pr-<id>`), so columns pinned beside a resized one move with it; a pinned cell's inline
  `left`/`right` is now `calc(var(…) * 1px)` rather than a pixel value.
- The calendar rings today in `--primary` instead of `--border`, which barely showed against the
  popover in dark themes.
- Autofilled fields keep the field's own background and text colour instead of the browser's
  blue or yellow tint.
- `tailwind.css` is the tweakcn `@theme inline` block plus the status colours, and now maps
  `--shadow-2xs` … `--shadow-2xl`, so `shadow-md` and the other utilities follow the theme. The
  shadow lines sit in an `@theme inline reference` block: plain `@theme inline` would also write
  `--shadow-sm: var(--shadow-sm)` onto `:root`, a cycle that erases the shadow.
- `AppShellHeader` and the `Sidebar` header share one height, the new token
  `--sui-shell-header-height` (`--spacing` × 16, so `4rem`; `3.5rem` compact, `4.5rem` spacious),
  measured border-box, so their bottom borders form one line. The app bar was `3.5rem` plus its
  padding and the sidebar header `3.75rem` plus its padding, so they missed by a few pixels. Below
  `48rem` the app bar's side padding drops to `0.75rem`.

### Fixed

- DataTable: resizing a column in a table narrower than its frame now keeps the edge under the
  pointer. The browser used to share every width change among all the stretched columns; the resize
  now starts from the widths on screen and gives spare width to the last unpinned data column.
- DataTable: "Pin to right" puts the column before the pinned actions column instead of after it,
  and "Pin to left" after a pinned selection column.
- DataTable: the header menu button no longer overlaps the resize grip.

### Deprecated

- `--sui-radius-sm`, `--sui-radius-control`, `--sui-radius-surface`, `--sui-radius-lg`,
  `--sui-font-family`, `--sui-font-family-mono`, `--sui-shadow-surface`, `--sui-shadow-overlay` and
  `--sui-shadow-modal`. They are no longer defined, but a value set on `:root` is
  still used. Removed in 3.0; see [Theming](./docs/theming.md#deprecated-names).

## 2.0.1

First stable release of `@shining-technologies/ui`. It includes everything in `2.0.0-rc.0` below,
plus these changes.

### Changed

- Theme: in dark mode `--input` now clears 3:1 against the card, like light mode. The default dark
  `--input` changes from `#54545d` to `#65656e`, and generated and preset themes follow.
- `TooltipProvider` defaults `delayDuration` to 300ms, the same as a standalone `Tooltip`, instead of
  Radix's 700ms.
- DataTable inline filters: the search box and the filters share one line and wrap control by
  control onto the next, with "Clear filters" right after the last filter and a wider gap before the
  row count and column picker. Filter triggers are the same height as the search box and the column
  picker, select filters look like the other triggers, triggers light up like a field while their
  picker is open, and below 640px the row count and column picker take a line of their own. An
  applied filter and its clear button light up as one control (focus border and halo around both,
  including when the clear button has keyboard focus).
- Fields: one box and one set of states for every field. The search box in the combobox, the
  multi-select filter and the phone country list is now a rounded field with the shared focus,
  instead of a bare input with a square focus outline. Invalid and disabled look the same on every
  field (one-time code boxes gain the invalid border; select, combobox and date triggers gain the
  disabled look), and the leftover per-component focus borders are removed.
- Option lists: `Select`, `Combobox`, `MultiCombobox` and the DataTable multi-select filter mark each
  option with a checkbox that fills and ticks when picked, instead of a bare tick.
  `.sui-option-check` replaces `.sui-combobox__check` and `.sui-multiselect__check`.
- DataTable filter panels end with the same footer: the multi-select filter's is always shown, with
  the selection count on the left and Clear on the right, and the range panel moves Clear to the
  right of its hint.
- `NumberInput`: `steppers` now defaults to `false`, so the increase and decrease buttons are hidden
  and the field looks like any other text field. The arrow keys still step. Pass `steppers` to keep
  the buttons.

### Fixed

- DataTable: a column with `enableFiltering: false` now ignores a filter set in code in a
  client-mode table too, so the table and `applyQuery` return the same rows.
- DataTable: the filter panel now starts a new filter on the column's `filter.defaultOperator`, as
  the inline layout already did.
- DataTable: `disabled` on a `select` filter option is honoured, as it already was for
  `multiSelect`.
- DataTable: opening a date or number range filter no longer rings its first preset.
- `Sparkline`: passing `style` (for example a width) no longer drops the height, which left the
  sparkline empty.
- `Spinner`: with `prefers-reduced-motion: reduce` it pulses as intended instead of stopping after
  one cycle.
- Forms: a disabled `Slider`, and a `Select` disabled through its `Field`, no longer submit a value.

## 2.0.0-rc.0

First release of the unified V2 package. It replaces `@shining-technologies/ui-kit-react`,
`@shining-technologies/ui-kit-core`, `@shining-technologies/ui-kit-themes` and
`@shining-technologies/ui-kit-export-csv`. See [MIGRATION.md](./MIGRATION.md).

### Breaking changes

- One package with entry points: `.`, `/core`, `/theme`, `/charts`, `/csv`, `/virtualized`,
  `/<component-family>`, and the stylesheets `styles.css`, `theme.css`, `presets.css`,
  `tailwind.css`.
- ESM only.
- Theming is CSS variables. `UIKitProvider`, the project registry, the project editor and switcher,
  and runtime token generation are removed.
- Semantic tokens use shadcn/ui names (`--primary`, not `--sui-primary`).
- Dark mode is the `.dark` class only; the operating system is no longer followed automatically.
- The DataTable `theme` prop and the chrome themes are removed.
- Removed duplicates: `Stat`, `StatTile`, `AppShellSidebar`, `SidebarGroup`, `SidebarItem`, and the
  dependency-free SVG charts (use `/charts`).
- Removed aliases: Button `solid`, `danger`, `md`; Badge `danger`, `accent`; `createTableTheme`,
  `TableTheme`, `TableThemeTokens`; `features.selection.getRowId` (use `getRowId`).
- DataTable part prop types renamed with a `DataTable` prefix where they clashed with standalone
  components.
- `Separator` renders a plain element and no longer accepts Radix's `asChild`.
- A clickable `StatsCard` (`onClick`) renders a `<div>` with a button stretched over it instead of a
  `<button>` root; its ref is always the `<div>`.
- `AccordionProps` is a type alias (it now includes the Radix `Root` props), so
  `interface X extends AccordionProps` no longer compiles; use an intersection type.
- `AppShell` `collapsed` no longer narrows the sidebar column and is deprecated.
- The table search box and `applyQuery` no longer match boolean values; dates match by calendar
  day in `timeZone`.
- `createTheme` and `createThemeCss` validate strictly: colours must parse completely, `radius`
  must be a length and `fontFamily` a font stack. Input that was accepted before, such as
  comma-separated `oklch()` or trailing text after a colour, now throws a `TypeError`.
- `ColorModeToggle` is controlled whenever the `mode` prop is passed, including `mode={undefined}`.
- `Table` `density` names the middle density `'comfortable'`; `'default'` still works and is
  deprecated.

### Fixed

- The package was marked `'use client'` as a whole, so its functions could not be called from
  Server Components. Directives are now per module; 91 of 185 modules are server-safe, including
  `Button`, `Badge`, `Card`, `Alert`, `Table`, `Empty`, `Separator`, `Breadcrumb`, the `AppShell`
  layout parts and the icons.
- Date filters returned different rows depending on the runtime's time zone, and inclusive range
  ends were an hour off on daylight-saving days.
- Row counts, default date cells and text sorting depended on the runtime's default locale,
  causing hydration mismatches.
- Empty values sorted first in descending order.
- The filter panel and active-filter chips counted filters whose value had been cleared.
- Panel filters stored numeric options and number inputs as strings.
- The search box reverted typed text when `globalFilter` was controlled through a slow round trip.
- Kit CSS was unlayered, so Tailwind v4 utilities could never override it.
- DataTable dark-mode overrides were client-only and missing from server-rendered HTML.
- Kit components turned dark on dark-OS machines in applications without a dark mode.
- The shared focus ring and reduced-motion rule depended on a wrapper class only the removed
  provider rendered; they now apply to kit elements directly.
- The date and time helpers (`toIso`, `fromIso`, `DATE_RANGE_PRESETS`, `fromTime`, `toTime`,
  `formatTime`, `splitDateTime`, `joinDateTime`) and `progressVariants` were exported from
  `'use client'` modules, so Server Components could not call them. They now live in server-safe
  modules; the export names are unchanged.
- `Calendar`, `DateField`, `TimeField`, `DateTimeField` and `formatTime` formatted in the runtime's
  default locale when no `locale` was passed, causing hydration mismatches. They now default to
  `'en-US'`, like `DataTable`.
- `Clock` ignored `minuteStep` on its dial, and its arrow keys did not snap to the step. The dial now
  offers only minutes on the step (multiples of both 5 and the step), and the arrow keys snap to it.
- `DateTimeField` could store a day outside `min`/`max` when a time was typed before a day was
  picked, or when **Now** was pressed. A typed time now goes on the nearest allowed day, and **Now**
  is disabled while today is out of range.
- `DateTimeField` displayed a value that had a date but no time without a time, and submitted it at
  00:00 while its time input showed `defaultTime`. It is now displayed, edited and submitted at
  `defaultTime`.
- `TimeField` and `DateTimeField` showed a clear button next to a placeholder when the value was
  invalid. All three date and time fields now show it only for a value they can display.
- `Progress` passed an out-of-range `value` or a non-positive `max` to Radix, which logged an error
  and removed `aria-valuenow`. Both are now clamped (`max` falls back to 100).
- `StatusDot` hid a dot named with `aria-labelledby` or `title` from assistive technology.
- `SegmentedBar` with a `label` and no segments was named `"<label>: "`; it is now
  `"<label>: No data"`.
- The calendar and clock inside `DateField`, `TimeField` and `DateTimeField` were named with the
  generic "Date" / "Time" inside a labelled `Field`. They now take the field's label, through a new
  `aria-labelledby` prop on `Calendar`, `Clock` and `TimeInput`.
- DataTable `headingActions` was not rendered unless `title`, `description` or `icon` was also set.
- `features.virtualization.enabled` on a plain `DataTable` rendered an empty body. It is now ignored,
  with a development-only warning pointing to `@shining-technologies/ui/virtualized`.
- `VirtualizedDataTable` switched pagination back on when `features.pagination` was passed without
  `enabled`; the options are now merged over `{ enabled: false }`.
- "Clear filters" counted filters whose value was still empty.
- Active-filter chips dropped a range bound of `0` and ignored `filter.label`.
- An `emptyState` or `errorState` of `null` or `''` fell back to the default content.
- The inline single-value filter labelled number operators "Value" instead of their symbol.
- Doc comments: `CellContext.rowIndex` is the row's position in `data`; `loadingRowCount` defaults
  to the page size capped at 8; `CellProgress` `showValue` shows a rounded percentage.
- A client-mode `DataTable` and `applyQuery` disagreed on search and sort. The table decided whether
  a column was searchable from its first non-empty value (skipping a column that started with a
  boolean) and matched booleans; it now tests every value with `matchesSearchValue` in its
  `timeZone`. Unreadable values in `number` and `datetime` columns (`'n/a'`) now sort last in both
  directions, as in `sortRows`.
- `Sidebar` under a `SidebarProvider` silently ignored its own state props (`collapsed`,
  `storageKey`, `mobileBreakpoint`, `shortcut`, …). The provider still owns the state; `Sidebar` now
  logs a development-only warning naming the ignored props. `nonce` applies either way.
- `AppShell collapsed` narrowed a full-width `Sidebar` to 3.75rem without switching it to the icon
  rail, and an `AppShell` without a `Sidebar` reserved an empty 15rem column. The shell is now one
  column unless a `Sidebar` is a direct child, which sizes its own column (16rem by default in every
  stylesheet). `AppShell collapsed` only sets `data-collapsed` and is deprecated.
- `BottomNavItem` hid its `badge` from screen readers; the badge text now follows the label in the
  button's accessible name.
- `ScrollToTop` scrolled smoothly under `prefers-reduced-motion: reduce`.
- `SectionTabs` put `aria-label` on an element with no role; the wrapper is now `role="group"`.
- `BreadcrumbEllipsis` had no text alternative; it now contains visually hidden "More".
  `BreadcrumbSeparator` and `BreadcrumbEllipsis` now forward refs.
- `SidebarNav accordion` closed open branches in other sections; the one-open rule now applies per
  section.
- A collapsible section folded with `defaultCollapsed` stayed folded when it held the current page;
  it now opens with the page's branches, in server HTML too.
- `SidebarNav` search inserted its "nothing matches" live region together with the message, so it
  was often not announced, and matches were never announced. The status region is now present from
  the start and announces the result count or `emptyMessage`.
- `SidebarBrand` and `SidebarUser` links bypassed the router link renderer and always rendered `<a>`.
- `AvatarGroup` overlapped and ringed only `Avatar` children. `UserAvatar`s now overlap too, and the
  "+n" chip takes the size of the avatars beside it instead of staying at 2rem.
- `AlertDialogContent` let `hideClose={false}` bring back the close button and `role` replace
  `alertdialog`. Both props are now ignored.
- The development warning for an unnamed dialog advised wrapping the title in `VisuallyHidden`, which
  puts a heading inside a `<span>`. It now suggests a title with `className="sui-visually-hidden"` or
  an `aria-label`, and names the matching title component.
- `CopyButton` with children was named by its visible text, which changed to "Copied" and gained
  "Copied to clipboard" during the confirmation, and its live region sat inside the button, where it
  may not be announced. The button is now always named by `label` (default: string children, else
  "Copy"), and the live region is rendered beside it.
- A clickable `StatsCard` was a `<button>` around its content, so a `chart` such as `Sparkline` put a
  `<div>` inside a button. The card is now a `<div>` with a button stretched over it, named by the
  label and value and described by the footnote. Its ref is the `<div>` whether or not it is clickable.
- `StatsCard` and `MetricTile` showed whether a change was good news only by colour and a hidden
  arrow; they now add visually hidden text.
- `StepCard` `titleAs` did not accept `'h1'`.
- `Checkbox` showed a tick instead of a dash when it was indeterminate without a controlled
  `checked` (`defaultChecked="indeterminate"`, or a form reset back to it).
- `ToggleGroup` `variant` and `size` did not style its items. Items now take them unless they set
  their own.
- `RadioGroup` did not set `aria-orientation`, and a surrounding `Field` label pointed at no element.
  The group now carries the field id, and clicking the label focuses its checked item. The arrow keys
  still move in all four directions.
- The clear button of `Combobox` and the chip remove buttons of `MultiCombobox` were `role="button"`
  elements inside the trigger `<button>`. They are now real buttons in a layer stacked over the
  trigger, which is wrapped in a `.sui-combobox` element (`Combobox` with `clearable`, and every
  `MultiCombobox`).
- The combobox listbox had no accessible name. It is now named by the combobox's `aria-labelledby` or
  `aria-label`, the surrounding field label, or the placeholder.
- Enter in the combobox search box picked an option while `loading` hid the list.
- `NumberInput` without `precision` rounded a stepped value to the step's decimals (1.5 + 1 gave 3).
- `PhoneInput` showed ten digits for a `+1` number while its value kept any extra ones. Digits now stop
  at what the number can hold (ten after `+1`, fifteen in all), and a `1` typed before ten digits is
  read as the trunk prefix.
- A required `Field` did not reach `OtpInput`, `TagsInput`, `ColorInput`, `FileUpload` or
  `ImageUpload`.
- `FloatingFormActions` did not mark its submit button `aria-busy` while `submitting`.
- Doc comments: `PasswordInput` `showRules` and `revealable` described the opposite of their default.
- `FileUpload` and `ImageUpload` without `multiple` but with `maxFiles` above 1 passed several files to
  `onFilesAccepted`, and `ImageUpload` kept them all. Files past the first are now rejected with
  `'count'`.
- `ImageUpload` removed the input carrying the field's id, description and invalid state once the grid
  was full, and neither upload linked its `hint` to the input.
- The hex field and presets of `ColorInput` were named "Colour …" inside a labelled `Field`; they now
  take the field label.
- `TagsInput` dropped pasted tags that failed `validate` without a message. The first one now goes
  back into the text box with its message.
- `scorePassword`, `DEFAULT_PASSWORD_RULES`, `normalizeHex`, `DEFAULT_SWATCHES` and `formatBytes` were
  exported from `'use client'` modules, so Server Components and Server Actions could not call them.
  They now live in server-safe modules; the export names are unchanged.
- `PasswordStrengthIndicator` did not announce a changed verdict; the verdict is now a polite live
  region.
- `StatusFlow` left its alternates list unnamed, and upcoming steps had no cue for assistive
  technology; the list is now named and upcoming chips read "(upcoming)".
- `resolveStatus` was marked internal although it is exported; it is now documented as public.
- Doc comments: `DialogPortal` and `DialogContent` described a provider scope that no longer exists,
  `StatsCard` referred to the removed `Stat`, and `ConfirmDialog` `destructive` claimed more than a
  button variant.
- Charts defaulted `legend` to `'interactive'` although it was documented as `'auto'`, so a
  single-series chart showed a one-button legend that could hide its only series. The default is
  now `'auto'`: no legend for one series, toggle buttons from two series up.
- `ScatterChart` `labelKey` did not name the hovered point in the tooltip; it is now the heading.
- `GaugeChart` `showTableToggle` had no effect; it now adds a table with the current value and the
  target.
- `DonutChart` assigned colours by array position although colour was documented to follow `key`.
  Slots now follow the sorted keys, so re-sorting `data` keeps each slice's colour.
- `DonutChart` `showShare` showed only a total; the tooltip now shows each slice's share, with the
  total as a footer.
- Chart `valueFormatter`, `xFormatter` and `yFormatter` reached only axis ticks. Tooltips and the
  table view now use them, falling back to full precision.
- Chart table views keyed rows by label, so repeated labels produced duplicate React keys.
- `--sui-chart-surface` set on an ancestor was shadowed by a declaration on `.sui-viz`, and a
  standalone `Sparkline` read it undefined. The default is now a `var()` fallback to `--card`.
- Chart tooltips and table views formatted numbers in the runtime's default locale, causing
  hydration mismatches. They now default to `'en-US'`.
- `ColorModeToggle` with `mode={undefined}` (`next-themes` before it mounts) acted uncontrolled and
  wrote the kit's stored preference and `.dark` class. Passing `mode` at all now makes the toggle
  controlled, with a neutral state while the value is `undefined`; a controlled toggle also no
  longer writes `<html>` when the OS setting changes.
- Without `ColorModeScript`, `useColorMode` and `ColorModeToggle` never applied the stored
  preference, so the toggle could disagree with the page. They now apply it on mount.
- `Table` `density` padded only body cells; header cells now follow it.
- `TableRow` `selected` was visual only; it now sets `aria-selected`.
- `GaugeChart`'s ring and track were exposed as unnamed images under Recharts 2 (axe
  `svg-img-alt`). The decorative ring is now hidden from assistive technology and out of the tab
  order under Recharts 2 and 3; the centre figure keeps the chart's accessible name.
- Security: `parseColor` accepted any text after a colour function (`rgb(1 73 59) url(…)`), and
  `createTheme` could copy a seed string into its output unchanged, so a user-supplied brand colour
  could make the browser load a URL through `background: var(--primary)`. Colours are now parsed
  strictly over the whole string and every generated token is re-serialised as hex.
- `tokensToCss` and `createThemeCss` now also reject `/*`, `*/`, `\`, control characters and
  unbalanced quotes in selectors and values, and resource-loading functions (`url()`,
  `image-set()`, `expression()`, …) in values. `radius` must be a length (`calc()`, `min()`, `max()`,
  `clamp()` and `var()` allowed) and `fontFamily` a font stack (`var()` allowed).
- `parseColor` read unitless `hsl()` saturation and lightness as fractions and did not range-check
  components. It now follows CSS Color 4: bare numbers only in the modern syntax, hue units
  converted, out-of-range components clamped, and anything else `null`.
- `createTheme` and `generateColors` accepted an unknown `neutralTint` and produced invalid colours;
  they now throw a `TypeError`.
- `sortRows` and `applyQuery` put values a `number` or `datetime` column cannot read (`'n/a'`) first
  in a descending sort. They now sort last in both directions, like empty values. The rule is
  exposed as `getSortEmptyCheck`, and `SortableColumn` accepts an `isEmpty` override.
- A bare `false` filter value on a boolean column meant "is true"; `false`, `'false'` and `0` now
  mean `isFalse`.
- A `select` or `multiSelect` filter whose value has no text form (an object or array, for example
  from a URL) matched exactly the rows whose value was empty or an object. Such a filter is now
  ignored.
- `parseQuerySearchParams` accepted operators that are not valid for the column's filter type, and
  `serializeQuerySearchParams` wrote sorts and filters `parseQuerySearchParams` then dropped. With
  `columns`, both now apply the same rules. Without `columns`, a bare string that is valid JSON or
  starts with `<operator>:` is written as a JSON string so it reads back unchanged; URLs for plain
  values such as `f.name=ann` are unchanged.
- Text filters did not trim the search text, unlike the search box.
- `applyQuery` decided which values the search box matches with its own rule. The rule is now the
  exported `matchesSearchValue`: strings and finite numbers as text, `Date` values by calendar day in
  the `timeZone` option, never booleans or objects.

### Added

- Charts: a `locale` prop (default `'en-US'`), `DEFAULT_CHART_LOCALE` and a `locale` argument on
  `formatFull`; `ChartTooltipContent` `labelKey`, `valueFormatters` and `locale`; `ChartFrame`
  `tableColumnFormatters`.
- `ColorModeToggle` `labels.toggle`, the name shown while a controlled `mode` is `undefined`.
- `Table` `density="comfortable"`, the kit's density name; `'default'` stays as a deprecated alias.
- The `IconProps` type is exported.
- `@shining-technologies/ui/core`: `applyQuery`, `parseQuerySearchParams`,
  `serializeQuerySearchParams`, `sortRows`, `paginateRows`, `clampPageIndex`, selection helpers,
  `toCalendarDate`, `getActiveFilters`. No dependencies.
- `@shining-technologies/ui/theme`: `createTheme`, `createThemeCss`, `tokensToCss`,
  `SEMANTIC_TOKENS`, `THEME_PRESETS` and the colour utilities.
- `useDataTableQueryState`: drives a table from the URL or any external store without losing
  same-tick changes.
- `ColorModeScript`, `useColorMode`, `ColorModeToggle` (no provider), `PortalContainerProvider`.
- DataTable `locale` and `timeZone` props.
- `presets.css` (ten named themes via `data-theme`) and `tailwind.css` (Tailwind v4 mapping).
- `required` on `OtpInput`, `TagsInput`, `ColorInput`, `FileUpload` and `ImageUpload`, defaulting to
  the surrounding `Field`.
- `announce` on `PasswordStrengthIndicator`, to turn its live verdict off.
- DataTable select and multi-select filters render `SelectOption.group` as labelled groups.
- `DefaultViewOptions` and `renderCellContent` are exported, for custom parts.
- `Sidebar` `renderLink`: renders the `SidebarBrand` and `SidebarUser` links and is the default for
  every `SidebarNav` inside.
- `SidebarNav` `resultsMessage`, `BottomNavItem` `badgeLabel`, and `Pagination` `labels.previousPage`,
  `labels.nextPage` and `labels.page` for its accessible names.
- `AccordionTrigger` `headingLevel` (default 3) and the `AccordionTriggerProps` type; `AccordionProps`
  now includes the Radix `Root` props.
- `BreadcrumbEllipsis` `label` and the `BreadcrumbEllipsisProps` type.
- `CopyButton` `copiedAnnouncement`, the text announced after a copy (default "Copied to clipboard").
- `StatsCard` and `MetricTile` `trendLabel`, the visually hidden text for `trend` (default
  "favourable" / "unfavourable").
- `StatusFlow` `alternatesListLabel` (default "Other outcomes") and `stateLabels`.
- The `AlertDialogContentProps` type. `AlertDialogProps` stays as a deprecated alias.

### Removed dependencies

`tailwind-merge`, `@radix-ui/react-separator`, and the internal V1 packages.
