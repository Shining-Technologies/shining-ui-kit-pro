# Shining UI

[![npm](https://img.shields.io/npm/v/@shining-technologies/ui.svg)](https://www.npmjs.com/package/@shining-technologies/ui)
[![CI](https://github.com/Shining-Technologies/shining-ui-kit-pro/actions/workflows/ci.yml/badge.svg)](https://github.com/Shining-Technologies/shining-ui-kit-pro/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**`@shining-technologies/ui`**: React components, a data table whose filtering also runs on your
server, and shadcn-style CSS-variable theming. One package, built for the Next.js App Router
and any other React setup.

- **Server Components work.** Pure components render on the server with no client JavaScript,
  and every function can be called from server code.
- **The theme is CSS.** Semantic tokens with shadcn/ui names, light and dark, no provider.
- **The data table's logic is framework-independent.** Filtering, sorting, pagination and URL
  state give the same result in the browser and on a server.
- **Tree-shakeable and typed.** One ES module per source file; declarations for every entry point.

```bash
npm install @shining-technologies/ui
```

```tsx
import '@shining-technologies/ui/styles.css'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@shining-technologies/ui'

export default function Page() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <Badge tone="success">Live</Badge> <Button>New order</Button>
      </CardContent>
    </Card>
  )
}
```

## Documentation

The documentation ships with the package, in [`packages/ui/docs`](packages/ui/docs/README.md).

| Start here                                                  |                                                          |
| ----------------------------------------------------------- | -------------------------------------------------------- |
| [Package README](packages/ui/README.md)                     | Overview, entry points, the short version of everything  |
| [Getting started](packages/ui/docs/getting-started.md)      | Install, stylesheet, first page, first table, TypeScript |
| [Theming](packages/ui/docs/theming.md)                      | Tokens, dark mode, named themes, brand colours, Tailwind |
| [Next.js](packages/ui/docs/nextjs.md)                       | Server Components, URL-driven tables, per-tenant themes  |
| [Data table](packages/ui/docs/data-table.md)                | Columns, filters, server mode, selection, export         |
| [Components](packages/ui/docs/README.md#components)         | Every component family with its props                    |
| [API reference](packages/ui/docs/README.md#api-reference)   | `/core`, `/theme`, `/csv`                                |
| [Migrating from V1](packages/ui/MIGRATION.md)               | From the `@shining-technologies/ui-kit-*` packages       |
| [Changelog](packages/ui/CHANGELOG.md)                       | Release notes                                            |

## Repository

```text
packages/ui           @shining-technologies/ui — the published package
  src/                  components, core, theme, charts, csv
  docs/                 user documentation (published with the package)
  tests/                unit, component, SSR, theme and boundary tests
apps/gallery          the component gallery, running against packages/ui
integration/          Next.js, Vite and TypeScript apps that install the packed tarball
docs/                 contributor documentation: development, releasing, architecture
scripts/              publish preflight, docs link check, release script
```

`packages/core`, `packages/react`, `packages/themes` and `packages/export-csv` are the V1
`@shining-technologies/ui-kit-*` packages. They stay in the repository, unchanged, until they
are removed; new work goes into `packages/ui`.

## Development

```bash
pnpm install
pnpm gallery          # the component gallery
pnpm build:ui         # build @shining-technologies/ui and verify the output
pnpm test:ui          # its test suite
pnpm typecheck:ui     # its type check
pnpm check            # every gate CI runs
```

Details: [Development](docs/contributing/development.md) ·
[Releasing](docs/contributing/releasing.md) · [Architecture](docs/architecture.md)

## Licence

MIT
