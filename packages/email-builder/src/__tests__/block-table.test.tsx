/**
 * The table block in the BlockEditor (shining-email 0.4): the palette tile that exists only when
 * the host passes data sources, the canvas drawing sample rows, and the inspector.
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BlockEditor } from '../block-editor/block-editor'
import { tintColor } from '../block-editor/blocks/table'
import type { BlockEditorProps } from '../block-editor/types'
import {
  allBlocks,
  blockDesignErrors,
  createRow,
  emptyBlockDesign,
  tableBlockFor,
  type BlockDesign,
  type DataSourceDefinition,
  type TableBlock,
} from '../design'

const brand = { primary_color: '#aa0000', button_text_color: '#ffffff' }

const ITEMS: DataSourceDefinition = {
  key: 'deal.items',
  label: 'Deal line items',
  group: 'Deal',
  fields: [
    { key: 'name', label: 'Item' },
    { key: 'description', label: 'Description' },
    { key: 'quantity', label: 'Qty', align: 'right' },
    { key: 'unit_price', label: 'Unit price', align: 'right' },
    { key: 'discount', label: 'Discount', align: 'right' },
    { key: 'line_total', label: 'Total', align: 'right' },
  ],
  default_columns: [
    { key: 'name', label: 'Item', secondary: 'description' },
    { key: 'quantity', label: 'Qty', align: 'right', width: 12 },
    { key: 'unit_price', label: 'Unit price', align: 'right', width: 20, hide_on_mobile: true },
    { key: 'line_total', label: 'Total', align: 'right', width: 20 },
  ],
  totals_key: 'deal.totals',
  sample: [
    {
      name: 'Website redesign',
      description: 'Five pages, responsive',
      quantity: '1',
      unit_price: '4,500.00',
      discount: '',
      line_total: '4,500.00',
    },
    {
      name: 'Hosting',
      description: '',
      quantity: '12 months',
      unit_price: '30.00',
      discount: '10%',
      line_total: '324.00',
    },
  ],
  sample_totals: [
    { label: 'Subtotal', value: '4,824.00' },
    { label: 'Total (AUD)', value: '5,306.40', emphasis: true },
    { label: 'Plus items priced on request', value: '' },
  ],
}

const QUOTES: DataSourceDefinition = {
  key: 'quote.lines',
  label: 'Quote lines',
  fields: [{ key: 'name', label: 'Line' }],
  default_columns: [{ key: 'name', label: 'Line' }],
  sample: [{ name: 'Setup' }],
}

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

function withTable(patch: Partial<TableBlock> = {}, source = ITEMS): BlockDesign {
  const block = { ...tableBlockFor(source, 'b_table'), ...patch }
  return { ...emptyBlockDesign(), rows: [createRow('100', [block])] }
}

const blocksPalette = () => within(screen.getByRole('region', { name: 'Blocks' }))
const tableBlock = (design: BlockDesign) =>
  allBlocks(design).find((block) => block.type === 'table') as TableBlock
const cell = () => document.querySelector<HTMLElement>('[data-block-id="b_table"]')!
/** The inspector of the selected table. */
const inspector = () => within(screen.getByRole('complementary', { name: 'Properties' }))

afterEach(() => vi.restoreAllMocks())

describe('the Table tile', () => {
  it('is in the palette only when the host passes data sources', () => {
    mount(null)
    expect(blocksPalette().queryByRole('button', { name: 'Table' })).toBeNull()
  })

  it('is not there for an empty list either', () => {
    mount(null, { dataSources: [] })
    expect(blocksPalette().queryByRole('button', { name: 'Table' })).toBeNull()
  })

  it('adds a table for the first data source: its columns and its totals', async () => {
    const { last } = mount(null, { dataSources: [ITEMS, QUOTES] })
    await userEvent.click(blocksPalette().getByRole('button', { name: 'Table' }))
    const block = tableBlock(last())
    expect(block).toMatchObject({ source: 'deal.items', totals: 'deal.totals' })
    expect(block.columns.map((c) => c.key)).toEqual([
      'name',
      'quantity',
      'unit_price',
      'line_total',
    ])
    expect(blockDesignErrors(last())).toEqual([])
    // Selected, with its inspector open.
    expect(inspector().getByRole('region', { name: 'Columns' })).toBeInTheDocument()
  })

  it('is in the "+" menu of a column only with data sources', async () => {
    const { unmount } = render(<span />)
    unmount()
    const row = createRow('100')
    mount({ ...emptyBlockDesign(), rows: [row] }, { dataSources: [ITEMS] })
    await userEvent.click(screen.getByRole('button', { name: 'Add a block here' }))
    expect(screen.getByRole('menuitem', { name: 'Table' })).toBeInTheDocument()
  })

  it('is left out of the "+" menu without data sources', async () => {
    mount({ ...emptyBlockDesign(), rows: [createRow('100')] })
    await userEvent.click(screen.getByRole('button', { name: 'Add a block here' }))
    expect(screen.queryByRole('menuitem', { name: 'Table' })).toBeNull()
    expect(screen.getByRole('menuitem', { name: 'Heading' })).toBeInTheDocument()
  })
})

describe('the table on the canvas', () => {
  it('draws the sample rows, headings, a second line and the totals', () => {
    mount(withTable(), { dataSources: [ITEMS] })
    const table = within(cell()).getByRole('table')
    expect(table).toHaveAccessibleName('Table of Deal line items, sample data')
    const headers = within(table).getAllByRole('columnheader')
    expect(headers.map((h) => h.textContent)).toEqual(['Item', 'Qty', 'Unit price', 'Total'])
    expect(headers[0]).toHaveAttribute('scope', 'col')
    expect(within(table).getByText('Website redesign')).toBeInTheDocument()
    expect(within(table).getByText('Five pages, responsive')).toBeInTheDocument()
    expect(within(table).getByText('12 months')).toBeInTheDocument()
    // A second line is its own small line; an empty one draws nothing.
    expect(within(table).getByText('Five pages, responsive').tagName).toBe('DIV')
    expect(within(table).getByText('Hosting').closest('td')!.querySelector('div')).toBeNull()
    expect(within(cell()).getByText('Sample data')).toBeInTheDocument()
  })

  it('draws the totals: a label and a value, an emphasised total, a label-only note across', () => {
    mount(withTable(), { dataSources: [ITEMS] })
    const table = within(cell()).getByRole('table')
    const subtotal = within(table).getByText('Subtotal').closest('tr')!
    expect(within(subtotal).getByText('4,824.00')).toBeInTheDocument()
    expect(within(table).getByText('Subtotal')).toHaveAttribute('colspan', '3')
    const total = within(table).getByText('Total (AUD)')
    expect(total).toHaveStyle({ fontWeight: 'bold' })
    expect(within(table).getByText('Subtotal')).not.toHaveStyle({ fontWeight: 'bold' })
    // No value: the label runs across every column, with no empty cell beside it.
    const note = within(table).getByText('Plus items priced on request')
    expect(note).toHaveAttribute('colspan', '4')
    expect(note.parentElement!.children).toHaveLength(1)
  })

  it('draws no totals when the block has none', () => {
    mount(withTable({ totals: null }), { dataSources: [ITEMS] })
    expect(within(cell()).queryByText('Subtotal')).toBeNull()
  })

  it('uses the brand colours for the heading row, and the block’s own when set', () => {
    mount(withTable({ header_background: '#112233', header_color: '#fafafa' }), {
      dataSources: [ITEMS],
    })
    const head = within(cell()).getAllByRole('columnheader')[0]!
    expect(head).toHaveStyle({ background: '#112233', color: '#fafafa' })
  })

  it('takes the primary brand colour for the heading row by default', () => {
    mount(withTable(), { dataSources: [ITEMS] })
    expect(within(cell()).getAllByRole('columnheader')[0]).toHaveStyle({ background: '#aa0000' })
  })

  it('can leave out the heading row, and shade every second row', () => {
    mount(withTable({ show_header: false, striped: true }), { dataSources: [ITEMS] })
    expect(within(cell()).queryAllByRole('columnheader')).toHaveLength(0)
    const rows = within(cell()).getAllByRole('row')
    expect(rows[0]).not.toHaveStyle({ background: '#f0f1f2' })
    expect(within(rows[1]!).getByText('Hosting').closest('td')).toHaveStyle({
      background: '#f0f1f2',
    })
  })

  it('drops the columns hidden on phones in the mobile canvas', () => {
    mount(withTable(), { dataSources: [ITEMS], device: 'mobile' })
    expect(
      within(cell())
        .getAllByRole('columnheader')
        .map((h) => h.textContent),
    ).toEqual(['Item', 'Qty', 'Total'])
    expect(within(cell()).getByText('Subtotal')).toHaveAttribute('colspan', '2')
  })

  it('says there is no sample data for an unknown source', () => {
    mount(withTable({ source: 'deal.foo' }), { dataSources: [ITEMS] })
    expect(within(cell()).getByText('No sample data for deal.foo')).toBeInTheDocument()
    expect(within(cell()).queryByRole('table')).toBeNull()
  })

  it('says so without any data sources, too', () => {
    mount(withTable())
    expect(within(cell()).getByText('No sample data for deal.items')).toBeInTheDocument()
  })

  it('names itself for a screen reader, and for drag and drop', () => {
    mount(withTable(), { dataSources: [ITEMS] })
    expect(screen.getByRole('group', { name: 'Table block: deal.items' })).toBeInTheDocument()
  })
})

describe('the table inspector', () => {
  async function open(patch: Partial<TableBlock> = {}) {
    const view = mount(withTable(patch), { dataSources: [ITEMS, QUOTES] })
    await userEvent.click(cell())
    return view
  }

  it('shows the data, and one group per column', async () => {
    await open()
    const props = inspector()
    expect(props.getByLabelText('Data')).toHaveValue('deal.items')
    expect(props.getAllByRole('group', { name: /^Column \d$/ })).toHaveLength(4)
    expect(props.getByLabelText('Column 1 shows')).toHaveValue('name')
    expect(props.getByLabelText('Column 1 heading')).toHaveValue('Item')
    expect(props.getByLabelText('Column 1 second line')).toHaveValue('description')
    expect(props.getByLabelText('Column 3 width')).toHaveValue(20)
    expect(props.getByLabelText('Hide column 3 on phones')).toBeChecked()
    expect(props.getByLabelText('Hide column 2 on phones')).not.toBeChecked()
  })

  it('edits a column’s heading, field, second line and alignment', async () => {
    const { last } = await open()
    const props = inspector()
    const heading = props.getByLabelText('Column 2 heading')
    await userEvent.clear(heading)
    await userEvent.type(heading, 'Quantity')
    expect(tableBlock(last()).columns[1]!.label).toBe('Quantity')

    await userEvent.selectOptions(props.getByLabelText('Column 2 shows'), 'discount')
    expect(tableBlock(last()).columns[1]!.key).toBe('discount')

    await userEvent.selectOptions(props.getByLabelText('Column 2 second line'), 'description')
    expect(tableBlock(last()).columns[1]!.secondary).toBe('description')
    await userEvent.selectOptions(props.getByLabelText('Column 2 second line'), '')
    expect('secondary' in tableBlock(last()).columns[1]!).toBe(false)

    const align = within(props.getByRole('group', { name: 'Column 2 alignment' }))
    await userEvent.click(align.getByRole('button', { name: 'Align centre' }))
    expect(tableBlock(last()).columns[1]!.align).toBe('center')
    expect(blockDesignErrors(last())).toEqual([])
  })

  it('sets and clears a column width', async () => {
    const { last } = await open()
    const props = inspector()
    await userEvent.click(props.getByLabelText('Set a width for column 1'))
    expect(tableBlock(last()).columns[0]!.width).toBe(20)
    await userEvent.click(props.getByLabelText('Set a width for column 1'))
    expect('width' in tableBlock(last()).columns[0]!).toBe(false)
  })

  it('refuses widths that add up to more than 100, and says why', async () => {
    const { last } = await open()
    const props = inspector()
    await userEvent.click(props.getByLabelText('Set a width for column 1'))
    const width = props.getByLabelText('Column 1 width')
    await userEvent.clear(width)
    await userEvent.type(width, '90')
    expect(
      await props.findByText(/Column widths add up to \d+; the most is 100/),
    ).toBeInTheDocument()
    expect(tableBlock(last()).columns[0]!.width).not.toBe(90)
  })

  it('hides a column on phones, and refuses it on the last column while there are totals', async () => {
    const { last } = await open()
    const props = inspector()
    await userEvent.click(props.getByLabelText('Hide column 2 on phones'))
    expect(tableBlock(last()).columns[1]!.hide_on_mobile).toBe(true)
    await userEvent.click(props.getByLabelText('Hide column 4 on phones'))
    expect(await props.findByRole('alert')).toHaveTextContent(
      'Needs the last column to show on phones, because the totals sit under it',
    )
    expect(tableBlock(last()).columns[3]!.hide_on_mobile).toBe(false)
    // Without totals it is fine.
    await userEvent.click(props.getByLabelText('Show totals under the table'))
    expect('totals' in tableBlock(last()) && tableBlock(last()).totals).toBeFalsy()
    await userEvent.click(props.getByLabelText('Hide column 4 on phones'))
    expect(tableBlock(last()).columns[3]!.hide_on_mobile).toBe(true)
  })

  it('adds a column for the next unused field, up to six, and removes down to one', async () => {
    const { last } = await open()
    const props = inspector()
    await userEvent.click(props.getByRole('button', { name: 'Add a column' }))
    expect(tableBlock(last()).columns).toHaveLength(5)
    expect(tableBlock(last()).columns[4]).toMatchObject({ key: 'description' })
    await userEvent.click(props.getByRole('button', { name: 'Add a column' }))
    expect(tableBlock(last()).columns).toHaveLength(6)
    expect(props.getByRole('button', { name: 'Add a column' })).toBeDisabled()
    expect(blockDesignErrors(last())).toEqual([])
    // With totals on, the last column may not be the one hidden on phones.
    await userEvent.click(props.getByLabelText('Show totals under the table'))
    for (let n = 6; n > 1; n--)
      await userEvent.click(props.getByRole('button', { name: `Remove column ${n}` }))
    expect(tableBlock(last()).columns).toHaveLength(1)
    expect(props.getByRole('button', { name: 'Remove column 1' })).toBeDisabled()
  })

  it('reorders columns', async () => {
    const { last } = await open()
    const props = inspector()
    expect(props.getByRole('button', { name: 'Move column 1 up' })).toBeDisabled()
    expect(props.getByRole('button', { name: 'Move column 4 down' })).toBeDisabled()
    await userEvent.click(props.getByRole('button', { name: 'Move column 2 up' }))
    expect(tableBlock(last()).columns.map((c) => c.key)).toEqual([
      'quantity',
      'name',
      'unit_price',
      'line_total',
    ])
    await userEvent.click(props.getByRole('button', { name: 'Move column 1 down' }))
    expect(tableBlock(last()).columns.map((c) => c.key)[0]).toBe('name')
  })

  it('turns the totals on and off', async () => {
    const { last } = await open()
    const props = inspector()
    const toggle = props.getByLabelText('Show totals under the table')
    expect(toggle).toBeChecked()
    await userEvent.click(toggle)
    expect(tableBlock(last()).totals ?? null).toBeNull()
    await userEvent.click(props.getByLabelText('Show totals under the table'))
    expect(tableBlock(last()).totals).toBe('deal.totals')
  })

  it('has no totals switch for a source without totals', async () => {
    mount(withTable({}, QUOTES), { dataSources: [ITEMS, QUOTES] })
    await userEvent.click(cell())
    expect(inspector().queryByLabelText('Show totals under the table')).toBeNull()
  })

  it('changes the look: heading row, shading, colours', async () => {
    const { last } = await open()
    const props = inspector()
    await userEvent.click(props.getByLabelText('Show the heading row'))
    expect(tableBlock(last()).show_header).toBe(false)
    await userEvent.click(props.getByLabelText('Shade every second row'))
    expect(tableBlock(last()).striped).toBe(true)
    await userEvent.click(props.getByRole('button', { name: 'Heading background: #000000' }))
    expect(tableBlock(last()).header_background).toBe('#000000')
    await userEvent.click(props.getByRole('button', { name: 'Lines: brand Muted text' }))
    expect(tableBlock(last()).border_color).toBe('brand.muted_text_color')
    expect(blockDesignErrors(last())).toEqual([])
  })

  it('changing the data resets the columns to the new source’s own', async () => {
    const { last } = await open()
    await userEvent.selectOptions(inspector().getByLabelText('Data'), 'quote.lines')
    const block = tableBlock(last())
    expect(block.source).toBe('quote.lines')
    expect(block.columns).toEqual([{ key: 'name', label: 'Line' }])
    // The new source has no totals, so none are kept.
    expect(block.totals ?? null).toBeNull()
    expect(blockDesignErrors(last())).toEqual([])
  })

  it('offers an unknown source as it is, so nothing is lost', async () => {
    mount(withTable({ source: 'deal.gone' }), { dataSources: [ITEMS] })
    await userEvent.click(cell())
    const select = inspector().getByLabelText('Data')
    expect(select).toHaveValue('deal.gone')
    expect(
      within(select).getByRole('option', { name: 'deal.gone (not available)' }),
    ).toBeInTheDocument()
  })

  it('has the shared style fields', async () => {
    const { last } = await open()
    const style = within(inspector().getByRole('region', { name: 'Style' }))
    expect(style.getByLabelText('Font size')).toHaveValue(14)
    await userEvent.clear(style.getByLabelText('Font size'))
    await userEvent.type(style.getByLabelText('Font size'), '18')
    expect(tableBlock(last()).style).toMatchObject({ font_size: 18 })
  })
})

describe('the stripe colour', () => {
  it('is the border colour mixed 10% over white, as the server computes it', () => {
    // The default border is the brand's muted text colour, #6b7280.
    expect(tintColor('#6b7280')).toBe('#f0f1f2')
    expect(tintColor('#000000')).toBe('#e6e6e6')
    expect(tintColor('#ffffff')).toBe('#ffffff')
    expect(tintColor('#abc')).toBe('#f6f8fa')
    // Halves round to even, as Python's round does: 250 + 5 * 0.9 = 254.5 gives 254, not 255.
    expect(tintColor('#fafafa')).toBe('#fefefe')
    // Anything it cannot read gives the server's fallback.
    expect(tintColor('red')).toBe('#f5f5f5')
    expect(tintColor('')).toBe('#f5f5f5')
  })

  it('follows the table’s own border colour', () => {
    mount(withTable({ striped: true, border_color: '#000000' }), { dataSources: [ITEMS] })
    const rows = within(cell()).getAllByRole('row')
    expect(within(rows[2]!).getByText('Hosting').closest('td')).toHaveStyle({
      background: '#e6e6e6',
    })
  })
})

describe('totals under a one-column table', () => {
  const ONE: DataSourceDefinition = {
    ...ITEMS,
    default_columns: [{ key: 'name', label: 'Item' }],
    sample_totals: [
      { label: 'Total (AUD)', value: '30.00', emphasis: true },
      { label: '', value: '5.00' },
      { label: 'Plus items priced on request', value: '' },
    ],
  }

  it('puts the figure after its label, or alone when there is no label', () => {
    mount(withTable({}, ONE), { dataSources: [ONE] })
    const table = within(cell()).getByRole('table')
    const total = within(table).getByText('Total (AUD): 30.00')
    expect(total).toHaveAttribute('colspan', '1')
    expect(total.parentElement!.children).toHaveLength(1)
    expect(within(table).getByText('5.00')).toBeInTheDocument()
    expect(within(table).getByText('Plus items priced on request')).toBeInTheDocument()
  })
})

describe('totals with nothing in them', () => {
  it('drops a line with neither a label nor a value, and keeps a note', () => {
    const source: DataSourceDefinition = {
      ...ITEMS,
      sample_totals: [
        { label: '', value: '' },
        { label: 'Subtotal', value: '4,824.00' },
        { label: 'A note', value: '' },
      ],
    }
    mount(withTable({}, source), { dataSources: [source] })
    const table = within(cell()).getByRole('table')
    // Two sample rows and two totals lines: the empty one left no row behind.
    expect(within(table).getAllByRole('row')).toHaveLength(1 + 2 + 2)
    expect(within(table).getByText('Subtotal')).toBeInTheDocument()
    expect(within(table).getByText('A note')).toBeInTheDocument()
  })
})
