---
'@shining-technologies/ui-kit-react': minor
---

Add a dashboard sidebar.

- `Sidebar`: a panel with a pinned header and footer and a scrolling body. It collapses to an icon rail with an animated width and becomes an off-canvas drawer below `mobileBreakpoint`. Inside `AppShell` it sizes its own column.
- `SidebarNav`: a data-driven tree of items, sections and separators, nested to any depth. It supports `activeId` or `currentPath` (longest-prefix match), branches that open themselves around the current page, `accordion`, controlled or uncontrolled expansion, `searchable` filtering with highlights, arrow-key navigation and `renderLink` for routers.
- `SidebarSection` and `SidebarMenuItem`: the composable parts, with toned section icons, collapsible headings, badges, hover actions, external links and rail flyouts.
- `SidebarBrand` and `SidebarUser`: identity rows that become dropdown menus (workspace switcher, account menu).
- `SidebarProvider`, `useSidebar` and `SidebarTrigger`: shared rail and drawer state, an opt-in ⌘/Ctrl shortcut and `storageKey` persistence.
- `getSidebarTrail` and `matchSidebarPath`: tree helpers for breadcrumbs and routing.
