import {
  MAX_BLOCKS,
  MAX_ROWS,
  allBlocks,
  cloneRowWithNewIds,
  countBlocks,
  createBlock,
  createRow,
  findBlock,
  findColumn,
  findRow,
  createSharedRowRef,
  hasFooter,
  insertBlock,
  insertRow,
  isSharedRowRef,
  moveBlock,
  moveRow,
  tableBlockFor,
  type Block,
  type BlockDesign,
  type BlockType,
  type DataSourceDefinition,
  type LayoutId,
  type Row,
} from '../design'
import { parsePaletteId } from './drop'
import type { ActionResult, Drop, EditorConstraints, Selection } from './types'

/** Why ``next`` breaks the limits of the editor it is in, or ``null``. The editor inside the
 * "Edit shared block" dialog is one row, and a shared block cannot hold another. */
export function constraintRefusal(
  next: BlockDesign,
  constraints: EditorConstraints = {},
): string | null {
  if (constraints.singleRow && next.rows.length !== 1) return 'A shared block is one row.'
  if (constraints.allowShared === false && next.rows.some(isSharedRowRef))
    return 'A saved row cannot contain a shared block.'
  return null
}

/** How many footers the email has once every shared block is expanded (a shared block placed
 * twice counts twice). More than one is a conflict the server refuses on save. */
export function footerCount(design: BlockDesign, resolve?: (ref: string) => Row | undefined) {
  const inRow = (row: Row) =>
    row.columns.reduce((sum, c) => sum + c.blocks.filter((b) => b.type === 'footer').length, 0)
  return design.rows.reduce((sum, row) => {
    if (!isSharedRowRef(row)) return sum + inRow(row)
    const found = resolve?.(row.ref)
    return sum + (found ? inRow(found) : 0)
  }, 0)
}

/** What the actions need to know about the editor around them. */
export interface ActionContext {
  /** The tables a new table block can show; without any, a table cannot be added. */
  dataSources?: DataSourceDefinition[]
  /** A shared block's row, for its footer (undefined while unknown). */
  resolveShared?: (ref: string) => Row | undefined
}

/** A new block of ``type``; a table starts from the first data source. ``null`` when it cannot
 * be made (a table with no data source). */
export function createBlockFor(
  type: BlockType,
  dataSources: DataSourceDefinition[] = [],
): Block | null {
  if (type === 'table') {
    const source = dataSources[0]
    return source ? tableBlockFor(source) : null
  }
  return createBlock(type)
}

/** Why a block of ``type`` cannot be added, or ``null``. */
export function blockRefusal(
  design: BlockDesign,
  type: BlockType,
  context: ActionContext = {},
): string | null {
  if (type === 'footer' && hasFooter(design, context.resolveShared))
    return 'An email can have only one footer.'
  if (type === 'table' && !context.dataSources?.length)
    return 'There is no data to show in a table yet.'
  if (countBlocks(design) >= MAX_BLOCKS) return `An email can have at most ${MAX_BLOCKS} blocks.`
  return null
}

function rowRefusal(design: BlockDesign, extraBlocks = 0): string | null {
  if (design.rows.length >= MAX_ROWS) return `An email can have at most ${MAX_ROWS} rows.`
  if (countBlocks(design) + extraBlocks > MAX_BLOCKS)
    return `An email can have at most ${MAX_BLOCKS} blocks.`
  return null
}

const blockSelection = (id: string): Selection => ({ kind: 'block', id })

/** The column and place a block added by click goes: after the selected block,
 * at the end of the selected column, or in a row's first column. ``null`` is a
 * new row at the end. */
export function insertionFor(
  design: BlockDesign,
  selection: Selection,
): { columnId: string; index: number } | null {
  if (!selection) return null
  if (selection.kind === 'block') {
    const found = findBlock(design, selection.id)
    return found ? { columnId: found.column.id, index: found.blockIndex + 1 } : null
  }
  if (selection.kind === 'column') {
    const found = findColumn(design, selection.id)
    return found ? { columnId: found.column.id, index: found.column.blocks.length } : null
  }
  const row = findRow(design, selection.id)
  // A shared block has no column of its own to add to.
  const first = row && !isSharedRowRef(row.row) ? row.row.columns[0] : undefined
  return first ? { columnId: first.id, index: first.blocks.length } : null
}

/** Where a layout or saved row added by click goes: after the row holding the selection. */
export function rowInsertionIndex(design: BlockDesign, selection: Selection): number {
  if (!selection) return design.rows.length
  if (selection.kind === 'row') {
    const row = findRow(design, selection.id)
    return row ? row.index + 1 : design.rows.length
  }
  if (selection.kind === 'column') {
    const column = findColumn(design, selection.id)
    return column ? column.rowIndex + 1 : design.rows.length
  }
  const block = findBlock(design, selection.id)
  return block ? block.rowIndex + 1 : design.rows.length
}

/** Add a new block of ``type`` after the selection (palette click or Enter). */
export function addBlock(
  design: BlockDesign,
  type: BlockType,
  selection: Selection,
  context: ActionContext = {},
): ActionResult {
  const refusal = blockRefusal(design, type, context)
  const block = refusal ? null : createBlockFor(type, context.dataSources)
  if (refusal || !block) return { design, notice: refusal ?? 'That block cannot be added.' }
  const where = insertionFor(design, selection)
  if (where) {
    return {
      design: insertBlock(design, block, where.columnId, where.index),
      selection: blockSelection(block.id),
    }
  }
  const row = rowRefusal(design)
  if (row) return { design, notice: row }
  return {
    // At the end, as before, unless a shared block is selected: it has no column to add to, so
    // the new row goes right after it.
    design: insertRow(
      design,
      createRow('100', [block]),
      selectedSharedRow(design, selection) ? rowInsertionIndex(design, selection) : undefined,
    ),
    selection: blockSelection(block.id),
  }
}

/** Whether the selection is the placeholder of a shared block. */
function selectedSharedRow(design: BlockDesign, selection: Selection): boolean {
  if (selection?.kind !== 'row') return false
  const found = findRow(design, selection.id)
  return found !== null && isSharedRowRef(found.row)
}

/** Add a new block at a place (a "+" insertion point). */
export function addBlockAt(
  design: BlockDesign,
  type: BlockType,
  columnId: string,
  index: number,
  context: ActionContext = {},
): ActionResult {
  const refusal = blockRefusal(design, type, context)
  const block = refusal ? null : createBlockFor(type, context.dataSources)
  if (refusal || !block) return { design, notice: refusal ?? 'That block cannot be added.' }
  return {
    design: insertBlock(design, block, columnId, index),
    selection: blockSelection(block.id),
  }
}

/** Add an empty row in ``layout`` after the selection's row. */
export function addLayout(
  design: BlockDesign,
  layout: LayoutId,
  selection: Selection,
): ActionResult {
  const refusal = rowRefusal(design)
  if (refusal) return { design, notice: refusal }
  const row = createRow(layout)
  return {
    design: insertRow(design, row, rowInsertionIndex(design, selection)),
    selection: { kind: 'row', id: row.id },
  }
}

/** Insert a copy of a saved row (new ids all through) at ``index``. A footer is
 * left out when the email already has one. */
export function insertSavedRow(
  design: BlockDesign,
  saved: Row,
  index: number,
  context: ActionContext = {},
): ActionResult {
  const copy = cloneRowWithNewIds(saved)
  let notice: string | undefined
  if (
    hasFooter(design, context.resolveShared) &&
    copy.columns.some((c) => c.blocks.some((b) => b.type === 'footer'))
  ) {
    copy.columns = copy.columns.map((column) => ({
      ...column,
      blocks: column.blocks.filter((block) => block.type !== 'footer'),
    }))
    notice = 'The email already has a footer, so the saved row was added without its footer.'
  }
  const added = copy.columns.reduce((sum, c) => sum + c.blocks.length, 0)
  const refusal = rowRefusal(design, added)
  if (refusal) return { design, notice: refusal }
  return {
    design: insertRow(design, copy, index),
    selection: { kind: 'row', id: copy.id },
    notice,
  }
}

/** Insert a placeholder for the shared block ``ref`` (whose content is ``row``) at ``index``.
 * Refused when the shared block has a footer and the email already has one. */
export function insertSharedRow(
  design: BlockDesign,
  ref: string,
  row: Row,
  index: number,
  context: ActionContext = {},
): ActionResult {
  const hasOwnFooter = row.columns.some((column) =>
    column.blocks.some((block) => block.type === 'footer'),
  )
  if (hasOwnFooter && hasFooter(design, context.resolveShared))
    return {
      design,
      notice: 'This shared block has a footer and the email already has one.',
    }
  const refusal = rowRefusal(design)
  if (refusal) return { design, notice: refusal }
  const placeholder = createSharedRowRef(ref)
  return {
    design: insertRow(design, placeholder, index),
    selection: { kind: 'row', id: placeholder.id },
  }
}

/** Apply a resolved drop of ``activeId``. ``savedRow`` finds a saved row by its palette id;
 * ``context.sharedRow`` does the same for a shared block. */
export function applyDrop(
  design: BlockDesign,
  activeId: string,
  drop: Drop,
  savedRow: (id: string) => Row | undefined,
  context: ActionContext & { sharedRow?: (id: string) => Row | undefined } = {},
): ActionResult {
  const palette = parsePaletteId(activeId)

  if (drop.kind === 'row') {
    if (!palette) return { design: moveRow(design, activeId, drop.index) }
    if (palette.kind === 'palette-layout') {
      const refusal = rowRefusal(design)
      if (refusal) return { design, notice: refusal }
      const row = createRow(palette.layout)
      return {
        design: insertRow(design, row, drop.index),
        selection: { kind: 'row', id: row.id },
      }
    }
    if (palette.kind === 'palette-saved') {
      const row = savedRow(palette.id)
      return row ? insertSavedRow(design, row, drop.index, context) : { design }
    }
    if (palette.kind === 'palette-shared') {
      const row = context.sharedRow?.(palette.id) ?? savedRow(palette.id)
      return row ? insertSharedRow(design, palette.id, row, drop.index, context) : { design }
    }
    return { design }
  }

  if (palette?.kind === 'palette-block') {
    const refusal = blockRefusal(design, palette.type, context)
    const block = refusal ? null : createBlockFor(palette.type, context.dataSources)
    if (refusal || !block) return { design, notice: refusal ?? 'That block cannot be added.' }
    if (drop.kind === 'block') {
      return {
        design: insertBlock(design, block, drop.columnId, drop.index),
        selection: blockSelection(block.id),
      }
    }
    const row = rowRefusal(design)
    if (row) return { design, notice: row }
    return {
      design: insertRow(design, createRow('100', [block]), drop.index),
      selection: blockSelection(block.id),
    }
  }

  const found = findBlock(design, activeId)
  if (!found) return { design }
  if (drop.kind === 'block') {
    return {
      design: moveBlock(design, activeId, { columnId: drop.columnId, index: drop.index }),
      selection: blockSelection(activeId),
      focusId: activeId,
    }
  }
  // A block dropped at the end of the email gets a row of its own.
  const row = rowRefusal(design)
  if (row && design.rows.length >= MAX_ROWS) return { design, notice: row }
  const without = {
    ...design,
    rows: design.rows.map((r) =>
      isSharedRowRef(r)
        ? r
        : {
            ...r,
            columns: r.columns.map((c) => ({
              ...c,
              blocks: c.blocks.filter((b) => b.id !== activeId),
            })),
          },
    ),
  }
  return {
    design: insertRow(without, createRow('100', [found.block]), drop.index),
    selection: blockSelection(activeId),
    focusId: activeId,
  }
}

/** Move a block up or down within its column. Unchanged at the edge. */
export function nudgeBlock(design: BlockDesign, id: string, delta: -1 | 1): BlockDesign {
  const found = findBlock(design, id)
  if (!found) return design
  const to = found.blockIndex + delta
  if (to < 0 || to >= found.column.blocks.length) return design
  return moveBlock(design, id, { columnId: found.column.id, index: to })
}

/** Move a block into the neighbouring column of its row, keeping its place as near as it can. */
export function nudgeBlockSideways(design: BlockDesign, id: string, delta: -1 | 1): BlockDesign {
  const found = findBlock(design, id)
  if (!found) return design
  const target = found.row.columns[found.columnIndex + delta]
  if (!target) return design
  return moveBlock(design, id, {
    columnId: target.id,
    index: Math.min(found.blockIndex, target.blocks.length),
  })
}

/** Move a row up or down. Unchanged at the edge. */
export function nudgeRow(design: BlockDesign, id: string, delta: -1 | 1): BlockDesign {
  const found = findRow(design, id)
  if (!found) return design
  const to = found.index + delta
  if (to < 0 || to >= design.rows.length) return design
  return moveRow(design, id, to)
}

/** The block to select after ``id`` is removed: the next in its column, else the previous. */
export function neighbourOf(design: BlockDesign, id: string): string | null {
  const found = findBlock(design, id)
  if (!found) return null
  return (
    (found.column.blocks[found.blockIndex + 1] ?? found.column.blocks[found.blockIndex - 1])?.id ??
    null
  )
}

export { allBlocks }
