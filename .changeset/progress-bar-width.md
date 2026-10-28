---
'@shining-technologies/ui': patch
---

`Progress` shows its bar again: the indicator had a computed width of 0 (`aria-valuenow` was right, the bar always looked empty) because `CellProgress`'s `display: flex` rule for `.sui-progress` also applied to the `Progress` root, and `Progress`'s height and `overflow: hidden` clipped the `CellProgress` percentage. The `CellProgress` row is now styled by its own `.sui-cell-progress` class, added next to `.sui-progress`; no class was renamed or removed.
