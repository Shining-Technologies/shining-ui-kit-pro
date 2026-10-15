/** Regression tests for the second real-browser run (format bar, row toolbar, saved rows). */
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BlockEditor } from '../block-editor/block-editor'
import type { BlockEditorProps, SavedRow } from '../block-editor/types'
import { createBlock, createRow, emptyBlockDesign, type BlockDesign } from '../design'

function mount(design: BlockDesign, extra: Partial<BlockEditorProps> = {}) {
  function Harness() {
    const [value, setValue] = useState<unknown>(design)
    return (
      <BlockEditor
        value={value}
        onChange={setValue}
        mergeFields={[{ key: 'contact.first_name', label: 'First name' }]}
        brand={{ primary_color: '#aa0000' }}
        {...extra}
      />
    )
  }
  return render(<Harness />)
}

function textDesign(): BlockDesign {
  const row = createRow('50-50', [createBlock('text', 'b_left')])
  row.id = 'r_main'
  row.columns[1]!.blocks = [createBlock('text', 'b_right')]
  return { ...emptyBlockDesign(), rows: [row] }
}

afterEach(() => vi.restoreAllMocks())

describe('format bar placement (A, E)', () => {
  /** happy-dom has no layout: give the cell, the canvas and the bar the sizes of the browser run. */
  function layout(cell: { left: number; right: number; top: number }) {
    const box = (left: number, top: number, width: number, height: number) => ({
      x: left,
      y: top,
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
      toJSON: () => ({}),
    })
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.matches('[data-canvas-scroll]')) return box(257, 43, 686, 900)
      if (this.matches('.seb-cell[data-selected]'))
        return box(cell.left, cell.top, cell.right - cell.left, 90)
      return box(0, 0, 0, 0)
    })
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(686)
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('seb-format') ? 425 : 0
    })
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('seb-format') ? 46 : 0
    })
  }

  async function select(id: string) {
    await userEvent.click(document.querySelector(`[data-block-id="${id}"]`) as HTMLElement)
    await screen.findByRole('toolbar', { name: 'Formatting' })
    return document.querySelector('.seb-format') as HTMLElement
  }

  it('right-aligns to the block when it is in the last column, so it stays left of the block toolbar', async () => {
    layout({ left: 612, right: 856, top: 244 })
    mount(textDesign())
    const bar = await select('b_right')
    // 856 - 425 = 431 in the page, so 431 - 612 in the cell's own coordinates.
    await waitFor(() => expect(bar.style.left).toBe(`${856 - 425 - 612}px`))
    expect(bar.dataset.side).toBe('above')
  })

  it('keeps inside the canvas on the left', async () => {
    layout({ left: 300, right: 400, top: 244 })
    mount(textDesign())
    const bar = await select('b_right')
    // The block is narrow: the bar cannot be wider than the room left of its right edge,
    // so it stops at the canvas's left edge (257 + 4).
    await waitFor(() => expect(Number.parseFloat(bar.style.left) + 300).toBeGreaterThanOrEqual(261))
    expect(Number.parseFloat(bar.style.maxWidth)).toBeLessThanOrEqual(480)
  })

  it('goes below the block when there is no room above it in the scroll area', async () => {
    layout({ left: 612, right: 856, top: 47 })
    mount(textDesign())
    const bar = await select('b_right')
    await waitFor(() => expect(bar.dataset.side).toBe('below'))
  })
})

describe('the row toolbar hangs in the left margin (B)', () => {
  it('is placed in the gutter, not above the row', async () => {
    mount(textDesign())
    await userEvent.click(document.querySelector('[data-row-id="r_main"]') as HTMLElement)
    const bar = screen.getByRole('toolbar', { name: 'Row 1 actions' })
    expect(bar).toHaveAttribute('data-gutter', 'left')
    expect(bar).not.toHaveAttribute('data-side')
  })
})

describe('text colour panel keyboard (C, F)', () => {
  it('Esc closes the colour panel and focus goes back to its button', async () => {
    mount(textDesign())
    await userEvent.click(document.querySelector('[data-block-id="b_left"]') as HTMLElement)
    const trigger = await screen.findByRole('button', { name: 'Text colour' })
    await userEvent.click(trigger)
    const panel = screen.getByRole('form', { name: 'Text colour' })
    // Focus moved into the panel, so Esc reaches it.
    expect(panel.contains(document.activeElement)).toBe(true)
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('form', { name: 'Text colour' })).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('Esc closes the link panel and focus goes back to its button', async () => {
    mount(textDesign())
    await userEvent.click(document.querySelector('[data-block-id="b_left"]') as HTMLElement)
    const trigger = await screen.findByRole('button', { name: 'Link' })
    await userEvent.click(trigger)
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('form', { name: 'Link' })).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('names the Insert field button', async () => {
    mount(textDesign())
    await userEvent.click(document.querySelector('[data-block-id="b_left"]') as HTMLElement)
    const bar = within(await screen.findByRole('toolbar', { name: 'Formatting' }))
    expect(bar.getByRole('button', { name: 'Insert field' })).toHaveAttribute(
      'aria-label',
      'Insert field',
    )
  })
})

describe('read-only saved rows (save and remove are optional)', () => {
  const saved = (): SavedRow => {
    const row = createRow('100', [createBlock('divider', 'b_sv')])
    row.id = 'r_sv'
    return { id: 3, name: 'Signature', row }
  }
  const withRow = () => {
    const row = createRow('100', [createBlock('divider', 'b_x')])
    row.id = 'r_main'
    return { ...emptyBlockDesign(), rows: [row] }
  }

  it('lists and inserts, and offers neither saving nor deleting', async () => {
    mount(withRow(), { savedRows: { list: async () => [saved()] } })
    const group = await screen.findByRole('region', { name: 'Saved rows' })
    expect(within(group).queryByRole('button', { name: /Delete saved row/ })).toBeNull()
    await userEvent.click(document.querySelector('[data-row-id="r_main"]') as HTMLElement)
    expect(screen.queryByRole('button', { name: 'Save as row' })).toBeNull()
    expect(screen.queryByText('Keep this row to reuse in other emails.')).toBeNull()
    await userEvent.click(within(group).getByRole('button', { name: 'Signature' }))
    expect(document.querySelectorAll('[data-row-id]')).toHaveLength(2)
  })

  it('without save, the empty list does not tell the author to save', async () => {
    mount(withRow(), { savedRows: { list: async () => [] } })
    const note = await screen.findByText('No saved rows yet.')
    expect(note).not.toHaveTextContent('Save as row')
  })

  it('with save but not remove, rows can be saved and not deleted', async () => {
    const save = vi.fn(async (name: string, row) => ({ id: 9, name, row }) as SavedRow)
    mount(withRow(), { savedRows: { list: async () => [saved()], save } })
    const group = await screen.findByRole('region', { name: 'Saved rows' })
    expect(within(group).queryByRole('button', { name: /Delete saved row/ })).toBeNull()
    await userEvent.click(document.querySelector('[data-row-id="r_main"]') as HTMLElement)
    expect(screen.getAllByRole('button', { name: 'Save as row' }).length).toBeGreaterThan(0)
  })

  it('with remove but not save, rows can be deleted and not saved', async () => {
    const remove = vi.fn().mockResolvedValue(undefined)
    mount(withRow(), { savedRows: { list: async () => [saved()], remove } })
    await userEvent.click(await screen.findByRole('button', { name: 'Delete saved row Signature' }))
    await userEvent.click(screen.getByRole('button', { name: /Delete “Signature”\?/ }))
    expect(remove).toHaveBeenCalledWith(3)
    await userEvent.click(document.querySelector('[data-row-id="r_main"]') as HTMLElement)
    expect(screen.queryByRole('button', { name: 'Save as row' })).toBeNull()
  })
})
