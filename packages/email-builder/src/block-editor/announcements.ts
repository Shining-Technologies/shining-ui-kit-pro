import type { Announcements, UniqueIdentifier } from '@dnd-kit/core'
import { ROW_LAYOUTS, findBlock, findColumn, findRow, type BlockDesign } from '../design'
import { blockLabel, blockSummary } from './blocks'
import { CANVAS_END, parsePaletteId } from './drop'

/**
 * What the screen reader says while something is dragged. dnd-kit's default
 * reads out raw ids; these name the thing in the editor's own words instead:
 * "Picked up Heading block.", "… is over position 2 in column 1 of row 3.".
 */
/** An item in the editor's own words: "Heading block “Welcome”", "Row 2". */
export function describeItem(
  design: BlockDesign,
  id: UniqueIdentifier,
  savedName: (id: string) => string | undefined = () => undefined,
): string {
  const key = String(id)
  const palette = parsePaletteId(key)
  if (palette?.kind === 'palette-block') return `${blockLabel(palette.type)} block`
  if (palette?.kind === 'palette-layout') {
    const layout = ROW_LAYOUTS.find((l) => l.id === palette.layout)
    return `${layout ? layout.label.replace(/ /g, '') : ''} row layout`.trim()
  }
  if (palette?.kind === 'palette-saved') {
    const name = savedName(palette.id)
    return name ? `Saved row “${name}”` : 'Saved row'
  }
  const block = findBlock(design, key)
  if (block) {
    const summary = blockSummary(block.block)
    return `${blockLabel(block.block.type)} block${summary ? ` “${summary}”` : ''}`
  }
  const row = findRow(design, key)
  if (row) return `Row ${row.index + 1}`
  return 'Item'
}

/** Where an item is: "position 2 in column 1 of row 3", or ``null``. */
export function describePlace(
  design: BlockDesign,
  id: UniqueIdentifier | undefined,
): string | null {
  if (id === undefined) return null
  const key = String(id)
  if (key === CANVAS_END) return 'the end of the email'
  const block = findBlock(design, key)
  if (block) {
    return `position ${block.blockIndex + 1} in column ${block.columnIndex + 1} of row ${block.rowIndex + 1}`
  }
  const column = findColumn(design, key)
  if (column) return `the end of column ${column.columnIndex + 1} of row ${column.rowIndex + 1}`
  const row = findRow(design, key)
  if (row) return `row ${row.index + 1}`
  return null
}

/**
 * What the screen reader says while something is dragged. dnd-kit's default
 * reads out raw ids; these name the thing in the editor's own words instead:
 * "Picked up Heading block.", "… is over position 2 in column 1 of row 3.".
 */
export function buildAnnouncements(
  design: BlockDesign,
  savedName: (id: string) => string | undefined = () => undefined,
): Announcements {
  const describe = (id: UniqueIdentifier) => describeItem(design, id, savedName)
  const where = (id: UniqueIdentifier | undefined) => describePlace(design, id)

  return {
    onDragStart: ({ active }) => `Picked up ${describe(active.id)}.`,
    onDragOver: ({ active, over }) => {
      const place = where(over?.id)
      return place
        ? `${describe(active.id)} is over ${place}.`
        : `${describe(active.id)} is not over a drop area.`
    },
    onDragEnd: ({ active, over }) => {
      const place = where(over?.id)
      if (!place) return `${describe(active.id)} was dropped outside the email.`
      return parsePaletteId(String(active.id))
        ? `Added ${describe(active.id)} at ${place}.`
        : `Moved ${describe(active.id)} to ${place}.`
    },
    onDragCancel: ({ active }) => `Cancelled. ${describe(active.id)} was not moved.`,
  }
}
