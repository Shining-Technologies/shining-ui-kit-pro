# Development

How to install the repo, run the tests, open Storybook, and run everything CI runs — with the
commands, what each one actually does, and what to do when one fails.

Every command below is run from the **repository root** unless it says otherwise.

## Prerequisites

|      |                                        |
| ---- | -------------------------------------- |
| Node | `>=18.18` (CI uses 22)                 |
| pnpm | `9.15.4` — pinned via `packageManager` |
| Git  | any recent version                     |

This is a pnpm workspace (`packages/*`, `apps/*`, `examples`). npm and yarn will not resolve
the `workspace:*` dependencies — use pnpm. If you do not have it:

```bash
corepack enable
corepack prepare pnpm@9.15.4 --activate
```

## First run

```bash
git clone <repo-url>
cd library-table
pnpm install
```

`pnpm install` links every workspace package together. You do **not** need to build the
packages before running tests, Storybook or the gallery: all three alias `@shining-ui-kit/*`
straight to `packages/*/src`, so they run against the TypeScript sources and pick up an edit
on save.

Verify the checkout in one command:

```bash
pnpm check      # lint + typecheck + test, the same gates as CI
```

## Command reference

Root scripts, all defined in [package.json](../../package.json):

| Command                             | What it does                                                  |
| ----------------------------------- | ------------------------------------------------------------- |
| `pnpm dev`                          | Docs and demo site on <http://localhost:5173>                 |
| `pnpm storybook`                    | Storybook workbench on <http://localhost:6006>                |
| `pnpm build-storybook`              | Static Storybook into `storybook-static/`                     |
| `pnpm test`                         | Run the whole Vitest suite once                               |
| `pnpm test:watch`                   | Vitest in watch mode                                          |
| `pnpm test:coverage`                | Test run plus a V8 coverage report                            |
| `pnpm typecheck`                    | `tsc` across every project reference                          |
| `pnpm lint` / `pnpm lint:fix`       | ESLint over the repo                                          |
| `pnpm format` / `pnpm format:check` | Prettier write / verify                                       |
| `pnpm check`                        | `lint` → `typecheck` → `test`                                 |
| `pnpm build`                        | Build all four publishable packages                           |
| `pnpm clean`                        | Remove `dist/`, `coverage/`, `storybook-static/`, tsbuildinfo |

---

## Testing

### Run the suite

```bash
pnpm test
```

A full run is **15 test files, 176 tests, ~30 seconds**. Vitest is configured in
[vitest.config.ts](../../vitest.config.ts).

Two things about that config are worth knowing before you write a test:

- **The environment is `happy-dom`, not jsdom.** Radix's popper stack (Popover, DropdownMenu,
  Select) never opens under jsdom here — an interaction hangs for ~45s and then fails for the
  wrong reason.
- **Timeouts are 15s** for both tests and hooks, so a stuck interaction fails fast instead of
  stalling the run.

[tests/setup.ts](../../tests/setup.ts) runs before every file. It registers the `vitest-axe`
matchers, cleans up React between tests, and polyfills the browser APIs the Radix primitives
need but the DOM implementation lacks — `matchMedia`, `ResizeObserver`,
`IntersectionObserver`, `DOMRect`, `scrollIntoView` and the Pointer Capture API.

### Where the tests live

```text
tests/                          integration, a11y and performance tests, against the public API
  rendering.test.tsx            structure, states, captions
  sorting.test.tsx              cycles, multi-sort, comparators
  filtering.test.tsx            filter types, operators, the panel
  pagination.test.tsx           client and server pagination
  selection-expansion.test.tsx  row selection and detail rows
  columns.test.tsx              visibility, resizing, pinning, grouped headers
  customization.test.tsx        slots, component overrides, class merging
  accessibility.test.tsx        axe passes, keyboard navigation, ARIA
  performance.test.tsx          large data sets, render counts
  virtualization.test.tsx       windowed rendering
  fixtures.tsx                  shared data and helpers — import from here
  setup.ts                      global setup, polyfills, matchers

packages/*/src/__tests__/       unit tests for pure logic
  core/filters, core/pagination, core/theme, export-csv/csv, themes/themes
```

The rule of thumb: pure functions get a unit test next to them in `packages/*/src/__tests__`;
anything that involves rendering a table goes in `tests/` and drives the component the way a
user would.

### Running a subset

```bash
pnpm test tests/sorting.test.tsx     # one file
pnpm test sorting                    # any path matching "sorting"
pnpm test -t "multi-sort"            # tests whose name matches
pnpm test packages/core              # a whole directory
```

### Watch mode

```bash
pnpm test:watch
```

Re-runs only what your change affects. Useful keys at the prompt: `a` all, `f` failed only,
`p` filter by filename, `t` filter by test name, `q` quit.

### Coverage

```bash
pnpm test:coverage
```

Prints a table and writes browsable HTML to `coverage/`:

```bash
start coverage/index.html      # Windows
open coverage/index.html       # macOS
```

Coverage measures `packages/*/src/**` only — stories, barrel files and `.d.ts` are excluded.

### Writing a test

Import through the package aliases, never a relative path into another package, and reuse the
shared fixtures:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataTable } from '@shining-ui-kit/react'
import { users, userColumns } from './fixtures'

it('sorts by name when the header is activated', async () => {
  const user = userEvent.setup()
  render(<DataTable data={users} columns={userColumns} label="Users" />)

  await user.click(screen.getByRole('button', { name: /name/i }))

  const cells = screen.getAllByRole('cell')
  expect(cells[0]).toHaveTextContent('Ada')
})
```

Accessibility assertions use the `vitest-axe` matcher already extended in setup:

```tsx
import { axe } from 'vitest-axe'

const { container } = render(<DataTable data={users} columns={userColumns} label="Users" />)
expect(await axe(container)).toHaveNoViolations()
```

---

## Storybook

### Run it

```bash
pnpm storybook
```

Serves on <http://localhost:6006> and opens a browser. It runs against `packages/*/src`, so
editing a component hot-reloads the story without a build step.

```bash
pnpm storybook -- -p 6007      # a different port
pnpm storybook -- --no-open    # don't launch a browser
```

### What is in there

Stories live in [stories/](../../stories/) plus any `*.stories.tsx` under `packages/react/src`.
The sidebar order is set in [.storybook/preview.ts](../../.storybook/preview.ts):

| Section             | File                                                                                                                                |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **DataTable/Basic** | [stories/data-table.stories.tsx](../../stories/data-table.stories.tsx) — states, sorting, filtering, pagination, selection, columns |
| **Customization**   | [stories/customization.stories.tsx](../../stories/customization.stories.tsx) — slots, overrides, class merging                      |
| **Design**          | [stories/design.stories.tsx](../../stories/design.stories.tsx) — tokens, variants, density                                          |
| **Examples**        | [stories/examples.stories.tsx](../../stories/examples.stories.tsx) — the real-world tables from `examples/`                         |
| **Performance**     | [stories/performance.stories.tsx](../../stories/performance.stories.tsx) — large data sets and virtualisation                       |

### The toolbar

- **Controls** are expanded by default — every prop is editable live in the panel below the
  story.
- **Theme** switches light/dark. It toggles a `.dark` class on `<html>`, exactly as an app
  would, via `@storybook/addon-themes`.
- **Accessibility** runs axe against the rendered story. It is configured with
  `a11y: { test: 'error' }`, so a violation is a failure, not a warning — treat a red
  accessibility panel as a broken story.

### Adding a story

Create `stories/<name>.stories.tsx`, give the meta a `title` that matches the sort order
above, and type it with `Meta`/`StoryObj`:

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { DataTable } from '@shining-ui-kit/react'
import { users, userColumns } from '@shining-ui-kit/examples'

const meta = {
  title: 'DataTable/Basic',
  component: DataTable,
  args: { data: users, columns: userColumns, label: 'Users' },
} satisfies Meta<typeof DataTable>

export default meta
type Story = StoryObj<typeof meta>

export const Striped: Story = { args: { variant: 'striped' } }
```

Stories are linted by `eslint-plugin-storybook`, so `pnpm lint` catches a malformed meta or a
missing default export.

### Build it statically

```bash
pnpm build-storybook              # → storybook-static/
pnpm build-storybook --quiet      # what CI runs
```

Preview the output with any static server, e.g. `npx serve storybook-static`.

---

## The gallery

```bash
pnpm gallery      # or `pnpm dev`
```

Vite dev server on <http://localhost:5180>, from [apps/gallery](../../apps/gallery). Like
Storybook it aliases to the library sources, so a change to a component reloads the page.

Storybook is the workbench for a single component in isolation; the gallery is where you see
every component under a real project, switch project and colour mode, and create or edit a
project with the same editor an application would embed.

Projects you create there are saved to the browser's localStorage under
`shining-ui-kit:projects`. Clear that key to get back to the shipped presets.

---

## Linting, formatting, types

```bash
pnpm lint             # ESLint, flat config
pnpm lint:fix         # fix what can be fixed
pnpm format           # Prettier over the repo
pnpm format:check     # verify only — use this in scripts
pnpm typecheck        # tsc -p tsconfig.json, all project references
```

Four rules from [eslint.config.js](../../eslint.config.js) bite most often:

- `@typescript-eslint/no-explicit-any` is an **error** in library code. Tests, stories,
  `examples/` and `apps/` are exempt.
- Type-only imports must be inline: `import { type ColumnDef, DataTable } from '...'`.
- Unused variables are an error unless prefixed with `_`.
- `console.log` warns; `console.warn` and `console.error` are allowed.

---

## Building

```bash
pnpm build
```

Builds the four publishable packages, each with Vite plus `vite-plugin-dts` for declarations.
`@shining-ui-kit/react` has an extra step: after the JS bundle,
[scripts/build-css.mjs](../../scripts/build-css.mjs) inlines the `@import` graph from
`src/styles/index.css` into a single `dist/styles.css`, so the published stylesheet needs no
CSS toolchain on the consumer's side.

Build one package on its own:

```bash
pnpm --filter @shining-ui-kit/core build
pnpm --filter @shining-ui-kit/react build
```

Start from clean when a stale artefact is suspected:

```bash
pnpm clean && pnpm build
```

---

## What CI runs

[.github/workflows/ci.yml](../../.github/workflows/ci.yml) runs on every push to `main`/`master`
and every pull request, on Node 22 with pnpm 9.15.4, in this order:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm build-storybook --quiet
```

To reproduce a CI failure exactly:

```bash
pnpm install --frozen-lockfile
pnpm check && pnpm build && pnpm build-storybook --quiet
```

`--frozen-lockfile` fails if `pnpm-lock.yaml` does not match `package.json` — if CI fails
there and your local install succeeded, commit the updated lockfile.

---

## Troubleshooting

**A test hangs, then times out at 15s.** Almost always a Radix popper that never opened — a
missing DOM polyfill for a newly used browser API. Add it to
[tests/setup.ts](../../tests/setup.ts) rather than mocking the component.

**`act(...)` warnings in the output.** Noise from an async state update after render; the run
still passes. Drive the interaction with `await user.click(...)` from `userEvent` rather than
firing the event directly.

**Cannot find module `@shining-ui-kit/...`.** The alias lists live in three places, and a new
package or subpath entry has to be added to each: [vitest.config.ts](../../vitest.config.ts),
[.storybook/main.ts](../../.storybook/main.ts) and `apps/gallery/vite.config.ts`. Subpaths must come
**before** their package prefix.

**Storybook shows a stale component.** Clear the Vite cache and restart:
`rimraf node_modules/.vite && pnpm storybook`.

**Port already in use.** `pnpm storybook -- -p 6007` or `pnpm dev -- --port 5174`.

**Typecheck passes but the build fails.** `pnpm typecheck` checks sources; the build also
emits declarations. Run `pnpm clean` to drop stale `*.tsbuildinfo` and try again.

**Anything unexplained after a dependency change.**
`pnpm clean && rimraf node_modules && pnpm install`.

## Where to go next

- [Architecture](../../ARCHITECTURE.md) — why the packages are split the way they are
- [Accessibility](../guide/accessibility.md) — what the axe tests are enforcing
- [Performance](../guide/performance.md) — what the performance tests measure
