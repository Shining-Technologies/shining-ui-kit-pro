# @shining-technologies/ui v2.0.0-rc.0

Released 2026-09-13 · Initial release · [CHANGELOG entry](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/%40shining-technologies%2Fui%402.0.0-rc.0/packages/ui/CHANGELOG.md#200-rc0)

The first release of `@shining-technologies/ui`: one ESM package with entry points that replaces
the four V1 `ui-kit-*` packages, themed by CSS variables instead of a provider.

```text
"@shining-technologies/ui": "2.0.0-rc.0"
```

## What changed

- One package with entry points `.`, `/core`, `/theme`, `/charts`, `/csv`, `/virtualized` and
  `/<component-family>`, and the stylesheets `styles.css`, `theme.css`, `presets.css` and
  `tailwind.css`. ESM only.
- Theming is CSS variables with shadcn/ui names (`--primary`, not `--sui-primary`).
  `UIKitProvider`, the project registry, editor and switcher, and runtime token generation are
  gone. Dark mode is the `.dark` class, set by `ColorModeScript`, `useColorMode` and
  `ColorModeToggle`.
- `'use client'` is per module, so the server-safe components and helpers can be used from Server
  Components.
- `@shining-technologies/ui/core`: `applyQuery`, `parseQuerySearchParams`,
  `serializeQuerySearchParams`, `sortRows`, `paginateRows` and the other table helpers, with no
  dependencies. `@shining-technologies/ui/theme`: `createTheme`, `createThemeCss`, `tokensToCss`,
  `THEME_PRESETS` and the colour utilities.
- `useDataTableQueryState`, and DataTable `locale` and `timeZone` props.
- Removed: the DataTable `theme` prop and chrome themes, `Stat`, `StatTile`, `AppShellSidebar`,
  `SidebarGroup`, `SidebarItem`, the dependency-free SVG charts, and the V1 aliases listed in the
  CHANGELOG.
- Many fixes found by the V2 audit: time-zone and locale-dependent table results, hydration
  mismatches, accessibility defects, and strict parsing of user-supplied theme colours.

## Migrations

- Moving from the V1 packages is a migration, not a pin bump: follow
  [MIGRATION.md](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/%40shining-technologies%2Fui%402.0.0-rc.0/packages/ui/MIGRATION.md)
  (install, imports, theming, data table, removed components, Next.js, checklist).
- Rename `--sui-<semantic>` overrides in the application's CSS to the shadcn names.
- `createTheme` and `createThemeCss` now throw a `TypeError` on input V1 accepted, such as
  comma-separated `oklch()` or trailing text after a colour.

## Settings

- Import `@shining-technologies/ui/styles.css`; add `presets.css` for the named themes
  (`data-theme="slate"`) or `tailwind.css` for the Tailwind v4 mapping.
- Remove `UIKitProvider`. Add `ColorModeScript` if the application supports dark mode.
- Peer dependencies: `react` and `react-dom` `^18.3.0 || ^19.0.0` (V1 accepted `^18.0.0`);
  optional `recharts` `^2.15.0 || ^3.0.0` and `@tanstack/react-virtual` `^3.11.0`.
- TypeScript must read `exports`: `moduleResolution` `"bundler"`, `"node16"` or `"nodenext"`.

## Upgrading

- Uninstall `@shining-technologies/ui-kit-react`, `-core`, `-themes` and `-export-csv`.
- Add the pin. It is published under the `next` dist-tag, so name the version.
- Work through MIGRATION.md sections 2 to 7.

## Compatibility

- A release candidate: the API could still change before 2.0.1.
- Do not install V1 and V2 in the same application: both style the same `sui-*` classes.
- Removed dependencies: `tailwind-merge`, `@radix-ui/react-separator`.
