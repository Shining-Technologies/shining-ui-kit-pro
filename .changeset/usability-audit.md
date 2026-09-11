---
'@shining-technologies/ui-kit-core': minor
'@shining-technologies/ui-kit-react': minor
'@shining-technologies/ui-kit-export-csv': patch
---

Usability and publish-readiness audit: every component checked for real-world use, with fixes and regression tests.

**Packaging**

- Fix: the published type declarations referenced an undeclared `ShiningColumnMeta`, which broke consumers compiling with `skipLibCheck: false` and left `meta.align` untyped. The pre-publish check now typechecks the shipped `.d.ts` as a strict consumer would.

**Server rendering**

- `scope="global"` now server-renders the tokens, so the first paint is themed (no flash). A new `nonce` prop covers strict Content-Security-Policies.
- Fix hydration mismatches from the sidebar's `storageKey` and a restored `ProjectRegistry`. Before hydration, phones get the closed drawer, not the desktop column.
- Fix: nested global providers no longer delete each other's tokens on unmount. A stored or imported project with missing fields is repaired instead of crashing the page.

**Forms**

- Every custom input now works uncontrolled (`defaultValue`) and submits natively (`name`, through a hidden input carrying the value): `PhoneInput` (E.164), `NumberInput`, `OtpInput`, `TagsInput`, `ColorInput`, `RatingInput`, `Combobox`, `MultiCombobox`, the date and time fields, and the uploads.
- `PhoneInput`: drops the trunk `0` from E.164 (`0412…` → `+61412…`); keeps Canada on `+1`; a pasted `+44…` picks its country; the country list is keyboard-navigable.
- Fix: an inline `onSearch` on `Combobox` fired on every render.
- `NumberInput` never emits `NaN`. `OtpInput` pastes from the focused box.
- `Calendar` always has a tab stop; its date handling is DST- and timezone-safe; `fromIso` rejects impossible dates.
- `Select`, `RadioGroup`, `DateField` and the uploads now join a surrounding `Field`.
- `DateField`, `TimeField` and `DateTimeField`: `label` is now optional. Inside a `Field`, the trigger is named by the field's label plus its value, instead of a second `aria-label` overriding the visible one.

**Data table**

- New `keepPageOnDataChange` prop: stay on the current page through a refetch or poll.
- Server mode: a sort, filter or search change returns to page 1 in the same update. Empty filters are left out of the query. A shrinking `rowCount` steps back from an empty last page.
- Fix: a render loop when controlled pagination met an unmemoised `data` array.
- Fix: date filters matched the previous day west of UTC.
- Fix: search skipped a column whose first value was empty.
- Fix: the rows-per-page select was blank for sizes outside its list.
- Fix: expanded-row ids collided between tables.

**Components**

- Toasts pause while hovered or focused (`pause` / `resume` on the context), announce through one live region, and replace in place.
- `Tooltip` defers to a surrounding `TooltipProvider` and gains `open`, `defaultOpen`, `onOpenChange`, `align` and `sideOffset`.
- `CopyButton` falls back when the Clipboard API is unavailable and adds `onCopyError`. `HoldButton` fires once per keyboard hold.
- `ConfirmDialog` waits for any thenable, guards against double submits, and adds `onError`.
- New `DropdownMenuRadioItem`, `DropdownMenuSubTrigger` and `DropdownMenuSubContent`, so `DropdownMenuSub` and `DropdownMenuRadioGroup` are usable. `DropdownMenuGroup`, `PopoverAnchor`, `SelectGroup`, `SelectLabel` and the prop types (`ButtonProps`, `TooltipProps`, …) are now exported from the package root.
- `CardTitle` takes `as`; `SummaryCard` and `StepCard` take `titleAs`; `AvatarGroup` honours `max`.
- Charts:
  - Every SVG chart has an accessible name (`ariaLabel`).
  - `null` and `NaN` are skipped rather than plotted as zero or crashing the chart.
  - All-negative data keeps zero on the axis.
  - `Sparkline` `height` works.
  - Recharts donut wedges and titled charts are labelled.

**CSV export**

- Fix: plain negative numbers are no longer formula-escaped.
- Fix: headers use the column's `header` text, not its id.
- New `data` option: export rows the table has not loaded, such as the full result of a server-side table. With `rows: 'selected'`, selections made on other pages are included.

**Accessibility and remaining gaps closed**

- Charts:
  - The dependency-free SVG charts (line, area, bar, pie) are keyboard-navigable. Arrow keys, Home/End and Escape move through the points, and each point is announced through a live region.
  - New `showTableToggle` data table on the SVG charts. Legends are a plain list unless series can be toggled.
  - `ScatterChart` is keyboard-navigable.
  - Lines break at missing values in both chart sets; `connectNulls` joins them instead.
  - A one-reading `Sparkline` draws a level line instead of nothing.
- Recharts 3 is supported (`recharts` peer range `^2.15.0 || ^3.0.0`). Both majors are tested on every change, and Recharts 3 needs no `react-is` override on React 19.
- Data table:
  - Explicit table roles, so the card layout keeps its table semantics, and each card cell carries its column name as text.
  - `aria-rowcount` and `aria-rowindex` follow the spec. The column resize grip reports its width.
  - Arrow keys skip disabled rows.
  - `data` and `columns` accept readonly arrays.
- Forms:
  - One controlled rule for every input (`value !== undefined`).
  - `PasswordInput` follows form resets.
  - `Slider`, `Switch` and `Checkbox` fully join a `Field`.
  - `OtpInput` keeps box positions on delete, and `TagsInput` splits pasted text on its `delimiters`.
  - `NumberInput` takes `locale`; `DateTimeField` takes `defaultTime`; `Combobox` takes `selectedOption` (`selectedOptions` on `MultiCombobox`).
  - `ImageUpload` keeps thumbnails across remounts, and the calendar follows its `value` and is hydration-safe.
- Components:
  - `HoldButton` opens a confirmation for screen-reader and voice-control users (`confirmOnClick`).
  - Focus returns to the opener when a dialog closes, including one opened from a menu, and a dialog without a name warns in development.
  - `StatusFlow`'s `current` accepts a status string, including an alternate, with `reached` marking how far the main path got.
  - `Table` takes `containerClassName` and `containerProps`; `Skeleton` takes `as`.
  - A clickable `StatsCard` has valid markup.
- Shell and theming:
  - With a `ProjectRegistry`, the project a user picked survives reloads even when `preset` or `brand` is set; only `project` overrides it. `initialProjectId` applies on first load only.
  - The phone drawer is a real modal: the rest of the page is inert, scroll is locked, and focus returns on close.
  - `className` and `style` on `UIKitProvider` work in global scope.
  - Local scope and custom sidebar breakpoints server-render without a flash.
  - `ColorModeToggle` follows the radio-group keyboard pattern.
