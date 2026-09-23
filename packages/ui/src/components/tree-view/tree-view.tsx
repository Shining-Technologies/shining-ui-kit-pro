'use client'

import {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/cn'
import { ChevronRightIcon } from '../icons/icons'

export interface TreeNode {
  /** Unique across the whole tree. */
  id: string
  label: ReactNode
  /** The text type-ahead matches. Defaults to `label` when that is a string. */
  textValue?: string
  /** A glyph before the label — a folder, a file, a team. */
  icon?: ReactNode
  /** Child nodes. An empty array is a parent with nothing in it yet. */
  children?: TreeNode[]
  disabled?: boolean
}

export interface TreeViewProps
  extends Omit<HTMLAttributes<HTMLUListElement>, 'onSelect' | 'defaultValue'> {
  items: TreeNode[]
  /** Ids of the open parents, controlled. */
  expanded?: string[]
  defaultExpanded?: string[]
  onExpandedChange?: (expanded: string[]) => void
  /** Ids of the selected nodes, controlled. At most one in `'single'` mode. */
  selected?: string[]
  defaultSelected?: string[]
  onSelectedChange?: (selected: string[]) => void
  /** `'single'` (the default), `'multiple'`, or `'none'` for a tree that only navigates. */
  selectionMode?: 'single' | 'multiple' | 'none'
  /** Called when a node is activated: clicked, or Enter pressed on it. */
  onAction?: (node: TreeNode) => void
  /** The tree's name. Required unless `aria-labelledby` names it. */
  'aria-label'?: string
}

interface VisibleNode {
  node: TreeNode
  level: number
  parentId: string | null
}

const textOf = (node: TreeNode) =>
  (node.textValue ?? (typeof node.label === 'string' ? node.label : '')).toLowerCase()

const isParent = (node: TreeNode) => Array.isArray(node.children)

/**
 * A hierarchy to browse and pick from: folders, an org chart, categories, a
 * chart of accounts.
 *
 * It follows the WAI-ARIA tree pattern. The tree is one tab stop; Up and Down
 * move through the visible nodes, Right opens a parent (then steps into it),
 * Left closes it (or steps out to the parent), Home and End jump to the ends,
 * and typing a letter moves to the next node that starts with it. Enter or
 * Space selects; in `'multiple'` mode they toggle.
 */
export const TreeView = forwardRef<HTMLUListElement, TreeViewProps>(function TreeView(
  {
    className,
    items,
    expanded: expandedProp,
    defaultExpanded = [],
    onExpandedChange,
    selected: selectedProp,
    defaultSelected = [],
    onSelectedChange,
    selectionMode = 'single',
    onAction,
    onKeyDown,
    ...props
  },
  ref,
) {
  const [expanded, setExpanded] = useControllableState({
    value: expandedProp,
    defaultValue: defaultExpanded,
    onChange: onExpandedChange,
  })
  const [selected, setSelected] = useControllableState({
    value: selectedProp,
    defaultValue: defaultSelected,
    onChange: onSelectedChange,
  })
  const open = useMemo(() => new Set(expanded), [expanded])
  const chosen = useMemo(() => new Set(selected), [selected])

  // The nodes a user can currently reach, in reading order.
  const visible = useMemo(() => {
    const list: VisibleNode[] = []
    const walk = (nodes: TreeNode[], level: number, parentId: string | null) => {
      nodes.forEach((node) => {
        list.push({ node, level, parentId })
        if (node.children && open.has(node.id)) walk(node.children, level + 1, node.id)
      })
    }
    walk(items, 1, null)
    return list
  }, [items, open])

  const [focusedId, setFocusedId] = useState<string | null>(null)
  // The tab stop: the focused node while it is still visible, else the first
  // selected visible node, else the first node.
  const tabStop =
    visible.find((entry) => entry.node.id === focusedId)?.node.id ??
    visible.find((entry) => chosen.has(entry.node.id))?.node.id ??
    visible[0]?.node.id

  const elements = useRef(new Map<string, HTMLLIElement>())
  const typeahead = useRef({ text: '', at: 0 })

  const focusNode = useCallback((id: string | undefined) => {
    if (!id) return
    setFocusedId(id)
    elements.current.get(id)?.focus()
  }, [])

  const toggle = (id: string, force?: boolean) => {
    const isOpen = open.has(id)
    const next = force ?? !isOpen
    if (next === isOpen) return
    setExpanded(next ? [...expanded, id] : expanded.filter((value) => value !== id))
  }

  const select = (node: TreeNode) => {
    if (node.disabled || selectionMode === 'none') return
    if (selectionMode === 'single') setSelected(chosen.has(node.id) ? selected : [node.id])
    else
      setSelected(
        chosen.has(node.id) ? selected.filter((id) => id !== node.id) : [...selected, node.id],
      )
  }

  const activate = (node: TreeNode) => {
    if (node.disabled) return
    select(node)
    onAction?.(node)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    const index = visible.findIndex((entry) => entry.node.id === tabStop)
    const current = visible[index]
    if (!current) return
    const { node } = current

    switch (event.key) {
      case 'ArrowDown':
        focusNode(visible[index + 1]?.node.id)
        break
      case 'ArrowUp':
        focusNode(visible[index - 1]?.node.id)
        break
      case 'Home':
        focusNode(visible[0]?.node.id)
        break
      case 'End':
        focusNode(visible[visible.length - 1]?.node.id)
        break
      case 'ArrowRight':
        if (!isParent(node) || node.disabled) break
        if (!open.has(node.id)) toggle(node.id, true)
        else focusNode(node.children?.[0]?.id)
        break
      case 'ArrowLeft':
        if (isParent(node) && open.has(node.id) && !node.disabled) toggle(node.id, false)
        else focusNode(current.parentId ?? undefined)
        break
      case 'Enter':
        activate(node)
        break
      case ' ':
        select(node)
        break
      default: {
        if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return
        const now = Date.now()
        const buffer = now - typeahead.current.at < 600 ? typeahead.current.text : ''
        const text = buffer + event.key.toLowerCase()
        typeahead.current = { text, at: now }
        // A repeated single letter cycles; a word searches from the current node.
        const start = text.length === 1 ? index + 1 : index
        const ordered = [...visible.slice(start), ...visible.slice(0, start)]
        const match = ordered.find((entry) => textOf(entry.node).startsWith(text))
        if (match) focusNode(match.node.id)
        else return
      }
    }
    event.preventDefault()
  }

  const renderNodes = (nodes: TreeNode[], level: number): ReactNode =>
    nodes.map((node, index) => {
      const parent = isParent(node)
      const isOpen = parent && open.has(node.id)
      return (
        <li
          key={node.id}
          ref={(element) => {
            if (element) elements.current.set(node.id, element)
            else elements.current.delete(node.id)
          }}
          role="treeitem"
          data-slot="tree-item"
          aria-level={level}
          aria-setsize={nodes.length}
          aria-posinset={index + 1}
          aria-expanded={parent ? isOpen : undefined}
          aria-selected={selectionMode === 'none' ? undefined : chosen.has(node.id)}
          aria-disabled={node.disabled || undefined}
          tabIndex={node.id === tabStop ? 0 : -1}
          className="sui-tree__item"
          onFocus={(event) => {
            // Focus lands on the innermost item only; its ancestors see it bubble.
            if (event.target === event.currentTarget) setFocusedId(node.id)
          }}
        >
          <div
            className="sui-tree__row"
            style={{ '--sui-tree-level': level - 1 } as CSSProperties}
            onClick={() => {
              focusNode(node.id)
              activate(node)
            }}
          >
            {parent ? (
              <span
                className="sui-tree__toggle"
                aria-hidden="true"
                onClick={(event) => {
                  event.stopPropagation()
                  focusNode(node.id)
                  if (!node.disabled) toggle(node.id)
                }}
              >
                <ChevronRightIcon />
              </span>
            ) : (
              <span className="sui-tree__spacer" aria-hidden="true" />
            )}
            {node.icon ? (
              <span className="sui-tree__icon" aria-hidden="true">
                {node.icon}
              </span>
            ) : null}
            <span className="sui-tree__label">{node.label}</span>
          </div>
          {parent && isOpen && node.children!.length > 0 ? (
            <ul role="group" className="sui-tree__group">
              {renderNodes(node.children!, level + 1)}
            </ul>
          ) : null}
        </li>
      )
    })

  return (
    <ul
      ref={ref}
      role="tree"
      data-slot="tree-view"
      aria-multiselectable={selectionMode === 'multiple' || undefined}
      className={cn('sui-tree', className)}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {renderNodes(items, 1)}
    </ul>
  )
})
