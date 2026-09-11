# Installation

## The one package most applications need

```bash
pnpm add @shining-ui-kit/react react react-dom
```

```bash
npm install @shining-ui-kit/react react react-dom
```

```bash
yarn add @shining-ui-kit/react react react-dom
```

`@shining-ui-kit/react` depends on `@shining-ui-kit/core` and pulls it in for you. It also
re-exports the parts of core an application reaches for — `createProject`, `contrastRatio`,
the token types — so you rarely install core directly. See
[Packages](../reference/packages.md) for when you would.

## Peer dependencies

| Peer                      | Required?                         | Needed for                               |
| ------------------------- | --------------------------------- | ---------------------------------------- |
| `react`, `react-dom`      | Yes — 18 or 19                    | Everything                               |
| `recharts`                | Only for the `/recharts` entry    | `BarChart`, `DonutChart`, `Sparkline`, … |
| `@tanstack/react-virtual` | Only for the `/virtualized` entry | Row virtualisation                       |

The two optional peers are declared `optional`, so a normal install never warns about them.
Add one only when you import the entry point that needs it:

```bash
pnpm add recharts                 # then: import { BarChart } from '@shining-ui-kit/react/recharts'
pnpm add @tanstack/react-virtual  # then: import { VirtualizedDataTable } from '@shining-ui-kit/react/virtualized'
```

Radix UI, TanStack Table, `clsx`, `tailwind-merge` and `class-variance-authority` are ordinary
dependencies — they install automatically and you do not configure them.

## Import the stylesheet once

```tsx
import '@shining-ui-kit/react/styles.css'
```

Anywhere that runs once at startup: your root layout, `main.tsx`, `_app.tsx`. It is plain CSS
built from `--sui-*` custom properties, so components look finished with no further setup.

**You do not need Tailwind.** If you do use it, nothing changes — every `className` prop is
merged through `tailwind-merge`, so your utilities override the kit's defaults rather than
fighting them. Put the kit's stylesheet **before** your Tailwind entry so your layer wins.

## Mount the provider

```tsx
import { UIKitProvider } from '@shining-ui-kit/react'
import '@shining-ui-kit/react/styles.css'

export function Root() {
  return (
    <UIKitProvider defaultProject="shining" defaultMode="system" scope="global">
      <App />
    </UIKitProvider>
  )
}
```

Components work without it, but the provider is what makes the appearance yours and lets it
change at runtime. `scope="global"` writes the tokens onto `<html>`, so portalled surfaces —
dialogs, dropdowns, tooltips — inherit them too.

Carry on in [Quick start](quick-start.md).

## Framework notes

### Next.js (App Router)

Every bundle carries a `'use client'` banner, so the kit imports cleanly from a Server
Component tree without you marking anything yourself. Import the stylesheet in the root
layout:

```tsx
// app/layout.tsx
import '@shining-ui-kit/react/styles.css'
import { UIKitProvider } from '@shining-ui-kit/react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <UIKitProvider defaultProject="shining" scope="global">
          {children}
        </UIKitProvider>
      </body>
    </html>
  )
}
```

`suppressHydrationWarning` on `<html>` matters when `defaultMode="system"`: the provider sets
the colour mode attribute before React hydrates, which is the point — it is what stops the
page flashing light before going dark.

### Vite, Remix, Astro, React Router

Nothing special. Import the stylesheet from your entry module and mount the provider at the
root of the React tree.

### Create React App / Webpack 4

Webpack 4 does not understand the `exports` field, so the subpath entries
(`/recharts`, `/virtualized`) will not resolve. The main entry and the stylesheet work
through the `main`/`module`/`types` fields. Prefer a modern bundler if you need the subpaths.

## TypeScript

Types ship with the packages — there is no `@types/…` to install. Every entry point resolves
under `"moduleResolution"` of `bundler`, `node16`, `nodenext` and legacy `node`, in both ESM
and CommonJS consumers; this is asserted on the packed tarballs before each release.

The kit augments TanStack Table's `ColumnMeta` so `column.columnDef.meta.align` is typed
inside your own renderers. The augmentation loads with the main entry — importing anything
from `@shining-ui-kit/react` is enough.

## What you get in the tarball

Both an ES module and a CommonJS build, with source maps, a rolled-up `.d.ts` per entry point
and its `.d.cts` twin, plus the stylesheet. No `postinstall` script, no binaries, no
telemetry.
