# @shining-technologies/email-builder

## 0.3.0

### Minor Changes

- e60439a: Shared blocks and a data-table block for shining-email 0.4.

  **Shared blocks.** A row saved as a shared block is inserted into a design as a placeholder, `{ id, type: 'shared', ref }`, not as a copy; the server puts the row's content in when it renders, so editing the shared block changes every template that uses it. The canvas draws the saved row read-only inside a dashed outline with a "Shared · name" badge (its inner blocks cannot be selected or edited), "Loading shared block…" while it is fetched, and a grey "This shared block was deleted" box that can only be removed. A placeholder's toolbar has move, Duplicate, "Edit shared block", "Detach" (replace it with a copy you can edit in this email, undoable) and Remove. A row's toolbar gains "Save as shared block", and the palette a "Shared blocks" section with how many templates use each. "Edit shared block" opens a modal (focus is trapped and restored; Esc, Cancel and Close ask "Discard changes?" when something was changed, and Esc during a drag only cancels the drag) with an editor of its own, limited to one row, and saves with `savedRows.update`; the server's refusal is shown inside it. Deleting a shared block that templates use is always refused: `savedRows.remove` rejects with the new `SharedRowInUseError(message, templates)`, and the editor says "Used in N templates: <names>. Remove it from those templates first." There is no delete-anyway.

  `SavedRowsAdapter` gains optional `update(id, { name?, row? }, designWidth?)` and `get(id)` (`null` means deleted), and `save` takes `{ shared?: boolean }` as a fourth argument. `SavedRow` gains `shared` and `usageCount`. `design` gains `SharedRowRef`, `DesignRow`, `isSharedRowRef`, `createSharedRowRef`, `replaceRowWithSharedRef`, `detachSharedRow`, `expandSharedRows`, `validateSharedRowContent` and `rowWithDefaults` (one row's defaults, as `withDefaults` does for a design); `hasFooter` takes an optional resolver for footers inside shared blocks.

  **Table block.** A new `table` block lists rows the project puts in the render context (a deal's line items): up to six columns, each a field of the data source with a heading, an optional second line, alignment, width and "hide on phones", optional totals lines, a heading row, shading and brand-coloured lines. `BlockEditor` takes `dataSources` (`GET data-sources/`); without them the Table tile and menu item are hidden. The canvas draws the source's sample rows and totals (a total with no value is a note across all columns) with a "Sample data" chip. `design` gains `TableBlock`, `TableColumn`, `TableTotal`, `DataSourceDefinition` and `tableBlockFor`; `validateBlockDesign` mirrors the server's table rules (one to six columns, widths that add up to at most 100, no totals when the last column is hidden on phones).

  **Breaking for TypeScript only.** `BlockDesign.rows` is now `DesignRow[]` (a `Row` or a `SharedRowRef`), so code that reads `design.rows[i].columns` must narrow with `isSharedRowRef` first. The allBlocks, findBlock and tree helpers skip placeholders. Needs shining-email 0.4.0 or later.

## 0.2.0

### Minor Changes

- 005c8a3: `BlockEditor`: the drag-and-drop editor for shining-email's block designs (rows, columns and eleven block types), with undo and redo, a desktop and mobile canvas at real widths, saved rows, inline text editing with merge-field chips, and properties for every block, row, column and the email itself. Every edit is checked against the server's rules before it is applied (the URL check is a port of the server's, sizes are counted as the server counts them), a move or insert that would leave an image wider than its column sets it to full width, and a YouTube thumbnail is filled on read. The floating format bar stays inside the canvas and clear of the block's toolbar, the row toolbar hangs in the left margin, and keyboard and screen-reader use is covered: sheets trap focus, the width switch is a toggle group, field errors are linked to their fields, keyboard moves are announced, and Esc closes the colour and link panels and returns focus to their button.

  To show a server validation error, pass `highlight` (a `BlockEditorHighlight`: `{ path?, blockId?, message }`) and `onHighlightClear`: the block, column or row it points at is outlined, scrolled into view and selected, the message is announced, and the highlight clears when that target is edited or the value is replaced. Prefer `blockId` to `path` for a background save, since a path is an index into the design as it was sent. `BrandPreview` gains `footer_html`, which the footer block shows above its own text, as the server renders it. `SavedRowsAdapter` needs only `list`; without `save` the editor hides "Save as row", without `remove` it hides the delete buttons, and listing and inserting still work for a read-only user. `savedRows.save` receives the email's width as a third argument. `MergeFieldDefinition` has an optional `description`, shown (and searched) in the merge-field picker. `UploadedImage` has an optional `assetId`, which `onUploadImage` can return so a block design keeps the uploaded asset's id (`asset_id`).

  `/design` gains the full `BlockDesign` types, `createBlock`, the tree helpers, `withDefaults`, `validateBlockDesign` (a client mirror of the server's rules), `resolveBrand` and `issueTarget` (maps a server error path to the block it points into). `EmailEditor`'s notice for a block design now points to `BlockEditor`. New dependencies: `@dnd-kit/core` and `@dnd-kit/sortable`.

## 0.1.0

### Minor Changes

- First release: `EmailEditor` (rich-text mode for shining-email designs, with merge fields, buttons, images, links and colour), `EmailPreview`, `MergeFieldPicker`, and the server-safe `./design` helpers. Merge tags written as plain text in a loaded design (seed data, starters) show as chips (`chipMergeTags`); the merge-field list may arrive after mount without rebuilding the editor.
