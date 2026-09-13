# @shining-technologies/ui documentation

New to the package? Read [Getting started](./getting-started.md), then [Theming](./theming.md).
If you use Next.js, read [Next.js](./nextjs.md) next.

## Guides

| Page                                        | What it covers                                                               |
| ------------------------------------------- | ---------------------------------------------------------------------------- |
| [Getting started](./getting-started.md)     | Requirements, install, the stylesheet, first page and table, TypeScript, tests |
| [Theming](./theming.md)                     | Semantic and derived tokens, dark mode, named themes, brand colours, scoped themes, Tailwind |
| [Next.js](./nextjs.md)                      | App Router setup, Server Components, URL-driven tables, per-tenant themes, CSP |
| [Data table](./data-table.md)               | Columns, cells, filters, sorting, pagination, selection, server mode, customisation, export |
| [Charts](./charts.md)                       | Trend, bar, donut, gauge, scatter and sparkline charts on Recharts           |
| [Accessibility](./accessibility.md)         | What the components guarantee and what your application provides            |
| [Troubleshooting](./troubleshooting.md)     | Install, styling, TypeScript, hydration and test problems                    |
| [Migrating from V1](../MIGRATION.md)        | From the `@shining-technologies/ui-kit-*` packages                           |

## Components

One page per component family. Each family is also an entry point:
`@shining-technologies/ui/<family>`.

| Family                                              | Components                                                              |
| --------------------------------------------------- | ----------------------------------------------------------------------- |
| [Button](./components/button.md)                    | Buttons, button groups, copy and hold-to-confirm buttons                |
| [Badge](./components/badge.md)                      | Badges and status badges                                                |
| [Avatar](./components/avatar.md)                    | Avatars and avatar groups                                               |
| [Card](./components/card.md)                        | Cards and their parts, stats cards, metric tiles, summaries             |
| [Feedback](./components/feedback.md)                | Alerts, empty states, progress, spinners, skeletons, toasts             |
| [Form](./components/form.md)                        | Fields, inputs, selects, checkboxes, comboboxes and typed inputs        |
| [Date and time](./components/date-time.md)          | Calendar, date, time and date-time fields                               |
| [Overlay](./components/overlay.md)                  | Dialogs, sheets, popovers, tooltips, dropdown menus                     |
| [Navigation](./components/navigation.md)            | Tabs, accordions, breadcrumbs, pagination                               |
| [Layout](./components/layout.md)                    | The application shell and page headers                                  |
| [Sidebar](./components/sidebar.md)                  | The dashboard sidebar and its data-driven navigation                    |
| [Table](./components/table.md)                      | The plain table for a fixed set of rows                                 |
| [Color mode](./components/color-mode.md)            | `ColorModeScript`, `ColorModeToggle`, `useColorMode`                    |
| [Icons](./components/icons.md)                      | The built-in icon set                                                   |
| [Separator](./components/separator.md)              | Horizontal and vertical separators                                      |
| [Visually hidden](./components/visually-hidden.md)  | Content for screen readers only                                         |
| [Data table](./data-table.md)                       | `DataTable` and its parts (guide and reference)                         |

## API reference

| Entry point                                        | Page                          |
| -------------------------------------------------- | ----------------------------- |
| `@shining-technologies/ui/core`                    | [Core](./api/core.md)         |
| `@shining-technologies/ui/theme`                   | [Theme](./api/theme.md)       |
| `@shining-technologies/ui/csv`                     | [CSV](./api/csv.md)           |

## Entry points

| Import                                    | Contains                                                         | Needs          |
| ----------------------------------------- | ---------------------------------------------------------------- | -------------- |
| `@shining-technologies/ui`                | Every component, hook and `core` function                         |                |
| `@shining-technologies/ui/<family>`       | One component family                                             |                |
| `@shining-technologies/ui/core`           | Filtering, sorting, pagination, selection, URL query. No React   |                |
| `@shining-technologies/ui/theme`          | Theme generation and colour utilities. No React                  |                |
| `@shining-technologies/ui/charts`         | Charts                                                           | `recharts`     |
| `@shining-technologies/ui/virtualized`    | Virtualized data table                                           | `@tanstack/react-virtual` |
| `@shining-technologies/ui/csv`            | CSV and TSV export                                               |                |
| `@shining-technologies/ui/styles.css`     | The complete stylesheet                                          |                |
| `@shining-technologies/ui/theme.css`      | Default theme tokens only                                        |                |
| `@shining-technologies/ui/presets.css`    | Ten named themes                                                 |                |
| `@shining-technologies/ui/tailwind.css`   | Tailwind CSS v4 token mapping                                    |                |
