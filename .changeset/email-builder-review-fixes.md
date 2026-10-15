---
'@shining-technologies/email-builder': minor
---

Review fixes for `BlockEditor` before its first release: a move or insert that would leave an image wider than its column now sets the image to full width; every action is checked against the server's rules before it is applied; the URL check is a port of the server's (merge tags anywhere after the start, and nothing unsafe); sizes are counted as the server counts them; a YouTube thumbnail is filled on read; a move that changes nothing is not an undo step; headings join pasted lines; and sheets trap focus, the width switch is a toggle group, field errors are linked to their fields and keyboard moves are announced. `savedRows.save` receives the email's width as a third argument. `MergeFieldDefinition` has an optional `description`, shown (and searched) in the merge-field picker.
