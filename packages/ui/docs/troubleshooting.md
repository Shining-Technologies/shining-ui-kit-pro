# Troubleshooting

- [Installing and importing](#installing-and-importing)
- [Styles](#styles)
- [Dark mode and themes](#dark-mode-and-themes)
- [Next.js and server rendering](#nextjs-and-server-rendering)
- [Data table](#data-table)
- [Tests](#tests)

## Installing and importing

**`Cannot find module '@shining-technologies/ui/core'` (or `/theme`, `/charts`, …) in
TypeScript.** Your `tsconfig.json` uses the legacy `"moduleResolution": "node"`, which ignores
the `exports` field. Use `"bundler"`, `"node16"` or `"nodenext"`.

**`require() of ES Module` or `Cannot use import statement outside a module`.** The package is
ESM only. Load it from ESM code, or in Jest enable ESM support or transform
`@shining-technologies/ui` (see [Getting started](./getting-started.md#testing-your-application)).

**`Could not resolve "recharts"` or `"@tanstack/react-virtual"`.** These are optional peer
dependencies, needed only by `@shining-technologies/ui/charts` and
`@shining-technologies/ui/virtualized`. Install the one you use.

**Invalid hook call, or context not found across components.** Two copies of React are loaded.
Run `npm ls react` and make sure only one version is installed. In a monorepo, deduplicate
`react` and `react-dom` in the bundler.

**Components look wrong after installing V2 next to V1.** `@shining-technologies/ui` and the
V1 `@shining-technologies/ui-kit-*` packages style the same `sui-*` class names. Use one of
them per application. See the [migration guide](../MIGRATION.md).

## Styles

**Components render unstyled.** Import `@shining-technologies/ui/styles.css` once, at the root
of the application (the root layout in Next.js, the entry file in Vite).

**Some styles are missing in an older browser.** The stylesheet uses cascade layers, `:where()`
and `color-mix()`. The minimum versions are Chrome and Edge 111, Safari 16.4 and Firefox 113.

**My CSS does not override a component.** Every kit rule is in `@layer components`, so any
unlayered rule of yours wins regardless of specificity or order. If your rule is inside a
layer of your own, that layer must come after `components` in the layer order. Check that your
selector matches the element: kit classes start with `sui-`, and many elements carry a
`data-slot` attribute you can target.

**A Tailwind utility does not override a component.** With Tailwind CSS v4, utilities are in
`@layer utilities`, which comes after `components`, so they win. If one does not, check that the
class is actually generated (Tailwind only emits classes it finds in your sources) and that the
component forwards `className` to the element you expect.

**`bg-primary` and similar utilities do nothing.** Import `@shining-technologies/ui/tailwind.css`
after `tailwindcss`, or keep your existing shadcn/ui `@theme inline` block. See
[Theming](./theming.md#7-tailwind-css-v4).

**The page font or background did not change.** Components are styled; the page is not. Add
`className="sui-scope"` to `<body>` to apply the theme's background, text colour and font to the
whole page.

## Dark mode and themes

**Dark mode does not switch.** Dark tokens apply only under the `.dark` class on `<html>` or an
ancestor. The library does not follow the operating system by itself. Render
`<ColorModeScript defaultMode="system" />` in `<head>`, or use `next-themes` with
`attribute="class"`. See [Color mode](./components/color-mode.md).

**A flash of the light theme before dark mode applies.** `ColorModeScript` must be in `<head>`
(it runs before the body paints). A toggle rendered only after hydration cannot prevent the flash.

**React warns about a `className` mismatch on `<html>`.** `ColorModeScript` changes the class
before React hydrates. Add `suppressHydrationWarning` to `<html>`.

**A named theme (`data-theme="slate"`) does nothing.** Import
`@shining-technologies/ui/presets.css` in addition to `styles.css`.

**Dialogs and menus inside a scoped theme use the page theme.** Overlays portal to `<body>`,
outside the scoped element. Wrap the scope in `PortalContainerProvider` with a container inside
it. See [Theming](./theming.md#6-scoped-themes).

**`createThemeCss` throws a `TypeError`.** It validates every value so its output is safe to
inline. The message names the rejected value: a colour that cannot be parsed, a selector or layer
name with unsafe characters, or a value containing characters that could break out of the rule.

## Next.js and server rendering

**"Functions cannot be passed directly to Client Components".** A function prop (`cell`,
`onClick`, `renderLink`, `onQueryChange`, …) was passed from a Server Component. Move that
component and its function props into a file that starts with `'use client'`.

**Hydration mismatch in a data table: different dates or number formats.** The server and the
browser formatted in different time zones or locales. Pass `timeZone` and `locale` to
`DataTable`, and the same values to `applyQuery` if the server filters. See
[Data table](./data-table.md#time-zones-and-locale).

**A URL-driven table loses the sort when the page resets.** Wiring each `on…Change` callback to
`router.replace` issues two navigations from the same stale state. Use
`useDataTableQueryState`. See [Next.js](./nextjs.md#a-data-table-driven-by-the-url).

**A client-side table jumps back to page 1 after `router.refresh()`.** A new `data` array resets
client pagination. Pass `keepPageOnDataChange`.

**Content-Security-Policy blocks an inline script or style.** Pass your nonce to
`ColorModeScript` and to `Sidebar`. See [Next.js](./nextjs.md#content-security-policy).

## Data table

**Selection or expansion jumps to other rows after a refetch.** Without `getRowId`, rows are
identified by index. Pass `getRowId={(row) => row.id}`.

**The table re-renders or resets constantly.** `columns` or `data` is a new array on every
render. Define `columns` outside the component or wrap it in `useMemo`, and keep `data` stable.

**A column value is typed `unknown` after spreading shared columns.** The shared array was
annotated (`const columns: ColumnBehavior<Order>[] = …`), which widens every value type. Use
`satisfies ColumnBehavior<Order>[]` instead.

**A date filter matches the wrong day.** Timestamps are placed in `timeZone` (the runtime's zone
when unset). Pass the zone your users think in. An ISO string without an offset
(`2024-03-05T09:00`) is read in the runtime's zone; store timestamps in UTC or with an offset.

**Server mode shows only the current page in a CSV export.** In server mode the table holds only
the current page. Fetch the full result and export it. See [CSV](./api/csv.md).

## Tests

**Opening a `Select` or `DropdownMenu` hangs, then the test times out.** The test DOM lacks the
Pointer Capture API. Add the stubs from
[Getting started](./getting-started.md#testing-your-application), or use `happy-dom`.

**`ResizeObserver is not defined` or `window.matchMedia is not a function`.** jsdom does not
implement them. Use `happy-dom` or the polyfills in
[Getting started](./getting-started.md#testing-your-application).

**`Unexpected token` on a `.css` import in Jest.** Map CSS to a stub:
`moduleNameMapper: { '\\.css$': '<rootDir>/test/style-stub.js' }`.
