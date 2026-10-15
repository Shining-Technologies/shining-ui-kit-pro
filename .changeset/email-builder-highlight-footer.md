---
'@shining-technologies/email-builder': minor
---

`BlockEditor` takes `highlight` (`{ path?, blockId?, message } | null`) and `onHighlightClear` to show a server validation error on the canvas: the block, column or row it points at is outlined, scrolled into view and selected, the message is announced, and the highlight clears when that target is edited. `BrandPreview` gains `footer_html`, which the footer block shows above its own text, as the server renders it.
