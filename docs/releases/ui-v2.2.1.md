# @shining-technologies/ui v2.2.1

Released 2026-10-28 · Patch · [CHANGELOG entry](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/%40shining-technologies%2Fui%402.2.1/packages/ui/CHANGELOG.md#221)

`Progress` draws its bar again, and the DataTable's `CellProgress` is no longer clipped.

```text
"@shining-technologies/ui": "2.2.1"
```

## What changed

- `Progress`: the indicator had a computed width of 0, so the bar looked empty at any value
  (`aria-valuenow` was correct). `.sui-progress` is the block name of both `Progress` and
  `CellProgress`, and `CellProgress`'s `display: flex` on it made the `Progress` indicator a
  zero-width flex item.
- `CellProgress`: the root also took `Progress`'s `0.5rem` height, `overflow: hidden` and track
  background, which clipped the percentage.
- `CellProgress` has a second root class, `.sui-cell-progress`, which carries its layout.
  `.sui-progress` stays on the root, and `.sui-progress__track`, `__bar` and `__value` are
  unchanged.

## Migrations

None.

## Settings

None.

## Upgrading

- Bump the pin.
- CSS that targets `.sui-progress` to restyle a `CellProgress` row (for example its `gap` or
  `align-items`) still applies. CSS written to restyle a `Progress` bar through `.sui-progress`
  no longer also reaches `CellProgress`; target `.sui-cell-progress` for that.

## Compatibility

- No class, prop, token or DOM structure was removed or renamed; `CellProgress` gains one class.
- A `Progress` bar that was invisible is now visible, and the `CellProgress` percentage that was
  clipped is now shown in full.
