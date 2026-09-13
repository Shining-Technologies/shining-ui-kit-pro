# Theming

The theme is CSS. There is no provider and nothing to configure in JavaScript.

```text
semantic tokens         --primary, --background, --radius …     you own these
      ↓
derived tokens          --sui-row-hover, --sui-radius-control … computed from them
      ↓
components              .sui-btn { background: var(--primary) }
      ↓
your CSS and utilities  always win
```

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

### Semantic tokens

The names are shadcn/ui's, so a shadcn `globals.css` works unchanged.

| Group    | Tokens                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------- |
| Surfaces | `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground` |
| Intent   | `--primary`, `--secondary`, `--muted`, `--accent`, each with `-foreground`                       |
| Status   | `--destructive`, `--success`, `--warning`, `--info`, each with `-foreground`                     |
| Lines    | `--border` (decorative), `--input` (form-control boundary, keep it at 3:1), `--ring`             |
| Charts   | `--chart-1` … `--chart-5`                                                                        |
| Sidebar  | `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring` |
| Shape    | `--radius`                                                                                       |

`--accent` is the subtle hover surface, not the brand colour. The brand colour is `--primary`.

### Derived and component tokens

Prefixed `--sui-`, defined in `tokens.css`, computed from the semantic tokens. Override any of
them globally or on one element.

| Group      | Tokens                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------- |
| Geometry   | `--sui-radius-sm`, `--sui-radius-control`, `--sui-radius-surface`, `--sui-radius-lg`, `--sui-border-width` |
| Typography | `--sui-font-family`, `--sui-font-family-mono`, `--sui-font-size`, `--sui-line-height`, `--sui-title-font-size`, `--sui-title-font-weight` |
| Rhythm     | `--sui-gap`, `--sui-stack`, `--sui-surface-padding`, `--sui-control-height`, `--sui-control-height-sm`, `--sui-control-height-lg` |
| Table      | `--sui-header-background`, `--sui-header-foreground`, `--sui-header-border`, `--sui-header-font-size`, `--sui-header-text-transform`, `--sui-row-hover`, `--sui-row-selected`, `--sui-row-striped`, `--sui-row-border`, `--sui-row-height`, `--sui-cell-padding-x`, `--sui-cell-padding-y` |
| Elevation  | `--sui-shadow-surface`, `--sui-shadow-overlay`, `--sui-shadow-modal`                               |

Typography tokens are prefixed so they never collide with Tailwind's `--font-*` theme variables.
To use your application's font:

```css
:root {
  --sui-font-family: var(--font-inter), system-ui, sans-serif;
}
```

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

Available: `shining`, `slate`, `midnight`, `violet`, `ember`, `forest`, `rose`, `mono`,
`darwind`, `unn`. Each has light and dark values.

## 5. Generate a theme from a brand colour

`@shining-technologies/ui/theme` turns a few seed colours into a complete light and dark
theme. It runs anywhere (build scripts, route handlers, Server Components) and has no
dependencies.

```ts
import { createThemeCss } from '@shining-technologies/ui/theme'

const css = createThemeCss({
  primary: '#be123c',
  accent: '#f59e0b', // optional: chart series and highlights
  neutralTint: 'subtle', // 'pure' | 'subtle' | 'tinted'
  radius: '0.5rem',
})
// :root { --background: …; --primary: …; … }
// .dark { … }
```

Guarantees:

- every filled colour and its foreground clear WCAG AA (4.5:1) in both modes;
- `--input` clears 3:1 against cards;
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

`tailwind.css` maps the tokens to Tailwind colours and radii (`bg-primary`,
`text-muted-foreground`, `border-border`, `rounded-lg`) and makes the `dark:` variant follow
`.dark`. Skip it if your project already has shadcn's `@theme inline` block.

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

The theme uses `@layer`, `:where()` and `color-mix(in oklab, …)`: Chrome and Edge 111,
Safari 16.4, Firefox 113 and later.
