# Releasing

Versions are decided by [Changesets](https://github.com/changesets/changesets), not by
editing `version` fields. The rule is: **a change users should hear about ships with a
changeset**; releasing is then a matter of consuming the ones that accumulated.

## One-time setup

Publishing needs three things in place. The first release is the only time you touch them.

1. **The npm scope.** Packages publish under the Shining Technologies org,
   [`@shining-technologies`](https://www.npmjs.com/org/shining-technologies). Whoever
   publishes must be a member of that org with publish rights. Every package already sets
   `"publishConfig": { "access": "public" }`, which is what stops npm treating a scoped
   package as private and rejecting it.

2. **An npm token,** for CI. On npmjs.com: Access Tokens → Generate → **Automation**. Add it
   to the GitHub repository as the secret `NPM_TOKEN` (Settings → Secrets and variables →
   Actions). Automation tokens bypass 2FA prompts, which is what a workflow needs.

3. **Nothing else.** `GITHUB_TOKEN` is provided by Actions.

To publish from your own machine instead, `npm login` once and skip steps 2 and 3.

## The everyday loop

### 1. Describe the change

```bash
pnpm changeset
```

Pick the affected packages, pick a bump, write the line that will appear in the changelog.
Commit the generated file in `.changeset/` with your code.

| Bump      | Use it for                                                                 |
| --------- | -------------------------------------------------------------------------- |
| **patch** | A fix that changes no API — behaviour, styling, types made more accurate   |
| **minor** | A new component, prop, export or token; anything additive                  |
| **major** | A removed or renamed export, a changed default, a changed DOM or CSS class |

A change to the **colour engine or the token names** is breaking even when no TypeScript
signature moves — an application's screenshots change. Treat it as major.

Not every commit needs one. A refactor, a test, a docs edit or a tweak to the gallery changes
nothing for an installed package; `pnpm changeset:status` shows what is pending.

### 2. Version

On CI this is automatic: a push to `master` opens or updates a **"Version Packages"** pull
request holding every pending changeset. Reviewing that PR is reviewing the release.

Locally, the same step is:

```bash
pnpm version:packages
```

which bumps the versions, writes each package's `CHANGELOG.md`, deletes the consumed
changesets and refreshes the lockfile.

### 3. Publish

Merging the "Version Packages" PR publishes. The
[release workflow](../../.github/workflows/release.yml) re-runs lint, typecheck, tests, the
build and the pre-publish preflight, then publishes every package whose version is not yet on
the registry, and pushes git tags.

By hand:

```bash
pnpm release
```

which is `pnpm build && pnpm prepublish:check && changeset publish`.

## What the preflight checks

`pnpm prepublish:check` is the gate that has to pass before anything leaves the machine. It
runs two things.

[`scripts/check-publish.mjs`](../../scripts/check-publish.mjs), per package:

- the metadata npm will not invent — name, version, description, license, repository, `files`
- `publishConfig.access: public` on every scoped package
- **every path in `main`, `module`, `types` and `exports` exists and is non-empty** — the
  check that catches an unbuilt package or an `exports` typo
- a `README.md` and `LICENSE` are present, so the npm page is not a blank slab
- no `workspace:` dependency resolves to a private package, which would install as a 404
- **`dist/` is not older than `src/`** — a stale build publishes fine and behaves like the
  last release

Then [`@arethetypeswrong/cli`](https://arethetypeswrong.github.io) on the packed tarballs,
which asserts the type declarations resolve under `node10`, `node16` from CJS, `node16` from
ESM and `bundler`. This is not theoretical: the kit shipped `export * from './ui'` in its
declarations at one point, which resolves under a bundler and silently vanishes under
`nodenext`. Two build settings prevent it now — `rollupTypes` flattens each entry's
declarations so no relative specifier survives, and `scripts/emit-cjs-types.mjs` gives every
`.d.ts` a `.d.cts` twin for the `require` condition.

CI runs the same preflight on every pull request, so packaging regressions are caught before
a release, not during one.

## Version groups

`core`, `react` and `themes` are a **fixed** group: they always carry the same version.
`react` re-exports `core`'s types and `themes` produces `core`'s projects — matching versions
should never be something a user has to think about. `export-csv` versions independently; it
is optional, dependency-free and rarely changes.

`workspace:*` ranges are rewritten to the exact published version at pack time. Changesets
detects pnpm from the root `packageManager` field and shells out to `pnpm publish`, so this
happens for you — but it is also why publishing must go through the scripts here rather than
a bare `npm publish` in a package directory.

## Pre-releases

For a beta line:

```bash
pnpm changeset pre enter beta
pnpm changeset            # as usual
pnpm version:packages     # 0.2.0-beta.0
pnpm release
pnpm changeset pre exit   # when the line is done
```

## Going to 1.0.0

Nothing special — a `major` changeset on a `0.x` package bumps it to `1.0.0`. Do it when the
public API is one you are willing to keep.

## Troubleshooting

**`ERR_PNPM_GIT_UNCLEAN`** — publishing checks the working tree. Commit or stash first;
`changeset publish` passes `--no-git-checks` itself, so this only bites on a manual
`pnpm publish`.

**`402 Payment Required`** — npm thinks the package is private. The scope exists but
`publishConfig.access` is missing or the org is on a paid plan expecting private packages.

**`404 Not Found` on publish** — you are not a member of the `@shining-technologies` org
with publish rights, or the token cannot write to it.

**Provenance failures** — the release workflow sets `NPM_CONFIG_PROVENANCE`, which
cryptographically links each tarball to the workflow run that built it. It requires a public
repository and the `id-token: write` permission (both already set). If a publish fails on
provenance, drop that env var from the workflow; nothing else depends on it.

**A version was published by mistake** — npm does not allow re-publishing a version. Publish
the fix as the next patch. `npm deprecate` the bad one; only use `npm unpublish` within 72
hours and when nothing depends on it.

## Related

- [Development](development.md) — repo layout, scripts, tests
- [Packages](../reference/packages.md) — what each published package contains
- [ARCHITECTURE.md](../../ARCHITECTURE.md) — why the packages split the way they do
