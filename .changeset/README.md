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

A change to **token names, default theme values or the cascade layer order** is a breaking
change even when no TypeScript signature moves — an application's CSS and screenshots change.
Treat it as major.

## Packages

`@shining-technologies/ui` is the only published package. Prerelease versions of it
(`2.0.0-rc.N`) are set by hand in its `package.json`; `scripts/publish.mjs` publishes them under
the `next` tag so they never reach `latest`.

The gallery (`@shining-technologies/ui-gallery`) is `private` and ignored here; it is never
published.

Full process: [docs/contributing/releasing.md](../docs/contributing/releasing.md).
