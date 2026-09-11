# @shining-technologies/ui-kit-themes

## 0.2.0

### Minor Changes

- e62526e: Make presets a one-line setup, and make sure a preset reaches every component.

  - `<UIKitProvider preset="darwind">`: name a shipped preset directly, with autocompletion (`PresetId`).
  - `<UIKitProvider brand="#be123c">` / `brand={{ primary, radius, density, … }}`: put your own colour, shape and type on top of a preset without building a project object. `applyBrand(preset, brand)` does the same outside React.
  - Two new presets: `darwind` (indigo and amber, sharp corners, compact striped rows, flat) and `unn` (teal and coral, very round corners, spacious, raised, borderless tables).
  - Fix: a preset id passed to `project` or `defaultProject` without a registry silently fell back to `shining`. Ids now resolve against the shipped presets, and an unknown id logs a warning.
  - Fix: `DataTable` ignored the project's density and table variant; it now falls back to them when its own props are not set.
  - Fix: in `local` scope, dialogs, sheets, menus, selects, popovers, tooltips and hover cards rendered outside the themed wrapper and showed the default palette. They now render inside it (`usePortalContainer()` exposes the element for your own portals).
  - In `global` scope, `<html>` now gets the `sui-scope` base styles (surface, type, focus ring, reduced motion), matching `local` scope.

### Patch Changes

- Updated dependencies [e62526e]
- Updated dependencies [e62526e]
  - @shining-technologies/ui-kit-core@0.2.0
