/** `highlight` (a server error shown on the canvas) and `BrandPreview.footer_html`. */
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BlockEditor } from '../block-editor/block-editor'
import type { BlockEditorHighlight } from '../block-editor/types'
import {
  createBlock,
  createRow,
  emptyBlockDesign,
  type BlockDesign,
  type FooterBlock,
  type SpacerBlock,
} from '../design'

function design(): BlockDesign {
  const base = emptyBlockDesign()
  const spacer = createBlock('spacer', 'b_spacer') as SpacerBlock
  const divider = createBlock('divider', 'b_divider')
  const first = createRow('100', [divider])
  first.id = 'r_first'
  const second = createRow('50-50', [spacer])
  second.id = 'r_second'
  second.columns[0]!.id = 'c_left'
  second.columns[1]!.id = 'c_right'
  return { ...base, rows: [first, second] }
}

let scrolled: Element[] = []

beforeEach(() => {
  scrolled = []
  Element.prototype.scrollIntoView = function (this: Element) {
    scrolled.push(this)
  }
})
afterEach(() => {
  vi.restoreAllMocks()
})

function mount(initial: BlockEditorHighlight | null) {
  const cleared = vi.fn()
  const changes: BlockDesign[] = []
  function Harness() {
    const [value, setValue] = useState<unknown>(design())
    const [highlight, setHighlight] = useState<BlockEditorHighlight | null>(initial)
    return (
      <BlockEditor
        value={value}
        onChange={(next) => {
          changes.push(next)
          setValue(next)
        }}
        mergeFields={[]}
        brand={{}}
        highlight={highlight}
        onHighlightClear={() => {
          cleared()
          setHighlight(null)
        }}
      />
    )
  }
  render(<Harness />)
  return { cleared, changes }
}

const props = () => within(screen.getByRole('complementary', { name: 'Properties' }))
const marked = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[data-error]')).map(
    (el) => el.dataset.blockId ?? el.dataset.columnId ?? el.dataset.rowId,
  )

describe('highlight', () => {
  it('outlines, scrolls to, selects and announces a block path', () => {
    mount({ path: 'rows[1].columns[0].blocks[0].height', message: 'Height is too tall' })
    expect(marked()).toEqual(['b_spacer'])
    expect(screen.getByRole('alert')).toHaveTextContent('Height is too tall')
    expect(scrolled).toHaveLength(1)
    expect((scrolled[0] as HTMLElement).dataset.blockId).toBe('b_spacer')
    expect(document.querySelector('[data-block-id="b_spacer"]')).toHaveAttribute(
      'aria-current',
      'true',
    )
    // The properties show that block.
    expect(props().getAllByRole('heading', { name: 'Spacer' })[0]).toBeInTheDocument()
  })

  it('takes a block id, and prefers it to the path', () => {
    mount({
      blockId: 'b_divider',
      path: 'rows[1].columns[0].blocks[0]',
      message: 'This divider is wrong',
    })
    expect(marked()).toEqual(['b_divider'])
  })

  it('outlines and selects a row path', () => {
    mount({ path: 'rows[1].padding', message: 'Row padding is wrong' })
    expect(marked()).toEqual(['r_second'])
    expect(document.querySelector('[data-row-id="r_second"]')).toHaveAttribute(
      'aria-current',
      'true',
    )
    expect(props().getByRole('heading', { name: 'Row 2' })).toBeInTheDocument()
    expect((scrolled[0] as HTMLElement).dataset.rowId).toBe('r_second')
  })

  it('outlines and selects a column path', () => {
    mount({ path: 'rows[1].columns[1].background', message: 'Column colour is wrong' })
    expect(marked()).toEqual(['c_right'])
    expect(document.querySelector('[data-column-id="c_right"]')).toHaveAttribute('data-selected')
    expect((scrolled[0] as HTMLElement).dataset.columnId).toBe('c_right')
  })

  it('shows the message for a path that points at nothing on the canvas', () => {
    mount({ path: 'settings.width', message: 'Width is wrong' })
    expect(marked()).toEqual([])
    expect(screen.getByRole('alert')).toHaveTextContent('Width is wrong')
    expect(props().getByRole('heading', { name: 'Email settings' })).toBeInTheDocument()
  })

  it('clears when its target is edited, and tells the host', async () => {
    const { cleared, changes } = mount({
      path: 'rows[1].columns[0].blocks[0].height',
      message: 'Height is too tall',
    })
    const height = screen.getByRole('spinbutton', { name: /height/i })
    await userEvent.clear(height)
    await userEvent.type(height, '40')
    fireEvent.blur(height)
    expect(changes.length).toBeGreaterThan(0)
    expect(cleared).toHaveBeenCalledTimes(1)
    expect(marked()).toEqual([])
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('stays when something else is edited', async () => {
    const { cleared } = mount({
      path: 'rows[1].columns[0].blocks[0].height',
      message: 'Height is too tall',
    })
    // Edit the other block's row, via the page settings.
    await userEvent.click(document.querySelector('[data-block-id="b_divider"]') as HTMLElement)
    await userEvent.click(screen.getByRole('button', { name: /duplicate block/i }))
    expect(cleared).not.toHaveBeenCalled()
    expect(marked()).toEqual(['b_spacer'])
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('can be dismissed', async () => {
    const { cleared } = mount({ blockId: 'b_spacer', message: 'Wrong' })
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(cleared).toHaveBeenCalledTimes(1)
    expect(marked()).toEqual([])
  })

  it('clears when the target is removed', async () => {
    const { cleared } = mount({ blockId: 'b_spacer', message: 'Wrong' })
    await userEvent.click(screen.getByRole('button', { name: /delete block/i }))
    expect(cleared).toHaveBeenCalled()
    expect(marked()).toEqual([])
  })
})

describe('BrandPreview.footer_html', () => {
  function footerDesign(html?: string): BlockDesign {
    const footer = createBlock('footer', 'b_footer') as FooterBlock
    if (html) footer.html = html
    const base = emptyBlockDesign()
    return { ...base, rows: [createRow('100', [footer])] }
  }

  it('shows the brand footer text above the block text, sanitised', () => {
    render(
      <BlockEditor
        value={footerDesign('<p>Block text</p>')}
        onChange={() => {}}
        mergeFields={[]}
        brand={{ footer_html: '<p>Brand <strong>text</strong></p><script>alert(1)</script>' }}
      />,
    )
    const cell = document.querySelector('.seb-b-footer') as HTMLElement
    const brand = cell.querySelector('[data-brand-footer]') as HTMLElement
    expect(brand).toHaveTextContent('Brand text')
    expect(brand.querySelector('strong')).not.toBeNull()
    expect(cell.querySelector('script')).toBeNull()
    expect(cell.textContent).not.toContain('alert(1)')
    expect(cell.textContent!.indexOf('Brand text')).toBeLessThan(
      cell.textContent!.indexOf('Block text'),
    )
  })

  it('shows nothing extra without it', () => {
    render(<BlockEditor value={footerDesign()} onChange={() => {}} mergeFields={[]} brand={{}} />)
    expect(document.querySelector('[data-brand-footer]')).toBeNull()
  })
})
