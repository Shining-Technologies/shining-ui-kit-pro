---
'@shining-technologies/email-builder': minor
---

`BlockEditor`: the drag-and-drop editor for shining-email's block designs (rows, columns and ten block types plus avatar), with undo and redo, a desktop and mobile canvas at real widths, saved rows, inline text editing with merge-field chips, and properties for every block, row, column and the email itself. `/design` gains the full `BlockDesign` types, `createBlock`, the tree helpers, `withDefaults`, `validateBlockDesign` (a client mirror of the server's rules), `resolveBrand` and `issueTarget` (maps a server error path to the block it points into). `EmailEditor`'s notice for a block design now points to `BlockEditor`. New dependencies: `@dnd-kit/core`, `@dnd-kit/sortable` and `@dnd-kit/utilities`.
