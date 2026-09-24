# Release notes

One document per released version. The
[CHANGELOG](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/master/packages/ui/CHANGELOG.md)
records what changed; these say what an application has to do when it moves its pin: migrations,
settings, upgrade steps and compatibility. `packages/ui/tests/release-notes.test.ts` fails if the
version in `packages/ui/package.json` has no page or no row.

`@shining-technologies/ui` 2.0.1 and 2.2.0 were published to npm untagged; both were tagged
afterwards on the commit that set the version, minutes before each publish. The four `ui-kit-*` packages are
the V1 packages, replaced by `@shining-technologies/ui` and not released again.

| Version                                                 | Date       | Kind            | Summary                                                                                                                                                                                         |
| ------------------------------------------------------- | ---------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ui-v2.2.0](ui-v2.2.0.md)                               | 2026-09-24 | Minor           | Components for record views that are not tables: filter bars and chips, bulk actions, timelines, trees, a kanban board, an event calendar, status panels and layout primitives. Additive        |
| [ui-v2.1.2](ui-v2.1.2.md)                               | 2026-09-22 | Patch           | DataTable column pinning is on for every table, and pinned and hidden columns are remembered in the browser without configuration                                                               |
| [ui-v2.1.1](ui-v2.1.1.md)                               | 2026-09-20 | Patch           | The 2.1.0 release under a new number, with no change to code, types or styles                                                                                                                   |
| [ui-v2.1.0](ui-v2.1.0.md)                               | 2026-09-20 | Minor           | The complete shadcn/tweakcn token set, date ranges, seven navigation components, and DataTable column resizing without re-renders and remembered pinning                                        |
| [ui-v2.0.1](ui-v2.0.1.md)                               | 2026-09-15 | Major           | The first stable release of `@shining-technologies/ui`: 2.0.0-rc.0 plus one field box for every input, inline filters on one toolbar line, and `NumberInput` without stepper buttons by default |
| [ui-v2.0.0-rc.0](ui-v2.0.0-rc.0.md)                     | 2026-09-13 | Initial release | The first release of `@shining-technologies/ui`: one ESM package with entry points that replaces the four V1 `ui-kit-*` packages, themed by CSS variables instead of a provider                 |
| [ui-kit-core-v0.1.0](ui-kit-core-v0.1.0.md)             | 2026-09-12 | Initial release | The V1 framework-agnostic core: design tokens, the OKLCH colour engine, the project system and the data-table state helpers                                                                     |
| [ui-kit-react-v0.1.0](ui-kit-react-v0.1.0.md)           | 2026-09-12 | Initial release | The V1 React components, charts and data table, themed at runtime by `UIKitProvider` from one palette                                                                                           |
| [ui-kit-themes-v0.1.0](ui-kit-themes-v0.1.0.md)         | 2026-09-12 | Initial release | The V1 presets: ten project palettes and four DataTable chrome themes                                                                                                                           |
| [ui-kit-export-csv-v0.1.0](ui-kit-export-csv-v0.1.0.md) | 2026-09-12 | Initial release | V1 CSV and TSV export for the data table or any TanStack Table instance, with no runtime dependencies                                                                                           |

## Writing one

> **Adapted for this repository.** This monorepo tags each package separately
> (`@shining-technologies/ui@X.Y.Z`), so a page is named after the package's short name and the
> version: `docs/releases/<package-short-name>-vX.Y.Z.md` (for example `ui-v2.1.2.md`), and the
> CHANGELOG is `packages/ui/CHANGELOG.md`. Everything below is the shared spec, with `vX.Y.Z`
> read as that name or that tag. Here, **Migrations** means code or CSS an application must
> change, and **Settings** means peer dependencies, stylesheets, theme tokens and prop defaults.

Every Shining library (shining-common, shining-notify, shining-ai, and the UI
kits) writes its release notes the same way. shining-common's pages are the
model.

**Where.** `docs/releases/vX.Y.Z.md`, one per tag, plus a row in this index,
newest first. Both are written in the **release commit**, the one that bumps
the version and adds the CHANGELOG heading. A test fails if a released version
has no page or no row.

**Audience.** The CHANGELOG records what changed. A release note says what a
consuming project has to _do_ when it moves its pin: the requirement line,
migrations, settings, upgrade steps and compatibility.

**Page layout.** Always the same five sections, in this order. Write `None.` in
a section with nothing in it; never drop one.

````markdown
# <package> vX.Y.Z

Released YYYY-MM-DD · <Kind> · [CHANGELOG entry](https://github.com/Shining-Technologies/<repo>/blob/vX.Y.Z/CHANGELOG.md)

<One or two sentences. The index row's Summary is the same text.>

```text
<the exact requirement line for this tag>
```

## What changed

## Migrations

## Settings

## Upgrading

## Compatibility
````

- **Kind** is one of `Initial release`, `Major`, `Minor`, `Patch`.
- **Links are absolute and pinned to the tag**
  (`https://github.com/Shining-Technologies/<repo>/blob/vX.Y.Z/...`). The page is
  also the GitHub Release body, and a relative link is broken there.
- **What changed**: bullets, public names in backticks, no internal detail.
- **Migrations**: each migration by name, and whether it is initial (faked with
  `--fake-initial` over an existing table) or runs for real.
- **Settings**: added, changed or removed keys, with their defaults.
- **Upgrading**: the steps, in order. Always starts with bumping the pin.
  Project-specific steps are named by project.
- **Compatibility**: behaviour a caller will notice, known issues, and any note
  about the bump itself.
- **Index row**: `| [vX.Y.Z](vX.Y.Z.md) | YYYY-MM-DD | <Kind> | <Summary> |`,
  summary without a trailing full stop.

**GitHub Release.** After the tag is pushed, publish the page as the release
body:

```bash
gh release create vX.Y.Z --verify-tag --title "<package> vX.Y.Z" --notes-file docs/releases/vX.Y.Z.md
```

Add `--latest=false` for a patch on an older minor. A fix to a published page
(a typo, a broken link) is re-synced with
`gh release edit vX.Y.Z --notes-file docs/releases/vX.Y.Z.md`; its facts are
never rewritten, just as a tag is never moved.

In this repository the tag and file differ, and the tag must be quoted:

```bash
gh release create '@shining-technologies/ui@2.1.2' --verify-tag --title '@shining-technologies/ui 2.1.2' --notes-file docs/releases/ui-v2.1.2.md
```
