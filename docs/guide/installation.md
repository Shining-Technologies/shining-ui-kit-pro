# Installation

## The one package most applications need

```bash
pnpm add @shining-technologies/ui-kit-react react react-dom
```

```bash
npm install @shining-technologies/ui-kit-react react react-dom
```

```bash
yarn add @shining-technologies/ui-kit-react react react-dom
```

`@shining-technologies/ui-kit-react` depends on `@shining-technologies/ui-kit-core` and pulls it in for you. It also
re-exports the parts of core an application reaches for — `createProject`, `contrastRatio`,
the token types — so you rarely install core directly. See
[Packages](../reference/packages.md) for when you would.

## Peer dependencies

| Peer                      | Required?                         | Needed for                               |
| ------------------------- | --------------------------------- | ---------------------------------------- |
| `react`, `react-dom`      | Yes — 18 or 19                    | Everything                               |
| `recharts` 3, or 2.15+    | Only for the `/recharts` entry    | `BarChart`, `DonutChart`, `Sparkline`, … |
| `@tanstack/react-virtual` | Only for the `/virtualized` entry | Row virtualisation                       |

The two optional peers are declared `optional`, so a normal install never warns about them.
Add one only when you import the entry point that needs it:

```bash
pnpm add recharts                 # then: import { BarChart } from '@shining-technologies/ui-kit-react/recharts'
pnpm add @tanstack/react-virtual  # then: import { VirtualizedDataTable } from '@shining-technologies/ui-kit-react/virtualized'
```

```bash
npm install recharts
```

```bash
yarn add recharts
```

Both Recharts majors are supported: the chart test suites run against Recharts 2 and Recharts 3
on every change. A new install gets Recharts 3, which is the better choice — especially on
React 19 (below).

### React 19 with Recharts 2

Recharts 3 takes `react-is` from your app, so it matches your React with nothing to do. Recharts
2 bundles an older `react-is`, which under React 19 silently breaks some charts — horizontal bars
among them — with no error to tell you why. Upgrade to Recharts 3, or override it to match your
React:

```jsonc
// package.json — npm
"overrides": { "react-is": "^19.0.0" }

// package.json — pnpm
"pnpm": { "overrides": { "react-is": "^19.0.0" } }

// package.json — yarn
"resolutions": { "react-is": "^19.0.0" }
```

React 18 needs nothing.

Radix UI, TanStack Table, `clsx`, `tailwind-merge` and `class-variance-authority` are ordinary
dependencies — they install automatically and you do not configure them.

## Import the stylesheet once

```tsx
import '@shining-technologies/ui-kit-react/styles.css'
```

Anywhere that runs once at startup: your root layout, `main.tsx`, `_app.tsx`. It is plain CSS
built from `--sui-*` custom properties, so components look finished with no further setup.

**You do not need Tailwind.** If you do use it, nothing changes — every `className` prop is
merged through `tailwind-merge`, so your utilities override the kit's defaults rather than
fighting them. Put the kit's stylesheet **before** your Tailwind entry so your layer wins.

## Mount the provider

```tsx
import { UIKitProvider } from '@shining-technologies/ui-kit-react'
import '@shining-technologies/ui-kit-react/styles.css'

export function Root() {
  return (
    <UIKitProvider preset="shining" defaultMode="system" scope="global">
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
import '@shining-technologies/ui-kit-react/styles.css'
import { UIKitProvider } from '@shining-technologies/ui-kit-react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <UIKitProvider preset="shining" scope="global">
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

With `scope="global"` the provider also server-renders the tokens as a `<style>` element, so
the first paint is already themed rather than showing the stylesheet's defaults until the
bundle hydrates. Under a strict Content-Security-Policy, pass the request's nonce:
`<UIKitProvider nonce={nonce} …>`.

A provider that only takes strings — `preset`, `brand`, `scope` — can sit directly in a
Server Component layout as above. Anything with non-serialisable props — a
`ProjectRegistry`, a `renderLink`, a callback — cannot cross from server to client, so create
it in a `'use client'` file of your own and render that from the layout:

```tsx
// app/providers.tsx
'use client'

import { ProjectRegistry, UIKitProvider } from '@shining-technologies/ui-kit-react'

const registry = new ProjectRegistry()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UIKitProvider registry={registry} scope="global">
      {children}
    </UIKitProvider>
  )
}
```

The root entry is marked `'use client'` as a whole, so even its pure helpers —
`resolveProject`, `contrastRatio`, `getPageRange` — are client references there and cannot be
called from a Server Component. In server code, import them from `@shining-technologies/ui-kit-core`.

More in [Next.js](./nextjs.md).

### Vite, Remix, Astro, React Router

Nothing special. Import the stylesheet from your entry module and mount the provider at the
root of the React tree.

### Create React App / Webpack 4

Not supported. The bundles use ES2021 syntax (`?.`, `??`), which Webpack 4 cannot parse
without transpiling `node_modules`, and `@shining-technologies/ui-kit-react/styles.css` resolves only
through the `exports` field, which Webpack 4 ignores. Use Vite or Webpack 5.

If you are stuck on Webpack 4, transpile `@shining-technologies/ui-kit-*` with Babel like your own source,
and import the stylesheet by its file path: `@shining-technologies/ui-kit-react/dist/styles.css`. The
subpath entries (`/recharts`, `/virtualized`) will not resolve either.

## TypeScript

Types ship with the packages — there is no `@types/…` to install. Every entry point resolves
under `"moduleResolution"` of `bundler`, `node16`, `nodenext` and legacy `node`, in both ESM
and CommonJS consumers; this is asserted on the packed tarballs before each release.

The kit augments TanStack Table's `ColumnMeta` so `column.columnDef.meta.align` is typed
inside your own renderers. The augmentation loads with the main entry — importing anything
from `@shining-technologies/ui-kit-react` is enough.

With TypeScript 5.6+ and `noUncheckedSideEffectImports` on, the bare stylesheet import is an
error until something declares CSS modules. Most bundler templates already do; if yours does
not, add one line to a `.d.ts` in your project:

```ts
declare module '*.css'
```

Test runners that execute the import need the same treatment. Vitest handles CSS itself;
Jest needs `.css` stubbed, e.g. `moduleNameMapper: { '\\.css$': '<rootDir>/test/style-stub.js' }`
with a stub that exports an empty object.

## What you get in the tarball

Both an ES module and a CommonJS build, with source maps, a rolled-up `.d.ts` per entry point
and its `.d.cts` twin, plus the stylesheet. No `postinstall` script, no binaries, no
telemetry.
