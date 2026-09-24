# @shining-technologies/ui v2.2.0

Released 2026-09-24 · Minor · [CHANGELOG entry](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/%40shining-technologies%2Fui%402.2.0/packages/ui/CHANGELOG.md#220)

Components for record views that are not tables: filter bars and chips, bulk actions, timelines,
trees, a kanban board, an event calendar, status panels and layout primitives. Additive.

```text
"@shining-technologies/ui": "2.2.0"
```

## What changed

- `@shining-technologies/ui/data-view`: `FilterBar`, `FilterBarActions`, `FilterChips` and
  `BulkActionBar`.
- DataTable `slots.selectionActions`; the selection bar is now `BulkActionBar`, and
  `SelectionBarProps` gains `actions`.
- `Chip`, `SearchInput`, `CircularProgress` and `Banner`.
- `/timeline` (`Timeline`, `TimelineItem`, `TimelineHeading`), `/tree-view` (`TreeView`) and
  `/kanban` (`KanbanBoard`, `KanbanMove`).
- `EventCalendar`, a month of events.
- `Empty` `status` (`'loading'`, `'error'`, `'success'`, `'offline'`) and the `EmptyStatus` type.
- Layout: `Stack`, `Grid`, `Container` (props type `LayoutContainerProps`),
  `ResizablePanelGroup`, `ResizablePanel` and `ResizableHandle`.
- `DialogContent size="full"`, and nine icons: `WifiOffIcon`, `RefreshIcon`, `FolderIcon`,
  `GripIcon`, `UserIcon`, `SettingsIcon`, `LogOutIcon`, `BellIcon`, `KeyIcon`.

## Migrations

None.

## Settings

- Stylesheets `layout.css` and `data-display.css`, bundled into `styles.css`; an application that
  imports `styles.css` needs nothing new. No new dependencies or peer dependencies.

## Upgrading

- Bump the pin.

## Compatibility

- Additive: no existing prop, class or default changed. `Empty` without `status` renders as
  before, and the DataTable selection bar without actions has the same markup.
