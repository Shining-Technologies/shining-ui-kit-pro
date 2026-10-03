# @shining-technologies/email-builder

The email editor for [shining-email](https://github.com/Shining-Technologies/shining-email):
staff design an email in a rich-text editor with merge fields, brand-styled
buttons and images; the server sanitises, stores and renders it.

- **`EmailEditor`** — controlled editor for a shining-email design
  (`{ version: 1, mode: 'richtext', settings: {}, html }`). It can only produce
  what the server keeps: paragraphs, headings 1–3, bold, italic, underline,
  strike, colour, alignment, lists, quotes, dividers, links, images, buttons and
  merge fields.
- **`EmailPreview`** — the server's rendered HTML in a sandboxed frame, with
  desktop, mobile and plain-text views and the renderer's warnings.
- **`MergeFieldPicker`** — searchable merge fields, also usable beside a subject
  input with `insertAtCursor`.
- **`@shining-technologies/email-builder/design`** — design and merge-tag
  helpers with no React, safe in server code.

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
