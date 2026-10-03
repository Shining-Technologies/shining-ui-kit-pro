# @shining-technologies/email-builder v0.1.0

Released 2026-10-03 · Initial release · [CHANGELOG entry](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/%40shining-technologies%2Femail-builder%400.1.0/packages/email-builder/CHANGELOG.md#010)

The first release of `@shining-technologies/email-builder`: the email editor for shining-email,
with merge fields, brand-styled buttons and images, and the server's rendered preview.

```text
"@shining-technologies/email-builder": "0.1.0"
```

## What changed

- `EmailEditor`: a controlled rich-text editor for shining-email designs
  (`{ version: 1, mode: 'richtext', settings: {}, html }`). It produces only what the server keeps:
  paragraphs, headings 1–3, bold, italic, underline, strike, colour, alignment, lists, quotes,
  dividers, links, images, buttons and merge fields.
- Merge fields as chips. Tags written as plain text in a loaded design (seed data, starters) become
  chips (`chipMergeTags`); a merge-field list that arrives after mount relabels the chips without
  rebuilding the editor.
- `EmailPreview`: the server's rendered HTML in a sandboxed frame, with desktop, mobile and
  plain-text views and the renderer's warnings.
- `MergeFieldPicker`: searchable merge fields, also usable beside a subject input.
- `@shining-technologies/email-builder/design`: design and merge-tag helpers with no React, safe in
  server code.
- `styles.css`, themed by the same CSS variables as `@shining-technologies/ui`.

## Migrations

None. A new package.

## Settings

- Peer dependencies: `react` and `react-dom` 18.3 or 19.
- Import `@shining-technologies/email-builder/styles.css` once.
- The editor talks to shining-email v0.1.0's API through callbacks the application passes in
  (merge fields, brand colours, image upload, preview); it makes no requests of its own.

## Upgrading

1. `npm install @shining-technologies/email-builder`.
2. Import the stylesheet, then render `EmailEditor` and `EmailPreview` where templates and one-off
   emails are written (the
   [README](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/%40shining-technologies%2Femail-builder%400.1.0/packages/email-builder/README.md)
   has the wiring).

## Compatibility

- ESM only. React 18.3 and 19. Built on TipTap 3.
- Designs are shining-email's `design_version` 1.
