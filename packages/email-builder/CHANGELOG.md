# @shining-technologies/email-builder

## 0.2.0

### Minor Changes

- 005c8a3: `BlockEditor`: the drag-and-drop editor for shining-email's block designs (rows, columns and eleven block types), with undo and redo, a desktop and mobile canvas at real widths, saved rows, inline text editing with merge-field chips, and properties for every block, row, column and the email itself. Every edit is checked against the server's rules before it is applied (the URL check is a port of the server's, sizes are counted as the server counts them), a move or insert that would leave an image wider than its column sets it to full width, and a YouTube thumbnail is filled on read. The floating format bar stays inside the canvas and clear of the block's toolbar, the row toolbar hangs in the left margin, and keyboard and screen-reader use is covered: sheets trap focus, the width switch is a toggle group, field errors are linked to their fields, keyboard moves are announced, and Esc closes the colour and link panels and returns focus to their button.

  To show a server validation error, pass `highlight` (a `BlockEditorHighlight`: `{ path?, blockId?, message }`) and `onHighlightClear`: the block, column or row it points at is outlined, scrolled into view and selected, the message is announced, and the highlight clears when that target is edited or the value is replaced. Prefer `blockId` to `path` for a background save, since a path is an index into the design as it was sent. `BrandPreview` gains `footer_html`, which the footer block shows above its own text, as the server renders it. `SavedRowsAdapter` needs only `list`; without `save` the editor hides "Save as row", without `remove` it hides the delete buttons, and listing and inserting still work for a read-only user. `savedRows.save` receives the email's width as a third argument. `MergeFieldDefinition` has an optional `description`, shown (and searched) in the merge-field picker. `UploadedImage` has an optional `assetId`, which `onUploadImage` can return so a block design keeps the uploaded asset's id (`asset_id`).

  `/design` gains the full `BlockDesign` types, `createBlock`, the tree helpers, `withDefaults`, `validateBlockDesign` (a client mirror of the server's rules), `resolveBrand` and `issueTarget` (maps a server error path to the block it points into). `EmailEditor`'s notice for a block design now points to `BlockEditor`. New dependencies: `@dnd-kit/core` and `@dnd-kit/sortable`.

## 0.1.0

### Minor Changes

- First release: `EmailEditor` (rich-text mode for shining-email designs, with merge fields, buttons, images, links and colour), `EmailPreview`, `MergeFieldPicker`, and the server-safe `./design` helpers. Merge tags written as plain text in a loaded design (seed data, starters) show as chips (`chipMergeTags`); the merge-field list may arrive after mount without rebuilding the editor.
