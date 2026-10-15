import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { describe, expect, it } from 'vitest'
import {
  addBlock,
  addLayout,
  applyDrop,
  insertSavedRow,
  neighbourOf,
  nudgeBlock,
  nudgeBlockSideways,
  nudgeRow,
} from '../block-editor/actions'
import { buildAnnouncements } from '../block-editor/announcements'
import { CANVAS_END, paletteId, parsePaletteId, resolveDrop } from '../block-editor/drop'
import { shortcutFor } from '../block-editor/history'
import {
  allBlocks,
  blockDesignErrors,
  createBlock,
  createRow,
  emptyBlockDesign,
  findBlock,
  type BlockDesign,
} from '../design'

/** Row 1: [heading, text] | [button]. Row 2: [divider]. */
function fixture(): BlockDesign {
  const first = createRow('50-50')
  first.id = 'r_1'
  first.columns[0]!.id = 'c_1'
  first.columns[1]!.id = 'c_2'
  first.columns[0]!.blocks = [createBlock('heading', 'b_h'), createBlock('text', 'b_t')]
  first.columns[1]!.blocks = [createBlock('button', 'b_btn')]
  const second = createRow('100', [createBlock('divider', 'b_d')])
  second.id = 'r_2'
  second.columns[0]!.id = 'c_3'
  return { ...emptyBlockDesign(), rows: [first, second] }
}

const sel = (kind: 'row' | 'column' | 'block', id: string) => ({ kind, id }) as const

describe('announcements', () => {
  const say = buildAnnouncements(fixture(), (id) => (id === '7' ? 'Signature' : undefined))
  const start = (id: string) => say.onDragStart!({ active: { id } } as DragStartEvent) as string
  const over = (id: string, to?: string) =>
    say.onDragOver!({
      active: { id },
      over: to ? { id: to } : null,
    } as unknown as DragOverEvent) as string
  const end = (id: string, to?: string) =>
    say.onDragEnd!({
      active: { id },
      over: to ? { id: to } : null,
    } as unknown as DragEndEvent) as string

  it('names what is picked up in plain words, never the raw id', () => {
    expect(start(paletteId.block('heading'))).toBe('Picked up Heading block.')
    expect(start(paletteId.block('avatar'))).toBe('Picked up Avatar block.')
    expect(start(paletteId.layout('33-67'))).toBe('Picked up 33/67 row layout.')
    expect(start(paletteId.saved(7))).toBe('Picked up Saved row “Signature”.')
    expect(start('b_h')).toBe('Picked up Heading block “Heading”.')
    expect(start('r_2')).toBe('Picked up Row 2.')
    expect(start('b_h')).not.toContain('b_h')
  })

  it('says where it is, in rows, columns and positions', () => {
    expect(over(paletteId.block('text'), 'b_t')).toBe(
      'Text block is over position 2 in column 1 of row 1.',
    )
    expect(over('b_h', 'b_btn')).toBe(
      'Heading block “Heading” is over position 1 in column 2 of row 1.',
    )
    expect(over('b_h', 'c_2')).toBe('Heading block “Heading” is over the end of column 2 of row 1.')
    expect(over('r_1', 'r_2')).toBe('Row 1 is over row 2.')
    expect(over(paletteId.layout('100'), CANVAS_END)).toBe(
      '100 row layout is over the end of the email.',
    )
    expect(over('b_h')).toBe('Heading block “Heading” is not over a drop area.')
  })

  it('says what happened', () => {
    expect(end(paletteId.block('divider'), 'c_3')).toBe(
      'Added Divider block at the end of column 1 of row 2.',
    )
    expect(end('b_h', 'b_d')).toBe(
      'Moved Heading block “Heading” to position 1 in column 1 of row 2.',
    )
    expect(end('b_h')).toBe('Heading block “Heading” was dropped outside the email.')
    expect(say.onDragCancel!({ active: { id: 'b_h' } } as never)).toBe(
      'Cancelled. Heading block “Heading” was not moved.',
    )
  })
})

describe('palette ids', () => {
  it('round-trips', () => {
    expect(parsePaletteId(paletteId.block('video'))).toEqual({
      kind: 'palette-block',
      type: 'video',
    })
    expect(parsePaletteId(paletteId.layout('67-33'))).toEqual({
      kind: 'palette-layout',
      layout: '67-33',
    })
    expect(parsePaletteId(paletteId.saved(12))).toEqual({ kind: 'palette-saved', id: '12' })
    expect(parsePaletteId('b_h')).toBeNull()
    expect(parsePaletteId('palette:block:carousel')).toBeNull()
  })
})

describe('where a drop lands', () => {
  const d = fixture()

  it('puts a palette block before or after the block it is over', () => {
    expect(resolveDrop(d, paletteId.block('spacer'), 'b_t', false)).toEqual({
      drop: { kind: 'block', columnId: 'c_1', index: 1 },
      hint: { id: 'b_t', position: 'before' },
    })
    expect(resolveDrop(d, paletteId.block('spacer'), 'b_t', true)!.drop).toEqual({
      kind: 'block',
      columnId: 'c_1',
      index: 2,
    })
  })

  it('puts a block at the end of the column it is over', () => {
    expect(resolveDrop(d, paletteId.block('spacer'), 'c_2', false)).toEqual({
      drop: { kind: 'block', columnId: 'c_2', index: 1 },
      hint: { id: 'c_2', position: 'inside' },
    })
  })

  it('counts an index after the dragged block has left its column', () => {
    // b_h (index 0) dropped after b_t (index 1): ends up at index 1.
    expect(resolveDrop(d, 'b_h', 'b_t', true)!.drop).toEqual({
      kind: 'block',
      columnId: 'c_1',
      index: 1,
    })
    expect(resolveDrop(d, 'b_h', 'b_t', false)!.drop).toEqual({
      kind: 'block',
      columnId: 'c_1',
      index: 0,
    })
    // b_t dropped before b_h: index 0.
    expect(resolveDrop(d, 'b_t', 'b_h', false)!.drop).toEqual({
      kind: 'block',
      columnId: 'c_1',
      index: 0,
    })
    expect(resolveDrop(d, 'b_h', 'b_h', false)).toBeNull()
  })

  it('applies a move within and across columns', () => {
    const within = applyDrop(d, 'b_h', resolveDrop(d, 'b_h', 'b_t', true)!.drop, () => undefined)
    expect(within.design.rows[0]!.columns[0]!.blocks.map((b) => b.id)).toEqual(['b_t', 'b_h'])
    const across = applyDrop(d, 'b_h', resolveDrop(d, 'b_h', 'b_btn', false)!.drop, () => undefined)
    expect(across.design.rows[0]!.columns[1]!.blocks.map((b) => b.id)).toEqual(['b_h', 'b_btn'])
    expect(allBlocks(across.design)).toHaveLength(4)
  })

  it('gives a block dropped at the end of the email a row of its own', () => {
    const drop = resolveDrop(d, 'b_h', CANVAS_END, false)!.drop
    expect(drop).toEqual({ kind: 'new-row-block', index: 2 })
    const next = applyDrop(d, 'b_h', drop, () => undefined).design
    expect(next.rows).toHaveLength(3)
    expect(next.rows[2]!.columns[0]!.blocks.map((b) => b.id)).toEqual(['b_h'])
    expect(allBlocks(next)).toHaveLength(4)
    expect(blockDesignErrors(next)).toEqual([])
  })

  it('adds a palette block, and a layout as a new row', () => {
    const block = applyDrop(
      d,
      paletteId.block('spacer'),
      resolveDrop(d, paletteId.block('spacer'), 'b_t', true)!.drop,
      () => undefined,
    )
    expect(block.design.rows[0]!.columns[0]!.blocks[2]!.type).toBe('spacer')
    expect(block.selection).toMatchObject({ kind: 'block' })
    const layout = resolveDrop(d, paletteId.layout('33-34-33'), 'r_1', true)!
    expect(layout.drop).toEqual({ kind: 'row', index: 1 })
    const row = applyDrop(d, paletteId.layout('33-34-33'), layout.drop, () => undefined)
    expect(row.design.rows.map((r) => r.columns.length)).toEqual([2, 3, 1])
    // Over a block of row 2 it lands before that row.
    expect(resolveDrop(d, paletteId.layout('100'), 'b_d', false)!.drop).toEqual({
      kind: 'row',
      index: 1,
    })
    expect(resolveDrop(d, paletteId.layout('100'), CANVAS_END, false)!.drop).toEqual({
      kind: 'row',
      index: 2,
    })
  })

  it('moves a row', () => {
    const drop = resolveDrop(d, 'r_1', 'r_2', true)!
    expect(drop.drop).toEqual({ kind: 'row', index: 1 })
    expect(drop.hint).toEqual({ id: 'r_2', position: 'after' })
    expect(applyDrop(d, 'r_1', drop.drop, () => undefined).design.rows.map((r) => r.id)).toEqual([
      'r_2',
      'r_1',
    ])
    expect(resolveDrop(d, 'r_1', CANVAS_END, false)!.drop).toEqual({ kind: 'row', index: 1 })
    expect(resolveDrop(d, 'r_1', 'r_1', false)).toBeNull()
  })

  it('ignores what cannot land there', () => {
    expect(resolveDrop(d, paletteId.block('spacer'), null, false)).toBeNull()
    expect(resolveDrop(d, paletteId.block('spacer'), 'r_1', false)).toBeNull()
    expect(resolveDrop(d, 'r_1', 'nope', false)).toBeNull()
  })

  it('inserts a dropped saved row with new ids', () => {
    const saved = createRow('50-50', [createBlock('heading', 'b_sv')])
    const drop = resolveDrop(d, paletteId.saved(3), 'r_2', false)!.drop
    const next = applyDrop(d, paletteId.saved(3), drop, (id) =>
      id === '3' ? saved : undefined,
    ).design
    expect(next.rows).toHaveLength(3)
    expect(next.rows[1]!.id).not.toBe(saved.id)
    expect(findBlock(next, 'b_sv')).toBeNull()
  })
})

describe('click-add and limits', () => {
  it('adds after the selected block, at the end of a column, or in a new row', () => {
    const d = fixture()
    const after = addBlock(d, 'spacer', sel('block', 'b_h'))
    expect(after.design.rows[0]!.columns[0]!.blocks.map((b) => b.type)).toEqual([
      'heading',
      'spacer',
      'text',
    ])
    const column = addBlock(d, 'spacer', sel('column', 'c_2'))
    expect(column.design.rows[0]!.columns[1]!.blocks.map((b) => b.type)).toEqual([
      'button',
      'spacer',
    ])
    const row = addBlock(d, 'spacer', sel('row', 'r_2'))
    expect(row.design.rows[1]!.columns[0]!.blocks.map((b) => b.type)).toEqual(['divider', 'spacer'])
    const none = addBlock(d, 'spacer', null)
    expect(none.design.rows).toHaveLength(3)
    expect(none.selection).toMatchObject({ kind: 'block' })
  })

  it('adds a layout after the row holding the selection', () => {
    const d = fixture()
    expect(
      addLayout(d, '33-67', sel('block', 'b_h')).design.rows.map((r) => r.columns.length),
    ).toEqual([2, 2, 1])
    expect(addLayout(d, '100', null).design.rows).toHaveLength(3)
  })

  it('refuses a second footer, too many blocks and too many rows', () => {
    const d = addBlock(fixture(), 'footer', null).design
    const again = addBlock(d, 'footer', null)
    expect(again.design).toBe(d)
    expect(again.notice).toMatch(/only one footer/)
    const many = {
      ...emptyBlockDesign(),
      rows: [
        createRow(
          '100',
          Array.from({ length: 300 }, () => createBlock('spacer')),
        ),
      ],
    }
    expect(addBlock(many, 'text', null).notice).toMatch(/300 blocks/)
    const rows = { ...emptyBlockDesign(), rows: Array.from({ length: 50 }, () => createRow('100')) }
    expect(addLayout(rows, '100', null).notice).toMatch(/50 rows/)
  })

  it('leaves a saved row’s footer out when the email has one', () => {
    const d = addBlock(fixture(), 'footer', null).design
    const saved = createRow('100', [createBlock('footer'), createBlock('text')])
    const result = insertSavedRow(d, saved, 0)
    expect(result.notice).toMatch(/already has a footer/)
    expect(allBlocks(result.design).filter((b) => b.type === 'footer')).toHaveLength(1)
    expect(blockDesignErrors(result.design)).toEqual([])
  })
})

describe('keyboard moves', () => {
  it('nudges a block within its column and stops at the edges', () => {
    const d = fixture()
    expect(nudgeBlock(d, 'b_h', 1).rows[0]!.columns[0]!.blocks.map((b) => b.id)).toEqual([
      'b_t',
      'b_h',
    ])
    expect(nudgeBlock(d, 'b_h', -1)).toBe(d)
    expect(nudgeBlock(d, 'b_t', 1)).toBe(d)
  })

  it('nudges a block into the neighbouring column, and a row up or down', () => {
    const d = fixture()
    const right = nudgeBlockSideways(d, 'b_t', 1)
    expect(right.rows[0]!.columns[1]!.blocks.map((b) => b.id)).toEqual([
      'b_btn',
      't'.length ? 'b_t' : '',
    ])
    expect(nudgeBlockSideways(d, 'b_t', -1)).toBe(d)
    expect(nudgeRow(d, 'r_1', 1).rows.map((r) => r.id)).toEqual(['r_2', 'r_1'])
    expect(nudgeRow(d, 'r_1', -1)).toBe(d)
  })

  it('picks a neighbour to select after a delete', () => {
    const d = fixture()
    expect(neighbourOf(d, 'b_h')).toBe('b_t')
    expect(neighbourOf(d, 'b_t')).toBe('b_h')
    expect(neighbourOf(d, 'b_d')).toBeNull()
  })
})

describe('undo and redo shortcuts', () => {
  const key = (init: KeyboardEventInit, target?: HTMLElement) => {
    const event = new KeyboardEvent('keydown', { bubbles: true, ...init })
    Object.defineProperty(event, 'target', { value: target ?? document.body })
    return shortcutFor(event)
  }
  it('maps Cmd/Ctrl+Z, Shift+Z and Y', () => {
    expect(key({ key: 'z', ctrlKey: true })).toBe('undo')
    expect(key({ key: 'z', metaKey: true })).toBe('undo')
    expect(key({ key: 'Z', ctrlKey: true, shiftKey: true })).toBe('redo')
    expect(key({ key: 'y', ctrlKey: true })).toBe('redo')
    expect(key({ key: 'z' })).toBeNull()
    expect(key({ key: 'z', ctrlKey: true, altKey: true })).toBeNull()
  })
  it('skips inputs, textareas, selects and editable text', () => {
    const make = (html: string) => {
      const host = document.createElement('div')
      host.innerHTML = html
      document.body.appendChild(host)
      return host.firstElementChild as HTMLElement
    }
    for (const html of [
      '<input>',
      '<textarea></textarea>',
      '<select></select>',
      '<div contenteditable="true"><p>x</p></div>',
    ]) {
      const el = make(html)
      expect(key({ key: 'z', ctrlKey: true }, el)).toBeNull()
      el.remove()
    }
    const inner = make('<div contenteditable="true"><p>x</p></div>')
      .firstElementChild as HTMLElement
    expect(key({ key: 'z', ctrlKey: true }, inner)).toBeNull()
  })
})
