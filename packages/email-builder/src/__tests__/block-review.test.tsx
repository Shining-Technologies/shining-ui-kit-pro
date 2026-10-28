/** Regression tests for the review of 005c8a3. */
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BlockEditor } from '../block-editor/block-editor'
import type { BlockEditorProps, SavedRow } from '../block-editor/types'
import { contentForEditor, joinLines } from '../block-editor/text-extensions'
import {
  DEFAULT_BLOCK_PADDING,
  MAX_DESIGN_BYTES,
  allBlocks,
  blockDesignErrors,
  createBlock,
  createRow,
  duplicateRow,
  emptyBlockDesign,
  findBlock,
  insertBlock,
  insertRow,
  moveBlock,
  toBlockDesign,
  urlProblem,
  validateBlockDesign,
  withDefaults,
  youtubeId,
  type BlockDesign,
  type HeadingBlock,
  type ImageBlock,
  type Row,
  type TextBlock,
} from '../design'
import { rowsOf } from './helpers'

const brand = {}
function mount(initial: unknown = null, extra: Partial<BlockEditorProps> = {}) {
  const changes: BlockDesign[] = []
  function Harness() {
    const [value, setValue] = useState<unknown>(initial)
    return (
      <BlockEditor
        value={value}
        onChange={(next) => {
          changes.push(next)
          setValue(next)
        }}
        mergeFields={[]}
        brand={brand}
        {...extra}
      />
    )
  }
  render(<Harness />)
  return { changes, last: () => changes.at(-1)! }
}
const blocksPalette = () => within(screen.getByRole('region', { name: 'Blocks' }))
const layouts = () => within(screen.getByRole('region', { name: 'Layouts' }))
const addBlock = (name: string) => userEvent.click(blocksPalette().getByRole('button', { name }))
const cells = () => Array.from(document.querySelectorAll<HTMLElement>('[data-block-id]'))

afterEach(() => vi.restoreAllMocks())

const image = (id: string, width: number | 'full'): ImageBlock =>
  ({ ...createBlock('image', id), src: 'https://x.test/a.png', width }) as ImageBlock

describe('1. a stale focus request', () => {
  it('does not survive a move that changed nothing, so Backspace cannot delete the block', async () => {
    const { last } = mount()
    await addBlock('Spacer')
    await addBlock('Divider')
    const spacer = cells()[0]!
    spacer.focus()
    // Alt+Up on the first block: nothing moves.
    fireEvent.keyDown(spacer, { key: 'ArrowUp', altKey: true })
    expect(allBlocks(last()).map((b) => b.type)).toEqual(['spacer', 'divider'])
    // The next change of the design must not pull focus back to a block.
    await addBlock('Button')
    expect(document.activeElement?.hasAttribute('data-block-id')).toBe(false)
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Backspace' })
    expect(allBlocks(last())).toHaveLength(3)
  })

  it('is cleared by any commit', async () => {
    const { last } = mount()
    await addBlock('Spacer')
    await addBlock('Divider')
    fireEvent.keyDown(cells()[1]!, { key: 'ArrowDown', altKey: true }) // edge: nothing moves
    await userEvent.click(screen.getByRole('button', { name: 'Duplicate' })) // a real change
    expect(allBlocks(last())).toHaveLength(3)
    // Focus went to the copy that was asked for, once.
    expect(document.activeElement).toBe(cells()[2])
    await addBlock('Button')
    expect(document.activeElement?.hasAttribute('data-block-id')).toBe(false)
  })
})

describe('2. width safety on moves and inserts', () => {
  const wide = (): BlockDesign => {
    const row = createRow('33-67')
    row.columns[1]!.blocks = [image('b_img', 400)]
    return { ...emptyBlockDesign(), rows: [row] }
  }

  it('moveBlock resets an image that no longer fits its column', () => {
    const d = wide()
    expect(blockDesignErrors(d)).toEqual([])
    const moved = moveBlock(d, 'b_img', { columnId: rowsOf(d)[0]!.columns[0]!.id })
    expect(findBlock(moved, 'b_img')!.block).toMatchObject({ width: 'full' })
    expect(blockDesignErrors(moved)).toEqual([])
    // Into a column it fits, it keeps its width.
    const back = moveBlock(moved, 'b_img', { columnId: rowsOf(d)[0]!.columns[1]!.id })
    expect(findBlock(back, 'b_img')!.block).toMatchObject({ width: 'full' })
    const stays = moveBlock(d, 'b_img', { columnId: rowsOf(d)[0]!.columns[1]!.id, index: 0 })
    expect(findBlock(stays, 'b_img')!.block).toMatchObject({ width: 400 })
  })

  it('insertBlock, insertRow and duplicateRow keep images within their columns', () => {
    const d = wide()
    const inserted = insertBlock(d, image('b_two', 300), rowsOf(d)[0]!.columns[0]!.id)
    expect(findBlock(inserted, 'b_two')!.block).toMatchObject({ width: 'full' })
    const narrow: BlockDesign = { ...emptyBlockDesign(), settings: { ...d.settings, width: 480 } }
    const row = createRow('100')
    row.columns[0]!.blocks = [image('b_saved', 560)]
    const withRow = insertRow(narrow, row)
    expect(findBlock(withRow, 'b_saved')!.block).toMatchObject({ width: 'full' })
    expect(blockDesignErrors(withRow)).toEqual([])
    const copied = duplicateRow(withRow, withRow.rows[0]!.id)
    expect(blockDesignErrors(copied)).toEqual([])
  })

  it('a keyboard move into a narrower column emits a design the server accepts', async () => {
    const { last } = mount(wide())
    fireEvent.keyDown(cells()[0]!, { key: 'ArrowLeft', altKey: true })
    expect(rowsOf(last())[0]!.columns[0]!.blocks).toHaveLength(1)
    expect(blockDesignErrors(last())).toEqual([])
    expect(allBlocks(last())[0]).toMatchObject({ width: 'full' })
  })

  it('a saved row from a wider email is inserted within this one', async () => {
    const row = createRow('100')
    row.columns[0]!.blocks = [image('b_saved', 560)]
    const saved: SavedRow = { id: 1, name: 'Wide', row }
    const narrow = {
      ...emptyBlockDesign(),
      settings: { ...emptyBlockDesign().settings, width: 480 },
    }
    const { last } = mount(narrow, {
      savedRows: { list: async () => [saved], save: vi.fn(), remove: vi.fn() },
    })
    await userEvent.click(await screen.findByRole('button', { name: 'Wide' }))
    expect(blockDesignErrors(last())).toEqual([])
    expect(allBlocks(last())[0]).toMatchObject({ width: 'full' })
  })

  it('turns down any action that would add a problem the server refuses', async () => {
    const bad = createRow('100', [{ ...createBlock('spacer', 'b_bad'), ui: 1 } as never])
    const saved: SavedRow = { id: 2, name: 'Broken', row: bad }
    const { changes } = mount(null, {
      savedRows: { list: async () => [saved], save: vi.fn(), remove: vi.fn() },
    })
    await userEvent.click(await screen.findByRole('button', { name: 'Broken' }))
    expect(changes).toHaveLength(0)
    expect(screen.getByText(/Is not a known property/)).toBeInTheDocument()
  })
})

describe('3. the server’s URL rule', () => {
  const WEB = ['http', 'https']
  const LINK = ['http', 'https', 'mailto', 'tel']
  const ok: Array<[string, string[]]> = [
    ['https://x.test/{{ deal.id }}', WEB],
    ['https://x.test/{{ p | default:"a" }}', WEB],
    ['https://x.test/?id={{ contact.id }}', WEB],
    ['{{ brand.website|https://example.com }}', WEB],
    ['{{ base }}/pricing', WEB],
    ['{{ base }}?a=1', WEB],
    ['{{ base }}#top', WEB],
    ['{{ a }}{{ b }}/x', WEB],
    ['  https://x.test/trim  ', WEB],
    ['mailto:a@b.test', LINK],
    ['tel:+61400000000', LINK],
    ['HTTPS://X.TEST', WEB],
  ]
  const refused: Array<[string, string[]]> = [
    ['{{x}}" onclick="alert(1)', WEB],
    ['{{ _x }}javascript:alert(1)', WEB],
    ['{{x}}javascript:alert(1)', WEB],
    ['{{ x }} javascript:alert(1)', WEB],
    ['{{ x }}foo', WEB],
    ['{{ x }} x', WEB],
    ['javascript:alert(1)', LINK],
    ['https://x.test/a b', WEB],
    ['https://x.test/"x', WEB],
    ['https://x.test/<b>', WEB],
    ['https://x.test/a\\b', WEB],
    ['https://x.test/a\u0001b', WEB],
    ['x.test', WEB],
    ['ftp://x.test', WEB],
    ['mailto:a@b.test', WEB],
    ['https://x.test/{{ unterminated', WEB],
    ['{{ unterminated', WEB],
    ['', WEB],
    ['   ', WEB],
    [`https://x.test/${'a'.repeat(2000)}`, WEB],
  ]

  it.each(ok)('accepts %s', (value, schemes) => {
    expect(urlProblem(value, schemes)).toBeNull()
  })
  it.each(refused)('refuses %s', (value, schemes) => {
    expect(urlProblem(value, schemes)).not.toBeNull()
  })
  it('counts the length after trimming, in characters', () => {
    expect(urlProblem(`https://x.test/${'a'.repeat(1985)}`, WEB)).toBeNull() // 2000
    expect(urlProblem(` https://x.test/${'a'.repeat(1985)} `, WEB)).toBeNull()
    expect(urlProblem(`https://x.test/${'a'.repeat(1986)}`, WEB)).not.toBeNull()
    expect(urlProblem(`https://x.test/${'é'.repeat(1985)}`, WEB)).toBeNull()
  })
  it('says why, as the server does', () => {
    expect(urlProblem('{{ x }}foo', WEB)).toBe(
      'must be a whole merge field, or one followed by /, ? or #',
    )
    expect(urlProblem('ftp://x.test', LINK)).toBe('must start with http:, https:, mailto:, tel:')
  })

  it('uses the right schemes for each prop', () => {
    const only = (block: unknown) => ({
      ...emptyBlockDesign(),
      rows: [createRow('100', [block as never])],
    })
    const errs = (block: unknown) =>
      blockDesignErrors(only(block)).map((i) => i.path.split('.').pop())
    expect(errs({ ...createBlock('button', 'b_x'), url: 'mailto:a@b.test' })).toEqual([])
    expect(errs({ ...image('b_x', 'full'), link: 'tel:+61400000000' })).toEqual([])
    expect(errs({ ...image('b_x', 'full'), src: 'mailto:a@b.test' })).toEqual(['src'])
    expect(errs({ ...createBlock('avatar', 'b_x'), src: 'tel:1' })).toEqual(['src'])
    expect(errs({ ...createBlock('video', 'b_x'), url: 'mailto:a@b.test' })).toEqual(['url'])
    expect(
      errs({
        ...createBlock('social', 'b_x'),
        source: 'custom',
        links: [{ network: 'x', url: 'mailto:a@b.test' }],
      }),
    ).toEqual(['url'])
    expect(
      errs({ ...createBlock('button', 'b_x'), url: 'https://x.test/?id={{ contact.id }}' }),
    ).toEqual([])
    expect(errs({ ...createBlock('button', 'b_x'), url: '{{ x }}foo' })).toEqual(['url'])
  })

  it('emits an address without its surrounding spaces', async () => {
    const { last } = mount()
    await addBlock('Button')
    await userEvent.type(screen.getByLabelText('Link address'), '  https://book.test/  ')
    expect(allBlocks(last())[0]).toMatchObject({ url: 'https://book.test/' })
  })
})

describe('4-8. smaller server-parity fixes', () => {
  it('4. matches the YouTube host without regard to case', () => {
    expect(youtubeId('https://WWW.YouTube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeId('HTTPS://YOUTU.BE/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeId('https://m.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeId('https://youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    // The video id keeps its case; paths are case-sensitive as on the server.
    expect(youtubeId('https://youtube.com/EMBED/dQw4w9WgXcQ')).toBeNull()
    expect(youtubeId('https://youtube.com/watch?v=DQW4W9WGXCQ')).toBe('DQW4W9WGXCQ')
    expect(youtubeId('https://notyoutube.com/watch?v=dQw4w9WgXcQ')).toBeNull()
  })

  it('5. refuses rows: null, and accepts missing rows', () => {
    const d = emptyBlockDesign()
    expect(
      validateBlockDesign({ ...d, rows: null }).map((i) => [i.path, i.message]),
    ).toContainEqual(['rows', 'Must be a list'])
    const { rows: _rows, ...noRows } = d
    expect(blockDesignErrors(noRows)).toEqual([])
  })

  it('6. gives the footer no outside padding by default, like the server', () => {
    expect(DEFAULT_BLOCK_PADDING.footer).toEqual([0, 0, 0, 0])
    const read = toBlockDesign({
      ...emptyBlockDesign(),
      rows: [createRow('100', [{ id: 'b_f', type: 'footer' } as never])],
    })!
    expect((allBlocks(read)[0] as { style: { padding: number[] } }).style.padding).toEqual([
      0, 0, 0, 0,
    ])
  })

  it('7. counts the size as Python’s json.dumps writes it', () => {
    const text = (id: string, n: number): TextBlock =>
      ({ ...createBlock('text', id), html: 'x'.repeat(n) }) as TextBlock
    const build = (last: number): BlockDesign => ({
      ...emptyBlockDesign(),
      rows: [createRow('100', [text('b_1', 90_000), text('b_2', 90_000), text('b_3', last)])],
    })
    const compact = (d: BlockDesign) => new TextEncoder().encode(JSON.stringify(d)).length
    // Find the longest last block whose compact JSON still fits.
    let n = 80_000
    while (compact(build(n + 1)) <= MAX_DESIGN_BYTES) n++
    expect(compact(build(n))).toBeLessThanOrEqual(MAX_DESIGN_BYTES)
    // Python's separators add bytes, so the server counts it over the limit.
    const sized = (d: BlockDesign) => validateBlockDesign(d).some((i) => /KB/.test(i.message))
    expect(sized(build(n))).toBe(true)
    expect(sized(build(n - 200))).toBe(false)
  })

  it('8. fills a YouTube video’s thumbnail on read, as the server does', () => {
    const video = { ...createBlock('video', 'b_v'), url: 'https://youtu.be/dQw4w9WgXcQ' }
    const read = toBlockDesign({ ...emptyBlockDesign(), rows: [createRow('100', [video])] })!
    expect(allBlocks(read)[0]).toMatchObject({
      thumbnail: { src: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg' },
    })
    expect(withDefaults(read)).toEqual(read)
    // Another host is left alone, and an author's thumbnail wins.
    const other = { ...video, url: 'https://vimeo.com/1' }
    expect(
      allBlocks(toBlockDesign({ ...emptyBlockDesign(), rows: [createRow('100', [other])] })!)[0],
    ).not.toHaveProperty('thumbnail')
    const own = { ...video, thumbnail: { src: 'https://x.test/t.png' } }
    expect(
      allBlocks(toBlockDesign({ ...emptyBlockDesign(), rows: [createRow('100', [own])] })!)[0],
    ).toMatchObject({
      thumbnail: { src: 'https://x.test/t.png' },
    })
  })
})

describe('9. a move that changes nothing is not an undo step', () => {
  it('leaves Undo disabled after choosing the layout a row already has', async () => {
    const { changes } = mount()
    await userEvent.click(layouts().getByRole('button', { name: 'Layout 100' }))
    const before = changes.length
    // Undo is enabled for the add; undo it, then redo state is the clean slate.
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }))
    await userEvent.click(layouts().getByRole('button', { name: 'Layout 100' }))
    const props = within(screen.getByRole('complementary', { name: 'Properties' }))
    const stepsBefore = changes.length
    await userEvent.click(props.getByRole('button', { name: 'Row layout 100' }))
    expect(changes).toHaveLength(stepsBefore)
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }))
    // One undo goes straight back to the empty email: no extra step was stored.
    expect(changes.at(-1)!.rows).toHaveLength(0)
    expect(before).toBeGreaterThan(0)
  })
})

describe('10. a heading joins lines instead of dropping them', () => {
  it('joins paragraphs and line breaks with a space', () => {
    expect(joinLines('<p>One</p><p>Two</p><p>Three</p>')).toBe('One Two Three')
    expect(joinLines('One<br>Two<br/>Three')).toBe('One Two Three')
    expect(joinLines('<p>A <strong>b</strong></p>')).toBe('A <strong>b</strong>')
    expect(contentForEditor('One</p><p>Two', 'heading')).toBe('<p>One Two</p>')
    expect(contentForEditor('<p>x</p>', 'text')).toBe('<p>x</p>')
  })

  it('loads a heading with several paragraphs as one line', async () => {
    const heading = { ...createBlock('heading', 'b_h'), html: 'One</p><p>Two' } as HeadingBlock
    mount({ ...emptyBlockDesign(), rows: [createRow('100', [heading])] })
    fireEvent.click(cells()[0]!)
    const box = await screen.findByRole('textbox', { name: 'Heading text' })
    expect(box).toHaveTextContent('One Two')
  })
})

describe('11. the undo shortcut is attached once', () => {
  it('does not re-attach its keydown listener when the editor re-renders', async () => {
    const add = vi.spyOn(window, 'addEventListener')
    mount()
    const count = () => add.mock.calls.filter(([type]) => type === 'keydown').length
    const first = count()
    await addBlock('Spacer')
    await addBlock('Divider')
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(count()).toBe(first)
    // And it still undoes.
    const spacer = cells()[0]!
    spacer.focus()
    fireEvent.keyDown(spacer, { key: 'y', ctrlKey: true })
    expect(cells()).toHaveLength(2)
  })
})

describe('12. accessibility', () => {
  const narrow = () =>
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query) =>
        ({
          matches: false,
          media: query,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
        }) as unknown as MediaQueryList,
    )

  it('a sheet traps Tab and gives focus back when it closes', async () => {
    narrow()
    mount()
    const open = screen.getByRole('button', { name: /Add$/ })
    open.focus()
    await userEvent.click(open)
    const dialog = screen.getByRole('dialog', { name: 'Add to the email' })
    const close = within(dialog).getByRole('button', { name: 'Close Add to the email' })
    expect(document.activeElement).toBe(close)
    // Shift+Tab from the first control wraps to the last one.
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true })
    const items = dialog.querySelectorAll<HTMLElement>('button:not(:disabled)')
    expect(document.activeElement).toBe(items[items.length - 1])
    // Tab from the last wraps to the first.
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' })
    expect(document.activeElement).toBe(close)
    await act(async () => {
      fireEvent.keyDown(dialog, { key: 'Escape' })
    })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(open)
  })

  it('the width switch is a group of toggle buttons', async () => {
    mount()
    const group = screen.getByRole('group', { name: 'Canvas width' })
    expect(within(group).getByRole('button', { name: 'Desktop' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(within(group).getByRole('button', { name: 'Mobile' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.queryByRole('tab')).toBeNull()
  })

  it('links a field’s error to the field', async () => {
    mount()
    await addBlock('Button')
    const url = screen.getByLabelText('Link address')
    await userEvent.type(url, 'javascript:x')
    const alert = screen.getByRole('alert')
    expect(url).toHaveAttribute('aria-invalid', 'true')
    expect(url.getAttribute('aria-describedby')).toBe(alert.id)
    expect(alert.id).not.toBe('')
  })

  it('announces keyboard moves, and the ones that cannot happen', async () => {
    mount()
    await addBlock('Spacer')
    await addBlock('Divider')
    const live = () => document.querySelector('[aria-live="polite"]')!.textContent
    fireEvent.keyDown(cells()[0]!, { key: 'ArrowDown', altKey: true })
    expect(live()).toBe('Moved Spacer block “24 pixels” to position 2 in column 1 of row 1.')
    fireEvent.keyDown(cells()[1]!, { key: 'ArrowDown', altKey: true })
    expect(live()).toMatch(/cannot move any further/)
  })
})

describe('13. the heading’s own size', () => {
  it('shows the size that comes from its level until one is set', async () => {
    mount()
    await addBlock('Heading')
    const size = () => screen.getByRole('spinbutton', { name: /^Font size/ })
    expect(size()).toHaveValue(24)
    await userEvent.click(screen.getByRole('button', { name: 'H1' }))
    expect(size()).toHaveValue(32)
    await userEvent.click(screen.getByRole('button', { name: 'H3' }))
    expect(size()).toHaveValue(20)
  })
})

describe('saved rows get the design width', () => {
  it('passes the email’s width when saving a row', async () => {
    const save = vi.fn(
      async (name: string, row: Row, _width?: number) => ({ id: 1, name, row }) as SavedRow,
    )
    const design = {
      ...emptyBlockDesign(),
      settings: { ...emptyBlockDesign().settings, width: 640 },
    }
    mount(design, { savedRows: { list: async () => [], save, remove: vi.fn() } })
    await screen.findByText(/No saved rows yet/)
    await userEvent.click(layouts().getByRole('button', { name: 'Layout 100' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save as row' }))
    const form = within(screen.getByRole('dialog', { name: 'Save as row' }))
    await userEvent.type(form.getByLabelText('Name'), 'Intro')
    await userEvent.click(form.getByRole('button', { name: 'Save row' }))
    await vi.waitFor(() => expect(save).toHaveBeenCalled())
    expect(save.mock.calls[0]![2]).toBe(640)
  })
})
