# @shining-technologies/email-builder

The email editor for [shining-email](https://github.com/Shining-Technologies/shining-email):
staff design an email in a rich-text editor with merge fields, brand-styled
buttons and images; the server sanitises, stores and renders it.

- **`EmailEditor`** — controlled editor for a shining-email design
  (`{ version: 1, mode: 'richtext', settings: {}, html }`). It can only produce
  what the server keeps: paragraphs, headings 1–3, bold, italic, underline,
  strike, colour, alignment, lists, quotes, dividers, links, images, buttons and
  merge fields.
- **`BlockEditor`** — the drag-and-drop editor for block designs
  (`{ version: 1, mode: 'blocks', settings, rows }`, shining-email 0.3): rows and
  columns, eleven block types and a data table, saved rows and shared blocks
  (shining-email 0.4), a desktop and mobile canvas. See [BlockEditor](#blockeditor).
- **`EmailPreview`** — the server's rendered HTML in a sandboxed frame, with
  desktop, mobile and plain-text views and the renderer's warnings.
- **`MergeFieldPicker`** — searchable merge fields, also usable beside a subject
  input with `insertAtCursor`.
- **`@shining-technologies/email-builder/design`** — design, block-design and
  merge-tag helpers with no React, safe in server code.

```bash
npm install @shining-technologies/email-builder
```

```tsx
import '@shining-technologies/email-builder/styles.css'
import { EmailEditor, EmailPreview } from '@shining-technologies/email-builder'

<EmailEditor
  value={template.design}
  onChange={(design) => setTemplate({ ...template, design })}
  mergeFields={mergeFields}            // GET merge-fields/
  brandColors={[brand.primary_color]}  // GET brand/
  onUploadImage={async (file) => {     // POST assets/
    const asset = await api.uploadAsset(file)
    return { url: asset.url, alt: asset.alt_default }
  }}
/>

<EmailPreview {...preview} />          // POST templates/<id>/preview/ → {html, text, subject, warnings}
```

The stylesheet reads `@shining-technologies/ui`'s theme tokens when the app
loads them, and falls back to neutral colours otherwise.

The editor writes merge fields as
`<span data-merge-field="contact.first_name">{{ contact.first_name|there }}</span>`
and buttons as
`<a data-type="button" data-align="center" href="…">Book now</a>` — the shapes
shining-email's renderer expects.

## BlockEditor

A controlled editor for shining-email's block designs: a palette (layouts, blocks, saved rows), a
canvas that approximates the email at a real desktop (the design's width, 600 by default) or mobile
(360) width, and properties for the selection or, with nothing selected, the email's own settings.
Below 1024px the side panes become sheets. The server renders the real email; show it with
`EmailPreview`.

```tsx
import { BlockEditor } from '@shining-technologies/email-builder'

;<BlockEditor
  value={template.design} // null starts an empty block design
  onChange={(design) => setTemplate({ ...template, design })}
  mergeFields={mergeFields} // GET merge-fields/
  brand={brand} // GET brand/ (colours, fonts, logo, social links, business details)
  onUploadImage={async (file) => {
    // POST assets/
    const asset = await api.uploadAsset(file)
    return { url: asset.url, alt: asset.alt_default, assetId: asset.id }
  }}
  savedRows={{
    // optional: saved-rows/; leave out save, update and remove for a read-only user
    list: () => api.listSavedRows(), // shared blocks come back with shared: true
    save: (name, row, width, options) =>
      api.saveRow({ name, row, design_width: width, is_shared: options?.shared }),
    update: (id, patch, width) => api.updateSavedRow(id, { ...patch, design_width: width }), // shared blocks only
    get: (id) => api.getSavedRow(id), // null when deleted
    remove: (id) => api.deleteSavedRow(id), // throw SharedRowInUseError on 409 shared_row_in_use
  }}
  dataSources={dataSources} // optional: GET data-sources/; without them there is no Table block
  highlight={serverError} // optional, { path?, blockId?, message } | null
  onHighlightClear={() => setServerError(null)}
  device={device} // optional, 'desktop' | 'mobile'
  onDeviceChange={setDevice}
  disabled={!canEdit}
/>
```

- **Adding.** Drag a tile onto the canvas, or click it to add after the selection; a "+" between
  blocks and in an empty column opens a menu. Layout tiles add a row; a saved row is inserted as a
  copy with new ids. The footer block is limited to one per email.
- **Editing.** Heading and text blocks are edited in place (marks, links, colour, merge-field chips,
  and no buttons or images, which are separate blocks). Everything else is edited in the properties.
  Colours offer the brand's swatches, written as `brand.<attr>` so a change to the brand kit reaches
  the email, then neutrals, a hex input and Clear.
- **Keyboard.** Blocks and rows are focusable: Enter selects, Alt+Up/Down moves (Alt+Left/Right
  moves a block to the next column), Delete removes. Cmd/Ctrl+Z undoes; Shift+Z or Y redoes (50
  steps), unless focus is in a field.
- **Validation.** Every change is checked with `validateBlockDesign` before it is applied and is
  refused, with the reason, if it would add a problem the server would reject. An unfinished block
  (no picture, no link) is a warning, not a refusal.
- **Undo history and the value you pass.** The editor keeps its own undo stack. It resets the
  stack when `value` is not the design it last emitted, because it takes that as a different
  template being loaded. So keep the design from `onChange` in local state and pass it straight
  back; do not replace it with the server's copy after a save (the server stores designs compact,
  so its copy is not byte-for-byte what the editor emitted) unless you mean to start a new history.
  `value` itself may be compact: the editor fills defaults on read.
- **Showing a server error.** Pass the refused design's error as `highlight` (a
  `BlockEditorHighlight`): `{ path, message }`, with the leading path of the server's message
  (`rows[0].columns[0].blocks[1].url`), or `{ blockId, message }`. The block, column or row it
  points at is outlined, scrolled into view and selected, and the message shows above the canvas
  (`role="alert"`, with a Dismiss button). A path into the settings, or one that points at nothing,
  shows the message alone. The editor drops the highlight when its target is edited or removed, when
  the `value` is replaced from outside, or when the author dismisses it, and calls
  `onHighlightClear` so the host can stop passing it. Prefer `blockId` for a save that runs in the
  background: a path is resolved against the design as it is when the highlight is shown, so an edit
  made while the request was in flight can move it onto another block. Look the id up with
  `issueTarget(sentDesign, error)` against the design you sent.
- **Brand footer text.** `brand.footer_html` (from `GET brand/`) is shown in the footer block above
  the block's own text, cleaned the same way, as the server renders them in the email's footer.
- **Merge fields.** `mergeFields` entries are `{ key, label, group?, description? }`. A
  `description` shows as a muted second line in the picker, is searched with the label, and is read
  out with the option (`aria-describedby`). The server's merge-fields list already carries one.
- **Saved rows.** Only `list` is required. Without `save` the editor hides "Save as row"; without
  `remove` it hides the delete buttons; listing and inserting still work, so a read-only user keeps
  the saved rows. `savedRows.save(name, row, designWidth)` receives the email's width (480–700);
  the server checks the row's images against it.
- **Shared blocks (shining-email 0.4).** A saved row the server marks shared (`SavedRow.shared`) is
  listed under "Shared blocks" with `usageCount`, and inserted as a placeholder
  (`{ id, type: 'shared', ref }`), not as a copy: the server puts its content in when it renders, so
  one edit reaches every template that uses it. On the canvas the block is drawn read-only inside a
  dashed outline with a "Shared · name" badge, "Loading shared block…" while it is fetched
  (`savedRows.get` for one the list does not hold) and a grey "This shared block was deleted" box
  that can only be removed. Its toolbar has **Edit shared block** (needs `savedRows.update`; opens a
  modal with an editor of its own, one row, saved with `update`, the server's refusal shown inside)
  and **Detach** (replaces it with a copy you can edit in this email; undoable). A row's toolbar has
  **Save as shared block** (needs `save`; calls `save(name, row, width, { shared: true })`). Whether a
  row is shared is decided when it is created. A shared block's `id` must be a UUID (the
  placeholder's `ref` is validated as one). The server stores saved rows compact; the editor fills
  the defaults in once, when it stores a shared block. `remove` of a shared block that templates use must
  reject with `SharedRowInUseError(message, templates)`: the editor then says "Used in N templates:
  <names>. Remove it from those templates first." and never deletes it. A shared block with a footer
  is refused in an email that already has one.
- **Table block (shining-email 0.4).** `dataSources` (`DataSourceDefinition[]`) are the lists a table
  can show (`deal.items`): their `fields` fill the column picker, `default_columns` start a new
  table, `totals_key` names the totals list, and `sample` / `sample_totals` are drawn on the canvas
  with a "Sample data" chip. The server formats nothing, so every value is already text. A table has
  one to six columns (heading, optional second line, alignment, width, hide on phones) and optional
  totals; a total with an empty value is a note across all columns. Without `dataSources` the Table
  tile is hidden. If the email has no data for the source when it is sent, the server leaves the
  table out.
- **Size.** The editor fills its parent. Give it a height, or set `--seb-block-editor-height`.

When the server refuses a design, its error starts with a path such as
`rows[0].columns[0].blocks[1].url`. `issueTarget(design, message)` (or `blockIdForPath`) maps it to
the block, column or row, so the host can select it.

The design helpers are in `@shining-technologies/email-builder/design` and have no React:
`createBlock`, `tableBlockFor`, `newId`, `findBlock`, `updateBlock`, `removeBlock`, `moveBlock`,
`duplicateBlock`, `insertRow`, `moveRow`, `setRowLayout`, `cloneRowWithNewIds`, `withDefaults` (the
server stores designs compact, so fill defaults on read), `validateBlockDesign`, `resolveBrand` and
more. `BlockDesign.rows` is `DesignRow[]`, a `Row` or a shared-block placeholder: narrow with
`isSharedRowRef` before reading `columns`. `createSharedRowRef`, `replaceRowWithSharedRef`,
`detachSharedRow`, `expandSharedRows` and `validateSharedRowContent` work on placeholders, and
`rowWithDefaults(row)` fills the defaults of one row the way `withDefaults` does for a design (a row
stored compact by the server).
