# Theming

Four layers, each usable on its own — and the first one, [projects](./projects.md), is what
most applications want. This page documents the layers _beneath_ it: the token names a
project generates, and the narrower overrides available when one component has to differ
from the rest.

## 0. Projects

```tsx
<UIKitProvider defaultProject="shining" scope="global">
```

A project generates every token below from four seed colours, including a full dark mode and
a contrast-checked foreground for every filled surface. See [Projects](./projects.md).

## 1. Design tokens

Every visual property resolves to a `--sui-*` custom property. Nothing in the library hardcodes
a colour, radius or spacing value — a test enforces it — so setting a variable on any ancestor
rethemes everything below it:

```css
.branded {
  --sui-primary: #db2777;
  --sui-ring: #db2777;
  --sui-radius: 4px;
  --sui-header-background: #fdf2f8;
  --sui-row-hover: #fdf2f8;
}
```

This is the lightest-weight option and works with a design system whose tokens already live in
CSS.

### The token set

The names mirror the shadcn/ui vocabulary, so a design authored against that vocabulary maps
across one-to-one.

| Group        | Variables                                                                                                                                                                                                                  |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Surfaces     | `--sui-background`, `--sui-foreground`, `--sui-card`, `--sui-card-foreground`, `--sui-popover`, `--sui-popover-foreground`, `--sui-popover-border`                                                                         |
| Intent       | `--sui-primary`, `--sui-primary-foreground`, `--sui-secondary`, `--sui-secondary-foreground`, `--sui-muted`, `--sui-muted-foreground`, `--sui-accent`, `--sui-accent-foreground`                                           |
| Status       | `--sui-destructive`, `--sui-success`, `--sui-warning`, `--sui-info`, each with a `-foreground`                                                                                                                             |
| Lines        | `--sui-border` (decorative), `--sui-input` (control boundary, held to 3:1), `--sui-ring`                                                                                                                                   |
| Charts       | `--sui-chart-1` … `--sui-chart-5`                                                                                                                                                                                          |
| Sidebar      | `--sui-sidebar`, `--sui-sidebar-foreground`, `--sui-sidebar-primary`, `--sui-sidebar-accent`, `--sui-sidebar-border`, `--sui-sidebar-ring`, and their foregrounds                                                          |
| Table header | `--sui-header-background`, `--sui-header-foreground`, `--sui-header-border`                                                                                                                                                |
| Table rows   | `--sui-row-background`, `--sui-row-foreground`, `--sui-row-hover`, `--sui-row-selected`, `--sui-row-selected-hover`, `--sui-row-striped`, `--sui-row-border`                                                               |
| Geometry     | `--sui-radius` (base), `--sui-radius-sm`, `--sui-radius-control`, `--sui-radius-surface`, `--sui-radius-lg`, `--sui-border-width`                                                                                          |
| Typography   | `--sui-font-family`, `--sui-font-family-mono`, `--sui-font-size`, `--sui-font-weight`, `--sui-line-height`, `--sui-title-font-weight`, `--sui-header-font-size`, `--sui-header-font-weight`, `--sui-header-letter-spacing` |
| Rhythm       | `--sui-cell-padding-x`, `--sui-cell-padding-y`, `--sui-header-padding-x`, `--sui-header-padding-y`, `--sui-gap`, `--sui-stack`, `--sui-surface-padding`                                                                    |
| Sizing       | `--sui-control-height`, `--sui-control-height-sm`, `--sui-control-height-lg`, `--sui-header-height`, `--sui-row-height`, `--sui-min-column-width`                                                                          |
| Elevation    | `--sui-shadow-surface`, `--sui-shadow-overlay`, `--sui-shadow-modal`, `--sui-shadow-pinned-left`, `--sui-shadow-pinned-right`                                                                                              |

`CSS_VAR_NAMES` from `@shining-ui-kit/core` is the same list, at runtime.

`--sui-accent` follows shadcn semantics: it is the subtle **hover surface**, not the brand
colour. The brand colour is `--sui-primary`.

## 2. The `theme` prop

A theme is plain data — serialisable, storable per user, buildable at runtime:

```tsx
<DataTable
  theme={{
    colors: { headerBackground: '#111827', rowHover: '#1f2937', border: '#374151' },
    radius: { table: '12px' },
    density: 'comfortable',
  }}
/>
```

Only the tokens you set are emitted, as inline custom properties on the table root; everything
else keeps inheriting from the stylesheet — which is what keeps dark mode working.

`createTableTheme` gives you type-checking and inheritance:

```ts
import { createTheme } from '@shining-ui-kit/react'
import { dashboardTheme } from '@shining-ui-kit/themes'

export const ourTheme = createTheme(
  { colors: { primary: '#0ea5e9' }, radius: { table: '16px' } },
  dashboardTheme, // inherit from this
)
```

`createTableTheme` remains as an alias of `createTheme`, and `TableTheme` of `UIKitTheme`.

### Dark-mode overrides

Values that should only apply in dark mode go under `dark`:

```tsx
theme={{
  colors: { headerBackground: '#fdf2f8' },
  dark: { colors: { headerBackground: '#2a0d1c' } },
}}
```

These cannot be inline (they depend on an ancestor selector), so the library injects a tiny
stylesheet keyed by a deterministic hash of the declarations. Server and client produce the
same class name, so hydration stays quiet.

## 3. Variants and density

```tsx
<DataTable variant="minimal" density="compact" />
```

Variants: `default`, `minimal`, `compact`, `borderless`, `striped`, `dashboard`.
Densities: `compact`, `comfortable`, `spacious`.

Both are token recipes applied through `data-variant` / `data-density` on the root. There is
no second table implementation behind any of them, which is why they compose with everything
else.

Prebuilt themes live in `@shining-ui-kit/themes`: `defaultTheme`, `minimalTheme`,
`dashboardTheme` and `midnightTheme` (a worked example of a full custom palette).

## Dark mode

The table follows the application. A `.dark` class or `[data-theme="dark"]` on any ancestor
switches it; with neither, it follows `prefers-color-scheme`. It never decides on its own, and
it never ships a dark theme that disagrees with yours.

```tsx
document.documentElement.classList.toggle('dark', isDark)
```

## A note on portals

Popovers, menus and selects render in a portal on `document.body`, so they read the token
defaults from `:root` rather than from the table element. If you theme through the `theme`
prop and want the floating surfaces to match, set the same overlay tokens
(`--sui-popover`, `--sui-popover-foreground`, `--sui-popover-border`) on `:root` too.
