# Integration tests for `@shining-technologies/ui`

Real applications that consume the V2 package the way users do: from the packed tarball, with
npm, outside the pnpm workspace. A workspace symlink would resolve `react` from
`packages/ui`'s own development copy and hide exactly the problems these projects exist to catch
(duplicate React, missing files, broken `exports`).

| Project         | Stack                                                                    | What it proves |
| --------------- | ------------------------------------------------------------------------ | -------------- |
| `next-app/`     | Next.js 16 App Router, React 19, Tailwind CSS v4, Playwright             | Production build, SSR and hydration, Server Components, a URL-driven server-mode table, route handlers, dark mode, presets, Tailwind overrides, Turbopack dev |
| `vite-app/`     | Vite 8, React 19, Tailwind CSS v4, Playwright                            | Dev and production builds, the full DataTable feature set, charts, virtualization, CSV, overlays; `treeshake/` measures bundle sizes per entry point |
| `types-check/`  | TypeScript, `bundler/` and `nodenext/` projects                          | Declarations resolve under both module resolutions with `skipLibCheck: false`; inferred cell types and `ColumnMeta` augmentation |

These folders are not part of the pnpm workspace and are excluded from the root ESLint run.

## Running

Build and pack the package first (from the repository root):

```bash
pnpm build:ui
cd packages/ui && pnpm pack --pack-destination ../../integration
```

Each project depends on `file:../shining-technologies-ui-2.0.0-rc.0.tgz`. After repacking,
remove the installed copy so npm extracts the new tarball:

```bash
rm -rf node_modules/@shining-technologies/ui && npm install
```

### Next.js

```bash
cd integration/next-app
npx playwright install chromium   # once
npm run typecheck
npm run build
npx playwright test               # production suite against `next start`
DEV=turbopack npx playwright test # smoke suite against `next dev`
```

The Playwright browser runs in `America/Los_Angeles` while the server runs in the machine's own
zone and the tables use `Australia/Sydney`, so any value formatted in the runtime's zone or locale
shows up as a hydration error. Every page fails its test on any console error or hydration
warning.

### Vite

```bash
cd integration/vite-app
npx tsc --noEmit && npx vite build     # there is no build script; the tests serve dist/
npx playwright test                    # preview suite; SUI_DEV=1 for the dev suite
node treeshake/build.mjs               # writes treeshake/results.json
```

### Types

```bash
cd integration/types-check/bundler && npx tsc --noEmit
cd ../nodenext && npx tsc --noEmit
```
