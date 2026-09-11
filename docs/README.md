# Shining UI Kit — documentation

A React component library whose entire appearance comes from a **project**: a named set of
seed colours and shape decisions you can swap, edit or create at runtime.

New here? Read [Installation](guide/installation.md), then
[Quick start](guide/quick-start.md). Fifteen minutes gets you a themed application with a
working table.

---

## Guide

The path from an empty project to a themed application.

| Page                                    | What it covers                                                   |
| --------------------------------------- | ---------------------------------------------------------------- |
| [Installation](guide/installation.md)   | Packages, peer dependencies, the stylesheet, framework notes     |
| [Quick start](guide/quick-start.md)     | The provider, your first components, your first table            |
| [Projects](guide/projects.md)           | Seeds, palettes, the registry, creating and forking projects     |
| [Theming](guide/theming.md)             | The token set, variants, density, dark mode                      |
| [Customization](guide/customization.md) | Slots, component overrides, class merging                        |
| [Accessibility](guide/accessibility.md) | What the kit guarantees, and what your application still owes it |
| [Performance](guide/performance.md)     | Stable references, memoisation, virtualisation                   |

## Components

| Page                                                | What it covers                                         |
| --------------------------------------------------- | ------------------------------------------------------ |
| [Component overview](components/overview.md)        | Every component, its props and its intent              |
| [Charts](components/charts.md)                      | The built-in charts: series, scales, the chart palette |
| [Charts on Recharts](components/charts-recharts.md) | Six chart forms, responsive rules, the palette audit   |

## Data table

The table is the largest component in the kit, so it has a section of its own.

| Page                                             | What it covers                                    |
| ------------------------------------------------ | ------------------------------------------------- |
| [Columns](data-table/columns.md)                 | Accessors, typing, `meta`, grouped headers        |
| [Cells](data-table/cells.md)                     | Custom cells and the cell toolkit                 |
| [Sorting](data-table/sorting.md)                 | Cycles, multi-sort, comparators, server mode      |
| [Filtering](data-table/filtering.md)             | Types, operators, both filter layouts, predicates |
| [Pagination](data-table/pagination.md)           | Client and server pagination                      |
| [Selection](data-table/selection.md)             | Single, multiple, disabled rows, persistence      |
| [Column UI](data-table/columns-ui.md)            | Visibility, resizing, pinning                     |
| [Expandable rows](data-table/expandable-rows.md) | Detail rows and expansion state                   |
| [Responsive](data-table/responsive.md)           | Scroll, cards, the fixed frame, column widths     |
| [Server-side](data-table/server-side.md)         | Query state and data fetching                     |

## Reference

| Page                                        | What it covers                                       |
| ------------------------------------------- | ---------------------------------------------------- |
| [API reference](reference/api-reference.md) | Every prop, type and export                          |
| [Packages](reference/packages.md)           | The four published packages and what belongs in each |

## Contributing

| Page                                                       | What it covers                                      |
| ---------------------------------------------------------- | --------------------------------------------------- |
| [Development](contributing/development.md)                 | Repo layout, scripts, tests, Storybook, the gallery |
| [Releasing](contributing/releasing.md)                     | Changesets, versioning, publishing to npm           |
| [Component inventory](contributing/component-inventory.md) | Internal: the portal audit behind the roadmap       |

Design rationale — why the packages split the way they do, and which rules the tests enforce
— lives in [ARCHITECTURE.md](../ARCHITECTURE.md).

---

## The two ideas worth knowing first

**A project is four colours and a shape.** Everything else is derived in OKLab: the neutral
ramp, hover and selected surfaces, borders, the five chart series, the whole dark mode, and a
contrast-checked foreground for every filled surface.

```ts
createProject({
  name: 'Acme',
  seed: { primary: '#7c3aed', accent: '#ec4899' },
  shape: { radius: '0.75rem', density: 'comfortable', elevation: 'soft' },
})
```

**Behaviour and appearance are separate systems.** Changing project, density or variant
cannot change what a component does. No component hardcodes a colour — every rule resolves to
a `--sui-*` custom property, and a test scans the stylesheets to keep it that way.
