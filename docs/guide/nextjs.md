# Next.js and server rendering

The kit renders on the server. Every component produces its HTML under `renderToString`
and `renderToPipeableStream`, and nothing touches `window`, `document` or `localStorage`
during render. This is asserted by a test suite that runs in plain Node. This page shows
how to set up the Next.js App Router, and covers the few places where the server and the
browser know different things.

The same rules apply to Remix / React Router, TanStack Start, Astro islands and any other SSR
host. Only the file names change.

---

## The App Router in three files

### 1. The root layout

```tsx
// app/layout.tsx
import '@shining-technologies/ui-kit-react/styles.css'
import './globals.css' // your own styles, after the kit's
import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

Import the stylesheet here, once. `suppressHydrationWarning` on `<html>` covers only that
element's attributes. The provider writes `data-sui-mode` and the token variables onto it after
hydration, and that is expected.

### 2. A client providers file

```tsx
// app/providers.tsx
'use client'

import { ProjectRegistry, ToastProvider, Toaster, UIKitProvider } from '@shining-technologies/ui-kit-react'

// Created once, in the browser. A registry holds functions and persists to
// localStorage, so it cannot be built in a Server Component and passed down.
const registry = new ProjectRegistry()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UIKitProvider registry={registry} preset="shining" defaultMode="system" scope="global">
      <ToastProvider>
        {children}
        <Toaster />
      </ToastProvider>
    </UIKitProvider>
  )
}
```

The kit's bundles already begin with `'use client'`, so a Server Component can render
`<UIKitProvider preset="unn" scope="global">` directly **when every prop is serialisable**
(strings, numbers, plain objects). You need your own `'use client'` file as soon as you pass
anything that is not: a `ProjectRegistry`, a callback such as `onModeChange`, a `renderLink`
function, or a nav tree whose items carry `onSelect`. In practice that is almost always, so start
with the file.

### 3. Pages stay Server Components

```tsx
// app/users/page.tsx — a Server Component
import { UsersTable } from './users-table'

export default async function UsersPage() {
  const users = await db.user.findMany()
  return <UsersTable users={users} />
}
```

```tsx
// app/users/users-table.tsx
'use client'

import { DataTable, type ColumnDef } from '@shining-technologies/ui-kit-react'

const columns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
]

export function UsersTable({ users }: { users: User[] }) {
  return <DataTable data={users} columns={columns} label="Users" getRowId={(u) => u.id} />
}
```

Column definitions contain functions (`cell`, `accessorFn`), so they live in the client file.
Fetch in the Server Component and pass plain data across.

Simple components with serialisable props (`Card`, `Badge`, `Alert`, `PageHeader`) can be
rendered straight from a Server Component. They become client components in the tree, but
you do not have to write the boundary yourself.

---

## No flash of the wrong theme

With `scope="global"`, the provider server-renders the tokens as a `<style>` element in the
initial HTML. The first paint is already in your project's colours, not the default palette.
React removes the element after hydration, once the tokens are on `<html>`.

For `defaultMode="system"` the server cannot know the visitor's OS setting, so it sends both
palettes, with the dark one behind `@media (prefers-color-scheme: dark)`. A dark-mode visitor
sees dark from the first frame.

`scope="local"` with `mode="system"` does the same for its wrapper. It server-renders a
`<style>` scoped to the wrapper that holds both palettes behind `prefers-color-scheme`, and
removes it at hydration. It honours `nonce` too.

**Prefer `scope="global"` for an application.** Only global scope themes the page background
and your own markup outside the provider. Local scope is for previews and side-by-side
comparisons.

### A saved theme choice

If users pick a theme, the server needs to know it to render it. The server has no
`localStorage`, so store the choice in a cookie as well, and pass it down:

```tsx
// app/layout.tsx
import { cookies } from 'next/headers'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const mode = (await cookies()).get('theme')?.value as 'light' | 'dark' | undefined
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers mode={mode ?? 'system'}>{children}</Providers>
      </body>
    </html>
  )
}
```

```tsx
// app/providers.tsx
'use client'

import { useState } from 'react'
import { UIKitProvider, type ColorModePreference } from '@shining-technologies/ui-kit-react'

export function Providers({
  mode: initial,
  children,
}: {
  mode: ColorModePreference
  children: React.ReactNode
}) {
  const [mode, setMode] = useState(initial)
  return (
    <UIKitProvider
      preset="shining"
      scope="global"
      mode={mode}
      onModeChange={(next) => {
        setMode(next)
        document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`
      }}
    >
      {children}
    </UIKitProvider>
  )
}
```

A `ProjectRegistry` restores the user's projects from `localStorage`. During hydration the
provider paints the registry's initial project, which is what the server rendered, and switches
to the restored one straight after. If the project must be right on the first frame, keep the
active project id in a cookie too and pass it as `project`.

With a registry, the user's saved pick wins over `preset` and `brand`. Those only decide where
a first visit starts. See [Precedence](./projects.md#precedence).

### Your own `dark:` utilities

The provider sets the colour mode on `<html>` after hydration. If you use Tailwind's `dark:`
variant for your own markup, it is not correct on the very first paint for a `system` visitor.
Either configure Tailwind's dark variant to use the media query, or set the class before paint
with a small inline script (for example with `next-themes`) and pass its result to
`mode`.

---

## Content-Security-Policy

The kit server-renders three inline `<style>` elements: the global token sheet, the
local-scope sheet in `system` mode, and the sidebar's custom-breakpoint style. `nonce` covers
all three. Under a policy that forbids inline styles without a nonce, pass the request's nonce:

```tsx
// app/layout.tsx
import { headers } from 'next/headers'

const nonce = (await headers()).get('x-nonce') ?? undefined
// …
<Providers nonce={nonce}>{children}</Providers>

// app/providers.tsx
<UIKitProvider scope="global" nonce={nonce}>
```

Components also set inline `style` attributes for geometry (column widths, chart sizes). Those
are governed by `style-src-attr`. Allow `'unsafe-inline'` for attributes, or accept that
sizing falls back to CSS defaults.

---

## Routing: the sidebar and links

`SidebarNav` renders plain `<a>` elements unless you give it `renderLink`. Pass your router's
link, together with the current path, so the active item is known on the server as well:

```tsx
// app/(dashboard)/nav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sidebar, SidebarNav, type SidebarNavEntry } from '@shining-technologies/ui-kit-react'

export function DashboardNav({ items }: { items: SidebarNavEntry[] }) {
  const pathname = usePathname()
  return (
    <Sidebar>
      <SidebarNav
        items={items}
        currentPath={pathname}
        renderLink={(props) => <Link {...props} />}
      />
    </Sidebar>
  )
}
```

React Router takes `to` instead of `href`:

```tsx
import { Link, useLocation } from 'react-router'

;<SidebarNav
  items={NAV}
  currentPath={useLocation().pathname}
  renderLink={({ href, ...props }) => <Link to={href} {...props} />}
/>
```

The link component must forward refs, because tooltips and flyouts on the collapsed rail anchor
to it. Next's `Link` and React Router's `Link` both do.

`currentPath` matches the longest enclosing `href`, so `/orders/1042` lights up "Orders". Full
URLs and hash routes (`#/reports`) are understood.

For buttons that navigate, use `asChild`:

```tsx
<Button asChild>
  <Link href="/users/new">New user</Link>
</Button>
```

### Remembered sidebar state

`<SidebarProvider storageKey="admin-nav">` remembers the collapsed rail and the open branches.
The server cannot see them, so the server HTML renders the default state, and the remembered one
is applied one commit after hydration. Pass `defaultCollapsed` from a cookie if the rail must be
right on the first frame.

On phones, before hydration, the sidebar is already rendered as a closed drawer, so a phone
never flashes the desktop column. The stylesheet covers the default `48rem` breakpoint. A
custom `mobileBreakpoint` is server-rendered as a small `<style>` scoped to the sidebar, which
carries the provider's `nonce`, so it works at any breakpoint.

---

## Server Actions and forms

Controls given a `name` submit their value with a native `<form>`. That includes `PhoneInput`
(E.164), `NumberInput` (the plain number), `TagsInput` (one entry per tag) and the date fields.
This means a Server Action receives clean values with no client code:

```tsx
<form action={createCustomer}>
  <Field label="Mobile">
    <PhoneInput name="phone" defaultCountry="AU" />
  </Field>
  <Button type="submit">Create</Button>
</form>
```

See [Forms](./forms.md#native-form-submission) for what each control submits.

---

## Server-only code

The root entry, `@shining-technologies/ui-kit-react`, is marked `'use client'` as a whole. A Server Component
can render its components, but it cannot **call** its functions: `createColumnHelper()`,
`createProject()` or `contrastRatio()` imported from `@shining-technologies/ui-kit-react` fail on the server.

Import server-side logic from `@shining-technologies/ui-kit-core` instead. It has no React and no
`'use client'`:

```ts
// app/api/theme/route.ts
import { createProject, resolveProject, themeToCssVars } from '@shining-technologies/ui-kit-core'
```

This is also how you compute a table's query on the server so client and server agree. See
[Server-side](../data-table/server-side.md).

---

## Charts on the server

Charts size themselves to their container, which does not exist on the server. They render at a
640px default width and resize on hydration. Give the chart's parent a fixed height, and pass a
`height`, so the layout does not shift:

```tsx
<div style={{ height: 240 }}>
  <LineChart data={data} xKey="month" series={[{ key: 'total' }]} height={240} />
</div>
```

---

## Checklist

- [ ] `styles.css` imported once, in the root layout
- [ ] A `'use client'` providers file holding `UIKitProvider` (and `ToastProvider`)
- [ ] `scope="global"` for the application
- [ ] Column definitions, `renderLink` and callbacks in client files
- [ ] Server-side helpers imported from `@shining-technologies/ui-kit-core`
- [ ] `nonce` passed if you have a strict CSP

## Related

- [Installation](./installation.md)
- [Theming](./theming.md) — colour mode and tokens
- [Forms](./forms.md)
- [Troubleshooting](./troubleshooting.md)
