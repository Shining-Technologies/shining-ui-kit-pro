# Tree view

A hierarchy to browse and pick from: folders, an organisation chart, product categories, a chart of
accounts.

```tsx
import { TreeView, type TreeNode } from '@shining-technologies/ui'
// or: from '@shining-technologies/ui/tree-view'
```

**Server and client.** `TreeView` is a client component (`'use client'`).

Exported types: `TreeViewProps`, `TreeNode`.

## Usage

```tsx
'use client'

import { FileIcon, FolderIcon, TreeView, type TreeNode } from '@shining-technologies/ui'
import { useState } from 'react'

const accounts: TreeNode[] = [
  {
    id: '1000',
    label: 'Assets',
    icon: <FolderIcon />,
    children: [
      { id: '1110', label: 'Cash at bank', icon: <FileIcon /> },
      { id: '1120', label: 'Accounts receivable', icon: <FileIcon /> },
    ],
  },
  { id: '9000', label: 'Suspense', icon: <FileIcon />, disabled: true },
]

export function Accounts() {
  const [selected, setSelected] = useState<string[]>([])
  return (
    <TreeView
      aria-label="Chart of accounts"
      items={accounts}
      defaultExpanded={['1000']}
      selected={selected}
      onSelectedChange={setSelected}
    />
  )
}
```

## Props

| Prop               | Type                                  | Default    | Description |
| ------------------ | ------------------------------------- | ---------- | ----------- |
| `items`            | `TreeNode[]`                          | —          | Required. The top-level nodes. |
| `expanded`         | `string[]`                            | —          | Ids of the open parents, controlled. |
| `defaultExpanded`  | `string[]`                            | `[]`       | Uncontrolled. |
| `onExpandedChange` | `(expanded: string[]) => void`        | —          | |
| `selected`         | `string[]`                            | —          | Ids of the selected nodes, controlled. At most one in `'single'` mode. |
| `defaultSelected`  | `string[]`                            | `[]`       | Uncontrolled. |
| `onSelectedChange` | `(selected: string[]) => void`        | —          | |
| `selectionMode`    | `'single' \| 'multiple' \| 'none'`    | `'single'` | `multiple` toggles each node; `none` only navigates. |
| `onAction`         | `(node: TreeNode) => void`            | —          | A node was clicked or Enter was pressed on it: open it, navigate to it. |
| `aria-label`       | `string`                              | —          | Names the tree. Required unless `aria-labelledby` does. |

Also accepts all `<ul>` props. `TreeNode` is `{ id, label, textValue?, icon?, children?, disabled? }`:
`id` must be unique in the whole tree, `children` (even an empty array) makes a node a parent, and
`textValue` is what type-ahead matches when `label` is not a string.

## Keyboard

The tree is one tab stop (the focused node, else the first selected one, else the first).

| Key            | Action |
| -------------- | ------ |
| Down / Up      | Next / previous visible node |
| Right          | Open a closed parent; on an open one, move to its first child |
| Left           | Close an open parent; otherwise move to the parent |
| Home / End     | First / last visible node |
| Enter          | Select and activate (`onAction`) |
| Space          | Select (toggle in `multiple` mode) |
| A letter       | The next node whose text starts with it; type quickly to match a word |

## Accessibility

It follows the WAI-ARIA tree pattern: `role="tree"` (with `aria-multiselectable` in multiple mode),
`role="treeitem"` with `aria-level`, `aria-setsize`, `aria-posinset`, `aria-expanded` on parents,
`aria-selected` unless the mode is `none`, and `aria-disabled`; children sit in a `role="group"`.
The focus ring is drawn on the row, not around the node's children. Icons are `aria-hidden`.

Classes: `.sui-tree`, `.sui-tree__item`, `__row` (indented by `--sui-tree-level`), `__toggle`,
`__icon`, `__label`, `__group`.

## Related

- [Navigation](./navigation.md): `VerticalNav` for a short, flat set of links
- [Sidebar](./sidebar.md): the application's own navigation tree
