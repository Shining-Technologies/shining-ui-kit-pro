import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BlockEditor } from '../block-editor/block-editor'
import type { BlockEditorProps, SavedRow } from '../block-editor/types'
import {
  allBlocks,
  blockDesignErrors,
  createBlock,
  createRow,
  emptyBlockDesign,
  emptyDesign,
  validateBlockDesign,
  type AvatarBlock,
  type BlockDesign,
  type ButtonBlock,
  type ImageBlock,
  type VideoBlock,
  type SpacerBlock,
  type TextBlock,
} from '../design'

const fields = [{ key: 'contact.first_name', label: 'First name', group: 'Contact' }]
const brand = {
  primary_color: '#aa0000',
  heading_font: 'georgia',
  business_name: 'Acme',
  social_links: [{ network: 'facebook', url: 'https://fb.test/acme' }],
}

type Extra = Partial<BlockEditorProps>

/** Mounts a controlled editor and records every design it emits. */
function mount(initial: unknown = null, extra: Extra = {}) {
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
        mergeFields={fields}
        brand={brand}
        {...extra}
      />
    )
  }
  render(<Harness />)
  const last = () => changes.at(-1)!
  return { changes, last }
}

const blocksPalette = () => within(screen.getByRole('region', { name: 'Blocks' }))
const layoutsPalette = () => within(screen.getByRole('region', { name: 'Layouts' }))
const addBlock = (name: string) => userEvent.click(blocksPalette().getByRole('button', { name }))
const cells = () => Array.from(document.querySelectorAll<HTMLElement>('[data-block-id]'))
const cellTypes = () => cells().map((el) => el.getAttribute('data-type'))

afterEach(() => vi.restoreAllMocks())

describe('BlockEditor: the shell', () => {
  it('shows the palette groups, an empty canvas and the email settings', () => {
    mount()
    expect(screen.getByRole('region', { name: 'Layouts' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Blocks' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Saved rows' })).toBeNull()
    for (const name of [
      'Heading',
      'Text',
      'Image',
      'Avatar',
      'Button',
      'Divider',
      'Spacer',
      'Social',
      'Video',
      'Footer',
      'HTML',
    ]) {
      expect(blocksPalette().getByRole('button', { name })).toBeInTheDocument()
    }
    for (const layout of ['100', '50 / 50', '33 / 67', '67 / 33', '33 / 34 / 33']) {
      expect(layoutsPalette().getByRole('button', { name: `Layout ${layout}` })).toBeInTheDocument()
    }
    expect(screen.getByText('This email is empty')).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Properties' })).toHaveTextContent(
      'Email settings',
    )
  })

  it('shows a notice for a rich-text design', () => {
    mount(emptyDesign('<p>x</p>'))
    expect(screen.getByRole('status')).toHaveTextContent('written as rich text')
    expect(screen.queryByRole('region', { name: 'Blocks' })).toBeNull()
  })

  it('has no palette or toolbars when disabled', () => {
    const design: BlockDesign = {
      ...emptyBlockDesign(),
      rows: [createRow('100', [createBlock('spacer', 'b_1')])],
    }
    mount(design, { disabled: true })
    expect(screen.queryByRole('region', { name: 'Blocks' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull()
    userEvent.click(cells()[0]!)
    expect(screen.queryByRole('toolbar', { name: /actions/ })).toBeNull()
  })
})

describe('BlockEditor: adding, deleting and duplicating', () => {
  it('adds a block by clicking its tile, into a new row, and selects it', async () => {
    const { last } = mount()
    await addBlock('Divider')
    expect(cellTypes()).toEqual(['divider'])
    expect(last().rows).toHaveLength(1)
    expect(allBlocks(last()).map((b) => b.type)).toEqual(['divider'])
    expect(screen.getByRole('toolbar', { name: 'Divider block actions' })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Properties' })).toHaveTextContent('Divider')
  })

  it('adds the next block after the selected one, in the same column', async () => {
    const { last } = mount()
    await addBlock('Spacer')
    await addBlock('Divider')
    await addBlock('Button')
    expect(last().rows).toHaveLength(1)
    expect(cellTypes()).toEqual(['spacer', 'divider', 'button'])
  })

  it('adds a layout row, then a block goes into its first column', async () => {
    const { last } = mount()
    await userEvent.click(layoutsPalette().getByRole('button', { name: 'Layout 50 / 50' }))
    expect(last().rows[0]!.columns.map((c) => c.width)).toEqual([50, 50])
    await addBlock('Heading')
    expect(last().rows[0]!.columns[0]!.blocks).toHaveLength(1)
    expect(last().rows[0]!.columns[1]!.blocks).toHaveLength(0)
  })

  it('deletes a block from its toolbar and selects its neighbour', async () => {
    const { last } = mount()
    await addBlock('Spacer')
    await addBlock('Divider')
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(cellTypes()).toEqual(['spacer'])
    expect(allBlocks(last())).toHaveLength(1)
    expect(document.querySelector('[data-selected]')).toHaveAttribute('data-type', 'spacer')
  })

  it('duplicates a block with a new id right after it and selects the copy', async () => {
    const { last } = mount()
    await addBlock('Spacer')
    const originalId = allBlocks(last())[0]!.id
    await userEvent.click(screen.getByRole('button', { name: 'Duplicate' }))
    const blocks = allBlocks(last())
    expect(blocks).toHaveLength(2)
    expect(blocks[0]!.id).toBe(originalId)
    expect(blocks[1]!.id).not.toBe(originalId)
    expect(cells()[1]).toHaveAttribute('data-selected')
  })

  it('adds from a "+" insertion point', async () => {
    const { last } = mount()
    await userEvent.click(layoutsPalette().getByRole('button', { name: 'Layout 100' }))
    await userEvent.click(screen.getByRole('button', { name: 'Add a block here' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Divider' }))
    expect(allBlocks(last()).map((b) => b.type)).toEqual(['divider'])
    // Between blocks: a new one goes before the first.
    const first = cells()[0]!
    await userEvent.click(within(first).getAllByRole('button', { name: 'Add a block here' })[0]!)
    await userEvent.click(screen.getByRole('menuitem', { name: 'Spacer' }))
    expect(allBlocks(last()).map((b) => b.type)).toEqual(['spacer', 'divider'])
  })

  it('refuses a second footer from the palette and the "+" menu', async () => {
    const { last } = mount()
    await addBlock('Footer')
    expect(allBlocks(last()).map((b) => b.type)).toEqual(['footer'])
    const tile = blocksPalette().getByRole('button', { name: 'Footer' })
    expect(tile).toBeDisabled()
    await userEvent.click(tile)
    expect(allBlocks(last())).toHaveLength(1)
    await userEvent.click(screen.getAllByRole('button', { name: 'Add a block here' })[0]!)
    expect(screen.getByRole('menuitem', { name: 'Footer' })).toBeDisabled()
    // A footer cannot be duplicated either.
    expect(screen.getByRole('button', { name: 'Duplicate' })).toBeDisabled()
  })
})

describe('BlockEditor: keyboard', () => {
  it('selects with Enter, moves with Alt+arrows and deletes with Delete', async () => {
    const { last } = mount()
    await addBlock('Spacer')
    await addBlock('Divider')
    await addBlock('Button')
    const ids = () => allBlocks(last()).map((b) => b.type)
    expect(ids()).toEqual(['spacer', 'divider', 'button'])

    fireEvent.click(document.querySelector('.seb-canvas')!)
    expect(document.querySelector('[data-selected]')).toBeNull()
    const spacer = cells()[0]!
    spacer.focus()
    fireEvent.keyDown(spacer, { key: 'Enter' })
    expect(spacer).toHaveAttribute('data-selected')

    fireEvent.keyDown(cells()[0]!, { key: 'ArrowDown', altKey: true })
    expect(ids()).toEqual(['divider', 'spacer', 'button'])
    fireEvent.keyDown(cells()[1]!, { key: 'ArrowDown', altKey: true })
    expect(ids()).toEqual(['divider', 'button', 'spacer'])
    // At the edge nothing moves.
    const before = last()
    fireEvent.keyDown(cells()[2]!, { key: 'ArrowDown', altKey: true })
    expect(last()).toBe(before)
    fireEvent.keyDown(cells()[2]!, { key: 'ArrowUp', altKey: true })
    expect(ids()).toEqual(['divider', 'spacer', 'button'])

    fireEvent.keyDown(cells()[0]!, { key: 'Delete' })
    expect(ids()).toEqual(['spacer', 'button'])
  })

  it('moves a block into the neighbouring column with Alt+arrows', async () => {
    const { last } = mount()
    await userEvent.click(layoutsPalette().getByRole('button', { name: 'Layout 50 / 50' }))
    await addBlock('Spacer')
    fireEvent.keyDown(cells()[0]!, { key: 'ArrowRight', altKey: true })
    expect(last().rows[0]!.columns[0]!.blocks).toHaveLength(0)
    expect(last().rows[0]!.columns[1]!.blocks).toHaveLength(1)
  })

  it('ignores Delete typed inside a field', async () => {
    mount()
    await addBlock('Spacer')
    const input = screen.getByRole('spinbutton', { name: /Height/ })
    fireEvent.keyDown(input, { key: 'Delete' })
    expect(cellTypes()).toEqual(['spacer'])
  })
})

describe('BlockEditor: undo and redo', () => {
  it('undoes and redoes with the buttons', async () => {
    const { last } = mount()
    await addBlock('Spacer')
    await addBlock('Divider')
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(allBlocks(last()).map((b) => b.type)).toEqual(['spacer'])
    await userEvent.click(screen.getByRole('button', { name: 'Redo' }))
    expect(allBlocks(last()).map((b) => b.type)).toEqual(['spacer', 'divider'])
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }))
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(last().rows).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled()
  })

  it('undoes with Cmd/Ctrl+Z and redoes with Shift+Z or Y', async () => {
    const { last } = mount()
    await addBlock('Spacer')
    await addBlock('Divider')
    const cell = cells()[1]!
    cell.focus()
    fireEvent.keyDown(cell, { key: 'z', ctrlKey: true })
    expect(allBlocks(last())).toHaveLength(1)
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
    })
    expect(allBlocks(last())).toHaveLength(2)
    fireEvent.keyDown(cells()[0]!, { key: 'z', metaKey: true })
    expect(allBlocks(last())).toHaveLength(1)
    fireEvent.keyDown(cells()[0]!, { key: 'y', ctrlKey: true })
    expect(allBlocks(last())).toHaveLength(2)
  })

  it('leaves Ctrl+Z to a field that has focus', async () => {
    const { last } = mount()
    await addBlock('Spacer')
    const input = screen.getByRole('spinbutton', { name: /Height/ })
    input.focus()
    fireEvent.keyDown(input, { key: 'z', ctrlKey: true })
    expect(allBlocks(last())).toHaveLength(1)
  })

  it('makes typing in one field a single undo step', async () => {
    const { last } = mount()
    await addBlock('Spacer')
    const input = screen.getByRole('spinbutton', { name: /Height/ })
    await userEvent.clear(input)
    await userEvent.type(input, '60')
    expect((allBlocks(last())[0] as SpacerBlock).height).toBe(60)
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }))
    // One step back from the typing, not one per key.
    expect((allBlocks(last())[0] as SpacerBlock).height).toBe(24)
  })

  it('starts a new history when the value is replaced from outside', async () => {
    function Harness() {
      const [value, setValue] = useState<unknown>(null)
      return (
        <>
          <BlockEditor value={value} onChange={setValue} mergeFields={fields} brand={brand} />
          <button type="button" onClick={() => setValue(emptyBlockDesign())}>
            load
          </button>
        </>
      )
    }
    render(<Harness />)
    await addBlock('Spacer')
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled()
    await userEvent.click(screen.getByRole('button', { name: 'load' }))
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled()
  })
})

describe('BlockEditor: saved rows', () => {
  const savedDesign = (): SavedRow => {
    const row = createRow('50-50', [createBlock('heading', 'b_sv_h')])
    row.id = 'r_sv'
    row.columns[0]!.id = 'c_sv_1'
    row.columns[1]!.id = 'c_sv_2'
    row.columns[1]!.blocks = [createBlock('spacer', 'b_sv_s')]
    return { id: 7, name: 'Signature', row }
  }

  it('lists saved rows and inserts a copy with new ids', async () => {
    const saved = savedDesign()
    const list = vi.fn().mockResolvedValue([saved])
    const { last } = mount(null, {
      savedRows: { list, save: vi.fn(), remove: vi.fn() },
    })
    const group = await screen.findByRole('region', { name: 'Saved rows' })
    await userEvent.click(await within(group).findByRole('button', { name: 'Signature' }))
    expect(last().rows).toHaveLength(1)
    const row = last().rows[0]!
    const oldIds = ['r_sv', 'c_sv_1', 'c_sv_2', 'b_sv_h', 'b_sv_s']
    const newIds = [row.id, ...row.columns.flatMap((c) => [c.id, ...c.blocks.map((b) => b.id)])]
    expect(newIds).toHaveLength(5)
    expect(newIds.filter((id) => oldIds.includes(id))).toEqual([])
    expect(blockDesignErrors(last())).toEqual([])
    // Inserting it again never repeats an id.
    await userEvent.click(within(group).getByRole('button', { name: 'Signature' }))
    const ids = last().rows.flatMap((r) => [
      r.id,
      ...r.columns.flatMap((c) => [c.id, ...c.blocks.map((b) => b.id)]),
    ])
    expect(new Set(ids).size).toBe(ids.length)
    expect(blockDesignErrors(last())).toEqual([])
  })

  it('says so when there are none, and reports a failure', async () => {
    const list = vi.fn().mockRejectedValueOnce(new Error('Offline')).mockResolvedValue([])
    mount(null, { savedRows: { list, save: vi.fn(), remove: vi.fn() } })
    expect(await screen.findByText('Offline')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText(/No saved rows yet/)).toBeInTheDocument()
  })

  it('saves the selected row under a name and lists it', async () => {
    const save = vi.fn(async (name: string, row) => ({ id: 9, name, row }) as SavedRow)
    mount(null, { savedRows: { list: async () => [], save, remove: vi.fn() } })
    await screen.findByText(/No saved rows yet/)
    await userEvent.click(layoutsPalette().getByRole('button', { name: 'Layout 100' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save as row' }))
    const form = within(screen.getByRole('dialog', { name: 'Save as row' }))
    await userEvent.click(form.getByRole('button', { name: 'Save row' }))
    expect(form.getByText('Give the row a name')).toBeInTheDocument()
    await userEvent.type(form.getByLabelText('Name'), 'Intro')
    await userEvent.click(form.getByRole('button', { name: 'Save row' }))
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1))
    expect(save.mock.calls[0]![0]).toBe('Intro')
    expect(save.mock.calls[0]![1]).toMatchObject({ columns: [{ width: 100 }] })
    expect(await screen.findByRole('button', { name: 'Intro' })).toBeInTheDocument()
  })

  it('deletes a saved row after a confirmation', async () => {
    const remove = vi.fn().mockResolvedValue(undefined)
    mount(null, { savedRows: { list: async () => [savedDesign()], save: vi.fn(), remove } })
    await userEvent.click(await screen.findByRole('button', { name: 'Delete saved row Signature' }))
    expect(remove).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: /Delete “Signature”\?/ }))
    expect(remove).toHaveBeenCalledWith(7)
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Signature' })).toBeNull())
  })
})

describe('BlockEditor: devices', () => {
  const design = (): BlockDesign => {
    const row = createRow('50-50', [createBlock('spacer', 'b_1')])
    row.columns[1]!.hide_on = 'mobile'
    const hidden = createRow('100', [createBlock('divider', 'b_2')])
    hidden.hide_on = 'desktop'
    return { ...emptyBlockDesign(), rows: [row, hidden] }
  }
  const email = () => document.querySelector<HTMLElement>('.seb-email')!

  it('draws desktop at the design width and mobile at 360, as real widths', async () => {
    mount({ ...design(), settings: { ...design().settings, width: 640 } })
    expect(email()).toHaveStyle({ width: '640px' })
    expect(email().style.transform).toBe('')
    await userEvent.click(screen.getByRole('tab', { name: 'Mobile' }))
    expect(email()).toHaveStyle({ width: '360px' })
    expect(email()).toHaveAttribute('data-device', 'mobile')
    expect(email().style.transform).toBe('')
    expect(screen.getByRole('tab', { name: 'Mobile' })).toHaveAttribute('aria-selected', 'true')
  })

  it('dims what is hidden on the device and says so', async () => {
    mount(design())
    // Desktop: the row hidden on desktop.
    expect(screen.getByText('Hidden on desktop')).toBeInTheDocument()
    expect(screen.queryByText('Hidden on mobile')).toBeNull()
    expect(document.querySelectorAll('[data-hidden]')).toHaveLength(1)
    await userEvent.click(screen.getByRole('tab', { name: 'Mobile' }))
    expect(screen.getByText('Hidden on mobile')).toBeInTheDocument()
    expect(screen.queryByText('Hidden on desktop')).toBeNull()
    expect(document.querySelector('.seb-col[data-hidden]')).not.toBeNull()
  })

  it('can be controlled', async () => {
    const onDeviceChange = vi.fn()
    mount(design(), { device: 'mobile', onDeviceChange })
    expect(email()).toHaveAttribute('data-device', 'mobile')
    await userEvent.click(screen.getByRole('tab', { name: 'Desktop' }))
    expect(onDeviceChange).toHaveBeenCalledWith('desktop')
    // Controlled: it stays on mobile until the parent says otherwise.
    expect(email()).toHaveAttribute('data-device', 'mobile')
  })

  it('stacks the columns on mobile', async () => {
    mount(design())
    expect(document.querySelector('.seb-columns')).not.toHaveAttribute('data-stacked')
    await userEvent.click(screen.getByRole('tab', { name: 'Mobile' }))
    expect(document.querySelector('.seb-columns')).toHaveAttribute('data-stacked')
  })
})

describe('BlockEditor: properties', () => {
  it('edits a block and emits a design the server would accept', async () => {
    const { last } = mount()
    await addBlock('Spacer')
    const height = screen.getByRole('spinbutton', { name: /Height/ })
    await userEvent.clear(height)
    await userEvent.type(height, '48')
    expect((allBlocks(last())[0] as SpacerBlock).height).toBe(48)
    expect(blockDesignErrors(last())).toEqual([])
  })

  it('does not commit a value outside its range', async () => {
    const { last } = mount()
    await addBlock('Spacer')
    const height = screen.getByRole('spinbutton', { name: /Height/ })
    await userEvent.clear(height)
    await userEvent.type(height, '3')
    expect((allBlocks(last())[0] as SpacerBlock).height).toBe(24)
    await userEvent.tab()
    expect(height).toHaveValue(24)
  })

  it('refuses an address the server would, and says why', async () => {
    const { last } = mount()
    await addBlock('Button')
    const url = screen.getByLabelText('Link address')
    await userEvent.type(url, 'javascript:alert(1)')
    expect(screen.getByRole('alert')).toHaveTextContent('must start with')
    expect((allBlocks(last())[0] as ButtonBlock).url).toBe('')
    await userEvent.clear(url)
    await userEvent.type(url, 'https://book.test/')
    expect((allBlocks(last())[0] as ButtonBlock).url).toBe('https://book.test/')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(blockDesignErrors(last())).toEqual([])
  })

  it('applies the button size and shape presets', async () => {
    const { last } = mount()
    await addBlock('Button')
    const style = () => (allBlocks(last())[0] as ButtonBlock).style
    await userEvent.click(screen.getByRole('button', { name: 'Large' }))
    expect(style()).toMatchObject({ padding_y: 16, padding_x: 32 })
    await userEvent.click(screen.getByRole('button', { name: 'Extra small' }))
    expect(style()).toMatchObject({ padding_y: 6, padding_x: 12 })
    await userEvent.click(screen.getByRole('button', { name: 'Pill' }))
    expect(style().radius).toBe(40)
    await userEvent.click(screen.getByRole('button', { name: 'Rectangle' }))
    expect(style().radius).toBe(0)
    await userEvent.click(screen.getByRole('button', { name: 'Rounded' }))
    expect(style().radius).toBe(6)
    expect(screen.getByRole('button', { name: 'Rounded' })).toHaveAttribute('aria-pressed', 'true')
    expect(blockDesignErrors(last())).toEqual([])
  })

  it('offers brand swatches that write brand.<attr>, neutrals, hex and Clear', async () => {
    const { last } = mount()
    await addBlock('Button')
    const style = () => (allBlocks(last())[0] as ButtonBlock).style
    await userEvent.click(screen.getByRole('button', { name: 'Background: brand Link' }))
    expect(style().background).toBe('brand.link_color')
    await userEvent.click(screen.getByRole('button', { name: 'Background: #374151' }))
    expect(style().background).toBe('#374151')
    const hex = screen.getByLabelText('Background: hex')
    await userEvent.clear(hex)
    await userEvent.type(hex, '#12ab34')
    expect(style().background).toBe('#12ab34')
    // The border colour is optional: Clear sets it back to inherit.
    await userEvent.click(screen.getByRole('button', { name: 'Border colour: brand Primary' }))
    expect(style().border_color).toBe('brand.primary_color')
    const group = screen.getByRole('group', { name: 'Border colour' })
    await userEvent.click(within(group).getByRole('button', { name: 'Clear' }))
    expect(style().border_color).toBeUndefined()
    expect(blockDesignErrors(last())).toEqual([])
  })

  it('shows the brand colours as the swatches', async () => {
    mount()
    await addBlock('Button')
    const swatch = screen.getByRole('button', { name: 'Background: brand Primary' })
    expect(swatch).toHaveStyle({ background: '#aa0000' })
  })

  it('edits padding as four inputs, linked or not', async () => {
    const { last } = mount()
    await addBlock('Divider')
    const padding = () =>
      (allBlocks(last())[0] as { style?: { padding?: number[] } }).style?.padding
    const top = screen.getByRole('spinbutton', { name: 'Padding top' })
    // The default [8, 0, 8, 0] is not even, so the sides start unlinked.
    expect(screen.getByRole('checkbox', { name: 'Link all sides' })).not.toBeChecked()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Link all sides' }))
    await userEvent.clear(top)
    await userEvent.type(top, '20')
    expect(padding()).toEqual([20, 20, 20, 20]) // linked: all sides move together
    await userEvent.click(screen.getByRole('checkbox', { name: 'Link all sides' }))
    expect(screen.getByRole('checkbox', { name: 'Link all sides' })).not.toBeChecked()
    const left = screen.getByRole('spinbutton', { name: 'Padding left' })
    await userEvent.clear(left)
    await userEvent.type(left, '4')
    expect(padding()).toEqual([20, 20, 20, 4])
    // Beyond 80 is refused for a block.
    await userEvent.clear(top)
    await userEvent.type(top, '81')
    expect(padding()).toEqual([8, 20, 20, 4]) // "8" was accepted, "81" was not
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(padding()).toBeUndefined()
    expect(blockDesignErrors(last())).toEqual([])
  })

  it('edits an avatar', async () => {
    const { last } = mount()
    await addBlock('Avatar')
    const avatar = () => allBlocks(last())[0] as AvatarBlock
    expect(avatar()).toMatchObject({ size: 64, shape: 'circle' })
    const size = screen.getByRole('spinbutton', { name: /Size/ })
    await userEvent.clear(size)
    await userEvent.type(size, '96')
    expect(avatar().size).toBe(96)
    await userEvent.selectOptions(screen.getByLabelText('Shape'), 'rounded')
    expect(avatar().shape).toBe('rounded')
    await userEvent.type(screen.getByLabelText('Picture address'), 'https://cdn.test/me.png')
    expect(document.querySelector('.seb-b-avatar img')).toHaveAttribute(
      'src',
      'https://cdn.test/me.png',
    )
    expect(blockDesignErrors(last())).toEqual([])
  })

  it('uploads an image through the caller and keeps the asset id', async () => {
    const onUploadImage = vi
      .fn()
      .mockResolvedValue({ url: 'https://cdn.test/a.png', alt: 'A', assetId: 'as_1' })
    const { last } = mount(null, { onUploadImage })
    await addBlock('Image')
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    await userEvent.upload(screen.getByLabelText('Upload an image'), file)
    await waitFor(() =>
      expect(allBlocks(last())[0]).toMatchObject({
        src: 'https://cdn.test/a.png',
        asset_id: 'as_1',
        alt: 'A',
      }),
    )
    expect(onUploadImage).toHaveBeenCalledWith(file)
    expect(blockDesignErrors(last())).toEqual([])
  })

  it('edits the row: layout (keeping blocks), gap, background, hide-on', async () => {
    const { last } = mount()
    await userEvent.click(layoutsPalette().getByRole('button', { name: 'Layout 33 / 34 / 33' }))
    await addBlock('Spacer')
    await userEvent.click(screen.getByRole('button', { name: 'Select row 1' }))
    const props = within(screen.getByRole('complementary', { name: 'Properties' }))
    await userEvent.click(props.getByRole('button', { name: 'Row layout 100' }))
    expect(last().rows[0]!.columns).toHaveLength(1)
    expect(allBlocks(last())).toHaveLength(1)
    await userEvent.click(props.getByRole('button', { name: 'Row layout 50 / 50' }))
    expect(last().rows[0]!.columns.map((c) => c.width)).toEqual([50, 50])
    expect(allBlocks(last())).toHaveLength(1)
    const gap = props.getByRole('spinbutton', { name: /Gap between columns/ })
    await userEvent.clear(gap)
    await userEvent.type(gap, '24')
    expect(last().rows[0]!.gap).toBe(24)
    await userEvent.selectOptions(props.getByLabelText('Hide on'), 'mobile')
    expect(last().rows[0]!.hide_on).toBe('mobile')
    await userEvent.click(props.getByRole('button', { name: 'Background: brand Primary' }))
    expect(last().rows[0]!.background).toBe('brand.primary_color')
    expect(blockDesignErrors(last())).toEqual([])
  })

  it('edits the column from the row', async () => {
    const { last } = mount()
    await userEvent.click(layoutsPalette().getByRole('button', { name: 'Layout 50 / 50' }))
    const props = within(screen.getByRole('complementary', { name: 'Properties' }))
    await userEvent.click(props.getByRole('button', { name: 'Column 2 (50%)' }))
    await userEvent.click(props.getByRole('button', { name: 'Middle' }))
    expect(last().rows[0]!.columns[1]!.valign).toBe('middle')
    await userEvent.selectOptions(props.getByLabelText('Hide on'), 'desktop')
    expect(last().rows[0]!.columns[1]!.hide_on).toBe('desktop')
    await userEvent.click(props.getByRole('button', { name: 'Background: brand Background' }))
    expect(last().rows[0]!.columns[1]!.background).toBe('brand.background_color')
    expect(blockDesignErrors(last())).toEqual([])
  })

  it('edits the email settings when nothing is selected', async () => {
    const { last } = mount()
    const width = screen.getByRole('spinbutton', { name: /^Width/ })
    await userEvent.clear(width)
    await userEvent.type(width, '640')
    expect(last().settings.width).toBe(640)
    expect(document.querySelector('.seb-email')).toHaveStyle({ width: '640px' })
    await userEvent.type(width, '9')
    await userEvent.click(screen.getByRole('button', { name: 'Content background: #f3f4f6' }))
    expect(last().settings.content_background).toBe('#f3f4f6')
    await userEvent.selectOptions(screen.getByLabelText('Font'), 'georgia')
    expect(last().settings.font).toBe('georgia')
    expect(blockDesignErrors(last())).toEqual([])
  })
})

describe('BlockEditor: text blocks', () => {
  it('edits a heading in place and inserts a merge-field chip', async () => {
    const { last } = mount()
    await addBlock('Heading')
    const box = await screen.findByRole('textbox', { name: 'Heading text' })
    expect(box).toHaveTextContent('Heading')
    await userEvent.click(screen.getByRole('button', { name: 'Insert field' }))
    await userEvent.click(screen.getByRole('option', { name: /First name/ }))
    const html = (allBlocks(last())[0] as { html: string }).html
    expect(html).toContain('{{ contact.first_name }}')
    expect(html).not.toContain('<p>')
    expect(blockDesignErrors(last())).toEqual([])
  })

  it('has formatting for text and nothing that adds a button or an image', async () => {
    mount()
    await addBlock('Text')
    const bar = await screen.findByRole('toolbar', { name: 'Formatting' })
    for (const name of [
      'Bold',
      'Italic',
      'Underline',
      'Strikethrough',
      'Link',
      'Text colour',
      'Bulleted list',
      'Numbered list',
      'Quote',
    ]) {
      expect(within(bar).getByRole('button', { name })).toBeInTheDocument()
    }
    expect(within(bar).queryByRole('button', { name: 'Button' })).toBeNull()
    expect(within(bar).queryByRole('button', { name: 'Image' })).toBeNull()
  })

  it('keeps a heading to inline formatting', async () => {
    mount()
    await addBlock('Heading')
    const bar = await screen.findByRole('toolbar', { name: 'Formatting' })
    expect(within(bar).queryByRole('button', { name: 'Bulleted list' })).toBeNull()
    expect(within(bar).getByRole('button', { name: 'Bold' })).toBeInTheDocument()
  })

  it('shows a loaded merge tag as a labelled chip when not being edited', () => {
    const design: BlockDesign = {
      ...emptyBlockDesign(),
      rows: [
        createRow('100', [
          {
            ...(createBlock('text', 'b_1') as TextBlock),
            html: '<p>Hi {{ contact.first_name|there }}</p>',
          },
        ]),
      ],
    }
    mount(design)
    expect(document.querySelector('.seb-b-text .seb-merge-chip')).toHaveTextContent('First name')
  })

  it('never renders markup it does not know', () => {
    const design: BlockDesign = {
      ...emptyBlockDesign(),
      rows: [
        createRow('100', [
          {
            ...(createBlock('text', 'b_1') as TextBlock),
            html: '<p onclick="x()">Hi<script>alert(1)</script><img src=x onerror=y></p>',
          },
        ]),
      ],
    }
    mount(design)
    const text = document.querySelector('.seb-b-text')!
    expect(text.querySelector('script, img')).toBeNull()
    expect(text.innerHTML).not.toContain('onclick')
  })
})

describe('BlockEditor: sheets below 1024px', () => {
  it('moves the palette and properties into sheets', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query) =>
        ({
          matches: false,
          media: query,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
        }) as unknown as MediaQueryList,
    )
    mount()
    expect(screen.queryByRole('region', { name: 'Blocks' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: /Add$/ }))
    const dialog = screen.getByRole('dialog', { name: 'Add to the email' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Divider' }))
    expect(screen.queryByRole('dialog', { name: 'Add to the email' })).toBeNull()
    expect(cellTypes()).toEqual(['divider'])
    // Selecting a block brings its properties up.
    expect(await screen.findByRole('dialog', { name: 'Properties' })).toBeInTheDocument()
    await act(async () => {
      fireEvent.keyDown(screen.getByRole('dialog', { name: 'Properties' }), { key: 'Escape' })
    })
    expect(screen.queryByRole('dialog', { name: 'Properties' })).toBeNull()
  })
})

describe('BlockEditor: every emitted design is valid', () => {
  it('stays valid through a long session of edits', async () => {
    const { changes } = mount(null, {
      savedRows: { list: async () => [], save: vi.fn(), remove: vi.fn() },
    })
    for (const name of [
      'Heading',
      'Text',
      'Image',
      'Avatar',
      'Button',
      'Divider',
      'Spacer',
      'Social',
      'Video',
      'Footer',
      'HTML',
    ]) {
      await addBlock(name)
    }
    await userEvent.click(layoutsPalette().getByRole('button', { name: 'Layout 67 / 33' }))
    await userEvent.click(
      within(screen.getByRole('toolbar', { name: /^Row \d+ actions$/ })).getByRole('button', {
        name: 'Duplicate row',
      }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Move row up' }))
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(changes.length).toBeGreaterThan(10)
    for (const design of changes) expect(blockDesignErrors(design)).toEqual([])
  })
})

describe('BlockEditor: server contract', () => {
  it('prefills a YouTube thumbnail, and never overwrites one the author chose', async () => {
    const { last } = mount()
    await addBlock('Video')
    const video = () => allBlocks(last())[0] as VideoBlock
    await userEvent.type(screen.getByLabelText('Video address'), 'https://youtu.be/dQw4w9WgXcQ')
    expect(video().thumbnail).toEqual({
      src: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    })
    expect(document.querySelector('.seb-video img')).toHaveAttribute(
      'src',
      'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    )
    const thumb = screen.getByLabelText('Thumbnail address')
    await userEvent.clear(thumb)
    await userEvent.type(thumb, 'https://cdn.test/mine.png')
    expect(video().thumbnail).toEqual({ src: 'https://cdn.test/mine.png' })
    const url = screen.getByLabelText('Video address')
    await userEvent.clear(url)
    await userEvent.type(url, 'https://youtu.be/aaaaaaaaaaa')
    expect(video().thumbnail).toEqual({ src: 'https://cdn.test/mine.png' })
    expect(blockDesignErrors(last())).toEqual([])
  })

  it('flags that the footer is shown below the email, wherever it is', async () => {
    mount()
    await addBlock('Footer')
    expect(document.querySelector('.seb-footer-flag')).toHaveTextContent('Shown below the email')
  })

  it('emits no editor-only keys and no legacy social style', async () => {
    const { changes } = mount()
    await addBlock('Social')
    await addBlock('Button')
    await addBlock('Image')
    const json = JSON.stringify(changes.at(-1))
    expect(json).not.toContain('pill')
    expect(json).not.toContain('undefined')
    for (const design of changes)
      expect(validateBlockDesign(design).filter((i) => i.severity === 'error')).toEqual([])
  })

  it('limits an image’s width to its column', async () => {
    const { last } = mount()
    await userEvent.click(layoutsPalette().getByRole('button', { name: 'Layout 33 / 67' }))
    await addBlock('Image')
    await userEvent.click(screen.getByRole('checkbox', { name: 'Full width' }))
    const width = screen.getByRole('spinbutton', { name: /^Width/ })
    await userEvent.clear(width)
    await userEvent.type(width, '198')
    expect((allBlocks(last())[0] as ImageBlock).width).toBe(198)
    await userEvent.type(width, '9')
    expect((allBlocks(last())[0] as ImageBlock).width).toBe(198)
  })
})
