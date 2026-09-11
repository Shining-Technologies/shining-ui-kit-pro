# Troubleshooting

The problems people actually hit, roughly in the order they hit them.

---

## Installing

### `ERESOLVE could not resolve` … `peer recharts`

The `/recharts` entry supports Recharts 3 and Recharts 2.15+. An `ERESOLVE` here means an older
Recharts line is installed (2.14 or below). Upgrade it:

```bash
npm install recharts@latest
```

Recharts is an optional peer. You only need it if you import from `@shining-technologies/ui-kit-react/recharts`.
The dependency-free charts in the root entry (`LineChart`, `BarChart`, `PieChart`, `Sparkline`)
need nothing.

### Charts draw nothing, or horizontal bars are missing, on React 19

You are on Recharts 2, which bundles an older `react-is` that misidentifies React 19 elements.
Recharts 3 takes `react-is` from your app and has no such problem, so the simplest fix is
`npm install recharts@latest`. To stay on Recharts 2, force the current `react-is`:

```jsonc
// package.json — npm
"overrides": { "react-is": "^19.0.0" }

// pnpm
"pnpm": { "overrides": { "react-is": "^19.0.0" } }

// yarn
"resolutions": { "react-is": "^19.0.0" }
```

### `@tanstack/table-core` peer conflict with `@shining-technologies/ui-kit-export-csv`

The kit is built on TanStack Table 8. If you install `@tanstack/table-core` yourself, pin it:
`npm install @tanstack/table-core@^8`. You usually do not need to, because it comes in through
`@shining-technologies/ui-kit-react`.

### `Module not found: @shining-technologies/ui-kit-react/styles.css`

The subpath resolves through the package's `exports` map, which Webpack 4, Create React App and
some older tools ignore. Use a current bundler (Vite, Webpack 5, Next.js, Parcel 2, esbuild),
or import the file directly: `@shining-technologies/ui-kit-react/dist/styles.css`.

---

## Styles

### Components render unstyled

The stylesheet is a separate import. Add it once, at the root of the app:

```ts
import '@shining-technologies/ui-kit-react/styles.css'
```

### My Tailwind classes lose to the kit's

Every `className` prop is merged with `tailwind-merge`, so a conflicting utility wins over the
kit's default. If a utility still loses, check the stylesheet order: the kit's CSS must be
imported **before** your Tailwind entry.

### The page flashes the default colours before switching

Use `scope="global"` on `UIKitProvider`. It server-renders the tokens, so the first paint is
already themed. See [Next.js and server rendering](./nextjs.md#no-flash-of-the-wrong-theme).

### My saved theme is ignored

It is not any more. With a `ProjectRegistry`, the project the user picked wins over `preset`,
`brand` and `defaultProject`, which only decide where a first visit starts. To force a theme
whatever the user picked, pass `project`. See [Projects](./projects.md#precedence).

### A dialog or menu is not themed

Portalled surfaces are themed in both scopes. If one is not, it was rendered outside every
`UIKitProvider`. Move the provider up so it wraps the whole app, and render your own portals
into `usePortalContainer()`.

---

## TypeScript

### `Cannot find module '@shining-technologies/ui-kit-react/styles.css'` (TS 2307 / 2882)

TypeScript 5.6+ with `noUncheckedSideEffectImports` checks CSS side-effect imports. Declare them
once:

```ts
// src/css.d.ts
declare module '*.css'
```

### `column.columnDef.meta.align` is untyped

The kit augments TanStack's `ColumnMeta` when anything is imported from `@shining-technologies/ui-kit-react`.
If you only import types from `@tanstack/react-table`, add one import from the kit somewhere in
the program (the `ColumnDef` type is the natural one).

---

## Testing

### Jest: `SyntaxError: Unexpected token '.'` importing `styles.css`

Jest does not understand CSS imports. Map them to a stub:

```js
// jest.config.js
moduleNameMapper: { '\\.css$': 'identity-obj-proxy' }
```

Vitest handles CSS already.

### `ResizeObserver is not defined` / `matchMedia is not a function` in jsdom

Charts, the responsive table and the sidebar use these browser APIs. jsdom has neither, so
polyfill them in your test setup file:

```ts
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.matchMedia ??= (query) =>
  ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  }) as MediaQueryList
```

---

## Components

### `useToast must be used within a ToastProvider`

Toasts need `ToastProvider` above them and a `Toaster` to draw the stack:

```tsx
<ToastProvider>
  <App />
  <Toaster />
</ToastProvider>
```

### A tooltip never appears on a disabled button

Disabled buttons receive no pointer events, so the tooltip never hears the hover. Wrap the
button:

```tsx
<Tooltip content="You need edit rights">
  <span tabIndex={0}>
    <Button disabled>Edit</Button>
  </span>
</Tooltip>
```

`Tooltip` works without a `TooltipProvider`. Add one near the root only to share the delay
across tooltips.

### A dialog has no accessible name

Every `DialogContent`, `SheetContent` and `AlertDialogContent` needs a `DialogTitle` (or the
matching `…Title`). To hide it visually, keep it for screen readers:

```tsx
<DialogTitle className="sui-sr-only">Edit address</DialogTitle>
```

### A `register()`-ed Checkbox or Switch is always `undefined`

`Checkbox` and `Switch` are buttons, not inputs. Use a `Controller` with
`checked` / `onCheckedChange`. See [Forms](./forms.md#which-controls-take-register-which-need-a-controller).

### A phone number is stored as `+610412…`

It is not any more. `PhoneInput` drops the trunk `0` from the E.164 value. If you are seeing it,
you are on an old version, or you are building the number yourself from the display text.
Use the value from `onValueChange`.

### A date shows the day before

You passed a UTC timestamp (`toISOString()`) to a date field. The date fields hold local
`yyyy-mm-dd` strings. Use `toIso(date)`. See [Forms](./forms.md#dates-and-times).

---

## The data table

### The table jumps back to page 1 on every refetch

In client mode, a new `data` array counts as new data, and new data starts again from page 1.
Either keep `data` stable (`useMemo`, or React Query's cached result), or opt out:

```tsx
<DataTable data={rows} columns={columns} keepPageOnDataChange />
```

Sorting, filtering and searching still go back to page 1.

### The table re-renders constantly or freezes

`columns` must be stable: define them outside the component or in `useMemo`. A fresh array on
every render rebuilds every column and row model. Also avoid an inline `data={[]}`. Use a module
constant: `const EMPTY: User[] = []`.

### Selection is lost after a refetch

Pass `getRowId={(row) => row.id}`. Without it, rows are identified by index, and a refetch is a
new set of rows.

### Server mode fetches page 5 of a new search

It does not any more. In server mode, a sort, filter or search change returns to page 1 in the
same update, so `onQueryChange` fires once. If you control `pagination` yourself, reset it
yourself.

### CSV export only has the current page

In server mode the table only holds the current page, so `rows: 'all'` exports what is loaded.
Fetch the full set and pass it as `data`. It is exported through the table's columns:

```ts
downloadTableCsv(table, { data: allRows })
```

With `rows: 'selected'`, `data` covers selections made on other pages too. Rows are matched
by `getRowId`.

---

## Still stuck?

Open an issue with a minimal reproduction:
<https://github.com/Shining-Technologies/shining-ui-kit-pro/issues>
