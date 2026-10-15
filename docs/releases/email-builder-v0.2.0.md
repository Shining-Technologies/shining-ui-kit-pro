# @shining-technologies/email-builder v0.2.0

Released 2026-10-15 · Minor · [CHANGELOG entry](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/%40shining-technologies%2Femail-builder%400.2.0/packages/email-builder/CHANGELOG.md#020)

`BlockEditor`: the drag-and-drop editor for shining-email 0.3's block designs, with a palette, a canvas
that approximates the email at a real desktop or mobile width, and properties for every block, row,
column and the email itself. Additive.

```text
"@shining-technologies/email-builder": "0.2.0"
```

## What changed

- `BlockEditor`: a controlled editor for block designs
  (`{ version: 1, mode: 'blocks', settings, rows }`).
  - Three panes (palette, canvas, properties) that become sheets below 1024px.
  - Rows of one to three columns in five layouts (100, 50/50, 33/67, 67/33, 33/34/33); changing a
    row's layout never loses a block.
  - Blocks: heading, text, image, avatar, button, divider, spacer, social, video, footer (one per
    email) and html. Heading and text edit in place, with marks, links, colour and merge-field chips;
    everything else is edited in the properties.
  - Drag a block, a row, a layout or a saved row with the pointer; click a palette tile to add after
    the selection; "+" insertion points between blocks; keyboard moves (Enter selects, Alt+arrows
    move, Delete removes) and spoken announcements.
  - Undo and redo (Cmd/Ctrl+Z, Shift+Z or Y; 50 steps); a desktop and mobile toggle that shows rows
    and columns hidden on the device dimmed and labelled.
  - Saved rows (`savedRows` adapter: `list`, with `save` and `remove` optional); insertion copies a row
    with new ids. Without `save` the editor hides "Save as row", without `remove` the delete buttons,
    so a read-only user can still list and insert.
  - Colour inputs offer the brand's swatches (written as `brand.<attr>`), neutrals, a hex input and
    Clear; button size and shape presets; padding as four inputs with a link-all toggle.
  - Every edit is checked with `validateBlockDesign` before it is applied.
  - A server validation error can be shown on the canvas: pass `highlight` (a `BlockEditorHighlight`,
    `{ path?, blockId?, message }`) and `onHighlightClear`. The block, column or row it points at is
    outlined, scrolled into view and selected, the message is announced, and the highlight clears
    when that target is edited or the value is replaced.
  - `BrandPreview.footer_html` is shown in the footer block above the block's own text, as the server
    renders them.
  - `MergeFieldDefinition.description` is a muted second line in the merge-field picker, searched with
    the label.
- `/design` (no React, safe in server code):
  - the `BlockDesign`, `Row`, `Column` and `Block` types, `createBlock`, `newId`;
  - the tree helpers `findBlock`, `updateBlock`, `removeBlock`, `moveBlock`, `duplicateBlock`,
    `insertBlock`, `insertRow`, `moveRow`, `duplicateRow`, `setRowLayout`, `cloneRowWithNewIds`;
  - `withDefaults` (the server stores designs compact; defaults are filled on read), `isBlockDesign`,
    `toBlockDesign`, `emptyBlockDesign`;
  - `validateBlockDesign` and `blockDesignErrors`, a client mirror of the server's rules that returns
    issues with their paths, and `issueTarget` / `blockIdForPath`, which map a server error such as
    `rows[0].columns[0].blocks[1].url: …` to the block, column or row it points into;
  - `resolveBrand`, `resolveFont`, `BrandPreview`, `ROW_LAYOUTS`, `FONT_STACKS`.
- `EmailEditor`'s notice for a block design now points to `BlockEditor`.
- `UploadedImage` gains an optional `assetId`, kept as the block's `asset_id`.

## Migrations

None. `BlockDesign` is now fully typed (`settings` and `rows` were `Record<string, unknown>` and
`unknown[]`); code that only passed one through is unaffected.

## Settings

- New dependencies: `@dnd-kit/core` ^6.3.1 and `@dnd-kit/sortable` ^10.
- `styles.css` gains the `.seb-*` rules for the block editor. The editor fills its parent: give it a
  height, or set `--seb-block-editor-height` on it (default `100%`, at least 32rem).
- `BlockEditor` makes no requests: merge fields, the brand, image upload and saved rows are passed in
  as props and callbacks.

## Upgrading

1. `npm install @shining-technologies/email-builder@0.2.0`.
2. Render `BlockEditor` where a block template is edited. It needs shining-email 0.3 (block mode, saved
   rows and the `designs/convert/` endpoint):

   ```tsx
   <BlockEditor
     value={template.design}
     onChange={(design) => setTemplate({ ...template, design })}
     mergeFields={mergeFields} // GET merge-fields/
     brand={brand} // GET brand/
     onUploadImage={uploadAsset} // POST assets/ → { url, alt, assetId }
     savedRows={savedRows} // optional: { list, save, remove }
   />
   ```

3. When the server refuses a design, pass its error to the editor with the `highlight` and
   `onHighlightClear` props (`highlight={{ path: error, message: error }}`, or `blockId` when you
   know it) to show it on the canvas. To place it yourself, `issueTarget(design, error)` finds the
   block, column or row it points at.

## Compatibility

- The server is the authority. `validateBlockDesign` mirrors its rules for hints; an unfinished block
  (an image with no picture, a button with no link) is reported as a `warning`, which the server
  would still refuse on save.
- The editor resets its undo history when `value` differs from the design it last emitted. Keep the
  `onChange` design in local state; do not swap in the server's compact copy after a save unless you
  intend to start a new history.
- `savedRows.save(name, row, designWidth)` gets a third argument, the email's width, for the server's
  `design_width`.
- The footer block renders below the email card whatever its place in the tree; the canvas flags it.
- The button's pill preset writes `radius: 40`, the server's maximum.
- ESM only. React 18.3 and 19.
