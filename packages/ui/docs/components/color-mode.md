# Color mode

Dark mode in this kit is a CSS class: `.dark` on `<html>` switches every token. These exports add
that class before the first paint, store the user's preference, and give you a toggle and a hook,
all without a provider. If your app already uses `next-themes`, use only `ColorModeToggle` in
controlled mode.

```tsx
import { ColorModeScript, ColorModeToggle, useColorMode } from '@shining-technologies/ui'
// or: from '@shining-technologies/ui/color-mode'
```

**Server and client.** `ColorModeScript`, `getColorModeScript`, `DEFAULT_COLOR_MODE_STORAGE_KEY` and
the preference types come from a module without a directive. `ColorModeScript` is a Server
Component and `getColorModeScript` runs anywhere. `useColorMode`, `ColorModeToggle`,
`resolveColorMode` and `applyColorMode` come from a `'use client'` module. Use them in client
components.

## How it works

- **Preference.** `'light'`, `'dark'` or `'system'` (`ColorModePreference`). It is stored in
  `localStorage` under `sui-color-mode` (`DEFAULT_COLOR_MODE_STORAGE_KEY`) unless you pass
  `storageKey`.
- **Resolved mode.** `'light'` or `'dark'` (`ResolvedColorMode`). `'system'` resolves through
  `matchMedia('(prefers-color-scheme: dark)')`.
- **Applied.** The resolved mode toggles `.dark` on `document.documentElement` and sets
  `style.colorScheme` to `'light'` or `'dark'`.
- **Fallback.** When nothing valid is stored (missing, blocked, or a value other than the three
  names), `defaultMode` is used. It defaults to `'system'`.

The kit never follows the operating system unless a preference of `'system'` is in effect. An app
that renders none of these exports never gets dark components. See [Theming](../theming.md#3-dark-mode).

## Setup without a library

```tsx
// app/layout.tsx (a Server Component)
import '@shining-technologies/ui/styles.css'
import { ColorModeScript } from '@shining-technologies/ui'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorModeScript defaultMode="system" />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

```tsx
// app/header.tsx
'use client'
import { ColorModeToggle } from '@shining-technologies/ui'

export function Header() {
  return (
    <header>
      <ColorModeToggle />
    </header>
  )
}
```

`suppressHydrationWarning` on `<html>` is required: the script changes the `class` and `style`
attributes before React hydrates.

Pass the same `storageKey` and `defaultMode` to `ColorModeScript`, `useColorMode` and
`ColorModeToggle`. Otherwise the first paint and the hook can disagree.

Without `ColorModeScript`, `useColorMode` and an uncontrolled `ColorModeToggle` still apply the
stored preference to `<html>` after they mount. The page can then show the wrong mode briefly, so
keep the script for a correct first paint.

## ColorModeScript

Renders an inline `<script>` that applies the stored preference before the page paints. Render it in
`<head>`.

```tsx
<ColorModeScript storageKey="acme-color-mode" defaultMode="light" />
```

| Prop          | Type                              | Default            | Description |
| ------------- | --------------------------------- | ------------------ | ----------- |
| `storageKey`  | `string`                          | `'sui-color-mode'` | `localStorage` key to read. |
| `defaultMode` | `'light' \| 'dark' \| 'system'`   | `'system'`         | Used when nothing valid is stored. An unrecognised value falls back to `'system'`. |
| `nonce`       | `string`                          | —                  | Content-Security-Policy nonce for the inline script. |

The script catches its own errors. Blocked storage falls back to `defaultMode`. Any other exception
leaves `<html>` unchanged. The storage key is JSON-encoded, with `<` escaped, before it is put into
the script, so an arbitrary key cannot break out of the string or the element.

The element has `suppressHydrationWarning` set.

### nonce

Under a nonce-based CSP, pass the request's nonce:

```tsx
// app/layout.tsx
import { headers } from 'next/headers'
import { ColorModeScript } from '@shining-technologies/ui'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorModeScript nonce={nonce} />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

How the nonce reaches the request (here as an `x-nonce` header) depends on your middleware. See
[Next.js](../nextjs.md#content-security-policy).

### getColorModeScript

`getColorModeScript(options?: ColorModeScriptOptions): string` returns the same script source
without the `<script>` element. Use it in frameworks or HTML templates that inject head scripts
themselves:

```ts
import { getColorModeScript } from '@shining-technologies/ui'

const head = `<script>${getColorModeScript({ defaultMode: 'dark' })}</script>`
```

`ColorModeScriptOptions` is `{ storageKey?: string; defaultMode?: ColorModePreference }`.
`ColorModeScriptProps` adds `nonce`.

## useColorMode

Reads and changes the preference. Every component that calls the hook with the same `storageKey`
stays in sync. So do other tabs, through the `storage` event.

```tsx
'use client'
import { Button, ButtonGroup, useColorMode, type ColorModePreference } from '@shining-technologies/ui'

const options: { value: ColorModePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

export function ColorModePicker() {
  const { mode, setMode } = useColorMode()
  return (
    <ButtonGroup aria-label="Colour mode">
      {options.map((option) => (
        <Button
          key={option.value}
          variant={mode === option.value ? 'secondary' : 'ghost'}
          aria-pressed={mode === option.value}
          onClick={() => setMode(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </ButtonGroup>
  )
}
```

**Options** (`UseColorModeOptions`, the same shape as `ColorModeScriptOptions`):

| Option        | Type                              | Default            | Description |
| ------------- | --------------------------------- | ------------------ | ----------- |
| `storageKey`  | `string`                          | `'sui-color-mode'` | `localStorage` key. |
| `defaultMode` | `'light' \| 'dark' \| 'system'`   | `'system'`         | Preference used when nothing valid is stored. |

**Returns** `ColorModeState`:

| Field          | Type                                        | Description |
| -------------- | ------------------------------------------- | ----------- |
| `mode`         | `'light' \| 'dark' \| 'system'`             | The stored preference, or `defaultMode`. |
| `resolvedMode` | `'light' \| 'dark'`                         | What `mode` resolves to now. |
| `setMode`      | `(mode: ColorModePreference) => void`       | Stores the preference, applies `.dark` and `color-scheme` to `<html>`, and updates every hook on the page. If storage is blocked, the change still applies to the current page. |

Behaviour:

- **Server rendering and hydration.** `mode` is `defaultMode`, and `resolvedMode` is `'dark'` only
  when `defaultMode` is `'dark'`, otherwise `'light'`. The real values arrive right after
  hydration. Mode-dependent UI (a pressed state, an icon) therefore renders the default first.
- **Mount.** If `<html>` does not match the stored preference (its `.dark` class or `color-scheme`),
  the hook applies the preference once. With `ColorModeScript` in place they already match, and
  nothing changes.
- **Operating system changes.** While the preference is `'system'`, an OS change updates
  `resolvedMode` and re-applies the class on `<html>`.
- **Other tabs.** A change in another tab under the same key updates the hook and the class.

### resolveColorMode and applyColorMode

Low-level helpers the hook uses. Both are client-only.

| Export | Signature | Description |
| ------ | --------- | ----------- |
| `resolveColorMode` | `(preference: ColorModePreference, system: ResolvedColorMode) => ResolvedColorMode` | Returns `system` for `'system'`, otherwise `preference`. |
| `applyColorMode` | `(mode: ResolvedColorMode, root?: HTMLElement) => void` | Toggles `.dark` and sets `style.colorScheme` on `root` (default `document.documentElement`). It does not store anything or notify hooks. Use `setMode` for that. |

## ColorModeToggle

An icon button that switches between light and dark. It shows a moon in light mode and a sun in
dark mode. Its accessible name describes the action ("Switch to dark mode").

```tsx
'use client'
import { ColorModeToggle } from '@shining-technologies/ui'

<ColorModeToggle labels={{ toDark: 'Use dark theme', toLight: 'Use light theme' }} />
```

| Prop           | Type                                                    | Default                                             | Description |
| -------------- | ------------------------------------------------------- | --------------------------------------------------- | ----------- |
| `mode`         | `'light' \| 'dark'`                                     | —                                                   | Controlled mode, for example from `next-themes`. Passing the prop at all, even as `undefined`, makes the toggle controlled (see below). |
| `onModeChange` | `(mode: 'light' \| 'dark') => void`                     | —                                                   | Called with the mode the click switches to, in both controlled and uncontrolled use. |
| `labels`       | `{ toDark?: string; toLight?: string; toggle?: string }` | `'Switch to dark mode'` / `'Switch to light mode'` / `'Toggle colour mode'` | Accessible name (and `title`) for each action. `toggle` is used while a controlled `mode` is `undefined`. |
| `storageKey`   | `string`                                                | `'sui-color-mode'`                                  | Uncontrolled only. See [useColorMode](#usecolormode). |
| `defaultMode`  | `'light' \| 'dark' \| 'system'`                         | `'system'`                                          | Uncontrolled only. |
| `variant`      | `ButtonProps['variant']`                                | `'ghost'`                                           | See [Button](button.md). |
| `size`         | `ButtonProps['size']`                                   | `'icon'`                                            | See [Button](button.md). |

Other [`Button`](button.md) props are accepted, except `onClick` and `children`. The `ref` is
forwarded to the `<button>`. The button has `data-mode` set to the current resolved mode.

**Uncontrolled** (no `mode` prop). The toggle reads and writes the stored preference like
`useColorMode`, including the correction on mount. A click stores an explicit `'light'` or `'dark'`
and then calls `onModeChange` if given. The toggle never sets `'system'`. To offer a system option,
build a picker with `useColorMode` as shown above.

**Controlled** (`mode` passed). Clicks only call `onModeChange`. The toggle never writes `<html>`
or storage: not on click, not on mount, and not when the OS setting changes. While `mode` is
`undefined`, the button shows a neutral state: the moon icon, no `data-mode`, and the name
`labels.toggle` ("Toggle colour mode"). A click in that state reports the opposite of what is
painted, based on `.dark` on `<html>`.

## With next-themes

`next-themes` sets the class and stores the preference itself. Do not render `ColorModeScript` and
do not call `useColorMode`. Configure `next-themes` to use the `class` attribute, and drive the
toggle in controlled mode:

```tsx
// app/providers.tsx
'use client'
import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}
```

```tsx
// app/theme-toggle.tsx
'use client'
import { ColorModeToggle } from '@shining-technologies/ui'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  // undefined until next-themes has mounted: the toggle stays controlled and shows a neutral state
  const mode = resolvedTheme === 'dark' || resolvedTheme === 'light' ? resolvedTheme : undefined
  return <ColorModeToggle mode={mode} onModeChange={setTheme} />
}
```

Always pass the `mode` prop, even when its value is `undefined`. Leaving it off makes the toggle
uncontrolled, and it would then write `sui-color-mode` and the `.dark` class alongside `next-themes`.

## Accessibility

- `ColorModeToggle` is a native `<button>`. Its accessible name and `title` describe the action
  ("Switch to light mode"), not the current state, and they update after each click. The icon is
  `aria-hidden`.
- `color-scheme` is set together with the class, so native form controls, scrollbars and system
  colours match the mode.
- Build a mode picker from real buttons with `aria-pressed`, or from a radio group, so the current
  choice is announced.
- Themes from `createThemeCss` meet WCAG AA contrast in both modes. Check hand-written dark tokens
  yourself ([Theming](../theming.md)).

## Related

- [Theming](../theming.md): dark tokens, presets, following the OS without JavaScript
- [Next.js](../nextjs.md): root layout, `next-themes`, Content-Security-Policy
- [Button](button.md): props accepted by `ColorModeToggle`
- [Icons](icons.md): `SunIcon`, `MoonIcon`, `MonitorIcon`
