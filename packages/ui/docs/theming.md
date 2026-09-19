# Theming

The theme is CSS. There is no provider and nothing to configure in JavaScript.

```text
shadcn / tweakcn tokens   --primary, --radius, --font-sans, --shadow-md, --spacing …   you own these
      ↓
derived tokens            --radius-md, --sui-row-hover, --sui-control-height …        computed from them
      ↓
components                .sui-btn { background: var(--primary); border-radius: var(--radius-md) }
      ↓
your CSS and utilities    always win
```

The token set is shadcn/ui's, in the shape [tweakcn](https://tweakcn.com) exports. Components read
those names directly; the kit adds a `--sui-` token only where shadcn has no equivalent (status
colours aside, that is density, table sizing and a few component details).

## 1. Use the default

```ts
import '@shining-technologies/ui/styles.css'
```

`styles.css` contains the default theme, the derived tokens and every component rule. The
default palette is the Shining house style, in light and dark.

## 2. Change the theme

Define the tokens yourself. Your rules win over the defaults whatever the import order,
because the defaults have zero specificity and sit in a lower cascade layer.

```css
/* globals.css */
:root {
  --primary: oklch(0.55 0.18 262);
  --primary-foreground: oklch(0.98 0 0);
  --ring: oklch(0.55 0.18 262);
  --radius: 0.5rem;
}

.dark {
  --primary: oklch(0.72 0.14 262);
  --primary-foreground: oklch(0.2 0.02 262);
}
```

Set only what you want to change; everything else keeps the default.

### Use a tweakcn or shadcn theme

Paste the theme [tweakcn](https://tweakcn.com) exports, or your shadcn `globals.css`, as it is.
Every token in it reaches the components: colours, `--radius`, fonts, shadows, `--tracking-normal`
and `--spacing`.

```css
/* globals.css */
@import 'tailwindcss';
@import '@shining-technologies/ui/styles.css';

@custom-variant dark (&:where(.dark, .dark *));

:root {
  --background: oklch(0.994 0 0);
  --primary: oklch(0.8545 0.1675 159.66);
  /* … the rest of the export … */
  --success: oklch(0.52 0.14 150); /* the kit's status colours: add them, or keep the defaults */
  --font-sans: 'Plus Jakarta Sans', sans-serif;
  --radius: 1.4rem;
  --shadow-sm: 0 1px 3px 0 hsl(0 0% 0% / 0.1), 0 1px 2px -1px hsl(0 0% 0% / 0.1);
  --spacing: 0.27rem;
}

.dark {
  /* … */
}

@theme inline {
  /* the export's block, unchanged, plus the status colours: */
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
}
```

Before you ship a generated theme, check the two tokens exports most often get wrong:

- **`--input`** is the border of every field. Keep it at 3:1 against `--card`; the near-white value
  many exports use makes fields invisible.
- **`--ring`** is the focus border of every field. A bright brand colour on a white page is often
  below 3:1; use a deeper shade of it for light mode.

tweakcn's `@custom-variant dark (&:is(.dark *))` misses the element that carries `.dark` itself;
`(&:where(.dark, .dark *))` covers both. The `@layer base { * { … } body { … } }` block of the
export is yours to keep: the kit never styles `body` or `*`.

### Semantic tokens

The names are shadcn/ui's, so a shadcn `globals.css` works unchanged.

| Group    | Tokens                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------- |
| Surfaces | `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground` |
| Intent   | `--primary`, `--secondary`, `--muted`, `--accent`, each with `-foreground`                       |
| Status   | `--destructive`, `--success`, `--warning`, `--info`, each with `-foreground` (`success`, `warning`, `info` are the kit's additions) |
| Lines    | `--border` (decorative), `--input` (form-control boundary, keep it at 3:1), `--ring`             |
| Charts   | `--chart-1` … `--chart-5`                                                                        |
| Sidebar  | `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring` |
| Shape    | `--radius`                                                                                       |
| Type     | `--font-sans` (every component), `--font-mono` (code, numbers in some cells), `--font-serif`, `--tracking-normal` |
| Shadows  | `--shadow-2xs`, `--shadow-xs`, `--shadow-sm` (cards, tables), `--shadow`, `--shadow-md` (menus, popovers, tooltips), `--shadow-lg` (dialogs, sheets), `--shadow-xl`, `--shadow-2xl` |
| Spacing  | `--spacing`, the unit component rhythm is a multiple of (`0.25rem`)                              |

`--accent` is the subtle hover surface, not the brand colour. The brand colour is `--primary`.

To use your application's font, set `--font-sans`. With `next/font`:

```css
:root {
  --font-sans: var(--font-inter), system-ui, sans-serif;
}
```

In a Tailwind project, `@theme { --font-sans: … }` works as well: the kit reads the same variable
Tailwind's `font-sans` does.

### Derived tokens

Defined in `tokens.css` and computed from the tokens above, so you rarely set them. Override any
of them globally or on one element.

| Group      | Tokens                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------- |
| Radius     | `--radius-sm`, `--radius-md` (controls), `--radius-lg` (cards, tables, popovers), `--radius-xl` (dialogs). shadcn's scale: `--radius` − 4px, − 2px, ± 0, + 4px |
| Rhythm     | `--sui-gap`, `--sui-stack`, `--sui-surface-padding`, `--sui-control-height`, `--sui-control-height-sm`, `--sui-control-height-lg`, `--sui-shell-header-height` (the app bar and the sidebar header, `--spacing` × 16): multiples of `--spacing` (a control is `--spacing` × 9, like shadcn's `h-9`) |
| Table      | `--sui-header-background`, `--sui-header-foreground`, `--sui-header-border`, `--sui-header-font-size`, `--sui-header-text-transform`, `--sui-row-hover`, `--sui-row-selected`, `--sui-row-striped`, `--sui-row-border`, `--sui-row-height`, `--sui-cell-padding-x`, `--sui-cell-padding-y` |
| Other      | `--sui-border-width`, `--sui-font-size`, `--sui-line-height`, `--sui-title-font-size`, `--sui-title-font-weight`, `--sui-shadow-pinned-left`, `--sui-shadow-pinned-right` |

`--spacing` is read where the rhythm is declared: on `:root` and on density wrappers
(`data-sui-density`). To change it for one subtree, set it together with `data-sui-density`.

#### Deprecated names

2.0 used kit names for radius, fonts and shadows. A value set on `:root` still works in 2.x; on a
single element, use the new name. The old names will be removed in 3.0:

| 2.0                                   | Now             |
| ------------------------------------- | --------------- |
| `--sui-radius-sm`                     | `--radius-sm`   |
| `--sui-radius-control`                | `--radius-md`   |
| `--sui-radius-surface`                | `--radius-lg`   |
| `--sui-radius-lg`                     | `--radius-xl`   |
| `--sui-font-family`                   | `--font-sans`   |
| `--sui-font-family-mono`              | `--font-mono`   |
| `--sui-shadow-surface`                | `--shadow-sm`   |
| `--sui-shadow-overlay`                | `--shadow-md`   |
| `--sui-shadow-modal`                  | `--shadow-lg`   |

In a Tailwind project, Tailwind's own `--font-sans` takes precedence over `--sui-font-family`;
set `--font-sans` instead.

## 3. Dark mode

Dark tokens apply under the `.dark` class, on `<html>` or any ancestor. The library never
follows the operating system by itself: an application without a dark mode never gets dark
components.

### Without a library

```tsx
import { ColorModeScript, ColorModeToggle } from '@shining-technologies/ui'

// In <head>: sets .dark before the first paint, from the stored preference.
<ColorModeScript defaultMode="system" />

// Anywhere:
<ColorModeToggle />
```

`useColorMode()` returns `{ mode, resolvedMode, setMode }` for your own controls. The preference
is stored in `localStorage` under `sui-color-mode` and synchronised across tabs.
`<html suppressHydrationWarning>` is needed because the script changes the class before React
hydrates.

### With next-themes

```tsx
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>

const { resolvedTheme, setTheme } = useTheme()
// undefined until next-themes mounts; the toggle stays controlled and shows a neutral state
const mode = resolvedTheme === 'dark' || resolvedTheme === 'light' ? resolvedTheme : undefined
<ColorModeToggle mode={mode} onModeChange={setTheme} />
```

Always pass `mode`, even while it is `undefined`: a toggle without the prop manages the kit's own
stored preference and would compete with `next-themes`.

### Following the OS without JavaScript

If you want the OS preference and no toggle, copy your dark tokens into a media query:

```css
@media (prefers-color-scheme: dark) {
  :root:not(.light) {
    /* the same declarations as .dark */
  }
}
```

## 4. Named themes

```ts
import '@shining-technologies/ui/styles.css'
import '@shining-technologies/ui/presets.css'
```

```html
<html data-theme="ember" class="dark"></html>
```

Import `presets.css` after `styles.css`: both define tokens with zero specificity in the same
cascade layer, so the file imported later wins.

Available: `shining`, `slate`, `midnight`, `violet`, `ember`, `forest`, `rose`, `mono`,
`darwind`, `unn`, `mint`. Each has light and dark values.

`mint` is built from a tweakcn palette: electric mint on white and true black, 1.4rem corners. In
light mode its primary is a deeper mint (`#008455`), because components also draw text, links and
focus borders in `--primary`, and bright mint on white does not reach 3:1.

## 5. Generate a theme from a brand colour

`@shining-technologies/ui/theme` turns a few seed colours into a complete light and dark
theme. It runs anywhere (build scripts, route handlers, Server Components) and has no
dependencies.

```ts
import { createThemeCss } from '@shining-technologies/ui/theme'

const css = createThemeCss({
  primary: '#be123c',
  accent: '#f59e0b', // optional: second hue for chart series (does not set --accent)
  neutralTint: 'subtle', // 'pure' | 'subtle' | 'tinted'
  radius: '0.5rem',
})
// :root { --background: …; --primary: …; … }
// .dark { … }
```

Guarantees:

- every filled colour and its foreground clear WCAG AA (4.5:1) in both modes;
- `--input` clears 3:1 against cards in both modes;
- colours are parsed and every other value validated, so the output is safe to inline even when
  the seed comes from user input.

Per-tenant themes in a Next.js Server Component:

```tsx
// app/[tenant]/layout.tsx
import { createThemeCss } from '@shining-technologies/ui/theme'

export default async function TenantLayout({ children, params }) {
  const tenant = await getTenant((await params).tenant)
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: createThemeCss(tenant.brand) }} />
      {children}
    </>
  )
}
```

`createThemeCss` throws `TypeError` on an invalid colour or value. When the seed comes from a
database or user input, call it in a `try` block and keep the default theme on failure; see the
[API reference](./api/theme.md#createthemecss).

Options: `selector` (default `:root`), `darkSelector` (default `.dark`) and `layer`. Use
`createTheme()` to get the tokens as objects instead of CSS.

## 6. Scoped themes

Any element can carry its own theme:

```tsx
<section data-theme="slate">…</section>

<div className="sui-theme" style={{ '--primary': '#be123c' } as React.CSSProperties}>…</div>
```

`data-theme` and the `sui-theme` class tell `tokens.css` to recompute the derived tokens for that
subtree. Without one of them, derived tokens such as `--sui-row-selected` keep the page's values.

Dialogs, menus and tooltips portal to `<body>`, outside the scoped element. To keep a scoped theme
on them, give them a container inside the scope:

```tsx
const [container, setContainer] = useState<HTMLElement | null>(null)

<section data-theme="slate" ref={setContainer}>
  <PortalContainerProvider container={container}>…</PortalContainerProvider>
</section>
```

## 7. Tailwind CSS v4

```css
@import 'tailwindcss';
@import '@shining-technologies/ui/styles.css';
@import '@shining-technologies/ui/tailwind.css';
```

`tailwind.css` is the `@theme inline` block of a tweakcn export plus the status colours: it maps
the tokens to Tailwind colours, radii and shadows (`bg-primary`, `text-success`, `border-border`,
`rounded-lg`, `shadow-md`) and makes the `dark:` variant follow `.dark`, including on the `.dark`
element itself. If your `globals.css` already has that block, skip this file and add the
`--color-success/warning/info` pairs to your block.

The shadow lines are tweakcn's (`--shadow-sm: var(--shadow-sm)`), in a separate
`@theme inline reference` block. Plain `@theme inline` also makes Tailwind write each line onto
`:root`, where it refers to itself and erases the shadow; a tweakcn export survives that only
because its own `:root` defines every `--shadow-*`. `reference` gives the same utilities and writes
no variable, so `shadow-md` follows the theme's shadows, dark mode included, whether or not you
define them. Consider the same change in your own `globals.css`.

Fonts and spacing need no mapping: Tailwind's `font-sans` and spacing utilities already read
`--font-sans` and `--spacing`, the variables the kit reads, and a value set in your `@theme` reaches
both. The kit's defaults for these names sit in Tailwind's `theme` layer, below Tailwind's own
values, so importing the kit never changes your Tailwind configuration.

Like shadcn, the kit derives `--radius-sm` … `--radius-xl` from `--radius`, and Tailwind's
`rounded-sm` … `rounded-xl` read the same variables: they follow your `--radius` too.

Utilities override component styles:

```tsx
<Button className="rounded-full bg-emerald-600">Save</Button>
```

This works because every kit rule is in `@layer components`, below Tailwind's `utilities`
layer. Import order does not matter.

## 8. Overriding without Tailwind

Unlayered CSS beats every layered rule, so plain class selectors win:

```css
.checkout-button {
  background: var(--success);
}
```

To change a component everywhere, target its class. Kit classes are prefixed `sui-`:

```css
.sui-card {
  box-shadow: none;
}
```

## 9. Density and table variants

```tsx
<DataTable density="compact" variant="striped" />
```

Density changes rhythm tokens (padding, row height, control height). Set
`data-sui-density="compact"` on any element to apply it to all components inside.

Table variants: `default`, `minimal`, `compact`, `borderless`, `striped`, `dashboard`.

## Browser support

The styles use `@layer`, `:where()`, `:has()`, container queries and `color-mix(in oklab, …)`:
Chrome and Edge 111, Safari 16.4, Firefox 121 and later.
