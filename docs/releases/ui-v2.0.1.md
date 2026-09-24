# @shining-technologies/ui v2.0.1

Released 2026-09-15 · Major · [CHANGELOG entry](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/%40shining-technologies%2Fui%402.0.1/packages/ui/CHANGELOG.md#201)

The first stable release of `@shining-technologies/ui`: 2.0.0-rc.0 plus one field box for every
input, inline filters on one toolbar line, and `NumberInput` without stepper buttons by default.

```text
"@shining-technologies/ui": "2.0.1"
```

## What changed

- Fields: one box and one set of focus, invalid and disabled states for every field, including
  the search boxes inside the combobox, the multi-select filter and the phone country list.
- DataTable inline filters: search and filters share one line and wrap control by control, with
  "Clear filters" after the last filter; filter panels end with the same footer.
- `Select`, `Combobox`, `MultiCombobox` and the DataTable multi-select filter mark options with a
  checkbox instead of a bare tick.
- `NumberInput` `steppers` defaults to `false`; the arrow keys still step.
- `TooltipProvider` `delayDuration` defaults to 300ms, like a standalone `Tooltip`.
- Fixes: `enableFiltering: false` honoured for filters set in code in client mode;
  `filter.defaultOperator` in the filter panel; `disabled` on `select` filter options; `Sparkline`
  with a `style`; `Spinner` under reduced motion; disabled `Slider` and `Select` no longer submit.

## Migrations

- CSS that targets `.sui-combobox__check` or `.sui-multiselect__check` must target
  `.sui-option-check`.

## Settings

- Theme: the default dark `--input` changes from `#54545d` to `#65656e` (3:1 against the card);
  generated and preset themes follow.
- `NumberInput`: pass `steppers` to keep the increase and decrease buttons.

## Upgrading

- From 2.0.0-rc.0: bump the pin, then apply the class rename and add `steppers` where the buttons
  are wanted.
- From the V1 packages: follow
  [MIGRATION.md](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/%40shining-technologies%2Fui%402.0.1/packages/ui/MIGRATION.md)
  and the 2.0.0-rc.0 notes.

## Compatibility

- 2.0.0 was never published to npm, so this is the first stable 2.x and the major bump from V1.
- `NumberInput` without `steppers` renders no buttons, and fields, filter toolbars and option
  lists look different: review screenshots.
