import { describe, expect, it } from 'vitest'
import {
  BLOCK_SPECS,
  BLOCK_TYPES,
  BUTTON_SHAPES,
  BUTTON_SIZES,
  ROW_LAYOUTS,
  allBlocks,
  blockIdForPath,
  issueTarget,
  youtubeId,
  blockDesignErrors,
  buttonShapeOf,
  buttonSizeOf,
  cloneRowWithNewIds,
  createBlock,
  createRow,
  duplicateBlock,
  duplicateRow,
  emptyBlockDesign,
  findBlock,
  insertBlock,
  insertRow,
  isBlockDesign,
  layoutOf,
  moveBlock,
  moveRow,
  newId,
  removeBlock,
  resolveBrand,
  resolveFont,
  setRowLayout,
  toBlockDesign,
  updateBlock,
  withDefaults,
  validateBlockDesign,
  youtubeThumbnail,
  type AvatarBlock,
  type BlockDesign,
  type ButtonBlock,
  type HeadingBlock,
  type LayoutId,
} from '../design'

/** Two rows: [heading, text] in a 50/50 row's columns, and a divider alone. */
function fixture(): BlockDesign {
  const design = emptyBlockDesign()
  const first = createRow('50-50')
  first.columns[0]!.blocks = [createBlock('heading', 'b_h'), createBlock('text', 'b_t')]
  first.columns[1]!.blocks = [createBlock('button', 'b_btn')]
  const second = createRow('100', [createBlock('divider', 'b_d')])
  return { ...design, rows: [first, second] }
}

describe('ids and defaults', () => {
  it('makes ids the server accepts, and different each time', () => {
    const a = newId()
    expect(a).toMatch(/^[a-z0-9_-]{1,40}$/)
    expect(a).toMatch(/^b_/)
    expect(newId('r')).toMatch(/^r_/)
    expect(newId()).not.toBe(a)
  })

  it('creates every block type from one table of defaults', () => {
    expect(Object.keys(BLOCK_SPECS).sort()).toEqual([...BLOCK_TYPES].sort())
    for (const type of BLOCK_TYPES) {
      const block = createBlock(type, 'b_x')
      expect(block).toMatchObject({ id: 'b_x', type })
      // Optional props stay out of a new block: defaults are filled on read.
      expect(Object.keys(block).every((key) => BLOCK_SPECS[type].keys.includes(key))).toBe(true)
    }
  })

  it('an empty design is valid, and so is one holding every block', () => {
    expect(emptyBlockDesign()).toMatchObject({ version: 1, mode: 'blocks', rows: [] })
    expect(blockDesignErrors(emptyBlockDesign())).toEqual([])
    const row = createRow('100')
    row.columns[0]!.blocks = BLOCK_TYPES.map((t) => createBlock(t))
    expect(blockDesignErrors({ ...emptyBlockDesign(), rows: [row] })).toEqual([])
  })

  it('knows a block design from other values', () => {
    expect(isBlockDesign(emptyBlockDesign())).toBe(true)
    expect(isBlockDesign({ version: 1, mode: 'richtext', html: '' })).toBe(false)
    expect(isBlockDesign({ version: 2, mode: 'blocks', rows: [] })).toBe(false)
    expect(isBlockDesign({ version: 1, mode: 'blocks', rows: [{ columns: [{}] }] })).toBe(false)
    expect(toBlockDesign(null)).toMatchObject({ mode: 'blocks', rows: [] })
    expect(toBlockDesign({ mode: 'richtext' })).toBeNull()
  })
})

describe('brand references', () => {
  const brand = { primary_color: '#ff0000', heading_font: 'georgia' }
  it('resolves brand.<attr> against the brand, with the kit default behind it', () => {
    expect(resolveBrand('brand.primary_color', brand)).toBe('#ff0000')
    expect(resolveBrand('brand.text_color', brand)).toBe('#1f2937')
    expect(resolveBrand('#123456', brand)).toBe('#123456')
    expect(resolveBrand(null, brand)).toBe('')
    expect(resolveBrand('brand.nope', brand)).toBe('')
  })

  it('turns font keys into stacks', () => {
    expect(resolveBrand('brand.heading_font', brand)).toContain('Georgia')
    expect(resolveFont('verdana')).toContain('Verdana')
    expect(resolveFont('brand.body_font', brand)).toContain('Arial')
  })

  it('finds the YouTube thumbnail', () => {
    expect(youtubeThumbnail('https://www.youtube.com/watch?v=abc123XYZ_-')).toBe(
      'https://img.youtube.com/vi/abc123XYZ_-/hqdefault.jpg',
    )
    expect(youtubeThumbnail('https://youtu.be/abc123XYZ_-')).toContain('abc123XYZ_-')
    expect(youtubeThumbnail('https://vimeo.com/1')).toBe('')
  })
})

describe('tree operations', () => {
  it('finds a block with its place', () => {
    const found = findBlock(fixture(), 'b_t')!
    expect(found).toMatchObject({ rowIndex: 0, columnIndex: 0, blockIndex: 1 })
    expect(findBlock(fixture(), 'nope')).toBeNull()
  })

  it('updates a block without touching the others or the original', () => {
    const before = fixture()
    const after = updateBlock<HeadingBlock>(before, 'b_h', { align: 'center', level: 1 })
    expect((findBlock(after, 'b_h')!.block as HeadingBlock).align).toBe('center')
    expect((findBlock(before, 'b_h')!.block as HeadingBlock).align).toBe('left')
    expect(findBlock(after, 'b_t')!.block).toBe(findBlock(before, 'b_t')!.block)
    expect(updateBlock(before, 'nope', { align: 'right' } as never)).toBe(before)
    // id and type cannot be patched away.
    const kept = updateBlock(before, 'b_h', { id: 'x', type: 'text' } as never)
    expect(findBlock(kept, 'b_h')!.block.type).toBe('heading')
  })

  it('removes a block', () => {
    const after = removeBlock(fixture(), 'b_h')
    expect(findBlock(after, 'b_h')).toBeNull()
    expect(allBlocks(after)).toHaveLength(3)
  })

  it('moves a block within its column', () => {
    const d = fixture()
    const col = d.rows[0]!.columns[0]!
    const moved = moveBlock(d, 'b_h', { columnId: col.id, index: 1 })
    expect(moved.rows[0]!.columns[0]!.blocks.map((b) => b.id)).toEqual(['b_t', 'b_h'])
  })

  it('moves a block across columns and rows without losing any', () => {
    const d = fixture()
    const right = d.rows[0]!.columns[1]!
    const across = moveBlock(d, 'b_h', { columnId: right.id, index: 0 })
    expect(across.rows[0]!.columns[0]!.blocks.map((b) => b.id)).toEqual(['b_t'])
    expect(across.rows[0]!.columns[1]!.blocks.map((b) => b.id)).toEqual(['b_h', 'b_btn'])
    const lower = d.rows[1]!.columns[0]!
    const down = moveBlock(d, 'b_btn', { columnId: lower.id })
    expect(down.rows[1]!.columns[0]!.blocks.map((b) => b.id)).toEqual(['b_d', 'b_btn'])
    expect(allBlocks(down)).toHaveLength(4)
    expect(moveBlock(d, 'b_h', { columnId: 'nope' })).toBe(d)
  })

  it('inserts a block at a place, clamping the index', () => {
    const d = fixture()
    const col = d.rows[0]!.columns[0]!
    const added = insertBlock(d, createBlock('spacer', 'b_s'), col.id, 1)
    expect(added.rows[0]!.columns[0]!.blocks.map((b) => b.id)).toEqual(['b_h', 'b_s', 'b_t'])
    const end = insertBlock(d, createBlock('spacer', 'b_e'), col.id, 99)
    expect(end.rows[0]!.columns[0]!.blocks.at(-1)!.id).toBe('b_e')
  })

  it('duplicates a block with a new id right after it, and refuses a second footer', () => {
    const d = fixture()
    const after = duplicateBlock(d, 'b_h')
    const ids = after.rows[0]!.columns[0]!.blocks.map((b) => b.id)
    expect(ids).toHaveLength(3)
    expect(ids[0]).toBe('b_h')
    expect(ids[1]).not.toBe('b_h')
    expect(after.rows[0]!.columns[0]!.blocks[1]).toMatchObject({ type: 'heading', html: 'Heading' })
    const withFooter = insertBlock(d, createBlock('footer', 'b_f'), d.rows[1]!.columns[0]!.id)
    expect(duplicateBlock(withFooter, 'b_f')).toBe(withFooter)
  })

  it('inserts, moves and duplicates rows', () => {
    const d = fixture()
    const row = createRow('33-67')
    const inserted = insertRow(d, row, 1)
    expect(inserted.rows.map((r) => r.id)).toEqual([d.rows[0]!.id, row.id, d.rows[1]!.id])
    expect(insertRow(d, row).rows.at(-1)!.id).toBe(row.id)
    const moved = moveRow(inserted, row.id, 0)
    expect(moved.rows[0]!.id).toBe(row.id)
    const last = moveRow(inserted, inserted.rows[0]!.id, 2)
    expect(last.rows.at(-1)!.id).toBe(inserted.rows[0]!.id)
    const copied = duplicateRow(d, d.rows[0]!.id)
    expect(copied.rows).toHaveLength(3)
    expect(copied.rows[1]!.id).not.toBe(d.rows[0]!.id)
  })

  it('clones a row with new ids all through', () => {
    const d = fixture()
    const copy = cloneRowWithNewIds(d.rows[0]!)
    const ids = (r: typeof copy) => [
      r.id,
      ...r.columns.flatMap((c) => [c.id, ...c.blocks.map((b) => b.id)]),
    ]
    const before = ids(d.rows[0]!)
    const after = ids(copy)
    expect(after).toHaveLength(before.length)
    expect(after.filter((id) => before.includes(id))).toEqual([])
    expect(new Set(after).size).toBe(after.length)
    expect(copy.columns[0]!.blocks[0]).toMatchObject({ type: 'heading', html: 'Heading' })
  })
})

describe('layouts', () => {
  it('has the five presets, each adding up to 100', () => {
    expect(ROW_LAYOUTS.map((l) => l.id)).toEqual(['100', '50-50', '33-67', '67-33', '33-34-33'])
    for (const layout of ROW_LAYOUTS) expect(layout.widths.reduce((a, b) => a + b, 0)).toBe(100)
  })

  it('creates a row in each layout', () => {
    for (const layout of ROW_LAYOUTS) {
      const row = createRow(layout.id)
      expect(row.columns.map((c) => c.width)).toEqual(layout.widths)
      expect(layoutOf(row)).toBe(layout.id)
    }
    const custom = createRow('50-50')
    custom.columns[0]!.width = 40
    expect(layoutOf(custom)).toBeNull()
  })

  it('keeps every block when the layout changes, whatever the order of changes', () => {
    const ids: LayoutId[] = ['100', '50-50', '33-67', '67-33', '33-34-33']
    for (const from of ids) {
      for (const to of ids) {
        let d = fixture()
        const rowId = d.rows[0]!.id
        d = setRowLayout(d, rowId, from)
        const kept = allBlocks(d).map((b) => b.id)
        d = setRowLayout(d, rowId, to)
        expect(
          allBlocks(d)
            .map((b) => b.id)
            .sort(),
        ).toEqual([...kept].sort())
        expect(d.rows[0]!.columns.map((c) => c.width)).toEqual(
          ROW_LAYOUTS.find((l) => l.id === to)!.widths,
        )
        expect(blockDesignErrors(d)).toEqual([])
      }
    }
  })

  it('sends an image wider than its new column back to full width', () => {
    let d = fixture()
    const rowId = d.rows[1]!.id
    d = updateBlock(d, 'b_d', {}) // no-op, keeps the fixture shape
    const wide = {
      ...createBlock('image', 'b_img'),
      src: 'https://x.test/a.png',
      width: 500,
    } as never
    d = insertBlock(d, wide, d.rows[1]!.columns[0]!.id)
    expect(blockDesignErrors(d)).toEqual([])
    d = setRowLayout(d, rowId, '33-67')
    expect(blockDesignErrors(d)).toEqual([])
    expect(findBlock(d, 'b_img')!.block).toMatchObject({ width: 'full' })
  })

  it('moves the blocks of removed columns to the end of the last column, in order', () => {
    let d = fixture()
    const rowId = d.rows[0]!.id
    d = setRowLayout(d, rowId, '100')
    expect(d.rows[0]!.columns).toHaveLength(1)
    expect(d.rows[0]!.columns[0]!.blocks.map((b) => b.id)).toEqual(['b_h', 'b_t', 'b_btn'])
  })

  it('adds empty columns with new ids and keeps the settings of the ones that stay', () => {
    let d = fixture()
    const rowId = d.rows[1]!.id
    const original = d.rows[1]!.columns[0]!
    d = {
      ...d,
      rows: d.rows.map((r) =>
        r.id === rowId ? { ...r, columns: [{ ...original, valign: 'middle' as const }] } : r,
      ),
    }
    d = setRowLayout(d, rowId, '33-34-33')
    const cols = d.rows[1]!.columns
    expect(cols).toHaveLength(3)
    expect(cols[0]).toMatchObject({ id: original.id, valign: 'middle' })
    expect(cols[1]!.blocks).toEqual([])
    expect(new Set(cols.map((c) => c.id)).size).toBe(3)
  })
})

describe('validateBlockDesign', () => {
  const issues = (d: unknown) => validateBlockDesign(d)
  const withBlock = (
    patch: Record<string, unknown>,
    type: Parameters<typeof createBlock>[0] = 'text',
  ) => {
    const row = createRow('100', [{ ...createBlock(type, 'b_x'), ...patch } as never])
    return { ...emptyBlockDesign(), rows: [row] }
  }
  const paths = (d: unknown) =>
    issues(d)
      .filter((i) => i.severity === 'error')
      .map((i) => i.path)

  it('refuses what is not a design', () => {
    expect(issues(null)[0]!.path).toBe('')
    expect(
      paths({ version: 2, mode: 'blocks', settings: emptyBlockDesign().settings, rows: [] }),
    ).toContain('version')
    expect(paths({ ...emptyBlockDesign(), mode: 'richtext' })).toContain('mode')
  })

  it('checks the settings', () => {
    const d = emptyBlockDesign()
    expect(paths({ ...d, settings: { ...d.settings, width: 479 } })).toContain('settings.width')
    expect(paths({ ...d, settings: { ...d.settings, width: 701 } })).toContain('settings.width')
    expect(paths({ ...d, settings: { ...d.settings, width: 700 } })).toEqual([])
    expect(paths({ ...d, settings: { ...d.settings, padding: [1, 2, 3] } })).toContain(
      'settings.padding',
    )
    expect(paths({ ...d, settings: { ...d.settings, background: 'brand.nope' } })).toContain(
      'settings.background',
    )
    expect(paths({ ...d, settings: { ...d.settings, font: 'comic-sans' } })).toContain(
      'settings.font',
    )
    expect(paths({ ...d, settings: { ...d.settings, font: 'georgia' } })).toEqual([])
    expect(paths({ ...d, settings: { ...d.settings, extra: 1 } })).toContain('settings.extra')
  })

  it('limits columns and their widths, with paths', () => {
    const d = fixture()
    const bad = structuredClone(d)
    bad.rows[0]!.columns[0]!.width = 60
    expect(paths(bad)).toContain('rows[0].columns')
    const four = structuredClone(d)
    four.rows[0]!.columns = [0, 1, 2, 3].map((i) => ({
      ...createRow('100').columns[0]!,
      id: `c_${i}`,
      width: 25,
    }))
    expect(paths(four)).toContain('rows[0].columns')
    const none = structuredClone(d)
    none.rows[1]!.columns = []
    expect(paths(none)).toContain('rows[1].columns')
  })

  it('limits ids', () => {
    expect(paths(withBlock({ id: 'Has Space' }))).toContain('rows[0].columns[0].blocks[0].id')
    expect(paths(withBlock({ id: 'a'.repeat(41) }))).toContain('rows[0].columns[0].blocks[0].id')
    const dup = fixture()
    dup.rows[1]!.columns[0]!.blocks[0]!.id = 'b_h'
    expect(paths(dup)).toContain('rows[1].columns[0].blocks[0].id')
  })

  it('limits rows, blocks and size', () => {
    const rows = Array.from({ length: 51 }, () => createRow('100'))
    expect(paths({ ...emptyBlockDesign(), rows })).toContain('rows[50]')
    const many = createRow(
      '100',
      Array.from({ length: 301 }, () => createBlock('spacer')),
    )
    expect(
      issues({ ...emptyBlockDesign(), rows: [many] }).some((i) => /300 blocks/.test(i.message)),
    ).toBe(true)
    const big = withBlock({ html: 'x'.repeat(256 * 1024) })
    expect(issues(big).some((i) => /256 KB/.test(i.message))).toBe(true)
  })

  it('allows one footer', () => {
    const row = createRow('100', [createBlock('footer'), createBlock('footer')])
    expect(
      issues({ ...emptyBlockDesign(), rows: [row] }).some((i) => /one footer/.test(i.message)),
    ).toBe(true)
  })

  it('refuses unknown types and props', () => {
    expect(paths(withBlock({ type: 'carousel' }))).toContain('rows[0].columns[0].blocks[0].type')
    expect(paths(withBlock({ colour: 'red' }))).toContain('rows[0].columns[0].blocks[0].colour')
    expect(paths(withBlock({ style: { padding: [1, 1, 1, 1], nope: 1 } }))).toContain(
      'rows[0].columns[0].blocks[0].style.nope',
    )
  })

  it('checks each block type’s props', () => {
    const bad = (
      type: Parameters<typeof createBlock>[0],
      patch: Record<string, unknown>,
      path: string,
    ) => expect(paths(withBlock(patch, type))).toContain(`rows[0].columns[0].blocks[0].${path}`)
    bad('heading', { level: 4 }, 'level')
    bad('heading', { align: 'justify' }, 'align')
    bad('heading', { color: 'not a colour!' }, 'color')
    bad('image', { src: 'ftp://x' }, 'src')
    bad('image', { width: 0 }, 'width')
    bad('image', { radius: 41 }, 'radius')
    bad('button', { url: 'javascript:alert(1)' }, 'url')
    bad('divider', { thickness: 9 }, 'thickness')
    bad('divider', { width: 9 }, 'width')
    bad('spacer', { height: 3 }, 'height')
    bad('spacer', { height: 121 }, 'height')
    bad('social', { source: 'custom', links: [{ network: 'x', url: 'ftp://x' }] }, 'links[0].url')
    bad('social', { links: 'nope' }, 'links')
    bad('video', { url: 'ftp://x' }, 'url')
    bad('footer', { show_business: 'yes' }, 'show_business')
  })

  it('accepts a merge field as a link, and mailto and tel', () => {
    for (const url of [
      '{{ unsubscribe_url }}',
      'mailto:a@b.test',
      'tel:+61400000000',
      'https://x.test',
    ]) {
      expect(paths(withBlock({ url }, 'button'))).toEqual([])
    }
  })

  it('warns, not errors, about an unfinished block', () => {
    const d = withBlock({}, 'button')
    const found = issues(d)
    expect(found.some((i) => i.severity === 'warning' && i.path.endsWith('.url'))).toBe(true)
    expect(blockDesignErrors(d)).toEqual([])
    expect(issues(withBlock({}, 'image')).some((i) => i.severity === 'warning')).toBe(true)
  })
})

describe('the additions of §1a', () => {
  const only = (block: unknown) => ({
    ...emptyBlockDesign(),
    rows: [createRow('100', [block as never])],
  })
  const errors = (block: unknown) => blockDesignErrors(only(block)).map((i) => i.path)

  it('accepts the shared style on a block, with nulls meaning inherit', () => {
    const text = {
      ...createBlock('text', 'b_x'),
      style: {
        padding: [8, 0, 8, 0],
        background: 'brand.background_color',
        color: null,
        font: 'georgia',
        font_size: 18,
        font_weight: 'bold',
      },
    }
    expect(errors(text)).toEqual([])
  })

  it('limits the shared style', () => {
    const style = (patch: Record<string, unknown>) => ({
      ...createBlock('text', 'b_x'),
      style: patch,
    })
    expect(errors(style({ padding: [81, 0, 0, 0] }))).toContain(
      'rows[0].columns[0].blocks[0].style.padding',
    )
    expect(errors(style({ font_size: 11 }))).toContain(
      'rows[0].columns[0].blocks[0].style.font_size',
    )
    expect(errors(style({ font_size: 33 }))).toContain(
      'rows[0].columns[0].blocks[0].style.font_size',
    )
    expect(errors(style({ font_weight: 'heavy' }))).toContain(
      'rows[0].columns[0].blocks[0].style.font_weight',
    )
    expect(errors(style({ font: 'comic' }))).toContain('rows[0].columns[0].blocks[0].style.font')
    expect(errors(style({ font: 'brand.primary_color' }))).toContain(
      'rows[0].columns[0].blocks[0].style.font',
    )
    expect(errors(style({ color: 'brand.heading_font' }))).toContain(
      'rows[0].columns[0].blocks[0].style.color',
    )
  })

  it('gives the html block only padding', () => {
    const html = createBlock('html', 'b_x')
    expect(errors({ ...html, style: { padding: [0, 0, 0, 0] } })).toEqual([])
    expect(errors({ ...html, style: { background: '#fff' } })).toContain(
      'rows[0].columns[0].blocks[0].style.background',
    )
  })

  it('gives the social block the shared style, and still reads the legacy "pill"', () => {
    const social = createBlock('social', 'b_x')
    expect(errors({ ...social, style: { padding: [0, 0, 0, 0], background: '#eee' } })).toEqual([])
    expect(errors({ ...social, style: 'pill' })).toEqual([])
    expect(errors({ ...social, style: 'round' })).toContain('rows[0].columns[0].blocks[0].style')
    // New blocks never carry the string.
    expect(createBlock('social')).not.toHaveProperty('style')
    const read = toBlockDesign(only({ ...social, style: 'pill' }))!
    expect(read.rows[0]!.columns[0]!.blocks[0]).toMatchObject({ style: { padding: [8, 0, 8, 0] } })
  })

  it('gives the button font, weight and border', () => {
    const button = createBlock('button', 'b_x') as ButtonBlock
    const style = (patch: Record<string, unknown>) => ({
      ...button,
      style: { ...button.style, ...patch },
    })
    expect(
      errors(
        style({
          font_size: 20,
          font_weight: 'normal',
          border_color: 'brand.primary_color',
          border_width: 2,
        }),
      ),
    ).toEqual([])
    expect(errors(style({ border_width: 5 }))).toContain(
      'rows[0].columns[0].blocks[0].style.border_width',
    )
    expect(errors(style({ font_size: 40 }))).toContain(
      'rows[0].columns[0].blocks[0].style.font_size',
    )
    expect(errors(style({ radius: 40 }))).toEqual([])
    expect(errors(style({ radius: 41 }))).toContain('rows[0].columns[0].blocks[0].style.radius')
    expect(errors(style({ padding_y: 41 }))).toContain(
      'rows[0].columns[0].blocks[0].style.padding_y',
    )
    expect(errors(style({ padding_x: 100 }))).toEqual([])
  })

  it('has image radius, row gap and column background and padding', () => {
    expect(errors({ ...createBlock('image', 'b_x'), radius: 12 })).toEqual([])
    const d = fixture()
    const row = d.rows[0]!
    expect(blockDesignErrors({ ...d, rows: [{ ...row, gap: 16 }, d.rows[1]!] })).toEqual([])
    expect(
      blockDesignErrors({ ...d, rows: [{ ...row, gap: 41 }, d.rows[1]!] }).map((i) => i.path),
    ).toContain('rows[0].gap')
    const col = { ...row.columns[0]!, background: '#eeeeee', padding: [4, 4, 4, 4] }
    expect(
      blockDesignErrors({ ...d, rows: [{ ...row, columns: [col, row.columns[1]!] }, d.rows[1]!] }),
    ).toEqual([])
    const wide = { ...col, padding: [4, 4, 4, 81] }
    expect(
      blockDesignErrors({
        ...d,
        rows: [{ ...row, columns: [wide, row.columns[1]!] }, d.rows[1]!],
      }).map((i) => i.path),
    ).toContain('rows[0].columns[0].padding')
  })

  it('has an avatar block', () => {
    const avatar = createBlock('avatar', 'b_x') as AvatarBlock
    expect(avatar).toMatchObject({ type: 'avatar', size: 64, shape: 'circle' })
    expect(errors({ ...avatar, size: 24 })).toEqual([])
    expect(errors({ ...avatar, size: 128 })).toEqual([])
    expect(errors({ ...avatar, size: 23 })).toContain('rows[0].columns[0].blocks[0].size')
    expect(errors({ ...avatar, size: 129 })).toContain('rows[0].columns[0].blocks[0].size')
    expect(errors({ ...avatar, shape: 'star' })).toContain('rows[0].columns[0].blocks[0].shape')
    expect(errors({ ...avatar, src: 'ftp://x' })).toContain('rows[0].columns[0].blocks[0].src')
    expect(errors({ ...avatar, style: { padding: [0, 0, 0, 0] } })).toEqual([])
  })

  it('fills defaults on read, without changing what is already set', () => {
    const stored = {
      version: 1,
      mode: 'blocks',
      settings: { width: 640 },
      rows: [
        {
          id: 'r_1',
          columns: [
            {
              id: 'c_1',
              width: 100,
              blocks: [
                { id: 'b_1', type: 'heading', html: 'Hi' },
                {
                  id: 'b_2',
                  type: 'button',
                  label: 'Go',
                  url: 'https://x.test',
                  style: { radius: 0 },
                },
              ],
            },
          ],
        },
      ],
    }
    const filled = toBlockDesign(stored)!
    expect(filled.settings).toMatchObject({ width: 640, font: 'brand.body_font' })
    expect(filled.rows[0]).toMatchObject({ background: null, hide_on: null })
    expect(filled.rows[0]!.columns[0]).toMatchObject({ valign: 'top', hide_on: null })
    expect(filled.rows[0]!.columns[0]!.blocks[0]).toMatchObject({
      html: 'Hi',
      level: 2,
      align: 'left',
    })
    const button = filled.rows[0]!.columns[0]!.blocks[1] as ButtonBlock
    // Explicit values win; the rest is the server's defaults, and a colour left out inherits.
    expect(button.style).toMatchObject({
      radius: 0,
      padding_y: 12,
      padding_x: 24,
      padding: [8, 0, 8, 0],
    })
    expect(button.style.background).toBeUndefined()
    expect(button.full_width).toBe(false)
    expect(blockDesignErrors(filled)).toEqual([])
    expect(withDefaults(filled)).toEqual(filled)
  })
})

describe('button presets', () => {
  it('maps sizes to padding and shapes to radius', () => {
    expect(BUTTON_SIZES.map((s) => s.id)).toEqual(['x-small', 'small', 'medium', 'large'])
    expect(BUTTON_SHAPES.map((s) => [s.id, s.radius])).toEqual([
      ['rectangle', 0],
      ['rounded', 6],
      ['pill', 40],
    ])
    const button = createBlock('button') as ButtonBlock
    expect(buttonSizeOf(button.style)).toBe('medium')
    expect(buttonShapeOf(button.style)).toBe('rounded')
    expect(buttonSizeOf({ padding_y: 1, padding_x: 1 })).toBeNull()
    expect(buttonShapeOf({ radius: 3 })).toBeNull()
  })
})

describe('the server contract', () => {
  const only = (block: unknown, settings: Record<string, unknown> = {}) => {
    const d = emptyBlockDesign()
    return {
      ...d,
      settings: { ...d.settings, ...settings },
      rows: [createRow('100', [block as never])],
    }
  }
  const errorPaths = (d: unknown) => blockDesignErrors(d).map((i) => i.path)

  it('accepts only hex and brand colours, and brand or key fonts', () => {
    const divider = (color: string) => only({ ...createBlock('divider', 'b_x'), color })
    for (const ok of ['#abc', '#AABBCC', 'brand.primary_color', 'brand.muted_text_color'])
      expect(errorPaths(divider(ok))).toEqual([])
    for (const bad of [
      'red',
      'rgb(0,0,0)',
      '#abcd',
      '#12',
      'brand.heading_font',
      'brand.nope',
      'transparent',
    ])
      expect(errorPaths(divider(bad))).toContain('rows[0].columns[0].blocks[0].color')
    const font = (value: string) => only(createBlock('spacer', 'b_x'), { font: value })
    expect(errorPaths(font('system'))).toEqual([])
    expect(errorPaths(font('brand.heading_font'))).toEqual([])
    expect(errorPaths(font("Georgia, 'Times New Roman', serif"))).toContain('settings.font')
    expect(errorPaths(font('brand.primary_color'))).toContain('settings.font')
  })

  it('uses the server’s ranges', () => {
    const d = emptyBlockDesign()
    const row = (patch: Record<string, unknown>) => ({
      ...d,
      rows: [{ ...createRow('100'), ...patch }],
    })
    expect(errorPaths(row({ padding: [100, 100, 100, 100] }))).toEqual([])
    expect(errorPaths(row({ padding: [101, 0, 0, 0] }))).toContain('rows[0].padding')
    expect(errorPaths({ ...d, settings: { ...d.settings, padding: [0, 0, 0, 101] } })).toContain(
      'settings.padding',
    )
    expect(errorPaths(row({ gap: 40 }))).toEqual([])
  })

  it('checks an image’s width against its column’s share of the design width', () => {
    const image = (width: number | 'full') => {
      const row = createRow('33-67', [
        { ...createBlock('image', 'b_x'), src: 'https://x.test/a.png', width } as never,
      ])
      return { ...emptyBlockDesign(), rows: [row] }
    }
    // 600 wide, first column 33 %: 198 px.
    expect(errorPaths(image(198))).toEqual([])
    expect(errorPaths(image(199))).toContain('rows[0].columns[0].blocks[0].width')
    expect(errorPaths(image('full'))).toEqual([])
  })

  it('refuses web addresses the server refuses', () => {
    const image = (src: string) => only({ ...createBlock('image', 'b_x'), src })
    expect(errorPaths(image('https://x.test/a.png'))).toEqual([])
    expect(errorPaths(image('http://localhost:8010/m/a.png'))).toEqual([])
    expect(errorPaths(image('/media/a.png'))).toContain('rows[0].columns[0].blocks[0].src')
    expect(errorPaths(image('https://x.test/has space.png'))).toContain(
      'rows[0].columns[0].blocks[0].src',
    )
    expect(errorPaths(only({ ...createBlock('button', 'b_x'), url: 'ftp://x.test' }))).toContain(
      'rows[0].columns[0].blocks[0].url',
    )
  })

  it('treats null as the default for any optional prop, as the server does', () => {
    const block = {
      ...createBlock('image', 'b_x'),
      src: 'https://x.test/a.png',
      link: null,
      radius: null,
      asset_id: null,
    }
    expect(errorPaths(only(block))).toEqual([])
    expect(errorPaths(only({ ...block, src: null }))).toContain('rows[0].columns[0].blocks[0].src')
  })

  it('needs a thumbnail for a video unless it is YouTube', () => {
    const video = (url: string, thumbnail?: unknown) =>
      only({ ...createBlock('video', 'b_x'), url, ...(thumbnail ? { thumbnail } : {}) })
    const warns = (d: unknown) =>
      validateBlockDesign(d)
        .filter((i) => i.severity === 'warning')
        .map((i) => i.path)
    expect(warns(video('https://vimeo.com/1'))).toContain('rows[0].columns[0].blocks[0].thumbnail')
    expect(warns(video('https://youtu.be/dQw4w9WgXcQ'))).not.toContain(
      'rows[0].columns[0].blocks[0].thumbnail',
    )
    expect(warns(video('https://vimeo.com/1', { src: 'https://x.test/t.png' }))).toEqual([])
    expect(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3')).toBe('dQw4w9WgXcQ')
    expect(youtubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeId('https://youtu.be/short')).toBeNull()
  })

  it('fills the server’s defaults on read', () => {
    const stored = {
      version: 1,
      mode: 'blocks',
      settings: {},
      rows: [
        {
          id: 'r_1',
          columns: [
            {
              id: 'c_1',
              width: 100,
              blocks: [
                { id: 'b_1', type: 'spacer' },
                { id: 'b_2', type: 'footer' },
                { id: 'b_3', type: 'text' },
                { id: 'b_4', type: 'heading', style: { font_size: 20 } },
              ],
            },
          ],
        },
      ],
    }
    const read = toBlockDesign(stored)!
    const [spacer, footer, text, heading] = read.rows[0]!.columns[0]!.blocks as never as Array<
      Record<string, any>
    >
    expect(read.rows[0]).toMatchObject({ gap: 16, padding: [16, 24, 16, 24] })
    expect(read.rows[0]!.columns[0]!.padding).toEqual([0, 0, 0, 0])
    expect(spacer).toMatchObject({ height: 24, style: { padding: [0, 0, 0, 0] } })
    expect(footer).toMatchObject({
      show_business: true,
      show_address: true,
      show_social: true,
      style: { padding: [0, 0, 0, 0] },
    })
    expect(text!.style.padding).toEqual([8, 0, 8, 0])
    expect(heading).toMatchObject({
      level: 2,
      align: 'left',
      color: 'brand.text_color',
      style: { font_size: 20, padding: [8, 0, 8, 0] },
    })
    expect(validateBlockDesign(read).filter((i) => i.severity === 'error')).toEqual([])
  })

  it('maps a server error to the block, column or row it points into', () => {
    const d = fixtureTree()
    const b = d.rows[0]!.columns[1]!.blocks[1]!.id
    expect(blockIdForPath(d, 'rows[0].columns[1].blocks[1].url: must start with https:')).toBe(b)
    expect(blockIdForPath(d, 'rows[0].columns[1].blocks[1]')).toBe(b)
    expect(blockIdForPath(d, 'rows[0].columns[1].blocks[1].style.padding')).toBe(b)
    expect(blockIdForPath(d, 'rows[0].columns[1].width')).toBeNull()
    expect(issueTarget(d, 'rows[0].columns[1].width: must be a number')).toEqual({
      kind: 'column',
      id: d.rows[0]!.columns[1]!.id,
      blockId: null,
    })
    expect(issueTarget(d, 'rows[1].gap: x')).toEqual({
      kind: 'row',
      id: d.rows[1]!.id,
      blockId: null,
    })
    expect(issueTarget(d, 'settings.width: x')).toEqual({
      kind: 'settings',
      id: null,
      blockId: null,
    })
    expect(issueTarget(d, 'rows[9].columns[0]: x')).toBeNull()
    expect(issueTarget(d, 'rows[0].columns[1].blocks[7].url: x')).toMatchObject({ kind: 'column' })
    expect(issueTarget(d, 'nonsense')).toBeNull()
  })
})

function fixtureTree(): BlockDesign {
  const first = createRow('50-50')
  first.columns[1]!.blocks = [createBlock('heading'), createBlock('button')]
  return { ...emptyBlockDesign(), rows: [first, createRow('100')] }
}
