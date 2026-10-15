import {
  BLOCK_TYPES,
  ROW_LAYOUTS,
  findBlock,
  findColumn,
  findRow,
  type BlockDesign,
  type BlockType,
  type LayoutId,
} from '../design'
import type { DropResolution, PaletteItem } from './types'

export const PALETTE_PREFIX = 'palette:'
export const CANVAS_END = 'canvas-end'

export const paletteId = {
  block: (type: BlockType) => `${PALETTE_PREFIX}block:${type}`,
  layout: (layout: LayoutId) => `${PALETTE_PREFIX}layout:${layout}`,
  saved: (id: string | number) => `${PALETTE_PREFIX}saved:${id}`,
}

export function parsePaletteId(id: string): PaletteItem | null {
  if (!id.startsWith(PALETTE_PREFIX)) return null
  const [, kind, ...rest] = id.split(':')
  const value = rest.join(':')
  if (kind === 'block' && (BLOCK_TYPES as readonly string[]).includes(value))
    return { kind: 'palette-block', type: value as BlockType }
  if (kind === 'layout' && ROW_LAYOUTS.some((layout) => layout.id === value))
    return { kind: 'palette-layout', layout: value as LayoutId }
  if (kind === 'saved' && value) return { kind: 'palette-saved', id: value }
  return null
}

/** The row an id belongs to (a row, one of its columns, or one of its blocks). */
function rowIndexOf(design: BlockDesign, id: string): number {
  const row = findRow(design, id)
  if (row) return row.index
  const column = findColumn(design, id)
  if (column) return column.rowIndex
  const block = findBlock(design, id)
  return block ? block.rowIndex : -1
}

/**
 * Where dropping ``activeId`` over ``overId`` would put it, and the line to
 * draw. ``after`` is whether the dragged item's centre is past the middle of
 * the item it is over. Pure, so the canvas, the drop and the tests agree.
 */
export function resolveDrop(
  design: BlockDesign,
  activeId: string,
  overId: string | null,
  after: boolean,
): DropResolution | null {
  if (!overId) return null
  const palette = parsePaletteId(activeId)
  const isRow = !palette && findRow(design, activeId) !== null
  const isBlock = !palette ? findBlock(design, activeId) !== null : palette.kind === 'palette-block'

  if (isRow || palette?.kind === 'palette-layout' || palette?.kind === 'palette-saved') {
    if (overId === CANVAS_END) {
      const index = design.rows.length - (isRow ? 1 : 0)
      return { drop: { kind: 'row', index }, hint: { id: CANVAS_END, position: 'inside' } }
    }
    const rowIndex = rowIndexOf(design, overId)
    if (rowIndex < 0) return null
    const rowId = design.rows[rowIndex]!.id
    if (isRow) {
      const from = design.rows.findIndex((row) => row.id === activeId)
      if (from === rowIndex) return null
      return {
        drop: { kind: 'row', index: rowIndex },
        hint: { id: rowId, position: from < rowIndex ? 'after' : 'before' },
      }
    }
    return {
      drop: { kind: 'row', index: rowIndex + (after ? 1 : 0) },
      hint: { id: rowId, position: after ? 'after' : 'before' },
    }
  }

  if (!isBlock) return null
  if (overId === CANVAS_END) {
    return {
      drop: { kind: 'new-row-block', index: design.rows.length },
      hint: { id: CANVAS_END, position: 'inside' },
    }
  }
  const over = findBlock(design, overId)
  if (over) {
    const active = findBlock(design, activeId)
    if (active && active.block.id === over.block.id) return null
    // Indexes are counted once the dragged block has left its old place.
    const shift =
      active && active.column.id === over.column.id && active.blockIndex < over.blockIndex ? 1 : 0
    const index = over.blockIndex - shift + (after ? 1 : 0)
    return {
      drop: { kind: 'block', columnId: over.column.id, index },
      hint: { id: over.block.id, position: after ? 'after' : 'before' },
    }
  }
  const column = findColumn(design, overId)
  if (column) {
    return {
      drop: { kind: 'block', columnId: column.column.id, index: column.column.blocks.length },
      hint: { id: column.column.id, position: 'inside' },
    }
  }
  return null
}
