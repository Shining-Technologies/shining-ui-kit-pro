/** Regression tests for the findings of the real-browser run on 7080084. */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BlockEditor } from '../block-editor/block-editor'
import { ImageResizeHandles } from '../block-editor/image-resize-handles'
import { pillLabel } from '../block-editor/blocks/shared'
import { joinLines } from '../block-editor/text-extensions'
import type { BlockEditorProps } from '../block-editor/types'
import { EmailEditor } from '../email-editor'
import { MergeFieldPicker } from '../merge-field-picker'
import { ColorPanel } from '../toolbar'
import {
  BUTTON_SIZES,
  allBlocks,
  blockDesignErrors,
  createBlock,
  createRow,
  emptyBlockDesign,
  emptyDesign,
  type BlockDesign,
  type ButtonBlock,
  type ImageBlock,
} from '../design'

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
        brand={{ primary_color: '#aa0000', button_text_color: '#aa0000' }}
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
const rows = () => Array.from(document.querySelectorAll<HTMLElement>('[data-row-id]'))
const active = () => document.activeElement as HTMLElement

afterEach(() => vi.restoreAllMocks())

describe('1-2. text focus is one-shot', () => {
  it('does not pull focus back into the text after Esc, when another block moves', async () => {
    const { last } = mount()
    await addBlock('Text')
    await addBlock('Divider')
    await addBlock('Spacer')
    const text = cells()[0]!
    text.focus()
    fireEvent.keyDown(text, { key: 'Enter' })
    await waitFor(() => expect(active().classList.contains('ProseMirror')).toBe(true))
    fireEvent.keyDown(active(), { key: 'Escape' })
    expect(active()).toBe(text)
    // Tab to the divider and move it up.
    const divider = cells()[1]!
    divider.focus()
    fireEvent.keyDown(divider, { key: 'ArrowUp', altKey: true })
    expect(allBlocks(last()).map((b) => b.type)).toEqual(['divider', 'text', 'spacer'])
    await new Promise((r) => setTimeout(r, 50))
    expect(active().classList.contains('ProseMirror')).toBe(false)
    expect(active()).toBe(cells().find((c) => c.getAttribute('data-type') === 'divider'))
    // Delete now goes to the block, not the editor.
    fireEvent.keyDown(active(), { key: 'Delete' })
    expect(allBlocks(last()).map((b) => b.type)).toEqual(['text', 'spacer'])
  })

  it('drops the request once it is used', async () => {
    mount()
    await addBlock('Text')
    await addBlock('Spacer')
    const text = cells()[0]!
    text.focus()
    fireEvent.keyDown(text, { key: 'Enter' })
    await waitFor(() => expect(active().classList.contains('ProseMirror')).toBe(true))
    text.focus() // leaves the editor without Esc
    await addBlock('Divider') // any later change of the design
    expect(active().classList.contains('ProseMirror')).toBe(false)
  })
})

describe('4. focus is kept', () => {
  it('goes to the new block after inserting from the "+" menu', async () => {
    mount()
    await layouts().getByRole('button', { name: 'Layout 100' }).click()
    await userEvent.click(screen.getByRole('button', { name: 'Add a block here' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Divider' }))
    expect(active()).toBe(cells()[0])
  })

  it('goes to the row when the last block of a column is deleted', async () => {
    mount()
    await addBlock('Spacer')
    fireEvent.keyDown(cells()[0]!, { key: 'Delete' })
    expect(cells()).toHaveLength(0)
    expect(active()).toBe(rows()[0])
  })

  it('goes to the neighbouring row when a row is deleted, and stays on a moved row', async () => {
    const { last } = mount()
    await layouts().getByRole('button', { name: 'Layout 100' }).click()
    await layouts().getByRole('button', { name: 'Layout 100' }).click()
    await layouts().getByRole('button', { name: 'Layout 100' }).click()
    const ids = last().rows.map((r) => r.id)
    const second = rows()[1]!
    second.focus()
    fireEvent.keyDown(second, { key: 'ArrowUp', altKey: true })
    expect(last().rows.map((r) => r.id)).toEqual([ids[1], ids[0], ids[2]])
    expect(active()).toBe(rows()[0])
    expect(active().getAttribute('data-row-id')).toBe(ids[1])
    fireEvent.keyDown(active(), { key: 'Delete' })
    expect(last().rows).toHaveLength(2)
    expect(active()).toBe(rows()[0]) // the row that followed
  })

  it('announces a row move by its old and new place', async () => {
    mount()
    await layouts().getByRole('button', { name: 'Layout 100' }).click()
    await layouts().getByRole('button', { name: 'Layout 100' }).click()
    const live = () => document.querySelector('[aria-live="polite"]')!.textContent
    const second = rows()[1]!
    second.focus()
    fireEvent.keyDown(second, { key: 'ArrowUp', altKey: true })
    expect(live()).toBe('Moved row 2 to position 1.')
    fireEvent.keyDown(rows()[0]!, { key: 'ArrowUp', altKey: true })
    expect(live()).toBe('Row 1 cannot move up any further.')
  })
})

describe('5. colour swatches', () => {
  it('keys swatches by position and names brand colours, even when two share a value', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(
      <ColorPanel
        colors={[
          { value: '#ffffff', label: 'Brand primary' },
          { value: '#ffffff', label: 'Brand button text' },
          '#123456',
        ]}
        onApply={() => undefined}
        onCancel={() => undefined}
      />,
    )
    expect(screen.getByRole('button', { name: 'Brand button text' })).toHaveAttribute(
      'title',
      'Brand button text (#ffffff)',
    )
    expect(screen.getByRole('button', { name: 'Colour #123456' })).toBeInTheDocument()
    expect(error).not.toHaveBeenCalled()
  })

  it('labels the format bar’s swatches by brand name', async () => {
    mount()
    await addBlock('Text')
    await userEvent.click(await screen.findByRole('button', { name: 'Text colour' }))
    expect(screen.getByRole('button', { name: 'Brand button text' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Brand primary' })).toBeInTheDocument()
  })
})

describe('6. the image handle clamps like the field and the server', () => {
  const rect = (width: number) =>
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: width,
      bottom: 100,
      width,
      height: 100,
      toJSON: () => ({}),
    } as DOMRect)
  const frame = () => {
    const el = document.createElement('div')
    el.innerHTML = '<div class="seb-col-inner"><img class="seb-image" alt=""></div>'
    document.body.appendChild(el)
    return el
  }
  const block = (width: ImageBlock['width']) =>
    ({ ...createBlock('image', 'b_i'), width, align: 'left' }) as ImageBlock

  it('allows the column’s share of the design width, not the room the canvas has', () => {
    rect(161) // what fits on the canvas
    const onCommit = vi.fn()
    render(
      <ImageResizeHandles
        block={block(100)}
        frame={frame()}
        maxWidth={198}
        onLive={vi.fn()}
        onCommit={onCommit}
      />,
    )
    const slider = screen.getByRole('slider', { name: 'Image width' })
    expect(slider).toHaveAttribute('aria-valuemax', '198')
    fireEvent.keyDown(slider, { key: 'End' })
    expect(onCommit).toHaveBeenCalledWith(198)
  })

  it('starts a drag from the stored width, so it never shrinks unless dragged inward', () => {
    rect(120) // shown narrower than stored
    const onLive = vi.fn()
    const onCommit = vi.fn()
    render(
      <ImageResizeHandles
        block={block(150)}
        frame={frame()}
        maxWidth={198}
        onLive={onLive}
        onCommit={onCommit}
      />,
    )
    const handle = screen.getByRole('slider', { name: 'Image width' })
    fireEvent.pointerDown(handle, { clientX: 100, pointerId: 1 })
    fireEvent.pointerMove(handle, { clientX: 110, pointerId: 1 })
    expect(onLive).toHaveBeenLastCalledWith(160) // 150 + 10, not 120 + 10
    fireEvent.pointerUp(handle, { pointerId: 1 })
    expect(onCommit).toHaveBeenCalledWith(160)
  })
})

describe('7. an invalid entry is not reverted silently', () => {
  it('keeps invalid hex text, flagged, until it is fixed or Esc reverts it', async () => {
    mount()
    await addBlock('Divider')
    const hex = screen.getByLabelText('Colour: hex')
    await userEvent.type(hex, 'zzz')
    expect(screen.getAllByRole('alert')[0]).toHaveTextContent('Use #rgb or #rrggbb')
    expect(hex).toHaveAttribute('aria-invalid', 'true')
    await userEvent.tab() // leaving does not discard it
    expect(hex).toHaveValue('zzz')
    expect(hex).toHaveAttribute('aria-invalid', 'true')
    await userEvent.type(hex, '{Escape}')
    expect(hex).toHaveValue('')
    expect(hex).not.toHaveAttribute('aria-invalid', 'true')
  })

  it('keeps an invalid link visible with its reason after leaving the field', async () => {
    const { last } = mount()
    await addBlock('Button')
    const url = screen.getByLabelText('Link address')
    await userEvent.type(url, 'x.test')
    await userEvent.tab()
    expect(url).toHaveValue('x.test')
    expect(url).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert')).toHaveTextContent('must start with')
    expect((allBlocks(last())[0] as ButtonBlock).url).toBe('')
  })

  it('clamps a number to its range and names the limit', async () => {
    const { last } = mount()
    await addBlock('Divider')
    const top = screen.getByRole('spinbutton', { name: 'Padding top' })
    await userEvent.clear(top)
    await userEvent.type(top, '200')
    expect(screen.getAllByText('Max 80').length).toBeGreaterThan(0)
    await userEvent.tab()
    expect(top).toHaveValue(80)
    expect((allBlocks(last())[0] as { style: { padding: number[] } }).style.padding[0]).toBe(80)
    expect(screen.getAllByText('Max 80').length).toBeGreaterThan(0)
    expect(blockDesignErrors(last())).toEqual([])
  })

  it('does the same for an avatar size', async () => {
    const { last } = mount()
    await addBlock('Avatar')
    const size = screen.getByRole('spinbutton', { name: /Size/ })
    await userEvent.clear(size)
    await userEvent.type(size, '200')
    await userEvent.tab()
    expect(size).toHaveValue(128)
    expect((allBlocks(last())[0] as { size: number }).size).toBe(128)
    expect(screen.getByText('Max 128')).toBeInTheDocument()
  })
})

describe('8. a pasted heading joins every block boundary', () => {
  it('puts a space where block elements met', () => {
    expect(joinLines('<h1>Title</h1><ul><li>item one</li><li>item two</li></ul>')).toBe(
      'Title item one item two',
    )
    expect(joinLines('<div>a</div><div>b</div><p>c</p>')).toBe('a b c')
    expect(joinLines('<p>x <em>y</em></p><blockquote>z</blockquote>')).toBe('x <em>y</em> z')
  })
})

describe('10. the formatting bar floats with the block', () => {
  it('sits inside the selected text block, not above the canvas', async () => {
    mount()
    await addBlock('Text')
    const bar = await screen.findByRole('toolbar', { name: 'Formatting' })
    const cell = cells()[0]!
    expect(cell.contains(bar)).toBe(true)
    expect(bar.closest('.seb-format')).not.toBeNull()
    expect(document.querySelector('.seb-stage-bar')!.contains(bar)).toBe(false)
    // Its panels belong to the bar, so they open over the canvas too.
    await userEvent.click(screen.getByRole('button', { name: 'Link' }))
    expect(bar.closest('.seb-format')!.querySelector('.seb-inline-panel')).not.toBeNull()
  })

  it('is gone when the block is not selected', async () => {
    mount()
    await addBlock('Text')
    await addBlock('Spacer')
    expect(screen.queryByRole('toolbar', { name: 'Formatting' })).toBeNull()
  })
})

describe('11. block toolbars sit beside the block', () => {
  it('hang in the right margin of a single column, left for the first of several', async () => {
    mount()
    await addBlock('Spacer')
    expect(screen.getByRole('toolbar', { name: 'Spacer block actions' })).toHaveAttribute(
      'data-gutter',
      'right',
    )
    await layouts().getByRole('button', { name: 'Layout 50 / 50' }).click()
    await addBlock('Divider')
    expect(screen.getByRole('toolbar', { name: 'Divider block actions' })).toHaveAttribute(
      'data-gutter',
      'left',
    )
  })
})

describe('12. small things', () => {
  it('spells social networks properly', () => {
    expect(pillLabel({ network: 'linkedin', url: '' })).toBe('LinkedIn')
    expect(pillLabel({ network: 'YouTube', url: '' })).toBe('YouTube')
    expect(pillLabel({ network: 'tiktok', url: '' })).toBe('TikTok')
    expect(pillLabel({ network: 'x', url: '' })).toBe('X')
    expect(pillLabel({ network: 'facebook', url: '' })).toBe('Facebook')
    expect(pillLabel({ network: 'instagram', url: '' })).toBe('Instagram')
    expect(pillLabel({ network: 'mastodon', url: '' })).toBe('Mastodon')
  })

  it('shows short labels where the long ones wrap, with the full name for assistive tech', async () => {
    mount()
    await addBlock('Button')
    const extra = screen.getByRole('button', { name: 'Extra small' })
    expect(extra).toHaveTextContent('XS')
    expect(BUTTON_SIZES.map((s) => s.short)).toEqual(['XS', 'S', 'M', 'L'])
    expect(layouts().getByRole('button', { name: 'Layout 33 / 34 / 33' })).toHaveTextContent(
      '33/34/33',
    )
  })

  it('uses a short placeholder for an inherited colour', async () => {
    mount()
    await addBlock('Button')
    expect(screen.getByLabelText('Background: hex')).toHaveAttribute('placeholder', 'Brand colour')
  })
})

describe('13. the Link extension is registered once', () => {
  it('does not make linkify warn however many editors are created', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    mount()
    await addBlock('Heading')
    await addBlock('Text')
    await addBlock('Heading')
    render(<EmailEditor value={emptyDesign('<p>x</p>')} onChange={() => undefined} />)
    expect(warn.mock.calls.filter((c) => String(c[0]).includes('linkify'))).toEqual([])
  })
})

describe('14. merge field descriptions', () => {
  const fields = [
    {
      key: 'unsubscribe_url',
      label: 'Unsubscribe link',
      group: 'Email',
      description: 'The link that stops further email',
    },
    { key: 'contact.first_name', label: 'First name', group: 'Contact' },
  ]

  it('shows the description under the label, searches it and describes the option with it', async () => {
    render(<MergeFieldPicker fields={fields} onSelect={() => undefined} />)
    await userEvent.click(screen.getByRole('button', { name: 'Insert field' }))
    const option = screen.getByRole('option', { name: /^Unsubscribe link/ })
    expect(within(option).getByText('The link that stops further email')).toHaveClass(
      'seb-picker-desc',
    )
    const described = option.getAttribute('aria-describedby')!
    expect(document.getElementById(described)).toHaveTextContent('stops further email')
    expect(screen.getByRole('option', { name: /^First name/ })).not.toHaveAttribute(
      'aria-describedby',
    )
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search fields' }), 'stops further')
    expect(screen.getAllByRole('option')).toHaveLength(1)
  })
})

describe('empty rows still validate', () => {
  it('keeps the design valid after all of this', () => {
    expect(blockDesignErrors({ ...emptyBlockDesign(), rows: [createRow('100')] })).toEqual([])
  })
})
