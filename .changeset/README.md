# Changesets

This folder is how versions are decided. Instead of editing `version` fields by hand, a
change that users should hear about ships with a **changeset**: a small markdown file naming
the affected packages, the bump each one needs, and the line that will appear in the
changelog.

```bash
pnpm changeset
```

Answer the prompts, commit the generated file alongside your code. At release time
`pnpm version:packages` consumes every pending changeset, bumps the versions, writes the
`CHANGELOG.md` files and deletes the changesets it used.

## What bump to pick

| Bump      | Use it for                                                                 |
| --------- | -------------------------------------------------------------------------- |
| **patch** | A fix that changes no API — behaviour, styling, types made more accurate   |
| **minor** | A new component, prop, export or token; anything additive                  |
| **major** | A removed or renamed export, a changed default, a changed DOM or CSS class |

Because the kit's appearance is generated, a change to the **colour engine or token names**
is a breaking change even when no TypeScript signature moves — an application's screenshots
change. Treat it as major.

## Version groups

`@shining-technologies/ui-kit-core`, `@shining-technologies/ui-kit-react` and `@shining-technologies/ui-kit-themes` are a
[`fixed`](https://github.com/changesets/changesets/blob/main/docs/fixed-packages.md) group:
they always carry the same version, because `react` re-exports `core`'s types and `themes`
produces `core`'s projects. Installing matching versions should never be something a user has
to think about.

`@shining-technologies/ui-kit-export-csv` versions on its own — it is optional, has no runtime
dependencies, and rarely changes.

`@shining-technologies/ui` (V2) is in no group. Prerelease versions of it (`2.0.0-rc.N`) are set
by hand in its `package.json`; `scripts/publish.mjs` publishes them under the `next` tag so they
never reach `latest`.

The gallery and examples workspaces are `private` and ignored here; they are never published.

Full process: [docs/contributing/releasing.md](../docs/contributing/releasing.md).
