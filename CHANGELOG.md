# Changelog

Each published package keeps its own changelog, written by
[Changesets](https://github.com/changesets/changesets) when a release is versioned:
`packages/react/CHANGELOG.md`, `packages/core/CHANGELOG.md`,
`packages/themes/CHANGELOG.md` and `packages/export-csv/CHANGELOG.md`.

Those files appear with the first release. Until then, pending changes live as markdown files
in `.changeset/`, and `pnpm changeset:status` lists them.

`core`, `react` and `themes` share one version line; `export-csv` versions on its own. Why,
and how a release is made: [docs/contributing/releasing.md](docs/contributing/releasing.md).

## Unreleased — 0.1.0

The first public release. Nothing is on npm yet, so there is no upgrade path to describe; the
contents are the [component overview](docs/components/overview.md) and the
[API reference](docs/reference/api-reference.md).
