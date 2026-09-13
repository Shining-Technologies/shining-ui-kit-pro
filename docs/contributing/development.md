# Development

How to set up the repository, work on `@shining-technologies/ui`, run its tests and reproduce
CI. Every command runs from the repository root unless it says otherwise.

## Prerequisites

|      |                                        |
| ---- | -------------------------------------- |
| Node | `>=18.18` (CI uses 22)                 |
| pnpm | `9.15.4`, pinned via `packageManager`  |
| Git  | any recent version                     |

This is a pnpm workspace (`packages/*`, `apps/*`, `examples`). npm and yarn cannot resolve its
`workspace:*` dependencies.

```bash
corepack enable
corepack prepare pnpm@9.15.4 --activate
```

## First run

```bash
git clone https://github.com/Shining-Technologies/shining-ui-kit-pro.git
cd shining-ui-kit-pro
pnpm install
pnpm test:ui
```

The tests and the gallery run against `packages/ui/src` through aliases, so no build is needed
first and an edit is picked up on save.

## Repository layout

```text
packages/ui/
  src/
    index.ts              root entry: every component, hook and core function
    core/                 @shining-technologies/ui/core — no React, no DOM, no imports
    theme/                @shining-technologies/ui/theme — generator, tokens.css, theme.css
    components/<family>/  @shining-technologies/ui/<family>
    charts/               @shining-technologies/ui/charts (Recharts)
    csv/                  @shining-technologies/ui/csv
    hooks/ lib/ styles/   internal
  tests/                  component, SSR, theme, boundary and integration-style tests
  scripts/                build steps: presets, CSS, declaration fixes, dist check
  docs/                   user documentation, published with the package
apps/gallery/             the component gallery (Vite), aliased to packages/ui/src
integration/              apps that install the packed tarball (see below)
docs/                     contributor documentation
scripts/                  repository scripts: publish preflight, docs links, publish
packages/core, react,
  themes, export-csv      the V1 packages, kept until they are removed
```

## Commands

| Command                | What it does                                                              |
| ---------------------- | ------------------------------------------------------------------------- |
| `pnpm gallery`         | Gallery on <http://localhost:5180>                                         |
| `pnpm build:ui`        | Build `packages/ui`, then `scripts/check-dist.mjs` verifies the output     |
| `pnpm test:ui`         | Run the V2 test suite once                                                 |
| `pnpm typecheck:ui`    | `tsc` over the V2 sources, tests and scripts                               |
| `pnpm lint`            | ESLint over the repository                                                 |
| `pnpm format`          | Prettier over the repository (`format:check` to verify only)               |
| `pnpm check:docs`      | Verify every relative Markdown link and heading anchor                     |
| `pnpm check`           | Lint, both type checks, all test suites and the docs link check            |
| `pnpm build`           | Build every package in `packages/`                                         |
| `pnpm prepublish:check`| The publish preflight (see [Releasing](releasing.md))                      |

Inside `packages/ui`, `pnpm test:watch` runs Vitest in watch mode, and `pnpm test <pattern>`
runs matching files.

## How the package is built

`pnpm build:ui` runs, in order:

1. **Vite library build**, ESM only, one output module per source module. A plugin keeps each
   file's `'use client'` directive on its own output file.
2. **`scripts/generate-presets.mjs`** writes `presets.css` from the preset seeds.
3. **`scripts/build-css.mjs`** bundles and minifies `styles.css`, and copies `theme.css` and
   `tailwind.css`.
4. **`tsc -p tsconfig.build.json`** emits one declaration file per source file.
5. **`scripts/fix-dts.mjs`** adds file extensions to relative specifiers in the declarations, so
   they resolve under `nodenext`.
6. **`scripts/check-dist.mjs`** fails the build if a client module lost its directive, a
   server-safe module gained one, a barrel carries one, or `core/` or `theme/` imports anything
   outside itself or touches a browser global.

## Rules the code follows

These are enforced by tests or by the dist check, not by review alone.

- **Directives per module.** A file that uses hooks, context, refs, effects, event handlers,
  browser APIs or Radix starts with `'use client'`. Nothing else does, and barrels never do.
- **`core/` and `theme/` import nothing**: no React, no package, no browser global.
- **No colour literals in component CSS.** Every colour resolves to a token.
- **Kit CSS is layered**: theme defaults in `base`, component rules in `components`, so an
  application's CSS and Tailwind utilities always win.
- **Deterministic output.** Formatting and date logic take an explicit `locale` and `timeZone`
  so server and client render the same text.

The reasoning behind each rule is in [Architecture](../architecture.md).

## Tests

```bash
pnpm test:ui
```

About 800 tests in 33 files. Configuration: `packages/ui/vitest.config.ts`.

- **Environment `happy-dom`.** Radix popper interactions (Select, DropdownMenu, Popover) hang
  under jsdom.
- **Timeouts are 15 seconds**, so a stuck interaction fails instead of stalling the run.
- **Tests import the public names** (`@shining-technologies/ui`, `/core`, `/charts`, …); the
  config aliases them to source. Import the same way in new tests.
- `tests/setup.ts` registers the `vitest-axe` matchers and polyfills `matchMedia`,
  `ResizeObserver`, `IntersectionObserver`, `DOMRect`, `scrollIntoView` and pointer capture.
- SSR tests use `// @vitest-environment node` and render with `react-dom/server`.

| Where                             | What                                                                  |
| --------------------------------- | --------------------------------------------------------------------- |
| `src/core/__tests__/`             | Pure logic: filtering (time zones, DST), sorting, pagination, queries |
| `tests/*.test.tsx`                | Components driven through the DOM, as a user would                     |
| `tests/ssr.test.tsx`              | Server rendering and hydration determinism                             |
| `tests/boundaries.test.ts`        | Client/server directives and import boundaries in source               |
| `tests/styles.test.ts`, `theme.test.ts` | Token contract, cascade layers, no colour literals, generator guarantees |
| `tests/accessibility.test.tsx`    | axe checks and keyboard behaviour                                      |

A new behaviour gets a test in the file for its area. A bug fix gets a regression test that
fails without the fix.

Accessibility assertion:

```tsx
import { axe } from 'vitest-axe'

const { container } = render(<Dialog open>…</Dialog>)
expect(await axe(container)).toHaveNoViolations()
```

## The gallery

```bash
pnpm gallery
```

Vite on <http://localhost:5180>, from `apps/gallery`. It aliases `@shining-technologies/ui` to
the package source, so component edits reload the page. Use it to check a change visually in
light and dark mode and across the named themes.

## Integration apps

`integration/` holds applications that install the **packed tarball** with npm, outside the
workspace, the way a user would: a Next.js App Router app, a Vite app and TypeScript resolution
projects. They catch what the unit tests cannot: missing files in the tarball, broken `exports`,
duplicate React, hydration errors, bundle size.

Run them before a release. Instructions: [integration/README.md](../../integration/README.md).

## What CI runs

[.github/workflows/ci.yml](../../.github/workflows/ci.yml), on pushes to `master` and on pull
requests, Node 22:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck        # V1 packages
pnpm test             # V1 packages
pnpm typecheck:ui
pnpm test:ui
pnpm test:recharts3   # V1 charts against Recharts 3
pnpm check:docs
pnpm build
pnpm prepublish:check
pnpm build-storybook --quiet   # V1 Storybook
```

The V1 steps stay until the V1 packages are removed. To reproduce a failure, run the same
commands locally. If `--frozen-lockfile` fails, `pnpm-lock.yaml` does not match a
`package.json`: run `pnpm install` and commit the lockfile.

## Troubleshooting

**A test hangs, then fails at 15 s.** Usually a Radix popper waiting on a browser API the test
DOM lacks. Add the polyfill to `packages/ui/tests/setup.ts` rather than mocking the component.

**`check-dist` fails after adding a component.** The new file either uses a hook without
`'use client'`, or has the directive without needing it. Add or remove it in the source file.

**Types pass but `build:ui` fails in `tsc -p tsconfig.build.json`.** `typecheck:ui` does not emit
declarations; the build does, and declaration emit can fail where a no-emit check passes (for
example an exported value whose inferred type cannot be named). Run `pnpm build:ui` locally
before pushing.

**The gallery shows a stale component.** Delete `apps/gallery/node_modules/.vite` and restart.
