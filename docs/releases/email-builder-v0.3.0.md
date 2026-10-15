# @shining-technologies/email-builder v0.3.0

Released 2026-10-15 · Minor · [CHANGELOG entry](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/%40shining-technologies%2Femail-builder%400.3.0/packages/email-builder/CHANGELOG.md#030)

`BlockEditor` gains shared blocks (a saved row inserted as a placeholder and edited in one place) and a data-table block for shining-email 0.4. Additive at runtime; `BlockDesign.rows` is widened for TypeScript.

```text
"@shining-technologies/email-builder": "0.3.0"
```

## What changed

- **Shared blocks.** A saved row marked shared is inserted into a design as a placeholder,
  `{ id, type: 'shared', ref }`, not as a copy. The server puts the row's content in when it renders,
  so editing the shared block changes every template that uses it, and mail already sent or queued
  does not change.
  - The canvas draws the saved row read-only in a dashed outline with a "Shared · name" badge; its
    inner blocks cannot be selected or edited. While the row loads it shows "Loading shared block…";
    a deleted one is a grey "This shared block was deleted" box that can only be removed.
  - A placeholder's toolbar: drag, move up and down, Duplicate (another placeholder for the same
    block), "Edit shared block", "Detach" ("Make a copy you can edit here"; undoable) and Remove.
  - A row's toolbar gains "Save as shared block", which saves the row with `{ shared: true }` and puts
    a placeholder in its place. Whether a row is shared is decided when it is created and never changes.
  - The palette gains a "Shared blocks" section, apart from "Saved rows", with how many templates use
    each block and a delete button when the adapter has `remove`.
  - "Edit shared block" opens a modal with an editor of its own: one row, no shared blocks inside it,
    its own undo. Esc, Cancel and Close ask "Discard changes?" when something was changed. Saving calls `savedRows.update`; the server's refusal (for example a footer
    conflict in a template that uses the block) is shown inside the dialog. Template undo does not
    cover shared content.
  - Deleting a shared block that templates use is **always refused**: `remove` rejects with
    `SharedRowInUseError`, and the editor says "Used in N templates: <names>. Remove it from those
    templates first." There is no delete-anyway option.
  - A shared block with a footer is refused when the email already has a footer (and the other way
    round).
  - `SavedRowsAdapter` gains optional `update(id, { name?, row? }, designWidth?)` and `get(id)` (`null`
    means deleted); `save` takes `{ shared?: boolean }` as a fourth argument; `SavedRow` gains `shared`
    and `usageCount`; `SharedRowInUseError(message, templates)` is exported.
- **Table block.** A `table` block lists rows the project puts in the render context under a source
  such as `deal.items`, in up to six columns (field, heading, optional second line, alignment, width,
  "hide on phones"), with optional totals lines, a heading row, shading and brand-coloured lines.
  - `BlockEditor` takes `dataSources` (`GET data-sources/`). Without them the Table tile and the "+"
    menu item are hidden. A new table starts from the first source's `default_columns`.
  - The canvas draws the source's `sample` rows and `sample_totals` with a "Sample data" chip; a source
    the editor does not know shows "No sample data for <source>". A total with an empty value is a
    note across all columns. Columns hidden on phones are dropped in the mobile canvas.
  - The inspector edits the data, the columns (add, remove, reorder), totals, heading row, shading,
    colours and the shared style fields.
- `/design` (no React, safe in server code): `SharedRowRef`, `DesignRow`, `isSharedRowRef`,
  `createSharedRowRef`, `replaceRowWithSharedRef`, `detachSharedRow`, `expandSharedRows`,
  `validateSharedRowContent`, `rowWithDefaults` (one row's defaults, as `withDefaults` does for a
  design); `TableBlock`, `TableColumn`, `TableTotal`, `DataSourceDefinition`,
  `tableBlockFor`. `hasFooter(design, resolve?)` can look into shared blocks. `validateBlockDesign`
  accepts a placeholder (an id, a `ref` that is a UUID, an optional `hide_on`; it counts as one row)
  and mirrors the server's table rules. `issueTarget` maps any path under a placeholder to its row.
- `BLOCK_TYPES` and `DEFAULT_BLOCK_PADDING` include `table`.

## Migrations

`BlockDesign.rows` is now `DesignRow[]`, a `Row` or a `SharedRowRef`. Code that reads a row's
`columns` must narrow first:

```ts
import { isSharedRowRef } from '@shining-technologies/email-builder/design'

for (const row of design.rows) {
  if (isSharedRowRef(row)) continue // its content lives in the saved row
  row.columns.forEach(/* … */)
}
```

`allBlocks`, `countBlocks`, `findBlock`, `findColumn`, `insertRow`, `duplicateRow`, `updateRow`,
`setRowLayout` and the rest of the helpers already skip or pass through placeholders. No change at
runtime for a design with none.

## Settings

- `BlockEditor` takes `dataSources?: DataSourceDefinition[]` and, in the saved-rows adapter, the
  optional `update` and `get`. Leave `update` out for a user who may not change shared blocks (the
  editor hides "Edit shared block"); leave `save` out to hide "Save as row" and "Save as shared block".
- `styles.css` gains the `.seb-shared-*`, `.seb-table-*` and `.seb-dialog-*` rules.
- No new dependencies.

## Upgrading

1. `npm install @shining-technologies/email-builder@0.3.0`. It needs **shining-email 0.4.0**: older
   servers reject a `shared` row and the `table` block.
2. Fix any code that reads `design.rows[i].columns` (see Migrations).
3. Pass the new data to `BlockEditor`:

   ```tsx
   <BlockEditor
     value={template.design}
     onChange={(design) => setTemplate({ ...template, design })}
     mergeFields={mergeFields}
     brand={brand}
     dataSources={dataSources} // GET data-sources/ → shows the Table tile
     savedRows={{
       list: () => api.listSavedRows(), // shared blocks come back with shared: true
       get: (id) => api.getSavedRow(id), // null when it was deleted
       save: (name, row, width, options) =>
         api.saveRow({ name, row, design_width: width, is_shared: options?.shared }),
       update: (id, patch, width) => api.updateSavedRow(id, { ...patch, design_width: width }),
       remove: async (id) => {
         try {
           await api.deleteSavedRow(id)
         } catch (error) {
           // 409 shared_row_in_use → throw new SharedRowInUseError(message, errors.templates)
         }
       },
     }}
   />
   ```

## Compatibility

- Needs shining-email 0.4.0 or later. The design `version` stays 1.
- A shared block's id must be a UUID: the placeholder's `ref` is validated as one, and the editor
  will not put a placeholder in a design for a saved row whose id is not.
- The server expands a placeholder before it validates and renders, and a send stores the expanded
  design, so editing a shared block never changes queued or sent mail.
- A shared block's ids on the canvas are the saved row's; the server re-keys them per placeholder.
- The nested editor in "Edit shared block" is limited to one row and cannot hold another shared
  block, as the server refuses both.
- `savedRows.remove` takes no options: there is no way to delete a shared block that templates use.
- ESM only. React 18.3 and 19.
