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
  columns, ten block types and an avatar, saved rows, a desktop and mobile
  canvas. See [BlockEditor](#blockeditor).
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
    // optional: GET/POST/DELETE saved-rows/
    list: () => api.listSavedRows(),
    save: (name, row) => api.saveRow({ name, row }),
    remove: (id) => api.deleteSavedRow(id),
  }}
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
- **Size.** The editor fills its parent. Give it a height, or set `--seb-block-editor-height`.

When the server refuses a design, its error starts with a path such as
`rows[0].columns[0].blocks[1].url`. `issueTarget(design, message)` (or `blockIdForPath`) maps it to
the block, column or row, so the host can select it.

The design helpers are in `@shining-technologies/email-builder/design` and have no React:
`createBlock`, `newId`, `findBlock`, `updateBlock`, `removeBlock`, `moveBlock`, `duplicateBlock`,
`insertRow`, `moveRow`, `setRowLayout`, `cloneRowWithNewIds`, `withDefaults` (the server stores
designs compact, so fill defaults on read), `validateBlockDesign`, `resolveBrand` and more.
