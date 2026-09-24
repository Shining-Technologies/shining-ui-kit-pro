# @shining-technologies/ui v2.1.0

Released 2026-09-20 · Minor · [CHANGELOG entry](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/%40shining-technologies%2Fui%402.1.0/packages/ui/CHANGELOG.md#210)

The complete shadcn/tweakcn token set, date ranges, seven navigation components, and DataTable
column resizing without re-renders and remembered pinning.

```text
"@shining-technologies/ui": "2.1.0"
```

## What changed

- Theme: `theme.css` defines the full shadcn/tweakcn set (`--font-sans`, `--font-serif`,
  `--font-mono`, `--tracking-normal`, `--spacing`, `--shadow-2xs` … `--shadow-2xl`,
  `--radius-sm` … `--radius-xl`), and components read it, so a pasted tweakcn export restyles
  fonts, shadows, spacing and radius. New preset `mint`.
- Sizes (control heights, gaps, padding, table rows) are multiples of `--spacing`; unchanged at
  the default `0.25rem`.
- Dates: `DateRangeField`; `Calendar` `range` and `months`; `formatDateRange`, `countDays`, and
  the `DateRange` and `CalendarRange` types.
- Navigation: `SegmentedControl`, `Stepper`, `ContextMenu`, `Menubar`, `MenuShortcut`, `Command`
  and `CommandMenu` (⌘K / Ctrl+K), `VerticalNav` and `NavigationRail`.
- DataTable: the `persist` prop, and column pinning remembered in the browser by default;
  `DataTableColumnResizer`; `features.resizing.mode: 'onEnd'` shows a guide line; resizing no
  longer re-renders the table, and `onColumnSizingChange` fires once, on release.
- `MultiCombobox` keeps its chips on one line with a `+n` summary; `maxChips` no longer defaults
  to `3`.
- `AppShellHeader` and the `Sidebar` header share `--sui-shell-header-height`.
- Fixes: resizing inside a stretched table, "Pin to right" and "Pin to left" order, and the header
  menu button over the resize grip.

## Migrations

- Code that relied on `onColumnSizingChange` during a drag receives the width only on release.
- A pinned cell's inline `left`/`right` is `calc(var(…) * 1px)`, not a pixel value; update CSS or
  tests that read it.

## Settings

- Deprecated, no longer defined, but still honoured when set on `:root`: `--sui-radius-sm`,
  `--sui-radius-control`, `--sui-radius-surface`, `--sui-radius-lg`, `--sui-font-family`,
  `--sui-font-family-mono`, `--sui-shadow-surface`, `--sui-shadow-overlay`,
  `--sui-shadow-modal`. Move overrides to `--radius-*`, `--font-*` and `--shadow-*`; they are
  removed in 3.0.
- `createTheme({ fontFamily })` writes `--font-sans` instead of `--sui-font-family`.
- `tailwind.css` now maps `--shadow-2xs` … `--shadow-2xl`.
- `MultiCombobox`: set `maxChips={3}` to keep the old cap.
- New dependencies `@radix-ui/react-context-menu` and `@radix-ui/react-menubar`, installed with
  the package. No peer dependency changes.

## Upgrading

- Bump the pin.
- Rename any deprecated `--sui-*` radius, font or shadow overrides.
- Pass `persist={false}` to a DataTable that must not remember pinning.

## Compatibility

- Additive apart from the defaults above. At default tokens, sizes and colours are unchanged; the
  calendar rings today in `--primary`, autofilled fields keep their own colours, and the app bar
  and sidebar header line up at `4rem`.
- Superseded the same day by 2.1.1, which has the same code.
