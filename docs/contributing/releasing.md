# Releasing

How `@shining-technologies/ui` gets from this repository to npm.

- [Versions](#versions)
- [One-time setup](#one-time-setup)
- [Before every release](#before-every-release)
- [Publishing](#publishing)
- [What the preflight checks](#what-the-preflight-checks)
- [Release candidates](#release-candidates)
- [Releasing 2.0.0](#releasing-200)
- [The V1 packages](#the-v1-packages)
- [Troubleshooting](#troubleshooting)

## Versions

Semantic versioning. What counts as breaking for a component library:

| Bump      | Use it for                                                                           |
| --------- | ------------------------------------------------------------------------------------ |
| **patch** | A fix that changes no API: behaviour, styling, more accurate types                  |
| **minor** | A new component, prop, export, token or entry point; anything additive              |
| **major** | A removed or renamed export, prop or token; a changed default; a changed DOM structure or `sui-*` class that applications may target |

A change to a **token name**, to the **default theme values**, or to the **cascade layer order**
is breaking even when no TypeScript signature moves: applications' CSS and screenshots change.

Stable versions go through [Changesets](https://github.com/changesets/changesets): a change that
users should hear about ships with a changeset (`pnpm changeset`), and every release is made by
consuming them. Release-candidate versions are set by hand (see
[Release candidates](#release-candidates)).

Every release also updates [packages/ui/CHANGELOG.md](../../packages/ui/CHANGELOG.md) and, for a
major version, [packages/ui/MIGRATION.md](../../packages/ui/MIGRATION.md).

## One-time setup

1. **npm scope.** Packages publish under the
   [`@shining-technologies`](https://www.npmjs.com/org/shining-technologies) organisation. The
   publisher must be a member with publish rights. `packages/ui/package.json` already sets
   `"publishConfig": { "access": "public" }`.
2. **npm token for CI.** On npmjs.com, create an **Automation** access token and add it to the
   GitHub repository as the secret `NPM_TOKEN`.
3. `GITHUB_TOKEN` is provided by GitHub Actions.

To publish from your own machine instead, run `npm login` once.

## Before every release

```bash
pnpm install --frozen-lockfile
pnpm check                 # lint, type checks, all test suites, docs links
pnpm build
pnpm prepublish:check      # the preflight below
```

Then run the integration apps against the packed tarball
([integration/README.md](../../integration/README.md)):

```bash
cd packages/ui && pnpm pack --pack-destination ../../integration && cd ../..
# update the tarball file name in integration/*/package.json if the version changed
cd integration/next-app && rm -rf node_modules/@shining-technologies/ui && npm install
npm run typecheck && npm run build && npx playwright test
cd ../vite-app && rm -rf node_modules/@shining-technologies/ui && npm install
npx tsc --noEmit && npx vite build && npx playwright test   # tests serve dist/ with vite preview
cd ../types-check/bundler && npx tsc --noEmit && cd ../nodenext && npx tsc --noEmit
```

Check the tarball contents: `cd packages/ui && npm pack --dry-run` should list `dist/`, `docs/`,
`README.md`, `MIGRATION.md`, `CHANGELOG.md`, `LICENSE` and `package.json`, and nothing else.

## Publishing

### From CI

[.github/workflows/release.yml](../../.github/workflows/release.yml) runs on every push to
`master`:

1. The same gates as CI (lint, type check, test suites, docs links, build, preflight).
2. If changesets are pending, it opens or updates a **Version Packages** pull request that bumps
   versions and writes changelogs. Merging that pull request is the release.
3. If none are pending, it runs `scripts/publish.mjs`, which publishes every package whose
   version is not on npm yet and pushes the git tags.

### By hand

```bash
pnpm release      # build → preflight → scripts/publish.mjs
```

### Why `scripts/publish.mjs` and not `changeset publish`

`changeset publish` puts every new version on the `latest` dist-tag unless the repository is in
Changesets pre mode. A hand-set `2.0.0-rc.1` would become what `npm install
@shining-technologies/ui` installs. `scripts/publish.mjs` publishes unpublished prerelease
versions under `next` first, then runs `changeset publish`, which skips them because they are
already on the registry.

## What the preflight checks

`pnpm prepublish:check` must pass before anything is published. It runs:

[`scripts/check-publish.mjs`](../../scripts/check-publish.mjs), for every non-private package in
`packages/`:

- `name`, `version`, `description`, `license`, `repository` and `files` are present;
- `publishConfig.access` is `public`;
- every path in `main`, `module`, `types` and `exports` exists and is not empty, and every
  `./*` pattern matches a built file;
- `README.md` and `LICENSE` exist;
- no `workspace:` dependency points at a private package;
- `dist/` is not older than `src/`;
- the shipped declarations type-check with `skipLibCheck: false`.

Then [`@arethetypeswrong/cli`](https://arethetypeswrong.github.io) on the packed tarball, with the
ESM-only profile: every entry point's types must resolve under `node16` (ESM) and `bundler`.

`pnpm build` has already run `packages/ui/scripts/check-dist.mjs`, which verifies the
client/server directives and the import boundaries of the built modules.

## Release candidates

While the API may still change, versions are `2.0.0-rc.N` and are published under `next`:

1. Set `"version": "2.0.0-rc.N"` in `packages/ui/package.json`.
2. Add a `## 2.0.0-rc.N` section to `packages/ui/CHANGELOG.md`.
3. Update the tarball name in `integration/*/package.json` and run the integration apps.
4. Merge to `master` (CI publishes), or run `pnpm release`.

Users install a candidate explicitly:

```bash
npm install @shining-technologies/ui@next
```

## Releasing 2.0.0

1. Set `"version": "2.0.0"` in `packages/ui/package.json`.
2. Rename the top section of `packages/ui/CHANGELOG.md` to `## 2.0.0` and summarise what changed
   since the last candidate.
3. Run everything in [Before every release](#before-every-release).
4. Merge to `master`, or run `pnpm release`. `2.0.0` is not a prerelease, so it goes to `latest`.
5. Verify: `npm view @shining-technologies/ui dist-tags` shows `latest: 2.0.0`.
6. Point V1 users at the migration guide:

   ```bash
   npm deprecate "@shining-technologies/ui-kit-react@*" "Replaced by @shining-technologies/ui. See https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/master/packages/ui/MIGRATION.md"
   npm deprecate "@shining-technologies/ui-kit-core@*" "Replaced by @shining-technologies/ui/core"
   npm deprecate "@shining-technologies/ui-kit-themes@*" "Replaced by @shining-technologies/ui/theme and presets.css"
   npm deprecate "@shining-technologies/ui-kit-export-csv@*" "Replaced by @shining-technologies/ui/csv"
   ```

From then on, every release of `@shining-technologies/ui` goes through changesets.

## The V1 packages

`@shining-technologies/ui-kit-core`, `-react`, `-themes` and `-export-csv` were published at
`0.1.0`. Their source has been removed from this repository (the last commit containing it is
`7880f44`), and they are not released again. Their versions stay on npm until they are
deprecated in step 6 of [Releasing 2.0.0](#releasing-200). Users move to
`@shining-technologies/ui` with [packages/ui/MIGRATION.md](../../packages/ui/MIGRATION.md).

## Troubleshooting

**`402 Payment Required`**: npm treats the package as private. Check `publishConfig.access`.

**`404 Not Found` on publish**: the publisher or token has no publish rights in the
`@shining-technologies` organisation.

**Provenance**: npm provenance links a tarball to the workflow run that built it, but npm only
accepts it from a **public** repository. This repository is private, so the release workflow does
not set `NPM_CONFIG_PROVENANCE`. If the repository becomes public, add
`NPM_CONFIG_PROVENANCE: 'true'` to the publish step's `env` (the `id-token: write` permission is
already granted).

**`ENEEDAUTH` or an empty `NODE_AUTH_TOKEN` in the log**: the `NPM_TOKEN` secret is missing. See
[One-time setup](#one-time-setup).

**A candidate went to `latest` by mistake**:

```bash
npm dist-tag add @shining-technologies/ui@<last-stable-or-candidate> latest
npm dist-tag add @shining-technologies/ui@2.0.0-rc.N next
```

**A broken version was published**: npm does not allow republishing a version. Publish the fix
as the next version and `npm deprecate` the broken one. Use `npm unpublish` only within 72 hours
and only when nothing depends on it.
