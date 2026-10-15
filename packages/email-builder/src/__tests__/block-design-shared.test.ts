/**
 * Shared blocks and the table block (shining-email 0.4) in the design helpers: the placeholder
 * row, every walker that has to skip it, expansion, and the table's schema as the server has it.
 */
import { describe, expect, it } from 'vitest'
import {
  BLOCK_TYPES,
  DEFAULT_BLOCK_PADDING,
  allBlocks,
  blockDesignErrors,
  blockIdForPath,
  countBlocks,
  createBlock,
  createRow,
  createSharedRowRef,
  detachSharedRow,
  duplicateRow,
  emptyBlockDesign,
  expandSharedRows,
  findBlock,
  findColumn,
  findRow,
  hasFooter,
  insertBlock,
  insertRow,
  isBlockDesign,
  isSharedRowRef,
  issueTarget,
  moveBlock,
  moveRow,
  relayoutRow,
  removeBlock,
  removeRow,
  replaceRowWithSharedRef,
  setRowLayout,
  tableBlockFor,
  toBlockDesign,
  updateBlock,
  updateColumn,
  updateRow,
  validateBlockDesign,
  validateSharedRowContent,
  withDefaults,
  type BlockDesign,
  type ButtonBlock,
  type DataSourceDefinition,
  type HeadingBlock,
  type ImageBlock,
  type Row,
  type SharedRowRef,
  type TableBlock,
} from '../design'

const REF = '7b0c2f4e-5a1d-4c3b-9e8f-2a6d1b4c9e30'

/** Row 1: [heading]. Row 2: a shared block. Row 3: [divider]. */
function withShared(): BlockDesign {
  const first = createRow('100', [createBlock('heading', 'b_h')])
  first.id = 'r_1'
  first.columns[0]!.id = 'c_1'
  const third = createRow('100', [createBlock('divider', 'b_d')])
  third.id = 'r_3'
  third.columns[0]!.id = 'c_3'
  return {
    ...emptyBlockDesign(),
    rows: [first, { id: 'r_shared', type: 'shared', ref: REF }, third],
  }
}

/** The row a shared block holds: a 50/50 row with a text, a footer and a button. */
function sharedContent(): Row {
  const row = createRow('50-50')
  row.id = 'r_saved'
  row.columns[0]!.id = 'c_saved_1'
  row.columns[1]!.id = 'c_saved_2'
  row.columns[0]!.blocks = [createBlock('text', 'b_saved_t'), createBlock('footer', 'b_saved_f')]
  row.columns[1]!.blocks = [
    { ...createBlock('button', 'b_saved_b'), url: 'https://x.test/go' } as ButtonBlock,
  ]
  return row
}

const plain = (): BlockDesign => {
  const first = createRow('50-50')
  first.columns[1]!.blocks = [createBlock('heading'), createBlock('button')]
  return { ...emptyBlockDesign(), rows: [first, createRow('100')] }
}

describe('shared block placeholders', () => {
  it('knows a placeholder from a row and makes new ones', () => {
    const ref = createSharedRowRef(REF)
    expect(ref).toEqual({ id: expect.stringMatching(/^r_/), type: 'shared', ref: REF })
    expect(isSharedRowRef(ref)).toBe(true)
    expect(isSharedRowRef(createRow('100'))).toBe(false)
    expect(isSharedRowRef(null)).toBe(false)
    expect(isSharedRowRef('shared')).toBe(false)
    expect(createSharedRowRef(REF).id).not.toBe(ref.id)
  })

  it('is part of a block design: accepted, kept as it is, valid', () => {
    const d = withShared()
    expect(isBlockDesign(d)).toBe(true)
    expect(toBlockDesign(d)!.rows[1]).toEqual({ id: 'r_shared', type: 'shared', ref: REF })
    expect(withDefaults(d).rows[1]).toBe(d.rows[1])
    expect(validateBlockDesign(d)).toEqual([])
    const hidden = { ...d, rows: [{ id: 'r_s', type: 'shared', ref: REF, hide_on: 'mobile' }] }
    expect(validateBlockDesign(hidden)).toEqual([])
  })

  it('validates a placeholder: id, ref, hide_on and nothing else', () => {
    const check = (row: Record<string, unknown>) =>
      validateBlockDesign({ ...emptyBlockDesign(), rows: [row] })
    const paths = (row: Record<string, unknown>) => check(row).map((issue) => issue.path)
    expect(paths({ type: 'shared', ref: REF })).toEqual(['rows[0].id'])
    expect(check({ id: 'r_s', type: 'shared' }).map((i) => [i.path, i.message])).toEqual([
      ['rows[0].ref', 'Is required'],
    ])
    expect(paths({ id: 'r_s', type: 'shared', ref: 'nope' })).toEqual(['rows[0].ref'])
    expect(paths({ id: 'r_s', type: 'shared', ref: 'x'.repeat(40) })).toEqual(['rows[0].ref'])
    expect(check({ id: 'r_s', type: 'shared', ref: REF.toUpperCase() })).toEqual([])
    expect(check({ id: 'r_s', type: 'shared', ref: REF.replace(/-/g, '') })).toEqual([])
    expect(paths({ id: 'r_s', type: 'shared', ref: REF, hide_on: 'tablet' })).toEqual([
      'rows[0].hide_on',
    ])
    // A shared block is one row: no layout, padding or columns of its own.
    for (const key of ['columns', 'padding', 'gap', 'background']) {
      expect(paths({ id: 'r_s', type: 'shared', ref: REF, [key]: [] })).toEqual([`rows[0].${key}`])
    }
    // Any other type is not a row.
    expect(paths({ id: 'r_s', type: 'banner', columns: [] })).toContain('rows[0].type')
  })

  it('counts as one row, and its id is checked with the others', () => {
    const rows = Array.from({ length: 51 }, (_, i) => ({ id: `r_${i}`, type: 'shared', ref: REF }))
    const issues = validateBlockDesign({ ...emptyBlockDesign(), rows })
    expect(issues.map((i) => [i.path, i.message])).toEqual([
      ['rows[50]', 'A design may have at most 50 rows'],
    ])
    const dup = withShared()
    ;(dup.rows[2] as Row).id = 'r_shared'
    expect(validateBlockDesign(dup).map((i) => i.path)).toEqual(['rows[2].id'])
  })

  it('is skipped by every walker', () => {
    const d = withShared()
    expect(allBlocks(d).map((b) => b.id)).toEqual(['b_h', 'b_d'])
    expect(countBlocks(d)).toBe(2)
    expect(findBlock(d, 'b_d')).toMatchObject({ rowIndex: 2, columnIndex: 0, blockIndex: 0 })
    expect(findColumn(d, 'c_3')).toMatchObject({ rowIndex: 2 })
    expect(findRow(d, 'r_shared')).toMatchObject({ index: 1 })
    // An edit to a block leaves the placeholder as it is.
    const updated = updateBlock<HeadingBlock>(d, 'b_h', { level: 1 })
    expect(updated.rows[1]).toBe(d.rows[1])
    expect(removeBlock(d, 'b_d').rows[1]).toBe(d.rows[1])
    expect(insertBlock(d, createBlock('spacer', 'b_s'), 'c_3').rows[1]).toBe(d.rows[1])
    expect(moveBlock(d, 'b_h', { columnId: 'c_3' }).rows[1]).toBe(d.rows[1])
    // Settings and layout belong to the saved row: the placeholder takes none.
    expect(updateRow(d, 'r_shared', { gap: 3, background: '#ffffff' })).toEqual(d)
    expect(setRowLayout(d, 'r_shared', '50-50')).toBe(d)
    expect(relayoutRow(d.rows[1]!, '50-50')).toBe(d.rows[1])
    expect(relayoutRow(d.rows[0] as Row, '50-50').columns).toHaveLength(2)
    expect(updateColumn(d, 'c_1', { valign: 'middle' }).rows[1]).toBe(d.rows[1])
  })

  it('moves, inserts and duplicates like a row', () => {
    const d = withShared()
    expect(moveRow(d, 'r_shared', 0).rows.map((r) => r.id)).toEqual(['r_shared', 'r_1', 'r_3'])
    const placed = insertRow(d, createSharedRowRef(REF), 0)
    expect(placed.rows).toHaveLength(4)
    expect(isSharedRowRef(placed.rows[0])).toBe(true)
    const copy = duplicateRow(d, 'r_shared')
    expect(copy.rows).toHaveLength(4)
    expect(copy.rows[2]).toMatchObject({ type: 'shared', ref: REF })
    expect(copy.rows[2]!.id).not.toBe('r_shared')
    expect(validateBlockDesign(copy)).toEqual([])
    expect(removeRow(d, 'r_shared').rows).toHaveLength(2)
  })

  it('has a footer only when the design or a resolved shared row has one', () => {
    const d = withShared()
    expect(hasFooter(d)).toBe(false)
    expect(hasFooter(d, () => sharedContent())).toBe(true)
    expect(hasFooter(d, () => undefined)).toBe(false)
    expect(hasFooter(d, () => createRow('100', [createBlock('text')]))).toBe(false)
    expect(hasFooter(insertBlock(d, createBlock('footer', 'b_f'), 'c_1'))).toBe(true)
  })

  it('maps any path under a placeholder to the row', () => {
    const d = withShared()
    for (const path of [
      'rows[1].ref: must be a UUID',
      'rows[1].hide_on: x',
      'rows[1].columns[0].blocks[0].url: x',
      'rows[1]',
    ]) {
      expect(issueTarget(d, path)).toEqual({ kind: 'row', id: 'r_shared', blockId: null })
    }
    expect(blockIdForPath(d, 'rows[1].columns[0].blocks[0].url: x')).toBeNull()
  })

  it('replaces a row with a placeholder in its place, keeping its id', () => {
    const d = plain()
    const id = d.rows[0]!.id
    const next = replaceRowWithSharedRef(d, id, REF)
    expect(next.rows[0]).toEqual({ id, type: 'shared', ref: REF })
    expect(next.rows[1]).toBe(d.rows[1])
    expect(validateBlockDesign(next)).toEqual([])
    expect(replaceRowWithSharedRef(d, 'nope', REF)).toBe(d)
  })

  it('detaches a placeholder into an editable copy with new ids, in place', () => {
    const d = withShared()
    const saved = sharedContent()
    const next = detachSharedRow(d, 'r_shared', saved)
    const copy = next.rows[1] as Row
    expect(isSharedRowRef(copy)).toBe(false)
    expect(next.rows).toHaveLength(3)
    expect(copy.id).not.toBe('r_saved')
    const oldIds = ['r_saved', 'c_saved_1', 'c_saved_2', 'b_saved_t', 'b_saved_f', 'b_saved_b']
    const newIds = [copy.id, ...copy.columns.flatMap((c) => [c.id, ...c.blocks.map((b) => b.id)])]
    expect(newIds).toHaveLength(6)
    expect(newIds.filter((id) => oldIds.includes(id))).toEqual([])
    // The copy reads with defaults filled, like any row read from the server.
    expect(copy.columns[0]).toMatchObject({ valign: 'top', hide_on: null })
    expect(validateBlockDesign(next)).toEqual([])
    // The saved row itself is not touched.
    expect(saved.id).toBe('r_saved')
    // A normal row is not a placeholder: nothing to detach.
    expect(detachSharedRow(d, 'r_1', saved)).toBe(d)
    expect(detachSharedRow(d, 'nope', saved)).toBe(d)
  })

  it('keeps where the placeholder hides: it wins over the saved row, as on expansion', () => {
    const d = withShared()
    ;(d.rows[1] as SharedRowRef).hide_on = 'mobile'
    const hidden = detachSharedRow(d, 'r_shared', { ...sharedContent(), hide_on: 'desktop' })
    expect((hidden.rows[1] as Row).hide_on).toBe('mobile')
    // With none of its own, the saved row’s setting stays.
    const open = detachSharedRow(withShared(), 'r_shared', {
      ...sharedContent(),
      hide_on: 'desktop',
    })
    expect((open.rows[1] as Row).hide_on).toBe('desktop')
  })

  it('detaches an image back to full width when this email is narrower', () => {
    const image = {
      ...createBlock('image', 'b_i'),
      src: 'https://x.test/a.png',
      width: 580,
    } as ImageBlock
    const d = withShared()
    const narrow = { ...d, settings: { ...d.settings, width: 480 } }
    const next = detachSharedRow(narrow, 'r_shared', createRow('100', [image]))
    expect(blockDesignErrors(next)).toEqual([])
    expect(allBlocks(next).find((b) => b.type === 'image')).toMatchObject({ width: 'full' })
  })
})

describe('expandSharedRows', () => {
  it('puts the resolved row in place of the placeholder, re-keyed from the placeholder id', () => {
    const d = withShared()
    const saved = sharedContent()
    const expanded = expandSharedRows(d, (ref) => (ref === REF ? saved : undefined))
    const row = expanded.rows[1] as Row
    expect(row.id).toBe('r_shared')
    expect(row.columns.map((c) => c.id)).toEqual(['r_shared-1', 'r_shared-4'])
    expect(row.columns.flatMap((c) => c.blocks.map((b) => b.id))).toEqual([
      'r_shared-2',
      'r_shared-3',
      'r_shared-5',
    ])
    // Deterministic, and valid.
    expect(expandSharedRows(d, () => saved)).toEqual(expanded)
    expect(validateBlockDesign(expanded)).toEqual([])
    // The saved row and the design are not changed.
    expect(saved.id).toBe('r_saved')
    expect(d.rows[1]).toEqual({ id: 'r_shared', type: 'shared', ref: REF })
  })

  it('keeps ids within 40 characters for a long placeholder id', () => {
    const long = `r_${'a'.repeat(38)}`
    const d = { ...emptyBlockDesign(), rows: [{ id: long, type: 'shared' as const, ref: REF }] }
    const row = expandSharedRows(d, () => sharedContent()).rows[0] as Row
    for (const id of [row.id, ...row.columns.map((c) => c.id)])
      expect(id.length).toBeLessThanOrEqual(40)
    expect(row.columns[0]!.id).toBe(`${long.slice(0, 24)}-1`)
  })

  it('lets the placeholder hide the row, and leaves a missing one out', () => {
    const d = withShared()
    ;(d.rows[1] as SharedRowRef).hide_on = 'mobile'
    const expanded = expandSharedRows(d, () => ({ ...sharedContent(), hide_on: 'desktop' }))
    expect((expanded.rows[1] as Row).hide_on).toBe('mobile')
    const bare = withShared()
    const kept = expandSharedRows(bare, () => ({ ...sharedContent(), hide_on: 'desktop' }))
    expect((kept.rows[1] as Row).hide_on).toBe('desktop')
    const gone = expandSharedRows(bare, () => undefined)
    expect(gone.rows.map((r) => r.id)).toEqual(['r_1', 'r_3'])
  })

  it('returns a design without placeholders as it is', () => {
    const d = plain()
    expect(expandSharedRows(d, () => sharedContent())).toBe(d)
  })
})

describe('validateSharedRowContent', () => {
  it('refuses a placeholder: shared blocks do not nest', () => {
    expect(validateSharedRowContent(createSharedRowRef(REF))).toEqual([
      { path: 'row', message: 'A saved row cannot contain a shared block', severity: 'error' },
    ])
  })

  it('checks a normal row on its own, with paths that start "row"', () => {
    expect(validateSharedRowContent(sharedContent())).toEqual([])
    const bad = sharedContent()
    bad.columns[1]!.blocks[0] = { ...createBlock('divider', 'b_x'), thickness: 99 } as never
    expect(validateSharedRowContent(bad).map((i) => i.path)).toEqual([
      'row.columns[1].blocks[0].thickness',
    ])
  })

  it('checks images against the width it is given', () => {
    const row = createRow('100', [
      { ...createBlock('image', 'b_i'), src: 'https://x.test/a.png', width: 580 } as ImageBlock,
    ])
    expect(validateSharedRowContent(row, 600)).toEqual([])
    expect(validateSharedRowContent(row, 480).map((i) => i.path)).toEqual([
      'row.columns[0].blocks[0].width',
    ])
  })
})

/* -- the table block --------------------------------------------------------- */

const ITEMS: DataSourceDefinition = {
  key: 'deal.items',
  label: 'Deal line items',
  group: 'Deal',
  fields: [
    { key: 'name', label: 'Item' },
    { key: 'description', label: 'Description' },
    { key: 'quantity', label: 'Qty', align: 'right' },
    { key: 'line_total', label: 'Total', align: 'right' },
  ],
  default_columns: [
    { key: 'name', label: 'Item', secondary: 'description' },
    { key: 'quantity', label: 'Qty', align: 'right', width: 12 },
    { key: 'line_total', label: 'Total', align: 'right', width: 20 },
  ],
  totals_key: 'deal.totals',
  sample: [{ name: 'Hosting', description: '', quantity: '1', line_total: '30.00' }],
  sample_totals: [{ label: 'Total', value: '30.00', emphasis: true }],
}

function withTable(patch: Record<string, unknown> = {}): BlockDesign {
  const block = { ...tableBlockFor(ITEMS, 'b_table'), ...patch } as never
  return { ...emptyBlockDesign(), rows: [createRow('100', [block])] }
}
const tableIssues = (patch: Record<string, unknown> = {}) =>
  validateBlockDesign(withTable(patch)).map((i) => [i.path, i.message])
const tablePaths = (patch: Record<string, unknown> = {}) => tableIssues(patch).map(([path]) => path)
const T = 'rows[0].columns[0].blocks[0]'

describe('the table block', () => {
  it('is a block type with its own padding and a starting block', () => {
    expect(BLOCK_TYPES).toContain('table')
    expect(DEFAULT_BLOCK_PADDING.table).toEqual([8, 0, 8, 0])
    const bare = createBlock('table', 'b_t')
    expect(bare).toMatchObject({ id: 'b_t', type: 'table' })
    expect(
      validateBlockDesign({ ...emptyBlockDesign(), rows: [createRow('100', [bare])] }),
    ).toEqual([])
  })

  it('starts from a data source: its columns and its totals', () => {
    const block = tableBlockFor(ITEMS, 'b_x')
    expect(block).toEqual({
      id: 'b_x',
      type: 'table',
      source: 'deal.items',
      totals: 'deal.totals',
      columns: ITEMS.default_columns,
    })
    // A copy: editing the block never changes the source's own columns.
    expect(block.columns[0]).not.toBe(ITEMS.default_columns[0])
    expect(tableBlockFor(ITEMS).id).toMatch(/^b_/)
    expect(blockDesignErrors(withTable())).toEqual([])
    const noTotals = tableBlockFor({ ...ITEMS, totals_key: null })
    expect('totals' in noTotals).toBe(false)
    const many = tableBlockFor({
      ...ITEMS,
      default_columns: Array.from({ length: 9 }, (_, i) => ({ key: `f${i}` })),
    })
    expect(many.columns).toHaveLength(6)
  })

  it('accepts what the server accepts', () => {
    expect(tableIssues()).toEqual([])
    expect(
      tableIssues({
        show_header: false,
        striped: true,
        header_background: '#112233',
        header_color: 'brand.text_color',
        border_color: '#abc',
        totals: null,
        style: { padding: [0, 0, 0, 0], font_size: 14, font_weight: 'bold' },
      }),
    ).toEqual([])
    expect(tableIssues({ source: 'a'.repeat(100) })).toEqual([])
  })

  it('refuses a bad source or totals path', () => {
    expect(tablePaths({ source: 'deal-items' })).toEqual([`${T}.source`])
    expect(tablePaths({ source: '' })).toEqual([`${T}.source`])
    expect(tablePaths({ source: 'a'.repeat(101) })).toEqual([`${T}.source`])
    expect(tablePaths({ totals: '1deal.totals' })).toEqual([`${T}.totals`])
    const missing = tableBlockFor(ITEMS) as unknown as Record<string, unknown>
    delete missing.source
    const design = { ...emptyBlockDesign(), rows: [createRow('100', [missing as never])] }
    expect(validateBlockDesign(design).map((i) => [i.path, i.message])).toContainEqual([
      `${T}.source`,
      'Is required',
    ])
  })

  it('wants one to six columns', () => {
    expect(tablePaths({ columns: [] })).toEqual([`${T}.columns`])
    expect(tablePaths({ columns: 'name' })).toEqual([`${T}.columns`])
    const seven = Array.from({ length: 7 }, (_, i) => ({ key: `f${i}` }))
    expect(tablePaths({ columns: seven })).toEqual([`${T}.columns`])
    expect(tablePaths({ columns: seven.slice(0, 6) })).toEqual([])
    const missing = tableBlockFor(ITEMS) as unknown as Record<string, unknown>
    delete missing.columns
    const design = { ...emptyBlockDesign(), rows: [createRow('100', [missing as never])] }
    expect(validateBlockDesign(design).map((i) => [i.path, i.message])).toContainEqual([
      `${T}.columns`,
      'Is required',
    ])
  })

  it('checks every column prop, with the column in the path', () => {
    const col = (patch: Record<string, unknown>) =>
      tablePaths({ columns: [{ key: 'name', ...patch }] })
    expect(col({ key: 'Name' })).toEqual([`${T}.columns[0].key`])
    expect(col({ key: '1st' })).toEqual([`${T}.columns[0].key`])
    expect(col({ key: 'a'.repeat(41) })).toEqual([`${T}.columns[0].key`])
    expect(col({ key: 'a'.repeat(40) })).toEqual([])
    expect(col({ label: 'x'.repeat(61) })).toEqual([`${T}.columns[0].label`])
    expect(col({ label: 'x'.repeat(60) })).toEqual([])
    expect(col({ secondary: 'Desc' })).toEqual([`${T}.columns[0].secondary`])
    expect(col({ secondary: null })).toEqual([])
    expect(col({ align: 'justify' })).toEqual([`${T}.columns[0].align`])
    expect(col({ width: 4 })).toEqual([`${T}.columns[0].width`])
    expect(col({ width: 91 })).toEqual([`${T}.columns[0].width`])
    expect(col({ width: 33.5 })).toEqual([`${T}.columns[0].width`])
    expect(col({ width: 5 })).toEqual([])
    expect(col({ width: 90 })).toEqual([])
    expect(col({ width: null })).toEqual([])
    expect(col({ hide_on_mobile: 'yes' })).toEqual([`${T}.columns[0].hide_on_mobile`])
    expect(col({ colour: 'red' })).toEqual([`${T}.columns[0].colour`])
    expect(tableIssues({ columns: [{ label: 'x' }] })).toContainEqual([
      `${T}.columns[0].key`,
      'Is required',
    ])
    expect(tablePaths({ columns: [{ key: 'a' }, 'b'] })).toEqual([`${T}.columns[1]`])
  })

  it('refuses widths that add up to more than 100', () => {
    const wide = [
      { key: 'a', width: 60 },
      { key: 'b', width: 41 },
    ]
    expect(tableIssues({ columns: wide, totals: null })).toEqual([
      [`${T}.columns`, 'Column widths add up to 101; the most is 100'],
    ])
    const exact = [
      { key: 'a', width: 60 },
      { key: 'b', width: 40 },
    ]
    expect(tableIssues({ columns: exact })).toEqual([])
    // Columns with no width share what is left, so they never add to the sum.
    const open = [{ key: 'a', width: 90 }, { key: 'b' }, { key: 'c' }]
    expect(tableIssues({ columns: open })).toEqual([])
  })

  it('refuses totals when the last column is hidden on phones', () => {
    const hidden = [{ key: 'a' }, { key: 'b', hide_on_mobile: true }]
    expect(tableIssues({ columns: hidden, totals: 'deal.totals' })).toEqual([
      [`${T}.totals`, 'Needs the last column to show on phones, because the totals sit under it'],
    ])
    expect(tableIssues({ columns: hidden, totals: null })).toEqual([])
    const first = [{ key: 'a', hide_on_mobile: true }, { key: 'b' }]
    expect(tableIssues({ columns: first })).toEqual([])
  })

  it('refuses unknown props and bad colours, as every block does', () => {
    expect(tablePaths({ zebra: true })).toEqual([`${T}.zebra`])
    expect(tablePaths({ header_background: 'red' })).toEqual([`${T}.header_background`])
    expect(tablePaths({ striped: 'yes' })).toEqual([`${T}.striped`])
    expect(tablePaths({ style: { padding: [0, 0, 0, 81] } })).toEqual([`${T}.style.padding`])
  })

  it('fills the defaults on read: the block, its style and every column', () => {
    const read = toBlockDesign(withTable())!
    const block = allBlocks(read)[0] as TableBlock
    expect(block).toMatchObject({
      show_header: true,
      striped: false,
      header_background: 'brand.primary_color',
      header_color: 'brand.button_text_color',
      border_color: 'brand.muted_text_color',
      style: { padding: [8, 0, 8, 0] },
    })
    expect(block.columns[0]).toMatchObject({ align: 'left', hide_on_mobile: false })
    expect(block.columns[0]!.label).toBe('Item')
    const bare = toBlockDesign(withTable({ columns: [{ key: 'name' }] }))!
    expect((allBlocks(bare)[0] as TableBlock).columns[0]).toEqual({
      key: 'name',
      label: '',
      align: 'left',
      hide_on_mobile: false,
    })
    expect(withDefaults(read)).toEqual(read)
    expect(validateBlockDesign(read)).toEqual([])
  })
})

describe('expandSharedRows: ids that would clash', () => {
  const oneColumn = (): Row => {
    const row = createRow('100', [createBlock('text', 's_a'), createBlock('text', 's_b')])
    row.id = 'r_saved'
    row.columns[0]!.id = 's_col'
    return row
  }
  const idsOf = (design: BlockDesign) =>
    (design.rows as Row[]).flatMap((r) => [
      r.id,
      ...r.columns.flatMap((c) => [c.id, ...c.blocks.map((b) => b.id)]),
    ])

  it('appends -x<n> to a generated id the design already uses (r1 beside r1-2)', () => {
    const own = createRow('100', [createBlock('heading', 'r1-2')])
    own.id = 'r_own'
    own.columns[0]!.id = 'c_own'
    const d: BlockDesign = {
      ...emptyBlockDesign(),
      rows: [own, { id: 'r1', type: 'shared', ref: REF }],
    }
    const row = expandSharedRows(d, () => oneColumn()).rows[1] as Row
    // column r1-1, first block r1-2 (taken: its design has a block of that name), second r1-3.
    expect([row.id, row.columns[0]!.id, ...row.columns[0]!.blocks.map((b) => b.id)]).toEqual([
      'r1',
      'r1-1',
      'r1-2-x1',
      'r1-3',
    ])
    const ids = idsOf(expandSharedRows(d, () => oneColumn()))
    expect(new Set(ids).size).toBe(ids.length)
    expect(validateBlockDesign(expandSharedRows(d, () => oneColumn()))).toEqual([])
  })

  it('takes the first free n when -x1 is taken too', () => {
    const own = createRow('100', [createBlock('heading', 'r1-2'), createBlock('text', 'r1-2-x1')])
    own.id = 'r_own'
    const d: BlockDesign = {
      ...emptyBlockDesign(),
      rows: [own, { id: 'r1', type: 'shared', ref: REF }],
    }
    const row = expandSharedRows(d, () => oneColumn()).rows[1] as Row
    expect(row.columns[0]!.blocks[0]!.id).toBe('r1-2-x2')
  })

  it('keeps two placeholders with the same 24-character start apart, in order', () => {
    const stem = 'p'.repeat(24)
    const d: BlockDesign = {
      ...emptyBlockDesign(),
      rows: [
        { id: `${stem}aaaa`, type: 'shared', ref: REF },
        { id: `${stem}bbbb`, type: 'shared', ref: REF },
      ],
    }
    const out = expandSharedRows(d, () => oneColumn())
    const [first, second] = out.rows as Row[]
    expect(first!.columns[0]!.id).toBe(`${stem}-1`)
    expect(second!.columns[0]!.id).toBe(`${stem}-1-x1`)
    expect(second!.columns[0]!.blocks.map((b) => b.id)).toEqual([`${stem}-2-x1`, `${stem}-3-x1`])
    const ids = idsOf(out)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id.length).toBeLessThanOrEqual(40)
    expect(expandSharedRows(d, () => oneColumn())).toEqual(out)
  })
})
