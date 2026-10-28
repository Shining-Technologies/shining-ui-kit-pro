# @shining-technologies/email-builder v0.3.1

Released 2026-10-28 · Patch · [CHANGELOG entry](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/%40shining-technologies%2Femail-builder%400.3.1/packages/email-builder/CHANGELOG.md#031)

The palette's inline delete question for a saved row or shared block fits the palette, and a refused delete closes it and says why.

```text
"@shining-technologies/email-builder": "0.3.1"
```

## What changed

- **A refused delete closes the question.** Choosing delete on a shared block that templates use
  made the adapter's `remove` throw `SharedRowInUseError`. The editor showed "Used in N templates: …
  Remove it from those templates first." above the canvas, but the "Delete “name”? / Keep" question
  stayed open in the palette. Now, when `remove` throws (that error or any other), the question closes
  and the same message appears under that row in the palette, in the destructive colour. It stays
  until the author asks to delete that row again. The notice above the canvas and the screen reader
  announcement are unchanged.
- **The question fits the palette.** It sat beside the row's name, and at the palette's narrowest
  width (13.5rem, for example in a 1440px window) it ran past the right edge. Now, while the question
  is open, it takes its own line under the name; the delete button wraps a long block name over
  several lines instead of overflowing, and its `title` holds the full text. This applies to saved
  rows and shared blocks alike.
- No class was removed or renamed and no prop or export changed. `.seb-saved-item` gains
  `data-confirming` while its question is open, and `.seb-saved-refusal` is the new paragraph that
  holds the reason.

## Migrations

None.

## Settings

None. `styles.css` gains the `.seb-saved-refusal` rule and changes `.seb-saved-item` and
`.seb-saved-confirm` (they wrap).

## Upgrading

- Bump the pin: `npm install @shining-technologies/email-builder@0.3.1`.
- The message shown is the editor's own text for `SharedRowInUseError` (built from the `templates`
  you pass), or the `message` of any other error `remove` throws. The `message` you give
  `SharedRowInUseError` itself is not shown.

## Compatibility

- Needs shining-email 0.4.0 or later, as 0.3.0 did.
- Your own CSS on `.seb-saved-item` or `.seb-saved-confirm` still applies; if it sets `display` or
  `flex-wrap` on them, check the open question in a narrow palette.
