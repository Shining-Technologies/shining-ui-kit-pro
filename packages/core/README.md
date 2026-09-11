# @shining-ui-kit/core

[![npm](https://img.shields.io/npm/v/@shining-ui-kit/core.svg)](https://www.npmjs.com/package/@shining-ui-kit/core)
[![license](https://img.shields.io/npm/l/@shining-ui-kit/core.svg)](../../LICENSE)

Everything [Shining UI Kit](https://github.com/ikramulSoHeL/shining-ui-kit-pro) knows that is
not React: the design-token surface, the OKLCH colour engine, the project system, and the
pure state, filter and pagination helpers behind the data table.

No React import appears anywhere in this package, so it runs in Node, in a worker, or in a
build step — generating a stylesheet at deploy time, validating a brand colour on the server,
or computing a query on an API route.

## Install

```bash
pnpm add @shining-ui-kit/core
```

You do not need this package directly if you use `@shining-ui-kit/react` — it re-exports the
parts an application reaches for.

## What is in it

### The project system

A project is four colours and a shape. Resolving one derives the complete token set.

```ts
import { createProject, resolveProject } from '@shining-ui-kit/core'

const acme = createProject({
  name: 'Acme',
  seed: { primary: '#7c3aed', accent: '#ec4899' },
  shape: { radius: '0.75rem', density: 'comfortable' },
})

const tokens = resolveProject(acme) // every --sui-* value, light and dark
```

Projects are plain data, so they round-trip through JSON — into localStorage, a database row,
or a config file.

### The colour engine

```ts
import { contrastRatio, generateScale, mix, readableForeground } from '@shining-ui-kit/core'

generateScale('#7c3aed') // 50…950, perceptually even in OKLab
readableForeground('#7c3aed') // the text colour that clears WCAG AA on it
contrastRatio('#111827', '#f9fafb') // 16.1
```

### Table state helpers

Sorting, filtering, pagination and query normalisation as pure functions, independent of any
renderer.

```ts
import { FILTER_OPERATORS, getPageRange, isFilterActive } from '@shining-ui-kit/core'
```

### Themes

```ts
import { createTheme, createTableTheme, mergeThemes, themeToCssVars } from '@shining-ui-kit/core'

document.documentElement.setAttribute('style', themeToCssVars(theme))
```

## Documentation

- [Projects](https://github.com/ikramulSoHeL/shining-ui-kit-pro/blob/master/docs/guide/projects.md)
- [Theming](https://github.com/ikramulSoHeL/shining-ui-kit-pro/blob/master/docs/guide/theming.md)
- [API reference](https://github.com/ikramulSoHeL/shining-ui-kit-pro/blob/master/docs/reference/api-reference.md)

## License

MIT © Shining Technologies
