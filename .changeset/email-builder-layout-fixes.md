---
'@shining-technologies/email-builder': minor
---

`BlockEditor` layout fixes from browser testing: the floating format bar stays inside the canvas and clear of the block's toolbar (it right-aligns to blocks in the last column, wraps when the canvas is narrow, and sits above the block when there is room, else below); the row toolbar hangs in the left margin so it no longer covers the row above; Esc closes the text colour panel and returns focus to its button (the link panel does the same); the canvas keeps room in both margins and scrolls sideways at a wide email width; and "Insert field" has an explicit accessible name. `SavedRowsAdapter.save` and `.remove` are now optional: without them the editor hides "Save as row" and the delete buttons, and listing and inserting saved rows still work.
