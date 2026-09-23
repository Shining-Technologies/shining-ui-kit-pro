# Kanban

Cards in columns, moved between them as work progresses: a sales pipeline, a support queue, a
hiring funnel, a sprint.

```tsx
import { KanbanBoard, type KanbanColumn, type KanbanMove } from '@shining-technologies/ui'
// or: from '@shining-technologies/ui/kanban'
```

**Server and client.** `KanbanBoard` is a client component (`'use client'`).

Exported types: `KanbanBoardProps`, `KanbanColumn`, `KanbanMove`.

## Usage

The board holds no copy of the data. It reports a `KanbanMove` and renders whatever `items` says
next, so a move can be saved, validated or refused before it shows.

```tsx
'use client'

import { KanbanBoard, type KanbanColumn, type KanbanMove } from '@shining-technologies/ui'
import { useState } from 'react'

const stages: KanbanColumn[] = [
  { id: 'lead', title: 'Lead' },
  { id: 'proposal', title: 'Proposal', tone: 'warning', limit: 5 },
  { id: 'won', title: 'Won', tone: 'success' },
]

/** Take the item out of its place and put it at `toIndex` among the target column's items. */
function applyMove(deals: Deal[], move: KanbanMove): Deal[] {
  const moving = deals.find((deal) => deal.id === move.itemId)!
  const rest = deals.filter((deal) => deal.id !== move.itemId)
  const column = rest.filter((deal) => deal.stage === move.toColumnId)
  const before = column[move.toIndex]
  const at = before ? rest.indexOf(before) : column.length ? rest.indexOf(column.at(-1)!) + 1 : rest.length
  return [...rest.slice(0, at), { ...moving, stage: move.toColumnId }, ...rest.slice(at)]
}

export function Pipeline({ initial }: { initial: Deal[] }) {
  const [deals, setDeals] = useState(initial)
  return (
    <KanbanBoard
      aria-label="Sales pipeline"
      columns={stages}
      items={deals}
      getItemId={(deal) => deal.id}
      getColumnId={(deal) => deal.stage}
      getItemLabel={(deal) => deal.title}
      onMove={(move) => {
        setDeals((current) => applyMove(current, move))
        void saveStage(move.itemId, move.toColumnId, move.toIndex)
      }}
      renderItem={(deal) => <DealCard deal={deal} />}
    />
  )
}
```

## Props

| Prop                  | Type                                                  | Default      | Description |
| --------------------- | ----------------------------------------------------- | ------------ | ----------- |
| `columns`             | `KanbanColumn[]`                                      | —            | Required. In display order. |
| `items`               | `readonly T[]`                                        | —            | Required. Every card, in display order; each column shows its own. |
| `getItemId`           | `(item: T) => string`                                 | —            | Required. |
| `getColumnId`         | `(item: T) => string`                                 | —            | Required. An item whose column is not in `columns` is not shown. |
| `renderItem`          | `(item: T, state: { dragging: boolean }) => ReactNode` | —            | Required. The card's content; the board draws the card. |
| `onMove`              | `(move: KanbanMove) => void`                          | —            | Called when a card moves. Without it the board is read-only. |
| `getItemLabel`        | `(item: T) => string`                                 | the id       | Names a card in announcements. |
| `renderColumnActions` | `(column: KanbanColumn) => ReactNode`                 | —            | Controls at the end of a column's header, such as an Add button. |
| `emptyText`           | `ReactNode`                                           | `'No items'` | Shown in an empty column. |
| `aria-label`          | `string`                                              | `'Board'`    | Names the board. |

Also accepts all `<div>` props. `KanbanColumn` is `{ id, title, textValue?, tone?, limit? }`: `limit`
is a work-in-progress limit (the count reads `4 / 5` and turns to a warning above it) and
`textValue` names a column whose `title` is not a string. `KanbanMove` is
`{ itemId, fromColumnId, toColumnId, fromIndex, toIndex }`, where `toIndex` is the position among the
target column's items once the card is in it.

## Moving cards

- **Pointer.** Drag a card onto a column; a placeholder shows where it will land.
- **Keyboard.** Focus a card and press Space or Enter to pick it up. Left and Right move it between
  columns, Up and Down within one; each step calls `onMove`, so the card moves as you go. Space or
  Enter drops it; Escape puts it back where it started (with one more `onMove`); Tab drops it where
  it is. Keys pressed on a button or link inside a card are left to that control.

Every step is announced in an assertive live region: "Picked up …", "… moved to Proposal, position 2
of 3", "Dropped …", "Move cancelled".

## Accessibility

Each column is a `<section>` named by its `<h3>` title, with the count read as "3 items" or "4 of 5
allowed". Cards are focusable list items with `aria-roledescription="Draggable card"` and a
description of the keyboard controls when the board is movable. Headings are level 3; put the board
under an `h2`.

Classes: `.sui-kanban`, `__column` (`data-drop-target`), `__header`, `__tone`, `__title`, `__count`
(`data-over`), `__actions`, `__list`, `__card` (`--movable`, `data-dragging`, `data-grabbed`),
`__drop`, `__empty`. The board scrolls horizontally with columns at least 16rem wide.

## Related

- [Data view](./data-view.md): `FilterBar` above the board
- [Badge](./badge.md) and [Avatar](./avatar.md): card content
- [Data table](../data-table.md): the same records as a table
