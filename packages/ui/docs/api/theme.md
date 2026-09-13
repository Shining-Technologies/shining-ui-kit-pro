# API reference: `@shining-technologies/ui/theme`

Theme generation and colour tooling. The library's theme is plain CSS custom properties
(`theme.css`); nothing on this page is needed at runtime. Use these functions to produce those
variables from a brand colour, in a build script, a route handler, or a Server Component that
renders a per-tenant `<style>`.

```ts
import { createThemeCss } from '@shining-technologies/ui/theme'
```

- No React, no DOM, no dependencies. Every function is pure and runs in Node, edge runtimes and
  browsers.
- These exports are only available from `@shining-technologies/ui/theme`; the root entry does not
  re-export them.

For the theming guide (tokens, dark mode, scoped themes, Tailwind), see [Theming](../theming.md).

## Contents

- [Stylesheets](#stylesheets)
- [Theme generation](#theme-generation)
  - [`createTheme`](#createtheme)
  - [`createThemeCss`](#createthemecss)
  - [`tokensToCss`](#tokenstocss)
  - [`SEMANTIC_TOKENS`](#semantic_tokens)
  - [`generateColors`](#generatecolors)
- [Presets](#presets)
- [Colour parsing and formatting](#colour-parsing-and-formatting)
- [Colour manipulation](#colour-manipulation)
- [Contrast](#contrast)
- [Scales](#scales)
- [Colour space conversion](#colour-space-conversion)
- [Export index](#export-index)

---

## Stylesheets

The package ships four stylesheets. They are CSS, not part of the JavaScript entry point.

| Import | Contents |
| --- | --- |
| `@shining-technologies/ui/styles.css` | Everything a component needs: the default theme, derived tokens and every component rule, minified. Theme and tokens are in the `base` cascade layer and components in `components`, declared as `@layer theme, base, components, utilities;` to match Tailwind v4, so application styles win. Import this once. |
| `@shining-technologies/ui/theme.css` | The default theme values only (the semantic tokens on `:where(:root)` and `.dark`, in `@layer base`). Already included in `styles.css`. |
| `@shining-technologies/ui/presets.css` | The named themes, generated at build time from [`THEME_PRESETS`](#theme_presets) with `createThemeCss`. Apply one with `data-theme="<id>"` on any element; dark values apply under `.dark`. Ids: `shining`, `slate`, `midnight`, `violet`, `ember`, `forest`, `rose`, `mono`, `darwind`, `unn`. Selectors use `:where()` (zero specificity) inside `@layer base`. |
| `@shining-technologies/ui/tailwind.css` | Tailwind CSS v4 integration: an `@theme inline` block mapping the semantic tokens to Tailwind colours (`bg-card`, `text-muted-foreground`, …) and `--radius-sm` to `--radius-xl`, plus a `dark` custom variant on `.dark`. Import after `tailwindcss` and `styles.css`. |

```css
@import 'tailwindcss';
@import '@shining-technologies/ui/styles.css';
@import '@shining-technologies/ui/presets.css';
@import '@shining-technologies/ui/tailwind.css';
```

See [Theming: named themes](../theming.md#4-named-themes) and
[Theming: Tailwind CSS v4](../theming.md#7-tailwind-css-v4). Density is controlled with CSS, not
with this module; see [Theming: density](../theming.md#9-density-and-table-variants).

---

## Theme generation

### `ThemeSeed`

The colours a theme is authored from. Every other colour is derived.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `primary` | `string` | required | The brand colour: filled buttons, active states, focus rings. |
| `accent` | `string` | derived | A second brand colour, used for chart series. Defaults to `primary` with its hue rotated by 150°, lightness 0.7 and chroma of at least 0.12 (OKLCH). |
| `neutral` | `string` | derived | The hue of the greys. Defaults to a grey carrying `primary`'s hue at the chroma set by `neutralTint`. |
| `surface` | `string` | lightest neutral step | Page background (`--background`) in light mode. Not used in dark mode. |
| `destructive` | `string` | `#dc2626` | |
| `success` | `string` | `#16a34a` | |
| `warning` | `string` | `#d97706` | |
| `info` | `string` | `#2563eb` | |

Colours may be any syntax [`parseColor`](#parsecolor) accepts: hex, `rgb()`, `hsl()` or `oklch()`.
Named colours such as `red` are not accepted.

### `NeutralTint`

`'pure' | 'subtle' | 'tinted'` — how much the greys pick up the brand hue (OKLCH chroma `0`,
`0.004` and `0.012`). Only used when `neutral` is not given.

### `ColorMode`

`'light' | 'dark'`

### `CreateThemeOptions`

`ThemeSeed` plus:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `neutralTint` | `NeutralTint` | `'subtle'` | |
| `radius` | `string` | not written | Base corner radius, written as `--radius`, e.g. `'0.5rem'`. |
| `fontFamily` | `string` | not written | Body font stack, written as `--sui-font-family`. |

### `ThemeTokens` and `ThemeDefinition`

```ts
type ThemeTokens = Record<string, string> // { '--primary': '#01493b', … }

interface ThemeDefinition {
  light: ThemeTokens
  dark: ThemeTokens
}
```

### `SemanticToken`

The union of the names in [`SEMANTIC_TOKENS`](#semantic_tokens), e.g. `'primary-foreground'`.

### `createTheme`

```ts
function createTheme(options: CreateThemeOptions): ThemeDefinition
```

Generates a complete light and dark theme from seed colours.

**Returns** `{ light, dark }`. Each contains one `--<token>` entry for every name in
`SEMANTIC_TOKENS` (38 entries). `--radius` and `--sui-font-family` are added to `light` only, when
given; because the dark selector normally matches the same element or a descendant, the values
still apply in dark mode.

**Validation** (all throw `TypeError`):

| Input | Rule | Message |
| --- | --- | --- |
| `primary` | required; a string `parseColor` accepts | `[shining-ui] primary is not a colour: <value>` |
| every other seed colour that is present | a string `parseColor` accepts | `[shining-ui] <field> is not a colour: "<value>"` |
| `neutralTint` | `'pure'`, `'subtle'` or `'tinted'` | `[shining-ui] neutralTint must be 'pure', 'subtle' or 'tinted': "<value>"` |
| `radius` | the [value rules of `tokensToCss`](#tokenstocss), and: not empty; only letters, digits, `_`, `.`, `%`, `+`, `-`, `*`, `/`, `,`, parentheses and spaces; no functions other than `calc()`, `min()`, `max()`, `clamp()` and `var()` | `[shining-ui] Unsafe value for radius: "<value>"` |
| `fontFamily` | the [value rules of `tokensToCss`](#tokenstocss), and: only letters, digits, spaces, `_`, `,`, `.`, `-`, balanced quotes and `var()` | `[shining-ui] Unsafe value for fontFamily: "<value>"` |

`radius` and `fontFamily` are trimmed. Examples that pass: `radius: 'calc(var(--base) + 2px)'`,
`fontFamily: '"Inter Variable", var(--font-geist-sans), sans-serif'`.

**Behaviour:**

- Filled colours (`primary`, `destructive`, `success`, `warning`, `info`) are paired with a
  foreground (white or the theme's darkest neutral) and the fill's lightness is adjusted, keeping
  hue and chroma, until the pair reaches 4.5:1. The adjustment runs for a bounded number of steps
  and stops at the extremes of lightness.
- The primary is first adjusted until it reaches 3.2:1 against the card colour of the mode.
- `--input` is set darker than `--border` so a form control boundary clears 3:1.
- Dark mode is not an inversion: page, card and popover lightness are fixed values carrying the
  neutral hue, and status colours are re-lit for a dark background.
- Every colour in the result is a hex string (`#rrggbb`, or `#rrggbbaa` with transparency)
  computed from the parsed seeds. Seed strings are never copied into the output: a seed that needs
  no adjustment is still re-serialised, so `surface: 'rgb(250 250 247)'` becomes
  `--background: #fafaf7`. Colours outside sRGB are brought into gamut.

```ts
import { createTheme } from '@shining-technologies/ui/theme'

const theme = createTheme({ primary: '#be123c', accent: '#f59e0b', neutralTint: 'tinted', radius: '0.5rem' })

theme.light['--primary'] // a hex colour
theme.dark['--primary-foreground'] // a hex colour readable on the dark primary
```

### `createThemeCss`

```ts
function createThemeCss(input: CreateThemeOptions | ThemeDefinition, options?: ThemeCssOptions): string
```

A theme as a stylesheet: the light tokens in one rule and the dark tokens in another.

**`input`**: either seed options (passed to `createTheme`, with the same validation) or an existing
`ThemeDefinition`. An object whose `light` and `dark` properties are both objects is treated as a
definition.

**`ThemeCssOptions`:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `selector` | `string` | `':root'` | Selector for the light tokens. |
| `darkSelector` | `string` | `'.dark'` | Selector for the dark tokens. |
| `layer` | `string` | none | Wrap the output in `@layer <name> { … }`. Must match `/^[a-zA-Z][\w.-]*$/`. An empty string means no layer. |

Without `layer` the output is unlayered, so it takes precedence over the library defaults, which
live in `@layer base`.

**Output format:**

```css
:root {
  --background: #f7f7f8;
  --foreground: #1c1d1e;
  /* … one declaration per token … */
}
.dark {
  /* … */
}
```

**Validation** (all throw `TypeError`): everything `createTheme` checks, plus every check in
[`tokensToCss`](#tokenstocss) for both rules, plus `[shining-ui] Invalid layer name: "<name>"`.

**Using untrusted input.** Seed colours are parsed strictly and re-serialised, and every other value
is checked against the rules above. The result can therefore be inlined into `<style>` even when
the seeds, radius or font come from users: nothing in it can end the rule, open a new one, close
the `<style>` element or load a resource. Invalid input throws `TypeError`, so decide what to render
instead:

```tsx
// app/[tenant]/layout.tsx
import type { ReactNode } from 'react'
import { createThemeCss } from '@shining-technologies/ui/theme'

declare function getTenant(slug: string): Promise<{ brandColor: string }>

export default async function TenantLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ tenant: string }>
}) {
  const tenant = await getTenant((await params).tenant)
  let css = ''
  try {
    css = createThemeCss({ primary: tenant.brandColor, radius: '0.5rem' })
  } catch {
    // Not a colour: keep the default theme.
  }

  return (
    <>
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      {children}
    </>
  )
}
```

To scope a theme to part of a page, pass selectors:

```ts
createThemeCss(
  { primary: '#047857' },
  { selector: '[data-brand="forest"]', darkSelector: '.dark [data-brand="forest"]' },
)
```

### `tokensToCss`

```ts
function tokensToCss(selector: string, tokens: ThemeTokens): string
```

One rule of custom-property declarations: `selector {\n  --name: value;\n}`. Values are trimmed.
Entries are written in object order.

Throws `TypeError` when:

| Check | Message |
| --- | --- |
| `selector` contains `;`, `{`, `}`, `<`, `>`, `\`, `/*`, `*/`, a control character (including a line break) or an unbalanced quote | `[shining-ui] Unsafe selector: "<selector>"` |
| a name does not match `/^--[a-zA-Z0-9-]+$/` | `[shining-ui] Invalid custom property name: "<name>"` |
| a value contains anything a selector may not, or a resource-loading function: `url()`, `src()`, `image()`, `image-set()`, `cross-fade()`, `element()`, `expression()` or `paint()` (case-insensitive, spaces before `(` included) | `[shining-ui] Unsafe value for <name>: "<value>"` |

Values are not otherwise validated, so any token set can be written, not only colours:

```ts
import { tokensToCss } from '@shining-technologies/ui/theme'

tokensToCss('.compact-card', { '--radius': '0.25rem', '--primary': '#0f766e' })
```

### `SEMANTIC_TOKENS`

```ts
const SEMANTIC_TOKENS: SemanticToken[]
```

Every semantic colour token a generated theme defines, as CSS names without `--`, in output order.
The names follow shadcn/ui, so an existing shadcn `globals.css` themes these components.

| Group | Tokens |
| --- | --- |
| Surfaces | `background`, `foreground`, `card`, `card-foreground`, `popover`, `popover-foreground` |
| Intent | `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `muted`, `muted-foreground`, `accent`, `accent-foreground` |
| Status | `destructive`, `destructive-foreground`, `success`, `success-foreground`, `warning`, `warning-foreground`, `info`, `info-foreground` |
| Lines | `border`, `input`, `ring` |
| Charts | `chart-1`, `chart-2`, `chart-3`, `chart-4`, `chart-5` |
| Sidebar | `sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-primary-foreground`, `sidebar-accent`, `sidebar-accent-foreground`, `sidebar-border`, `sidebar-ring` |

`--radius` and `--sui-font-family` are not in this list; `createTheme` writes them separately.

### `generateColors`

```ts
function generateColors(seed: ThemeSeed, tint: NeutralTint, mode: ColorMode): ThemeColors
```

The palette engine behind `createTheme`, for one mode. It throws `TypeError` for an unknown `tint`
but does not validate colours: an unparseable seed is treated as a mid grey (see
[`toOklch`](#tooklch)). Seeds are re-serialised before use, so every returned colour is a hex string
(or `'transparent'`). Prefer `createTheme` unless you need the extra fields below.

**`ThemeColors`** has a camelCase field for each semantic token (`background`, `cardForeground`,
`chart1` … `chart5`, `sidebarAccentForeground`, …) plus fields that `createTheme` does not emit:

| Field | Light mode | Dark mode |
| --- | --- | --- |
| `popoverBorder` | neutral 200 | fixed dark shade |
| `headerBackground`, `headerForeground`, `headerBorder` | table header colours | table header colours |
| `rowBackground` | `'transparent'` | `'transparent'` |
| `rowForeground`, `rowHover`, `rowSelected`, `rowSelectedHover`, `rowStriped`, `rowBorder` | table row colours | table row colours |

Chart colours walk the hue from `primary` towards `accent` in five steps, with alternating
lightness so neighbouring series stay distinct in greyscale.

---

## Presets

### `ThemePreset`

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | Value for `data-theme`. |
| `name` | `string` | Display name. |
| `description` | `string` | |
| `seed` | `ThemeSeed` | |
| `neutralTint` | `NeutralTint` | |
| `radius` | `string` | Written as `--radius`. |

### `THEME_PRESETS`

The shipped named themes, as a readonly tuple. `presets.css` is generated from this list.

| `id` | `name` | `primary` | `accent` | `neutralTint` | `radius` |
| --- | --- | --- | --- | --- | --- |
| `shining` | Shining | `#01493b` | `#ff7f00` | `subtle` | `0.65rem` |
| `slate` | Slate | `#2563eb` | `#06b6d4` | `subtle` | `0.5rem` |
| `midnight` | Midnight | `#38bdf8` | `#818cf8` | `tinted` | `0.75rem` |
| `violet` | Violet | `#7c3aed` | `#ec4899` | `subtle` | `0.75rem` |
| `ember` | Ember | `#c2410c` | `#eab308` | `tinted` | `0.875rem` |
| `forest` | Forest | `#047857` | `#84cc16` | `subtle` | `0.375rem` |
| `rose` | Rose | `#e11d48` | `#fb923c` | `tinted` | `1rem` |
| `mono` | Mono | `#18181b` | `#71717a` | `pure` | `0.125rem` |
| `darwind` | Darwind | `#3730a3` | `#f59e0b` | `subtle` | `0.25rem` |
| `unn` | Unn | `#0f766e` | `#f97362` | `tinted` | `1.25rem` |

Several presets also set `neutral`, `surface` and status seeds; read `preset.seed` for the full
values.

### `ThemePresetId`

The union of the `id` values above.

### `getThemePreset`

```ts
function getThemePreset(id: string): ThemePreset | undefined
```

The preset with that id, or `undefined`.

Rebuild a preset with changes, for example a different radius:

```ts
import { createThemeCss, getThemePreset } from '@shining-technologies/ui/theme'

const ember = getThemePreset('ember')
const css = ember
  ? createThemeCss({ ...ember.seed, neutralTint: ember.neutralTint, radius: '0.25rem' })
  : ''
```

---

## Colour parsing and formatting

### `Oklch` and `Rgb`

```ts
interface Oklch {
  l: number // perceptual lightness, 0–1
  c: number // chroma, 0 to about 0.4 for displayable sRGB
  h: number // hue angle in degrees, 0–360
  alpha: number // 0–1
}

interface Rgb {
  r: number // 0–1
  g: number // 0–1
  b: number // 0–1
  alpha: number // 0–1
}
```

### `parseColor`

```ts
function parseColor(input: string): Oklch | null
```

Parses a colour string into OKLCH, strictly and over the whole string, following CSS Color 4.
Returns `null` for anything else, including a valid colour with other text before, after or inside
it (`rgb(1 2 3) url(x)`, `#fff;`). Never throws. Surrounding whitespace is ignored and matching is
case-insensitive.

| Syntax | Components |
| --- | --- |
| `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa` | Hex digits only. |
| `rgb(r g b)`, `rgb(r g b / a)` | Each channel a number (0–255), a percentage or `none` (0); numbers and percentages may be mixed. |
| `rgb(r, g, b)`, `rgb(r, g, b, a)` | Legacy syntax: three numbers or three percentages, not mixed; no `none`. |
| `hsl(h s l)`, `hsl(h s l / a)` | Hue as a number (degrees), an angle (`deg`, `grad`, `rad`, `turn`) or `none`; saturation and lightness as percentages, numbers (`50` means `50%`) or `none`. |
| `hsl(h, s, l)`, `hsl(h, s, l, a)` | Legacy syntax: saturation and lightness must be percentages; no `none`. |
| `oklch(l c h)`, `oklch(l c h / a)` | Lightness as a number (0–1) or percentage; chroma as a number or a percentage of 0.4; hue as for `hsl()`; any of them `none` (0). No comma syntax. |

`rgba()` and `hsla()` are aliases of `rgb()` and `hsl()`. Alpha is a number or a percentage (`none`
is 0 in the modern syntax). Numbers use CSS syntax: `1`, `-0.5`, `.5`, `1e3`, but not `1.`.

Out-of-range values are clamped as CSS clamps them: RGB channels to 0–255, saturation and lightness
to 0–100%, OKLCH lightness to 0–1, chroma to at least 0, alpha to 0–1. Hue wraps into 0–360.

Not supported: named colours (`red`), `hwb()`, `lab()`, `color()`, `calc()` inside a colour and
relative colour syntax.

### `formatHex`

```ts
function formatHex(color: Oklch): string
```

Renders as `#rrggbb`, or `#rrggbbaa` when `alpha < 1`. Out-of-gamut colours are brought into sRGB
with [`gamutFit`](#gamutfit) (chroma reduced, hue kept) before conversion.

### `formatOklch`

```ts
function formatOklch(color: Oklch): string
```

Renders as `oklch(l c h)` or `oklch(l c h / alpha)`, with `l` and `c` rounded to 4 decimal places,
`h` to 2 and `alpha` to 3. No gamut fitting.

```ts
import { formatHex, formatOklch, parseColor } from '@shining-technologies/ui/theme'

const red = parseColor('#ff0000')
if (red) {
  formatOklch(red) // 'oklch(0.628 0.2577 29.23)'
  formatHex({ ...red, alpha: 0.5 }) // '#ff000080'
}
```

### `toRgb`

```ts
function toRgb(color: Oklch): Rgb
```

Converts to sRGB after `gamutFit`. Channels are 0–1.

---

## Colour manipulation

These functions take colour strings and return hex strings. None of them throws: an input that
`parseColor` cannot read is treated as a mid grey (`oklch(0.6 0 0)`). Validate with `parseColor`
first when the input is untrusted. All arithmetic is in OKLCH, so changes are perceptually even.

### `toOklch`

```ts
function toOklch(color: string): Oklch
```

`parseColor(color)`, or `{ l: 0.6, c: 0, h: 0, alpha: 1 }` when it cannot be parsed.

### `lighten`

```ts
function lighten(color: string, amount: number): string
```

Moves lightness towards white by `amount` (0–1) of the remaining distance.

### `darken`

```ts
function darken(color: string, amount: number): string
```

Multiplies lightness by `1 - amount`.

### `withLightness`

```ts
function withLightness(color: string, l: number): string
```

Sets absolute OKLCH lightness (clamped to 0–1), keeping hue and chroma.

### `saturate`

```ts
function saturate(color: string, factor: number): string
```

Multiplies chroma by `factor`: `1` is unchanged, `0` is grey, above `1` intensifies (limited by the
sRGB gamut on output).

### `withAlpha`

```ts
function withAlpha(color: string, alpha: number): string
```

Sets alpha (clamped to 0–1). Returns `#rrggbbaa` when alpha is below 1.

### `mix`

```ts
function mix(a: string, b: string, weight?: number): string
```

Blends two colours in OKLCH. `weight` (default `0.5`, clamped to 0–1) is the share of `b`. Hue is
interpolated the short way round, and a grey takes the other colour's hue, so mixing towards white
does not shift the hue. Alpha is interpolated too.

```ts
import { mix } from '@shining-technologies/ui/theme'

mix('#ffffff', '#2563eb', 0.1) // a light blue tint
```

---

## Contrast

### `contrastRatio`

```ts
function contrastRatio(a: string, b: string): number
```

WCAG 2.x contrast ratio, from 1 to 21 (floating point, so black on white is just under 21).
Alpha is ignored.

### `meetsContrastAA`

```ts
function meetsContrastAA(foreground: string, background: string, large?: boolean): boolean
```

`true` when the ratio is at least 4.5, or at least 3 when `large` is `true` (large text).

### `readableForeground`

```ts
function readableForeground(background: string, light?: string, dark?: string): string
```

Returns whichever of `light` (default `'#ffffff'`) and `dark` (default `'#09090b'`) has the higher
contrast against `background`; `light` on a tie. The candidate is returned as passed, not
re-formatted. It picks the better of the two; it does not guarantee that either reaches 4.5:1.

```ts
import { readableForeground } from '@shining-technologies/ui/theme'

readableForeground('#facc15') // '#09090b'
```

### `isDark`

```ts
function isDark(color: string): boolean
```

`true` when OKLCH lightness is below 0.5.

---

## Scales

### `SCALE_STEPS`, `ScaleStep`, `ColorScale`

```ts
const SCALE_STEPS: readonly [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
type ScaleStep = (typeof SCALE_STEPS)[number]
type ColorScale = Record<ScaleStep, string>
```

### `generateScale`

```ts
function generateScale(seed: string): ColorScale
```

Builds a 50–950 ramp (Tailwind convention) from one colour. Every step keeps the seed's hue. Each
step has a fixed OKLCH lightness (50: 0.977, 100: 0.951, 200: 0.9, 300: 0.83, 400: 0.74, 500: 0.64,
600: 0.56, 700: 0.48, 800: 0.4, 900: 0.33, 950: 0.23), and chroma is the seed's chroma scaled down
at both ends (full at 500 and 600), so a muted seed gives a muted ramp. The seed's own lightness is
not used, so the seed itself is usually not one of the steps.

```ts
import { generateScale, nearestScaleStep } from '@shining-technologies/ui/theme'

const blue = generateScale('#2563eb')
blue[600] // '#2968f0'
nearestScaleStep('#2563eb') // 600
```

### `nearestScaleStep`

```ts
function nearestScaleStep(seed: string): ScaleStep
```

The step whose target lightness is closest to the seed's, so neighbouring steps can serve as its
hover and active states.

---

## Colour space conversion

Low-level conversions used by the rest of the module.

### `rgbToOklch`

```ts
function rgbToOklch(color: Rgb): Oklch
```

sRGB (channels 0–1, gamma-encoded) to OKLCH, following Björn Ottosson's reference conversion.
A colour with near-zero chroma gets hue `0`.

### `oklchToRgb`

```ts
function oklchToRgb(color: Oklch): Rgb
```

OKLCH to sRGB. Channels outside 0–1 are clamped, which can shift the hue of an out-of-gamut
colour; use `gamutFit` first (as `toRgb` and `formatHex` do) to avoid that.

### `gamutFit`

```ts
function gamutFit(color: Oklch): Oklch
```

Reduces chroma (binary search) until the colour fits in sRGB, keeping hue and lightness.
Lightness at or below 0 returns black and at or above 1 returns white (chroma 0). A colour already
in gamut is returned unchanged.

### `relativeLuminance`

```ts
function relativeLuminance(color: Rgb): number
```

WCAG 2.x relative luminance of a gamma-encoded sRGB colour (channels 0–1). Alpha is ignored.

---

## Export index

Every export of `@shining-technologies/ui/theme`, alphabetically.

**Functions and constants:** [`contrastRatio`](#contrastratio), [`createTheme`](#createtheme),
[`createThemeCss`](#createthemecss), [`darken`](#darken), [`formatHex`](#formathex),
[`formatOklch`](#formatoklch), [`gamutFit`](#gamutfit), [`generateColors`](#generatecolors),
[`generateScale`](#generatescale), [`getThemePreset`](#getthemepreset), [`isDark`](#isdark),
[`lighten`](#lighten), [`meetsContrastAA`](#meetscontrastaa), [`mix`](#mix),
[`nearestScaleStep`](#nearestscalestep), [`oklchToRgb`](#oklchtorgb),
[`parseColor`](#parsecolor), [`readableForeground`](#readableforeground),
[`relativeLuminance`](#relativeluminance), [`rgbToOklch`](#rgbtooklch),
[`saturate`](#saturate), [`SCALE_STEPS`](#scale_steps-scalestep-colorscale),
[`SEMANTIC_TOKENS`](#semantic_tokens), [`THEME_PRESETS`](#theme_presets), [`toOklch`](#tooklch),
[`tokensToCss`](#tokenstocss), [`toRgb`](#torgb), [`withAlpha`](#withalpha),
[`withLightness`](#withlightness).

**Types:** `ColorMode`, `ColorScale`, `CreateThemeOptions`, `NeutralTint`, `Oklch`, `Rgb`,
`ScaleStep`, `SemanticToken`, `ThemeColors`, `ThemeCssOptions`, `ThemeDefinition`, `ThemePreset`,
`ThemePresetId`, `ThemeSeed`, `ThemeTokens`.
