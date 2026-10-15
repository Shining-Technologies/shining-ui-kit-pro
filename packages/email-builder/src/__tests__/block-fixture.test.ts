/**
 * One design covering every block type and every prop, in
 * `fixtures/block-design.full.json`. The server validates the same file, so
 * the two ends agree on the contract (§1, §1a).
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  BLOCK_SPECS,
  BLOCK_TYPES,
  allBlocks,
  blockDesignErrors,
  isBlockDesign,
  toBlockDesign,
  validateBlockDesign,
  withDefaults,
  type BlockDesign,
} from '../design'

const fixture = JSON.parse(
  readFileSync(resolve(__dirname, 'fixtures/block-design.full.json'), 'utf8'),
) as BlockDesign

describe('the shared full-design fixture', () => {
  it('is a block design the client accepts, with no warnings either', () => {
    expect(isBlockDesign(fixture)).toBe(true)
    expect(validateBlockDesign(fixture)).toEqual([])
  })

  it('has every block type', () => {
    const types = new Set(allBlocks(fixture).map((b) => b.type))
    expect([...types].sort()).toEqual([...BLOCK_TYPES].sort())
  })

  it('uses every prop of every block type, of its style, and of rows, columns and settings', () => {
    const seen = new Map<string, Set<string>>()
    const note = (kind: string, value: object) => {
      const keys = seen.get(kind) ?? new Set<string>()
      Object.keys(value).forEach((key) => keys.add(key))
      seen.set(kind, keys)
    }
    note('settings', fixture.settings)
    for (const row of fixture.rows) {
      note('row', row)
      for (const column of row.columns) {
        note('column', column)
        for (const block of column.blocks) {
          note(block.type, block)
          const style = (block as { style?: unknown }).style
          if (style && typeof style === 'object') note(`${block.type}.style`, style)
          const thumb = (block as { thumbnail?: unknown }).thumbnail
          if (thumb && typeof thumb === 'object') note('video.thumbnail', thumb)
        }
      }
    }
    const missing = (kind: string, keys: readonly string[]) => [
      kind,
      keys.filter((key) => !(seen.get(kind) ?? new Set<string>()).has(key)),
    ]
    expect(
      missing('settings', ['width', 'background', 'content_background', 'font', 'padding']),
    ).toEqual(['settings', []])
    expect(missing('row', ['id', 'padding', 'background', 'hide_on', 'gap', 'columns'])).toEqual([
      'row',
      [],
    ])
    expect(
      missing('column', ['id', 'width', 'hide_on', 'valign', 'background', 'padding', 'blocks']),
    ).toEqual(['column', []])
    expect(missing('video.thumbnail', ['src', 'asset_id'])).toEqual(['video.thumbnail', []])
    // Every prop of every block type appears on some block of that type.
    for (const type of BLOCK_TYPES) {
      expect(missing(type, BLOCK_SPECS[type].keys)).toEqual([type, []])
    }
    // The shared style: every field appears on some block, and the button and html have theirs.
    const sharedSeen = new Set<string>()
    for (const type of BLOCK_TYPES) {
      if (type !== 'button' && type !== 'html')
        (seen.get(`${type}.style`) ?? []).forEach((key) => sharedSeen.add(key))
    }
    expect(
      ['padding', 'background', 'color', 'font', 'font_size', 'font_weight'].filter(
        (k) => !sharedSeen.has(k),
      ),
    ).toEqual([])
    expect(
      missing('button.style', [
        'padding',
        'background',
        'color',
        'font',
        'font_size',
        'font_weight',
        'radius',
        'padding_y',
        'padding_x',
        'border_color',
        'border_width',
      ]),
    ).toEqual(['button.style', []])
    expect(missing('html.style', ['padding'])).toEqual(['html.style', []])
  })

  it('reads the same with defaults filled, and filling twice changes nothing', () => {
    const filled = toBlockDesign(fixture)!
    expect(validateBlockDesign(filled)).toEqual([])
    expect(withDefaults(filled)).toEqual(filled)
    // Everything the fixture sets is kept.
    expect(allBlocks(filled).map((b) => b.id)).toEqual(allBlocks(fixture).map((b) => b.id))
    expect(filled.settings).toEqual(fixture.settings)
    expect(blockDesignErrors(filled)).toEqual([])
  })

  it('has no key the schema does not know, at any level', () => {
    const noisy = JSON.parse(JSON.stringify(fixture)) as BlockDesign & {
      rows: Array<{
        ui?: unknown
        columns: Array<{
          _collapsed?: boolean
          blocks: Array<{ style?: Record<string, unknown> } & Record<string, unknown>>
        }>
      }>
    }
    expect(validateBlockDesign(noisy)).toEqual([])
    const bad = (mutate: (d: typeof noisy) => void, path: string) => {
      const copy = JSON.parse(JSON.stringify(noisy)) as typeof noisy
      mutate(copy)
      expect(validateBlockDesign(copy).map((i) => i.path)).toContain(path)
    }
    bad((d) => ((d.settings as unknown as Record<string, unknown>).ui = 1), 'settings.ui')
    bad((d) => (d.rows[0]!.ui = 1), 'rows[0].ui')
    bad((d) => (d.rows[0]!.columns[0]!._collapsed = true), 'rows[0].columns[0]._collapsed')
    bad((d) => (d.rows[0]!.columns[0]!.blocks[0]!.ui = 1), 'rows[0].columns[0].blocks[0].ui')
    bad(
      (d) => (d.rows[0]!.columns[0]!.blocks[0]!.style!.ui = 1),
      'rows[0].columns[0].blocks[0].style.ui',
    )
  })
})
